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

/**
 * GET /api/reputation/agent/[id]/history - Get trust score history for a credential
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: credentialId } = await params;
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500);
    const days = Math.min(parseInt(searchParams.get('days') || '30'), 365);
    const includeStats = searchParams.get('include_stats') === 'true';

    // Verify user owns this credential
    const { data: credential, error: credError } = await supabase
      .from('credentials')
      .select('id, issuer_id')
      .eq('id', credentialId)
      .single();

    if (credError || !credential) {
      return NextResponse.json({ error: 'Credential not found' }, { status: 404 });
    }

    // Check ownership
    const { data: issuer } = await supabase
      .from('issuers')
      .select('id')
      .eq('id', credential.issuer_id)
      .eq('user_id', user.id)
      .single();

    if (!issuer) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const serviceSupabase = getServiceSupabase();

    // Get trust score history
    const { data: history, error: historyError } = await serviceSupabase
      .rpc('get_trust_score_history', {
        p_credential_id: credentialId,
        p_limit: limit,
        p_days: days,
      });

    if (historyError) {
      console.error('Failed to fetch trust score history:', historyError);
      return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
    }

    let stats = null;
    if (includeStats) {
      const { data: statsData, error: statsError } = await serviceSupabase
        .rpc('get_trust_score_stats', {
          p_credential_id: credentialId,
          p_days: days,
        });

      if (!statsError && statsData?.[0]) {
        stats = {
          min_score: statsData[0].min_score,
          max_score: statsData[0].max_score,
          avg_score: parseFloat(statsData[0].avg_score),
          total_changes: statsData[0].total_changes,
          net_change: statsData[0].net_change,
          trend: statsData[0].trend,
        };
      }
    }

    // Get current trust score
    const { data: currentReputation } = await serviceSupabase
      .from('agent_reputation')
      .select('trust_score, verification_score, longevity_score, activity_score, issuer_score')
      .eq('credential_id', credentialId)
      .single();

    return NextResponse.json({
      credential_id: credentialId,
      current: currentReputation || null,
      history: history || [],
      stats,
      period_days: days,
    });
  } catch (error) {
    console.error('Get trust score history error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
