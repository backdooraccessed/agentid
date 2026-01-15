import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Public Supabase client
function getPublicSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// GET /api/registry/featured - Get featured agents
export async function GET() {
  try {
    const supabase = getPublicSupabase();

    // Get featured agents
    const { data: agents, error } = await supabase
      .from('v_featured_agents')
      .select('*');

    if (error) {
      console.error('Failed to fetch featured agents:', error);
      return NextResponse.json({ error: 'Failed to fetch featured agents' }, { status: 500 });
    }

    return NextResponse.json({ agents: agents || [] });
  } catch (error) {
    console.error('Featured agents error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
