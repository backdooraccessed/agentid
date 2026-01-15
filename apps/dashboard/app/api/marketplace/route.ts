import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/marketplace - List all live apps (public)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'newest';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('apps')
      .select(`
        *,
        app_category_links!inner(category_id),
        app_categories:app_category_links(
          app_categories(id, name, slug, icon)
        ),
        issuers(name, is_verified)
      `, { count: 'exact' })
      .eq('status', 'live');

    // Filter by category
    if (category) {
      const { data: categoryData } = await supabase
        .from('app_categories')
        .select('id')
        .eq('slug', category)
        .single();

      if (categoryData) {
        query = query.eq('app_category_links.category_id', categoryData.id);
      }
    }

    // Search
    if (search) {
      query = query.or(`name.ilike.%${search}%,tagline.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Sort
    switch (sort) {
      case 'popular':
        query = query.order('view_count', { ascending: false });
        break;
      case 'rating':
        query = query.order('average_rating', { ascending: false, nullsFirst: false });
        break;
      case 'oldest':
        query = query.order('published_at', { ascending: true });
        break;
      case 'newest':
      default:
        query = query.order('published_at', { ascending: false });
    }

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data: apps, error, count } = await query;

    if (error) {
      console.error('Error fetching apps:', error);
      return NextResponse.json({ error: 'Failed to fetch apps' }, { status: 500 });
    }

    // Transform the data
    const transformedApps = apps?.map(app => ({
      ...app,
      categories: app.app_categories?.map((link: { app_categories: { id: string; name: string; slug: string; icon: string } }) => link.app_categories).filter(Boolean) || [],
      issuer: app.issuers,
      app_category_links: undefined,
      app_categories: undefined,
      issuers: undefined,
    })) || [];

    return NextResponse.json({
      apps: transformedApps,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Error in marketplace GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
