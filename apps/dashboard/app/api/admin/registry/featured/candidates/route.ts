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
 * GET /api/admin/registry/featured/candidates - Get agents eligible for featuring
 *
 * Query params:
 *   - min_trust_score: Minimum trust score (default: 70)
 *   - min_verifications: Minimum verification count (default: 10)
 *   - limit: Number of candidates to return (default: 20)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !(await isAdmin(user.email))) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const minTrustScore = parseInt(searchParams.get('min_trust_score') || '70');
    const minVerifications = parseInt(searchParams.get('min_verifications') || '10');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

    const serviceSupabase = getServiceSupabase();

    // Get candidate agents with high trust scores and verification counts
    // that are public, verified, but not yet featured
    const { data: candidates, error } = await serviceSupabase
      .from('agent_registry')
      .select(`
        id,
        credential_id,
        display_name,
        description,
        category,
        is_featured,
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
          longevity_score,
          activity_score,
          verification_count
        )
      `)
      .eq('is_public', true)
      .eq('is_featured', false);

    if (error) {
      console.error('Failed to fetch candidates:', error);
      return NextResponse.json({ error: 'Failed to fetch candidates' }, { status: 500 });
    }

    // Filter and score candidates
    interface CandidateAgent {
      id: string;
      credential_id: string;
      display_name: string;
      description: string | null;
      category: string | null;
      is_featured: boolean;
      is_verified: boolean;
      created_at: string;
      credential: {
        id: string;
        agent_name: string;
        agent_type: string;
        status: string;
      } | null;
      reputation: {
        trust_score: number;
        verification_score: number;
        longevity_score: number;
        activity_score: number;
        verification_count: number;
      } | null;
    }

    const scoredCandidates = ((candidates || []) as unknown as CandidateAgent[])
      .filter(agent => {
        const reputation = agent.reputation;
        if (!reputation) return false;

        return (
          reputation.trust_score >= minTrustScore &&
          reputation.verification_count >= minVerifications &&
          agent.credential?.status === 'active'
        );
      })
      .map(agent => {
        const rep = agent.reputation!;

        // Calculate a composite score for ranking
        // Weight: trust_score (40%), verification_count (30%), longevity (15%), activity (15%)
        const compositeScore =
          rep.trust_score * 0.4 +
          Math.min(rep.verification_count / 10, 100) * 0.3 +
          rep.longevity_score * 0.15 +
          rep.activity_score * 0.15;

        return {
          ...agent,
          composite_score: Math.round(compositeScore * 10) / 10,
        };
      })
      .sort((a, b) => b.composite_score - a.composite_score)
      .slice(0, limit);

    return NextResponse.json({
      candidates: scoredCandidates,
      count: scoredCandidates.length,
      criteria: {
        min_trust_score: minTrustScore,
        min_verifications: minVerifications,
      },
    });
  } catch (error) {
    console.error('Get featured candidates error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
