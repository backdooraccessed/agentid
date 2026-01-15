import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/marketplace/categories - List all categories (public)
export async function GET() {
  try {
    const supabase = await createClient();

    const { data: categories, error } = await supabase
      .from('app_categories')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }

    // Get app counts per category
    const { data: counts } = await supabase
      .from('app_category_links')
      .select('category_id, apps!inner(status)')
      .eq('apps.status', 'live');

    const countMap: Record<string, number> = {};
    counts?.forEach(item => {
      countMap[item.category_id] = (countMap[item.category_id] || 0) + 1;
    });

    const categoriesWithCounts = categories?.map(cat => ({
      ...cat,
      app_count: countMap[cat.id] || 0,
    })) || [];

    return NextResponse.json({ categories: categoriesWithCounts });
  } catch (error) {
    console.error('Error in categories GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
