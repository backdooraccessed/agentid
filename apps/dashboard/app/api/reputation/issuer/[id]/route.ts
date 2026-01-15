import { NextRequest, NextResponse } from 'next/server';
import { getIssuerReputation } from '@/lib/reputation';
import {
  checkRateLimit,
  getClientIdentifier,
  RateLimits,
  rateLimitExceededResponse,
} from '@/lib/rate-limit';

/**
 * GET /api/reputation/issuer/[id] - Get issuer reputation
 *
 * Public endpoint - no authentication required
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Rate limiting
  const clientId = getClientIdentifier(request);
  const rateLimit = await checkRateLimit(clientId, RateLimits.reputation);
  if (!rateLimit.success) {
    return rateLimitExceededResponse(rateLimit);
  }

  try {
    const { id } = await params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: 'Invalid issuer ID format' },
        { status: 400 }
      );
    }

    const reputation = await getIssuerReputation(id);

    if (!reputation) {
      return NextResponse.json(
        { error: 'Reputation data not found for this issuer' },
        { status: 404 }
      );
    }

    return NextResponse.json(reputation);
  } catch (error) {
    console.error('Issuer reputation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
