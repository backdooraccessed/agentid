import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Public Supabase client for unauthenticated requests
function getPublicSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Update schema
const updateSchema = z.object({
  display_name: z.string().min(1).max(100).optional(),
  description: z.string().max(2000).optional().nullable(),
  short_description: z.string().max(160).optional().nullable(),
  logo_url: z.string().url().optional().nullable(),
  categories: z.array(z.string()).optional(),
  capabilities: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  endpoint_url: z.string().url().optional().nullable(),
  documentation_url: z.string().url().optional().nullable(),
  api_spec_url: z.string().url().optional().nullable(),
  support_email: z.string().email().optional().nullable(),
  support_url: z.string().url().optional().nullable(),
  visibility: z.enum(['public', 'unlisted', 'private']).optional(),
});

// GET /api/registry/[id] - Get agent profile (public)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getPublicSupabase();

    // Check if ID is a UUID (registry ID) or credential ID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    if (!isUUID) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }

    // Try to get by credential ID first using the function
    const { data: profileData, error: profileError } = await supabase.rpc('get_agent_profile', {
      p_credential_id: id,
    });

    if (!profileError && profileData && profileData.length > 0) {
      return NextResponse.json({ agent: profileData[0] });
    }

    // Fallback: try to get by registry ID
    const { data: agent, error } = await supabase
      .from('agent_registry')
      .select(`
        *,
        issuers (name, is_verified, domain),
        credentials (agent_id, agent_name, status)
      `)
      .eq('id', id)
      .eq('visibility', 'public')
      .single();

    if (error || !agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Check credential is active
    if (agent.credentials?.status !== 'active') {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    return NextResponse.json({
      agent: {
        ...agent,
        issuer_name: agent.issuers?.name,
        issuer_verified: agent.issuers?.is_verified,
        issuer_domain: agent.issuers?.domain,
      },
    });
  } catch (error) {
    console.error('Registry GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/registry/[id] - Update agent profile (authenticated, owner only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerClient();

    // Verify authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get issuer for this user
    const { data: issuer, error: issuerError } = await supabase
      .from('issuers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (issuerError || !issuer) {
      return NextResponse.json({ error: 'Issuer not found' }, { status: 404 });
    }

    // Parse and validate request body
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Build update object
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    const data = parsed.data;
    if (data.display_name !== undefined) updates.display_name = data.display_name;
    if (data.description !== undefined) updates.description = data.description;
    if (data.short_description !== undefined) updates.short_description = data.short_description;
    if (data.logo_url !== undefined) updates.logo_url = data.logo_url;
    if (data.categories !== undefined) updates.categories = data.categories;
    if (data.capabilities !== undefined) updates.capabilities = data.capabilities;
    if (data.tags !== undefined) updates.tags = data.tags;
    if (data.endpoint_url !== undefined) updates.endpoint_url = data.endpoint_url;
    if (data.documentation_url !== undefined) updates.documentation_url = data.documentation_url;
    if (data.api_spec_url !== undefined) updates.api_spec_url = data.api_spec_url;
    if (data.support_email !== undefined) updates.support_email = data.support_email;
    if (data.support_url !== undefined) updates.support_url = data.support_url;
    if (data.visibility !== undefined) {
      updates.visibility = data.visibility;
      // Set published_at if becoming public for the first time
      if (data.visibility === 'public') {
        updates.published_at = new Date().toISOString();
      }
    }

    // Update (RLS will enforce ownership)
    const { data: agent, error } = await supabase
      .from('agent_registry')
      .update(updates)
      .eq('id', id)
      .eq('issuer_id', issuer.id)
      .select()
      .single();

    if (error || !agent) {
      console.error('Failed to update agent:', error);
      return NextResponse.json({ error: 'Failed to update agent' }, { status: 500 });
    }

    return NextResponse.json({ agent });
  } catch (error) {
    console.error('Registry PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/registry/[id] - Remove from registry (authenticated, owner only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerClient();

    // Verify authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get issuer for this user
    const { data: issuer, error: issuerError } = await supabase
      .from('issuers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (issuerError || !issuer) {
      return NextResponse.json({ error: 'Issuer not found' }, { status: 404 });
    }

    // Delete (RLS will enforce ownership)
    const { error } = await supabase
      .from('agent_registry')
      .delete()
      .eq('id', id)
      .eq('issuer_id', issuer.id);

    if (error) {
      console.error('Failed to delete agent:', error);
      return NextResponse.json({ error: 'Failed to delete agent' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Registry DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
