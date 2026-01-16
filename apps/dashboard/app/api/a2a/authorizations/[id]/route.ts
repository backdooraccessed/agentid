import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { triggerWebhooks } from '@/lib/webhooks';
import { verifyA2AAuthorizationResponseSignature } from '@/lib/a2a-signature';

// Service client for internal operations
function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// GET /api/a2a/authorizations/[id] - Get authorization request details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: authorization, error } = await supabase
      .from('a2a_authorization_requests')
      .select(`
        *,
        requester:credentials!requester_credential_id(
          id,
          agent_name,
          issuer:issuers(display_name)
        ),
        grantor:credentials!grantor_credential_id(
          id,
          agent_name,
          issuer:issuers(display_name)
        )
      `)
      .eq('id', id)
      .single();

    if (error || !authorization) {
      return NextResponse.json({ error: 'Authorization request not found' }, { status: 404 });
    }

    return NextResponse.json({ authorization });
  } catch (error) {
    console.error('Get authorization error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/a2a/authorizations/[id] - Respond to authorization request
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { grantor_credential_id, approved, message, signature } = body;

    // Validate required fields
    if (!grantor_credential_id || approved === undefined || !signature) {
      return NextResponse.json(
        { error: 'Missing required fields: grantor_credential_id, approved, signature' },
        { status: 400 }
      );
    }

    // Verify the user owns the grantor credential
    const { data: grantorCred, error: credError } = await supabase
      .from('credentials')
      .select('id, issuer_id')
      .eq('id', grantor_credential_id)
      .single();

    if (credError || !grantorCred) {
      return NextResponse.json({ error: 'Grantor credential not found' }, { status: 404 });
    }

    if (grantorCred.issuer_id !== user.id) {
      return NextResponse.json({ error: 'You do not own this credential' }, { status: 403 });
    }

    // Verify the authorization response signature
    const signatureResult = await verifyA2AAuthorizationResponseSignature({
      grantorCredentialId: grantor_credential_id,
      authorizationId: id,
      approved,
      signature,
    });

    if (!signatureResult.valid) {
      console.error('A2A authorization response signature verification failed:', signatureResult.error);
      return NextResponse.json(
        {
          error: 'Signature verification failed',
          details: signatureResult.error,
        },
        { status: 403 }
      );
    }

    // Respond to authorization request
    const serviceSupabase = getServiceSupabase();
    const { error } = await serviceSupabase
      .rpc('respond_to_authorization_request', {
        p_request_id: id,
        p_grantor_id: grantor_credential_id,
        p_approved: approved,
        p_message: message || null,
        p_signature: signature,
      });

    if (error) {
      console.error('Failed to respond to authorization:', error);
      if (error.message.includes('not found or already responded')) {
        return NextResponse.json(
          { error: 'Authorization request not found or already responded' },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: 'Failed to respond to authorization' }, { status: 500 });
    }

    // Send notifications to requester (fire and forget)
    void (async () => {
      try {
        // Get authorization request details
        const { data: authRequest } = await serviceSupabase
          .from('a2a_authorization_requests')
          .select(`
            requester_credential_id,
            grantor_credential_id,
            requested_permissions,
            requester:credentials!requester_credential_id(issuer_id, agent_name),
            grantor:credentials!grantor_credential_id(agent_name)
          `)
          .eq('id', id)
          .single();

        if (authRequest?.requester) {
          const requesterIssuerId = (authRequest.requester as unknown as { issuer_id: string }).issuer_id;
          const grantorAgentName = (authRequest.grantor as unknown as { agent_name: string })?.agent_name || 'Unknown Agent';

          // Trigger webhooks for requester's issuer
          await triggerWebhooks(
            requesterIssuerId,
            'authorization.responded',
            {
              authorization_id: id,
              requester_credential_id: authRequest.requester_credential_id,
              grantor_credential_id: authRequest.grantor_credential_id,
              grantor_agent_name: grantorAgentName,
              approved,
              message,
            }
          );
        }
      } catch (notifyError) {
        console.error('Failed to send authorization response notifications:', notifyError);
      }
    })();

    return NextResponse.json({
      message: `Authorization request ${approved ? 'approved' : 'denied'}`,
      status: approved ? 'approved' : 'denied',
    });
  } catch (error) {
    console.error('Respond to authorization error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/a2a/authorizations/[id] - Revoke an authorization
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, reason } = body;

    if (action !== 'revoke') {
      return NextResponse.json(
        { error: 'Only "revoke" action is supported' },
        { status: 400 }
      );
    }

    // Get the authorization to verify ownership
    const { data: authorization, error: fetchError } = await supabase
      .from('a2a_authorization_requests')
      .select('grantor_credential_id, status')
      .eq('id', id)
      .single();

    if (fetchError || !authorization) {
      return NextResponse.json({ error: 'Authorization not found' }, { status: 404 });
    }

    if (authorization.status !== 'approved') {
      return NextResponse.json(
        { error: 'Can only revoke approved authorizations' },
        { status: 400 }
      );
    }

    // Verify the user owns the grantor credential
    const { data: grantorCred, error: credError } = await supabase
      .from('credentials')
      .select('id, issuer_id')
      .eq('id', authorization.grantor_credential_id)
      .single();

    if (credError || !grantorCred || grantorCred.issuer_id !== user.id) {
      return NextResponse.json(
        { error: 'You do not own the grantor credential' },
        { status: 403 }
      );
    }

    // Revoke the authorization with audit fields
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('a2a_authorization_requests')
      .update({
        status: 'revoked',
        revoked_at: now,
        revocation_reason: reason || null,
        updated_at: now,
      })
      .eq('id', id);

    if (error) {
      console.error('Failed to revoke authorization:', error);
      return NextResponse.json({ error: 'Failed to revoke authorization' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Authorization revoked',
      status: 'revoked',
      revoked_at: now,
      reason: reason || null,
    });
  } catch (error) {
    console.error('Revoke authorization error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
