import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { revokeCredentialRequestSchema } from '@agentid/shared';
import { triggerWebhooks } from '@/lib/webhooks';
import { authenticateRequest, checkScope } from '@/lib/auth';
import { ApiKeyScopes } from '@/lib/api-keys';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Authenticate (session or API key)
    const auth = await authenticateRequest(request);

    if (!auth.authenticated) {
      return NextResponse.json(
        { error: auth.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!auth.issuerId) {
      return NextResponse.json(
        { error: 'Issuer profile not found. Please register first.' },
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

    // 2. Get supabase client
    const supabase = auth.apiKeyInfo
      ? createServiceClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
      : await createClient();

    // 3. Parse request body
    const body = await request.json().catch(() => ({}));
    const parsed = revokeCredentialRequestSchema.safeParse(body);
    const reason = parsed.success ? parsed.data.reason : 'Revoked by issuer';

    // 4. Use revoke_credential function for instant revocation broadcast
    // This function updates the credential AND inserts into revocations_stream
    // which triggers Supabase Realtime broadcast to all connected verifiers
    const { data: revokeResult, error: revokeError } = await supabase.rpc(
      'revoke_credential',
      {
        p_credential_id: id,
        p_reason: reason,
        p_user_id: auth.userId,
      }
    );

    if (revokeError) {
      console.error('Revoke RPC error:', revokeError);
      return NextResponse.json(
        { error: 'Failed to revoke credential' },
        { status: 500 }
      );
    }

    const result = revokeResult?.[0];
    if (!result?.success) {
      return NextResponse.json(
        { error: result?.message || 'Credential not found, not owned by you, or already revoked' },
        { status: 404 }
      );
    }

    // Fetch the updated credential for webhook payload
    const { data: credential, error } = await supabase
      .from('credentials')
      .select()
      .eq('id', id)
      .single();

    if (error || !credential) {
      // Revocation succeeded but couldn't fetch - still return success
      return NextResponse.json({
        success: true,
        credential: { id, status: 'revoked' },
        instant_broadcast: true,
      });
    }

    // Trigger webhooks (fire and forget)
    void triggerWebhooks(
      auth.issuerId,
      'credential.revoked',
      {
        credential_id: credential.id,
        agent_id: credential.agent_id,
        agent_name: credential.agent_name,
        revoked_at: credential.revoked_at,
        revocation_reason: credential.revocation_reason,
      },
      credential.id
    );

    return NextResponse.json({
      success: true,
      credential: {
        id: credential.id,
        agent_id: credential.agent_id,
        status: credential.status,
        revoked_at: credential.revoked_at,
        revocation_reason: credential.revocation_reason,
      },
      // Instant revocation: all connected verifiers are notified in real-time
      instant_broadcast: true,
      revocation_id: result.revocation_id,
    });
  } catch (error) {
    console.error('Revocation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
