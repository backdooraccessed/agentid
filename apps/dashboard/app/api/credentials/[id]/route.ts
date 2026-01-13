import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Fetch credential with issuer info
    const { data: credential, error } = await supabase
      .from('credentials')
      .select(`
        *,
        issuers (
          id,
          name,
          issuer_type,
          is_verified,
          public_key
        )
      `)
      .eq('id', id)
      .single();

    if (error || !credential) {
      return NextResponse.json(
        { error: 'Credential not found' },
        { status: 404 }
      );
    }

    // Check validity
    const now = new Date();
    const validFrom = new Date(credential.valid_from);
    const validUntil = new Date(credential.valid_until);
    const isValid =
      credential.status === 'active' &&
      now >= validFrom &&
      now < validUntil;

    return NextResponse.json({
      credential: credential.credential_payload,
      issuer_public_key: credential.issuers.public_key,
      status: credential.status,
      is_valid: isValid,
    });
  } catch (error) {
    console.error('Get credential error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
