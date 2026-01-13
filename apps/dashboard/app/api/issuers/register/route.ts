import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { registerIssuerRequestSchema } from '@agentid/shared';
import { nanoid } from 'nanoid';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Check if already registered
    const { data: existing } = await supabase
      .from('issuers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Already registered as an issuer' },
        { status: 409 }
      );
    }

    // 3. Parse and validate request
    const body = await request.json();
    const parsed = registerIssuerRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.format() },
        { status: 400 }
      );
    }

    // 4. Generate Ed25519 key pair via Edge Function
    const { data: keyPair, error: keyError } = await supabase.functions.invoke(
      'sign-credential',
      {
        body: {
          action: 'generate_keys',
          user_id: user.id,
        },
      }
    );

    if (keyError || !keyPair?.public_key) {
      console.error('Key generation error:', keyError);
      return NextResponse.json(
        { error: 'Failed to generate signing keys' },
        { status: 500 }
      );
    }

    // 5. Create issuer record
    const keyId = `key_${nanoid(16)}`;

    const { data: issuer, error: insertError } = await supabase
      .from('issuers')
      .insert({
        user_id: user.id,
        name: parsed.data.name,
        issuer_type: parsed.data.issuer_type,
        domain: parsed.data.domain || null,
        description: parsed.data.description || null,
        public_key: keyPair.public_key,
        key_id: keyId,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create issuer profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({ issuer }, { status: 201 });
  } catch (error) {
    console.error('Issuer registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const supabase = await createClient();

    // Get current user's issuer profile
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: issuer, error } = await supabase
      .from('issuers')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error || !issuer) {
      return NextResponse.json({ issuer: null }, { status: 200 });
    }

    return NextResponse.json({ issuer });
  } catch (error) {
    console.error('Get issuer error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
