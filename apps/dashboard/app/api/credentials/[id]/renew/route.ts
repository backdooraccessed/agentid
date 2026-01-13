import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { authenticateRequest, checkScope } from '@/lib/auth';
import { ApiKeyScopes } from '@/lib/api-keys';

/**
 * POST /api/credentials/[id]/renew - Renew a credential
 * Extends the validity period of an existing credential
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Authenticate (session or API key)
    const auth = await authenticateRequest(request);

    if (!auth.authenticated) {
      return NextResponse.json(
        { error: auth.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!auth.issuerId) {
      return NextResponse.json(
        { error: 'Issuer profile not found' },
        { status: 404 }
      );
    }

    // Check scope for API key auth
    if (auth.apiKeyInfo && !checkScope(auth, ApiKeyScopes.CREDENTIALS_WRITE)) {
      return NextResponse.json(
        { error: 'API key lacks credentials:write scope' },
        { status: 403 }
      );
    }

    const supabase = auth.apiKeyInfo
      ? createServiceClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
      : await createClient();

    // Parse request body
    const body = await request.json();
    const { extend_days = 90 } = body;

    // Validate extend_days
    if (typeof extend_days !== 'number' || extend_days < 1 || extend_days > 365) {
      return NextResponse.json(
        { error: 'extend_days must be between 1 and 365' },
        { status: 400 }
      );
    }

    // Fetch existing credential
    const { data: credential, error: fetchError } = await supabase
      .from('credentials')
      .select('*, issuers!inner(id, user_id)')
      .eq('id', id)
      .eq('issuer_id', auth.issuerId)
      .single();

    if (fetchError || !credential) {
      return NextResponse.json(
        { error: 'Credential not found' },
        { status: 404 }
      );
    }

    // Only allow renewal of active or expired credentials
    if (credential.status === 'revoked') {
      return NextResponse.json(
        { error: 'Cannot renew a revoked credential' },
        { status: 400 }
      );
    }

    // Calculate new validity period
    const now = new Date();
    const currentValidUntil = new Date(credential.valid_until);
    const baseDate = currentValidUntil > now ? currentValidUntil : now;
    const newValidUntil = new Date(baseDate);
    newValidUntil.setDate(newValidUntil.getDate() + extend_days);

    // Update credential payload with new validity
    const payload = credential.credential_payload;
    payload.constraints.valid_until = newValidUntil.toISOString();

    // Re-sign the credential via Edge Function
    const { data: signed, error: signError } = await supabase.functions.invoke(
      'sign-credential',
      {
        body: {
          action: 'sign',
          user_id: credential.issuers.user_id,
          payload: {
            ...payload,
            signature: undefined, // Remove old signature
          },
        },
      }
    );

    if (signError || !signed?.signature) {
      console.error('Signing error:', signError);
      return NextResponse.json(
        { error: 'Failed to re-sign credential' },
        { status: 500 }
      );
    }

    // Update credential in database
    const updatedPayload = {
      ...payload,
      signature: signed.signature,
    };

    const { data: updated, error: updateError } = await supabase
      .from('credentials')
      .update({
        valid_until: newValidUntil.toISOString(),
        credential_payload: updatedPayload,
        status: 'active', // Reactivate if was expired
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update credential' },
        { status: 500 }
      );
    }

    // Log the renewal in audit log (fire and forget)
    void (async () => {
      try {
        await supabase.from('audit_logs').insert({
          issuer_id: auth.issuerId,
          action: 'credential.renewed',
          resource_type: 'credential',
          resource_id: id,
          details: {
            agent_id: credential.agent_id,
            previous_valid_until: credential.valid_until,
            new_valid_until: newValidUntil.toISOString(),
            extend_days,
          },
        });
      } catch {
        // Ignore audit log failures
      }
    })();

    return NextResponse.json({
      message: 'Credential renewed successfully',
      credential: {
        id: updated.id,
        agent_id: updated.agent_id,
        status: updated.status,
        valid_until: updated.valid_until,
      },
    });
  } catch (error) {
    console.error('Credential renewal error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
