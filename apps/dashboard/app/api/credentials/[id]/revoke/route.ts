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

    // 4. Verify credential ownership and revoke
    const { data: credential, error } = await supabase
      .from('credentials')
      .update({
        status: 'revoked',
        revoked_at: new Date().toISOString(),
        revocation_reason: reason,
      })
      .eq('id', id)
      .eq('issuer_id', auth.issuerId)
      .eq('status', 'active')
      .select()
      .single();

    if (error || !credential) {
      return NextResponse.json(
        { error: 'Credential not found, not owned by you, or already revoked' },
        { status: 404 }
      );
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
    });
  } catch (error) {
    console.error('Revocation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
