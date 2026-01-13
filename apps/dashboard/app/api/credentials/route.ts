import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { issueCredentialRequestSchema } from '@agentid/shared';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Demo mode: use test issuer if no authenticated user
    const testIssuerId = '4b874791-9a15-4808-83b3-ff26c59275b5';

    // 1. Check authentication (optional in demo mode)
    const { data: { user } } = await supabase.auth.getUser();

    // 2. Get issuer profile (use test issuer in demo mode)
    const { data: issuer, error: issuerError } = user
      ? await supabase
          .from('issuers')
          .select('*')
          .eq('user_id', user.id)
          .single()
      : await supabase
          .from('issuers')
          .select('*')
          .eq('id', testIssuerId)
          .single();

    if (issuerError || !issuer) {
      return NextResponse.json(
        { error: 'Issuer profile not found. Please register first.' },
        { status: 404 }
      );
    }

    // 3. Parse and validate request
    const body = await request.json();
    const parsed = issueCredentialRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.format() },
        { status: 400 }
      );
    }

    // 4. Check for existing credential with same agent_id
    const { data: existingCredential } = await supabase
      .from('credentials')
      .select('id')
      .eq('issuer_id', issuer.id)
      .eq('agent_id', parsed.data.agent_id)
      .single();

    if (existingCredential) {
      return NextResponse.json(
        { error: 'A credential for this agent_id already exists' },
        { status: 409 }
      );
    }

    // 5. Build credential payload
    const credentialId = crypto.randomUUID();
    const now = new Date().toISOString();
    const validFrom = parsed.data.valid_from || now;

    const credentialPayload = {
      credential_id: credentialId,
      agent_id: parsed.data.agent_id,
      agent_name: parsed.data.agent_name,
      agent_type: parsed.data.agent_type,
      issuer: {
        issuer_id: issuer.id,
        issuer_type: issuer.issuer_type,
        issuer_verified: issuer.is_verified,
        name: issuer.name,
      },
      permissions: parsed.data.permissions,
      constraints: {
        valid_from: validFrom,
        valid_until: parsed.data.valid_until,
        geographic_restrictions: parsed.data.geographic_restrictions || [],
        allowed_services: parsed.data.allowed_services || [],
      },
      issued_at: now,
    };

    // 6. Sign the credential via Edge Function
    const { data: signResult, error: signError } = await supabase.functions.invoke(
      'sign-credential',
      {
        body: {
          payload: credentialPayload,
          issuer_id: issuer.id,
        },
      }
    );

    if (signError || !signResult?.signature) {
      console.error('Signing error:', signError);
      return NextResponse.json(
        { error: 'Failed to sign credential' },
        { status: 500 }
      );
    }

    // Add signature to payload
    const signedPayload = {
      ...credentialPayload,
      signature: signResult.signature,
    };

    // 7. Store credential in database
    const { data: credential, error: insertError } = await supabase
      .from('credentials')
      .insert({
        id: credentialId,
        issuer_id: issuer.id,
        agent_id: parsed.data.agent_id,
        agent_name: parsed.data.agent_name,
        agent_type: parsed.data.agent_type,
        permissions: parsed.data.permissions,
        valid_from: validFrom,
        valid_until: parsed.data.valid_until,
        geographic_restrictions: parsed.data.geographic_restrictions || [],
        allowed_services: parsed.data.allowed_services || [],
        signature: signResult.signature,
        key_id: issuer.key_id,
        credential_payload: signedPayload,
        metadata: parsed.data.metadata || {},
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to store credential' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { credential: signedPayload },
      { status: 201 }
    );
  } catch (error) {
    console.error('Credential issuance error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const supabase = await createClient();

    // Demo mode: use test issuer if no authenticated user
    const testIssuerId = '4b874791-9a15-4808-83b3-ff26c59275b5';

    // Check authentication (optional in demo mode)
    const { data: { user } } = await supabase.auth.getUser();

    // Get issuer profile (use test issuer in demo mode)
    const { data: issuer } = user
      ? await supabase
          .from('issuers')
          .select('id')
          .eq('user_id', user.id)
          .single()
      : await supabase
          .from('issuers')
          .select('id')
          .eq('id', testIssuerId)
          .single();

    if (!issuer) {
      return NextResponse.json({ credentials: [] });
    }

    // Get all credentials for this issuer
    const { data: credentials, error } = await supabase
      .from('credentials')
      .select('*')
      .eq('issuer_id', issuer.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch credentials' },
        { status: 500 }
      );
    }

    return NextResponse.json({ credentials: credentials || [] });
  } catch (error) {
    console.error('Get credentials error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
