import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/marketplace/[slug] - Get app details by slug (public)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = await createClient();

    // Fetch app with related data
    const { data: app, error } = await supabase
      .from('apps')
      .select(`
        *,
        app_screenshots(id, image_url, caption, display_order),
        app_category_links(
          app_categories(id, name, slug, icon)
        ),
        issuers(name, is_verified),
        credentials(agent_name, id)
      `)
      .eq('slug', slug)
      .eq('status', 'live')
      .single();

    if (error || !app) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 });
    }

    // Get trust score if credential exists
    let trustScore = null;
    if (app.credential_id) {
      const { data: reputation } = await supabase
        .from('agent_reputation')
        .select('trust_score')
        .eq('credential_id', app.credential_id)
        .single();
      trustScore = reputation?.trust_score;
    }

    // Increment view count
    await supabase
      .from('apps')
      .update({ view_count: (app.view_count || 0) + 1 })
      .eq('id', app.id);

    // Track analytics
    await supabase.from('app_analytics').insert({
      app_id: app.id,
      event_type: 'view',
    });

    // Transform response
    const transformedApp = {
      ...app,
      categories: app.app_category_links?.map((link: { app_categories: { id: string; name: string; slug: string; icon: string } }) => link.app_categories).filter(Boolean) || [],
      screenshots: app.app_screenshots?.sort((a: { display_order: number }, b: { display_order: number }) => a.display_order - b.display_order) || [],
      issuer: app.issuers,
      credential: app.credentials ? {
        agent_name: app.credentials.agent_name,
        trust_score: trustScore,
      } : null,
      app_category_links: undefined,
      app_screenshots: undefined,
      issuers: undefined,
      credentials: undefined,
    };

    return NextResponse.json({ app: transformedApp });
  } catch (error) {
    console.error('Error in marketplace GET [slug]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
