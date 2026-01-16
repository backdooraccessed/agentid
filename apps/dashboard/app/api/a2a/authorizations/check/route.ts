import { NextRequest, NextResponse } from 'next/server';
import { checkA2AAuthorizationWithConstraints } from '@/lib/a2a-permissions';

/**
 * Extract region from request headers (Vercel/Cloudflare)
 */
function getRegionFromRequest(request: NextRequest): string | null {
  const country = request.headers.get('x-vercel-ip-country');
  if (country) return country;

  const cfCountry = request.headers.get('cf-ipcountry');
  if (cfCountry) return cfCountry;

  return null;
}

/**
 * POST /api/a2a/authorizations/check - Check if agent is authorized for an action
 *
 * This is a public endpoint (no authentication required) that verifies
 * whether one agent has been granted permission by another.
 *
 * Constraints are now fully evaluated:
 * - Time windows (e.g., "09:00-17:00")
 * - Day restrictions (e.g., ["monday", "tuesday"])
 * - Geographic restrictions (e.g., ["US", "EU"])
 * - Rate limits (per minute and per day)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      requester_credential_id,
      grantor_credential_id,
      action,
      permission, // Legacy support - alias for action
      resource,
      context: userContext = {},
    } = body;

    // Support both 'action' and 'permission' for backwards compatibility
    const actionToCheck = action || permission;

    if (!requester_credential_id || !grantor_credential_id || !actionToCheck) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          required: ['requester_credential_id', 'grantor_credential_id', 'action'],
        },
        { status: 400 }
      );
    }

    // Build evaluation context
    const region = getRegionFromRequest(request);
    const now = new Date();

    const result = await checkA2AAuthorizationWithConstraints({
      requesterCredentialId: requester_credential_id,
      grantorCredentialId: grantor_credential_id,
      action: actionToCheck,
      resource,
      context: {
        region: userContext.region || region,
        currentHour: userContext.current_hour ?? now.getHours(),
        currentDay: userContext.current_day ?? now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase(),
      },
    });

    if (!result.authorized) {
      return NextResponse.json({
        authorized: false,
        reason: result.reason || 'No valid authorization found',
      });
    }

    return NextResponse.json({
      authorized: true,
      authorization_id: result.authorization_id,
      valid_until: result.valid_until,
      constraints_applied: result.constraints_applied,
      rate_limit_remaining: result.rate_limit_remaining,
    });
  } catch (error) {
    console.error('Check authorization error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
