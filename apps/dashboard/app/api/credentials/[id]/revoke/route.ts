import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { revokeCredentialRequestSchema } from '@agentid/shared';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // 1. Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Get issuer profile
    const { data: issuer } = await supabase
      .from('issuers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!issuer) {
      return NextResponse.json(
        { error: 'Issuer profile not found' },
        { status: 404 }
      );
    }

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
      .eq('issuer_id', issuer.id)
      .eq('status', 'active')
      .select()
      .single();

    if (error || !credential) {
      return NextResponse.json(
        { error: 'Credential not found, not owned by you, or already revoked' },
        { status: 404 }
      );
    }

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
