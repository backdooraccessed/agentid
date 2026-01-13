import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { authenticateRequest, checkScope } from '@/lib/auth';
import { ApiKeyScopes } from '@/lib/api-keys';

const updateTemplateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  agent_type: z.string().min(1).optional(),
  permissions: z.array(z.string()).optional(),
  geographic_restrictions: z.array(z.string()).optional(),
  allowed_services: z.array(z.string()).optional(),
  validity_days: z.number().positive().nullable().optional(),
  metadata_schema: z.record(z.unknown()).optional(),
  default_metadata: z.record(z.unknown()).optional(),
  is_active: z.boolean().optional(),
});

/**
 * GET /api/templates/[id] - Get template details
 */
export async function GET(
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

    // Get template
    const { data: template, error } = await supabase
      .from('credential_templates')
      .select('*')
      .eq('id', id)
      .eq('issuer_id', auth.issuerId)
      .single();

    if (error || !template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Get recent credentials using this template
    const { data: credentials } = await supabase
      .from('credentials')
      .select('id, agent_id, agent_name, created_at, status')
      .eq('template_id', id)
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      template,
      recent_credentials: credentials || [],
    });
  } catch (error) {
    console.error('Template fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/templates/[id] - Update template
 */
export async function PATCH(
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

    // Parse and validate request
    const body = await request.json();
    const parsed = updateTemplateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.format() },
        { status: 400 }
      );
    }

    // Build update object (only include provided fields)
    const updates: Record<string, unknown> = {};
    const data = parsed.data;

    if (data.name !== undefined) updates.name = data.name;
    if (data.description !== undefined) updates.description = data.description;
    if (data.agent_type !== undefined) updates.agent_type = data.agent_type;
    if (data.permissions !== undefined) updates.permissions = data.permissions;
    if (data.geographic_restrictions !== undefined) updates.geographic_restrictions = data.geographic_restrictions;
    if (data.allowed_services !== undefined) updates.allowed_services = data.allowed_services;
    if (data.validity_days !== undefined) updates.validity_days = data.validity_days;
    if (data.metadata_schema !== undefined) updates.metadata_schema = data.metadata_schema;
    if (data.default_metadata !== undefined) updates.default_metadata = data.default_metadata;
    if (data.is_active !== undefined) updates.is_active = data.is_active;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No updates provided' },
        { status: 400 }
      );
    }

    // Update template
    const { data: template, error } = await supabase
      .from('credential_templates')
      .update(updates)
      .eq('id', id)
      .eq('issuer_id', auth.issuerId)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'A template with this name already exists' },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: 'Template not found or update failed' },
        { status: 404 }
      );
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error('Template update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/templates/[id] - Delete template
 */
export async function DELETE(
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

    // Delete template
    const { error } = await supabase
      .from('credential_templates')
      .delete()
      .eq('id', id)
      .eq('issuer_id', auth.issuerId);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete template' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Template delete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
