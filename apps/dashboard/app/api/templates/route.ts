import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { authenticateRequest, checkScope } from '@/lib/auth';
import { ApiKeyScopes } from '@/lib/api-keys';

const createTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  agent_type: z.string().min(1),
  permissions: z.array(z.string()).default([]),
  geographic_restrictions: z.array(z.string()).optional(),
  allowed_services: z.array(z.string()).optional(),
  validity_days: z.number().positive().optional(),
  metadata_schema: z.record(z.unknown()).optional(),
  default_metadata: z.record(z.unknown()).optional(),
});

/**
 * GET /api/templates - List credential templates
 */
export async function GET(request: NextRequest) {
  try {
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
    if (auth.apiKeyInfo && !checkScope(auth, ApiKeyScopes.CREDENTIALS_READ)) {
      return NextResponse.json(
        { error: 'API key lacks credentials:read scope' },
        { status: 403 }
      );
    }

    const supabase = auth.apiKeyInfo
      ? createServiceClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
      : await createClient();

    // Get query params
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';

    // Build query
    let query = supabase
      .from('credential_templates')
      .select('*')
      .eq('issuer_id', auth.issuerId)
      .order('created_at', { ascending: false });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data: templates, error } = await query;

    if (error) {
      console.error('Failed to fetch templates:', error);
      return NextResponse.json(
        { error: 'Failed to fetch templates' },
        { status: 500 }
      );
    }

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Templates list error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/templates - Create credential template
 */
export async function POST(request: NextRequest) {
  try {
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

    // Parse and validate request
    const body = await request.json();
    const parsed = createTemplateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const {
      name,
      description,
      agent_type,
      permissions,
      geographic_restrictions,
      allowed_services,
      validity_days,
      metadata_schema,
      default_metadata,
    } = parsed.data;

    // Create template
    const { data: template, error } = await supabase
      .from('credential_templates')
      .insert({
        issuer_id: auth.issuerId,
        name,
        description,
        agent_type,
        permissions,
        geographic_restrictions: geographic_restrictions || [],
        allowed_services: allowed_services || [],
        validity_days,
        metadata_schema: metadata_schema || {},
        default_metadata: default_metadata || {},
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'A template with this name already exists' },
          { status: 409 }
        );
      }
      console.error('Failed to create template:', error);
      return NextResponse.json(
        { error: 'Failed to create template' },
        { status: 500 }
      );
    }

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    console.error('Template creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
