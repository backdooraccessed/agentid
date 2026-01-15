import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/widget/[id]
 * Returns credential data optimized for the embeddable widget
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const { id: credentialId } = await params;

  try {
    const supabase = await createClient();

    // Fetch credential with issuer info
    const { data: credential, error } = await supabase
      .from('credentials')
      .select(`
        id,
        agent_id,
        agent_name,
        agent_type,
        status,
        valid_from,
        valid_until,
        permissions,
        issuer:issuers (
          id,
          name,
          is_verified
        )
      `)
      .eq('id', credentialId)
      .single();

    if (error || !credential) {
      return NextResponse.json(
        {
          valid: false,
          error: 'Credential not found',
          error_code: 'CREDENTIAL_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // Check if credential is valid
    const now = new Date();
    const validFrom = new Date(credential.valid_from);
    const validUntil = new Date(credential.valid_until);

    if (credential.status !== 'active') {
      return NextResponse.json({
        valid: false,
        error: `Credential is ${credential.status}`,
        error_code: 'CREDENTIAL_NOT_ACTIVE',
        credential: {
          credential_id: credential.id,
          agent_id: credential.agent_id,
          agent_name: credential.agent_name,
          agent_type: credential.agent_type,
          status: credential.status,
        },
      });
    }

    if (now < validFrom) {
      return NextResponse.json({
        valid: false,
        error: 'Credential not yet valid',
        error_code: 'CREDENTIAL_NOT_YET_VALID',
      });
    }

    if (now > validUntil) {
      return NextResponse.json({
        valid: false,
        error: 'Credential expired',
        error_code: 'CREDENTIAL_EXPIRED',
      });
    }

    // Fetch trust score from reputation
    const { data: reputation } = await supabase
      .from('agent_reputation')
      .select('trust_score')
      .eq('credential_id', credentialId)
      .single();

    const verificationTimeMs = Date.now() - startTime;

    // Return widget-optimized response
    return NextResponse.json({
      valid: true,
      credential: {
        credential_id: credential.id,
        agent_id: credential.agent_id,
        agent_name: credential.agent_name,
        agent_type: credential.agent_type,
        status: credential.status,
        valid_from: credential.valid_from,
        valid_until: credential.valid_until,
        permissions: credential.permissions,
        issuer: credential.issuer ? {
          id: (credential.issuer as any).id,
          name: (credential.issuer as any).name,
          issuer_verified: (credential.issuer as any).is_verified,
        } : null,
      },
      trust_score: reputation?.trust_score ?? 50,
      verification_time_ms: verificationTimeMs,
    });
  } catch (error) {
    console.error('Widget API error:', error);
    return NextResponse.json(
      {
        valid: false,
        error: 'Internal server error',
        error_code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}

// Support CORS for widget embedding
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
