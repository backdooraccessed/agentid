import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { triggerWebhooks } from '@/lib/webhooks';
import { sendAuthorizationRequestEmail } from '@/lib/email';
import { verifyA2AAuthorizationSignature } from '@/lib/a2a-signature';

// Service client for internal operations
function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// GET /api/a2a/authorizations - List authorization requests
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const credentialId = searchParams.get('credential_id');
    const role = searchParams.get('role'); // 'requester' or 'grantor'
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query - use the view for pending requests or main table for all
    let query;
    if (status === 'pending') {
      query = supabase
        .from('v_pending_authorizations')
        .select('*');

      if (credentialId) {
        if (role === 'requester') {
          query = query.eq('requester_credential_id', credentialId);
        } else if (role === 'grantor') {
          query = query.eq('grantor_credential_id', credentialId);
        } else {
          query = query.or(`requester_credential_id.eq.${credentialId},grantor_credential_id.eq.${credentialId}`);
        }
      }
    } else {
      query = supabase
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
        `);

      if (credentialId) {
        if (role === 'requester') {
          query = query.eq('requester_credential_id', credentialId);
        } else if (role === 'grantor') {
          query = query.eq('grantor_credential_id', credentialId);
        } else {
          query = query.or(`requester_credential_id.eq.${credentialId},grantor_credential_id.eq.${credentialId}`);
        }
      }

      if (status) {
        query = query.eq('status', status);
      }
    }

    const { data: authorizations, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Failed to fetch authorizations:', error);
      return NextResponse.json({ error: 'Failed to fetch authorizations' }, { status: 500 });
    }

    return NextResponse.json({
      authorizations: authorizations || [],
      total: count || authorizations?.length || 0,
    });
  } catch (error) {
    console.error('Authorizations error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/a2a/authorizations - Create an authorization request
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      requester_credential_id,
      grantor_credential_id,
      requested_permissions,
      scope,
      constraints,
      valid_until,
      signature,
    } = body;

    // Validate required fields
    if (!requester_credential_id || !grantor_credential_id || !requested_permissions || !signature) {
      return NextResponse.json(
        { error: 'Missing required fields: requester_credential_id, grantor_credential_id, requested_permissions, signature' },
        { status: 400 }
      );
    }

    // Validate permissions format
    if (!Array.isArray(requested_permissions) || requested_permissions.length === 0) {
      return NextResponse.json(
        { error: 'requested_permissions must be a non-empty array' },
        { status: 400 }
      );
    }

    // Verify the user owns the requester credential
    const { data: requesterCred, error: credError } = await supabase
      .from('credentials')
      .select('id, issuer_id')
      .eq('id', requester_credential_id)
      .single();

    if (credError || !requesterCred) {
      return NextResponse.json({ error: 'Requester credential not found' }, { status: 404 });
    }

    if (requesterCred.issuer_id !== user.id) {
      return NextResponse.json({ error: 'You do not own this credential' }, { status: 403 });
    }

    // Verify grantor credential exists
    const serviceSupabase = getServiceSupabase();
    const { data: grantorCred, error: grantorError } = await serviceSupabase
      .from('credentials')
      .select('id, status')
      .eq('id', grantor_credential_id)
      .single();

    if (grantorError || !grantorCred) {
      return NextResponse.json({ error: 'Grantor credential not found' }, { status: 404 });
    }

    if (grantorCred.status !== 'active') {
      return NextResponse.json({ error: 'Grantor credential is not active' }, { status: 400 });
    }

    // Verify the authorization request signature
    const signatureResult = await verifyA2AAuthorizationSignature({
      requesterCredentialId: requester_credential_id,
      grantorCredentialId: grantor_credential_id,
      requestedPermissions: requested_permissions,
      scope,
      constraints,
      validUntil: valid_until,
      signature,
    });

    if (!signatureResult.valid) {
      console.error('A2A authorization request signature verification failed:', signatureResult.error);
      return NextResponse.json(
        {
          error: 'Signature verification failed',
          details: signatureResult.error,
        },
        { status: 403 }
      );
    }

    // Create authorization request
    const { data: requestId, error } = await serviceSupabase
      .rpc('create_a2a_authorization_request', {
        p_requester_id: requester_credential_id,
        p_grantor_id: grantor_credential_id,
        p_permissions: requested_permissions,
        p_scope: scope || null,
        p_constraints: constraints || null,
        p_valid_until: valid_until || null,
        p_signature: signature,
      });

    if (error) {
      console.error('Failed to create authorization request:', error);
      return NextResponse.json({ error: 'Failed to create authorization request' }, { status: 500 });
    }

    // Send notifications (fire and forget)
    void (async () => {
      try {
        // Get requester and grantor details for notifications
        const { data: requesterDetails } = await serviceSupabase
          .from('credentials')
          .select('agent_name, agent_id, issuer_id')
          .eq('id', requester_credential_id)
          .single();

        const { data: grantorDetails } = await serviceSupabase
          .from('credentials')
          .select('agent_name, issuer_id, issuer:issuers(user_id)')
          .eq('id', grantor_credential_id)
          .single();

        // Trigger webhooks for grantor's issuer
        if (grantorDetails?.issuer_id) {
          await triggerWebhooks(
            grantorDetails.issuer_id,
            'authorization.requested',
            {
              authorization_id: requestId,
              requester_credential_id,
              grantor_credential_id,
              requester_agent_name: requesterDetails?.agent_name,
              requested_permissions,
              scope,
            }
          );
        }

        // Send email notification to grantor's issuer
        if (grantorDetails?.issuer) {
          const grantorUserId = (grantorDetails.issuer as unknown as { user_id: string }).user_id;
          // Get user email from Supabase Auth
          const { data: userData } = await serviceSupabase.auth.admin.getUserById(grantorUserId);
          if (userData?.user?.email) {
            await sendAuthorizationRequestEmail({
              email: userData.user.email,
              requesterAgentName: requesterDetails?.agent_name || 'Unknown Agent',
              requesterAgentId: requesterDetails?.agent_id || requester_credential_id,
              requestedPermissions: requested_permissions.map((p: unknown) =>
                typeof p === 'string' ? p : (p as { action?: string }).action || JSON.stringify(p)
              ),
              scopeDescription: scope,
              authorizationId: requestId,
            });
          }
        }
      } catch (notifyError) {
        console.error('Failed to send authorization notifications:', notifyError);
      }
    })();

    return NextResponse.json({
      authorization_id: requestId,
      message: 'Authorization request created',
    });
  } catch (error) {
    console.error('Create authorization error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
