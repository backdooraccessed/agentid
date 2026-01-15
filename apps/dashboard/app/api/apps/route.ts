import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/apps - List my apps (authenticated)
export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get issuer
    const { data: issuer } = await supabase
      .from('issuers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!issuer) {
      return NextResponse.json({ error: 'Issuer profile not found' }, { status: 404 });
    }

    // Fetch apps
    const { data: apps, error } = await supabase
      .from('apps')
      .select(`
        *,
        app_category_links(
          app_categories(id, name, slug, icon)
        )
      `)
      .eq('issuer_id', issuer.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching apps:', error);
      return NextResponse.json({ error: 'Failed to fetch apps' }, { status: 500 });
    }

    const transformedApps = apps?.map(app => ({
      ...app,
      categories: app.app_category_links?.map((link: { app_categories: { id: string; name: string; slug: string; icon: string } }) => link.app_categories).filter(Boolean) || [],
      app_category_links: undefined,
    })) || [];

    return NextResponse.json({ apps: transformedApps });
  } catch (error) {
    console.error('Error in apps GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/apps - Create new app (authenticated)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get issuer
    const { data: issuer } = await supabase
      .from('issuers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!issuer) {
      return NextResponse.json({ error: 'Issuer profile not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      name,
      tagline,
      description,
      icon_url,
      demo_video_url,
      app_url,
      demo_url,
      github_url,
      docs_url,
      pricing_type = 'free',
      pricing_amount,
      category_ids = [],
      tags = [],
      credential_id,
      screenshots = [],
      publish = false,
    } = body;

    // Validate required fields
    if (!name || !tagline || !description || !app_url) {
      return NextResponse.json({
        error: 'Missing required fields: name, tagline, description, app_url'
      }, { status: 400 });
    }

    // Generate slug
    const { data: slugData } = await supabase.rpc('generate_app_slug', { app_name: name });
    const slug = slugData || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    // Create app
    const { data: app, error } = await supabase
      .from('apps')
      .insert({
        issuer_id: issuer.id,
        credential_id: credential_id || null,
        name,
        slug,
        tagline,
        description,
        icon_url,
        demo_video_url,
        app_url,
        demo_url,
        github_url,
        docs_url,
        pricing_type,
        pricing_amount,
        tags,
        status: publish ? 'live' : 'draft',
        published_at: publish ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating app:', error);
      return NextResponse.json({ error: 'Failed to create app' }, { status: 500 });
    }

    // Add category links
    if (category_ids.length > 0) {
      const categoryLinks = category_ids.map((categoryId: string) => ({
        app_id: app.id,
        category_id: categoryId,
      }));

      await supabase.from('app_category_links').insert(categoryLinks);
    }

    // Add screenshots
    if (screenshots.length > 0) {
      const screenshotData = screenshots.map((s: { image_url: string; caption?: string }, index: number) => ({
        app_id: app.id,
        image_url: s.image_url,
        caption: s.caption,
        display_order: index,
      }));

      await supabase.from('app_screenshots').insert(screenshotData);
    }

    return NextResponse.json({ app }, { status: 201 });
  } catch (error) {
    console.error('Error in apps POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
