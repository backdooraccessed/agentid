import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

// Service client for internal operations
function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Admin emails (should be moved to env or database)
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').filter(Boolean);

async function isAdmin(email: string | undefined): Promise<boolean> {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

/**
 * GET /api/admin/registry/featured - Get all featured agents
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !(await isAdmin(user.email))) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const serviceSupabase = getServiceSupabase();

    // Get featured agents with reputation data
    const { data: featuredAgents, error } = await serviceSupabase
      .from('agent_registry')
      .select(`
        id,
        credential_id,
        display_name,
        description,
        category,
        is_featured,
        featured_at,
        is_verified,
        created_at,
        credential:credentials(
          id,
          agent_name,
          agent_type,
          status
        ),
        reputation:agent_reputation(
          trust_score,
          verification_score,
          verification_count
        )
      `)
      .eq('is_featured', true)
      .eq('is_public', true)
      .order('featured_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch featured agents:', error);
      return NextResponse.json({ error: 'Failed to fetch featured agents' }, { status: 500 });
    }

    return NextResponse.json({
      featured: featuredAgents || [],
      count: featuredAgents?.length || 0,
    });
  } catch (error) {
    console.error('Get featured agents error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/registry/featured - Feature or unfeature an agent
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !(await isAdmin(user.email))) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { registry_id, featured } = body;

    if (!registry_id || featured === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: registry_id, featured' },
        { status: 400 }
      );
    }

    const serviceSupabase = getServiceSupabase();

    // Verify registry entry exists and is public
    const { data: entry, error: fetchError } = await serviceSupabase
      .from('agent_registry')
      .select('id, display_name, is_public')
      .eq('id', registry_id)
      .single();

    if (fetchError || !entry) {
      return NextResponse.json({ error: 'Agent registry entry not found' }, { status: 404 });
    }

    if (!entry.is_public) {
      return NextResponse.json(
        { error: 'Only public agents can be featured' },
        { status: 400 }
      );
    }

    // Update featured status
    const { error: updateError } = await serviceSupabase
      .from('agent_registry')
      .update({
        is_featured: featured,
        featured_at: featured ? new Date().toISOString() : null,
      })
      .eq('id', registry_id);

    if (updateError) {
      console.error('Failed to update featured status:', updateError);
      return NextResponse.json({ error: 'Failed to update featured status' }, { status: 500 });
    }

    // Log audit
    await serviceSupabase.from('audit_logs').insert({
      user_id: user.id,
      action: featured ? 'registry.featured' : 'registry.unfeatured',
      resource_type: 'agent_registry',
      resource_id: registry_id,
      details: {
        display_name: entry.display_name,
        featured,
      },
    });

    return NextResponse.json({
      message: featured ? 'Agent featured' : 'Agent unfeatured',
      registry_id,
      featured,
    });
  } catch (error) {
    console.error('Feature agent error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
