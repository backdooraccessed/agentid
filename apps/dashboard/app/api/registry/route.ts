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

// Search schema
const searchSchema = z.object({
  query: z.string().optional(),
  categories: z.array(z.string()).optional(),
  capabilities: z.array(z.string()).optional(),
  min_trust_score: z.number().int().min(0).max(100).optional(),
  issuer_verified: z.boolean().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

// Register schema
const registerSchema = z.object({
  credential_id: z.string().uuid(),
  display_name: z.string().min(1).max(100),
  description: z.string().max(2000).optional(),
  short_description: z.string().max(160).optional(),
  categories: z.array(z.string()).default([]),
  capabilities: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  endpoint_url: z.string().url().optional(),
  documentation_url: z.string().url().optional(),
  support_email: z.string().email().optional(),
  visibility: z.enum(['public', 'unlisted', 'private']).default('public'),
});

// GET /api/registry - Search agents (public)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse query parameters
    const params = {
      query: searchParams.get('query') || undefined,
      categories: searchParams.get('categories')?.split(',').filter(Boolean) || undefined,
      capabilities: searchParams.get('capabilities')?.split(',').filter(Boolean) || undefined,
      min_trust_score: searchParams.get('min_trust_score')
        ? parseInt(searchParams.get('min_trust_score')!)
        : undefined,
      issuer_verified: searchParams.get('issuer_verified')
        ? searchParams.get('issuer_verified') === 'true'
        : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
    };

    const parsed = searchSchema.safeParse(params);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { query, categories, capabilities, min_trust_score, issuer_verified, limit, offset } =
      parsed.data;

    const supabase = getPublicSupabase();

    // Use the search function
    const { data: agents, error } = await supabase.rpc('search_agents', {
      p_query: query || null,
      p_categories: categories || null,
      p_capabilities: capabilities || null,
      p_min_trust_score: min_trust_score || null,
      p_issuer_verified: issuer_verified ?? null,
      p_limit: limit,
      p_offset: offset,
    });

    if (error) {
      console.error('Failed to search agents:', error);
      return NextResponse.json({ error: 'Failed to search agents' }, { status: 500 });
    }

    // Get total count for pagination
    const { count } = await supabase
      .from('agent_registry')
      .select('*', { count: 'exact', head: true })
      .eq('visibility', 'public');

    return NextResponse.json({
      agents: agents || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Registry search error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/registry - Register agent (authenticated)
export async function POST(request: NextRequest) {
  try {
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
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Verify credential belongs to this issuer
    const { data: credential, error: credError } = await supabase
      .from('credentials')
      .select('id, status')
      .eq('id', data.credential_id)
      .eq('issuer_id', issuer.id)
      .single();

    if (credError || !credential) {
      return NextResponse.json({ error: 'Credential not found' }, { status: 404 });
    }

    if (credential.status !== 'active') {
      return NextResponse.json({ error: 'Credential is not active' }, { status: 400 });
    }

    // Register the agent
    const { data: result, error } = await supabase.rpc('register_agent', {
      p_credential_id: data.credential_id,
      p_display_name: data.display_name,
      p_description: data.description || null,
      p_short_description: data.short_description || null,
      p_categories: data.categories,
      p_capabilities: data.capabilities,
      p_tags: data.tags,
      p_endpoint_url: data.endpoint_url || null,
      p_documentation_url: data.documentation_url || null,
      p_support_email: data.support_email || null,
      p_visibility: data.visibility,
    });

    if (error || !result?.[0]?.success) {
      console.error('Failed to register agent:', error || result?.[0]?.message);
      return NextResponse.json(
        { error: result?.[0]?.message || 'Failed to register agent' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      registry_id: result[0].registry_id,
      message: result[0].message,
    }, { status: 201 });
  } catch (error) {
    console.error('Registry POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
