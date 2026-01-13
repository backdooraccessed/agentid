import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  checkRateLimit,
  getClientIdentifier,
  RateLimits,
  rateLimitHeaders,
  rateLimitExceededResponse,
} from '@/lib/rate-limit';

// Lazy initialization of Supabase client for public access
let supabase: ReturnType<typeof createClient> | null = null;

function getSupabase() {
  if (!supabase) {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return supabase;
}

/**
 * GET /api/directory - Public issuer directory
 * Query params:
 *   - verified_only: Only show verified issuers (default: true)
 *   - search: Search by name
 *   - limit: Number of results (default: 50, max: 100)
 *   - offset: Pagination offset
 */
export async function GET(request: NextRequest) {
  // Rate limiting
  const clientId = getClientIdentifier(request);
  const rateLimit = checkRateLimit(clientId, RateLimits.reputation);
  if (!rateLimit.success) {
    return rateLimitExceededResponse(rateLimit);
  }

  try {
    const { searchParams } = new URL(request.url);
    const verifiedOnly = searchParams.get('verified_only') !== 'false';
    const search = searchParams.get('search');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query for public issuer data
    let query = getSupabase()
      .from('issuers')
      .select(`
        id,
        name,
        issuer_type,
        domain,
        description,
        is_verified,
        created_at,
        issuer_reputation(trust_score, total_credentials, active_credentials)
      `, { count: 'exact' })
      .order('is_verified', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (verifiedOnly) {
      query = query.eq('is_verified', true);
    }

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Directory fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch directory' },
        { status: 500, headers: rateLimitHeaders(rateLimit) }
      );
    }

    interface IssuerWithReputation {
      id: string;
      name: string;
      issuer_type: string;
      domain: string | null;
      description: string | null;
      is_verified: boolean;
      created_at: string;
      issuer_reputation: Array<{
        trust_score: number;
        total_credentials: number;
        active_credentials: number;
      }> | null;
    }

    const issuers = data as IssuerWithReputation[] | null;

    // Transform data for public consumption
    const directory = (issuers || []).map(issuer => ({
      id: issuer.id,
      name: issuer.name,
      type: issuer.issuer_type,
      domain: issuer.domain,
      description: issuer.description,
      verified: issuer.is_verified,
      joined: issuer.created_at,
      stats: issuer.issuer_reputation?.[0] ? {
        trust_score: issuer.issuer_reputation[0].trust_score,
        total_credentials: issuer.issuer_reputation[0].total_credentials,
        active_credentials: issuer.issuer_reputation[0].active_credentials,
      } : null,
    }));

    return NextResponse.json({
      issuers: directory,
      pagination: {
        total: count || 0,
        limit,
        offset,
        has_more: (count || 0) > offset + limit,
      },
    }, { headers: rateLimitHeaders(rateLimit) });
  } catch (error) {
    console.error('Directory error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
