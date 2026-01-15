import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Public Supabase client
function getPublicSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// GET /api/registry/categories - List categories with agent counts
export async function GET() {
  try {
    const supabase = getPublicSupabase();

    // Get categories with stats
    const { data: categories, error } = await supabase
      .from('v_category_stats')
      .select('*')
      .order('agent_count', { ascending: false });

    if (error) {
      console.error('Failed to fetch categories:', error);
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }

    return NextResponse.json({ categories: categories || [] });
  } catch (error) {
    console.error('Categories error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
