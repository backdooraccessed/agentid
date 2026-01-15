import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/apps/[id] - Get my app details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: issuer } = await supabase
      .from('issuers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!issuer) {
      return NextResponse.json({ error: 'Issuer profile not found' }, { status: 404 });
    }

    const { data: app, error } = await supabase
      .from('apps')
      .select(`
        *,
        app_screenshots(id, image_url, caption, display_order),
        app_category_links(
          app_categories(id, name, slug, icon)
        )
      `)
      .eq('id', id)
      .eq('issuer_id', issuer.id)
      .single();

    if (error || !app) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 });
    }

    const transformedApp = {
      ...app,
      categories: app.app_category_links?.map((link: { app_categories: { id: string; name: string; slug: string; icon: string } }) => link.app_categories).filter(Boolean) || [],
      screenshots: app.app_screenshots?.sort((a: { display_order: number }, b: { display_order: number }) => a.display_order - b.display_order) || [],
      app_category_links: undefined,
      app_screenshots: undefined,
    };

    return NextResponse.json({ app: transformedApp });
  } catch (error) {
    console.error('Error in apps GET [id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/apps/[id] - Update my app
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: issuer } = await supabase
      .from('issuers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!issuer) {
      return NextResponse.json({ error: 'Issuer profile not found' }, { status: 404 });
    }

    // Check ownership
    const { data: existingApp } = await supabase
      .from('apps')
      .select('id')
      .eq('id', id)
      .eq('issuer_id', issuer.id)
      .single();

    if (!existingApp) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 });
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
      pricing_type,
      pricing_amount,
      category_ids,
      tags,
      credential_id,
      screenshots,
      status,
    } = body;

    // Build update object
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (tagline !== undefined) updateData.tagline = tagline;
    if (description !== undefined) updateData.description = description;
    if (icon_url !== undefined) updateData.icon_url = icon_url;
    if (demo_video_url !== undefined) updateData.demo_video_url = demo_video_url;
    if (app_url !== undefined) updateData.app_url = app_url;
    if (demo_url !== undefined) updateData.demo_url = demo_url;
    if (github_url !== undefined) updateData.github_url = github_url;
    if (docs_url !== undefined) updateData.docs_url = docs_url;
    if (pricing_type !== undefined) updateData.pricing_type = pricing_type;
    if (pricing_amount !== undefined) updateData.pricing_amount = pricing_amount;
    if (tags !== undefined) updateData.tags = tags;
    if (credential_id !== undefined) updateData.credential_id = credential_id;
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'live') {
        updateData.published_at = new Date().toISOString();
      }
    }

    const { data: app, error } = await supabase
      .from('apps')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating app:', error);
      return NextResponse.json({ error: 'Failed to update app' }, { status: 500 });
    }

    // Update category links if provided
    if (category_ids !== undefined) {
      await supabase.from('app_category_links').delete().eq('app_id', id);

      if (category_ids.length > 0) {
        const categoryLinks = category_ids.map((categoryId: string) => ({
          app_id: id,
          category_id: categoryId,
        }));
        await supabase.from('app_category_links').insert(categoryLinks);
      }
    }

    // Update screenshots if provided
    if (screenshots !== undefined) {
      await supabase.from('app_screenshots').delete().eq('app_id', id);

      if (screenshots.length > 0) {
        const screenshotData = screenshots.map((s: { image_url: string; caption?: string }, index: number) => ({
          app_id: id,
          image_url: s.image_url,
          caption: s.caption,
          display_order: index,
        }));
        await supabase.from('app_screenshots').insert(screenshotData);
      }
    }

    return NextResponse.json({ app });
  } catch (error) {
    console.error('Error in apps PUT [id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/apps/[id] - Delete my app
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: issuer } = await supabase
      .from('issuers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!issuer) {
      return NextResponse.json({ error: 'Issuer profile not found' }, { status: 404 });
    }

    const { error } = await supabase
      .from('apps')
      .delete()
      .eq('id', id)
      .eq('issuer_id', issuer.id);

    if (error) {
      console.error('Error deleting app:', error);
      return NextResponse.json({ error: 'Failed to delete app' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in apps DELETE [id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
