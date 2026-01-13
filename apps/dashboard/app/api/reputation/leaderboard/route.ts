import { NextRequest, NextResponse } from 'next/server';
import { getReputationLeaderboard } from '@/lib/reputation';
import {
  checkRateLimit,
  getClientIdentifier,
  RateLimits,
  rateLimitExceededResponse,
} from '@/lib/rate-limit';

/**
 * GET /api/reputation/leaderboard - Get top agents by reputation
 *
 * Public endpoint - no authentication required
 *
 * Query params:
 * - limit: number of results (default 10, max 100)
 */
export async function GET(request: NextRequest) {
  // Rate limiting
  const clientId = getClientIdentifier(request);
  const rateLimit = checkRateLimit(clientId, RateLimits.leaderboard);
  if (!rateLimit.success) {
    return rateLimitExceededResponse(rateLimit);
  }

  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const limit = Math.min(100, Math.max(1, parseInt(limitParam || '10', 10) || 10));

    const leaderboard = await getReputationLeaderboard(limit);

    return NextResponse.json({
      leaderboard,
      count: leaderboard.length,
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
