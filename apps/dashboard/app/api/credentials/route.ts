import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { issueCredentialRequestSchema } from '@agentid/shared';
import { authenticateRequest, checkScope } from '@/lib/auth';
import { ApiKeyScopes } from '@/lib/api-keys';
import { createClient as createServiceClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
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

    // 2. Use service client for credential operations to bypass RLS
    // This is safe because we've already verified authentication and issuer ownership
    // The service client is needed because credential insert triggers update analytics,
    // which would fail with user-scoped RLS
    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: issuer, error: issuerError } = await supabase
      .from('issuers')
      .select('*')
      .eq('id', auth.issuerId)
      .single();

    if (issuerError || !issuer) {
      return NextResponse.json(
        { error: 'Issuer profile not found' },
        { status: 404 }
      );
    }

    // 3. Parse request body
    const body = await request.json();

    // Check if using a template
    let templateData: {
      agent_type?: string;
      permissions?: string[];
      geographic_restrictions?: string[];
      allowed_services?: string[];
      validity_days?: number | null;
      default_metadata?: Record<string, unknown>;
    } | null = null;
    let templateId: string | null = null;

    if (body.template_id) {
      templateId = body.template_id;
      const { data: template, error: templateError } = await supabase
        .from('credential_templates')
        .select('*')
        .eq('id', body.template_id)
        .eq('issuer_id', issuer.id)
        .eq('is_active', true)
        .single();

      if (templateError || !template) {
        return NextResponse.json(
          { error: 'Template not found or inactive' },
          { status: 404 }
        );
      }

      templateData = {
        agent_type: template.agent_type,
        permissions: template.permissions,
        geographic_restrictions: template.geographic_restrictions,
        allowed_services: template.allowed_services,
        validity_days: template.validity_days,
        default_metadata: template.default_metadata,
      };
    }

    // Merge template data with request body (request overrides template)
    const mergedBody = templateData
      ? {
          ...body,
          agent_type: body.agent_type || templateData.agent_type,
          permissions: body.permissions || templateData.permissions,
          geographic_restrictions: body.geographic_restrictions || templateData.geographic_restrictions,
          allowed_services: body.allowed_services || templateData.allowed_services,
          metadata: { ...(templateData.default_metadata || {}), ...(body.metadata || {}) },
          // Calculate valid_until from template validity_days if not provided
          valid_until: body.valid_until || (templateData.validity_days
            ? new Date(Date.now() + templateData.validity_days * 24 * 60 * 60 * 1000).toISOString()
            : undefined),
        }
      : body;

    // Validate merged body
    const parsed = issueCredentialRequestSchema.safeParse(mergedBody);

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
        { error: 'Failed to sign credential', details: signError?.message || 'No signature returned' },
        { status: 500 }
      );
    }

    // Add signature to payload
    const signedPayload = {
      ...credentialPayload,
      signature: signResult.signature,
    };

    // 7. Store credential in database
    // Note: agent_profile column requires migration 020_agent_profile.sql
    const insertData: Record<string, unknown> = {
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
      metadata: {
        ...(parsed.data.metadata || {}),
        // Store agent_profile in metadata until migration is applied
        agent_profile: parsed.data.agent_profile || undefined,
      },
      template_id: templateId,
    };

    const { data: credential, error: insertError } = await supabase
      .from('credentials')
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to store credential', details: insertError.message },
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

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get issuer profile
    const { data: issuer } = await supabase
      .from('issuers')
      .select('id')
      .eq('user_id', user.id)
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
