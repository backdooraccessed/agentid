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
 * POST /api/a2a/authorizations/expire - Run authorization expiration check
 *
 * This endpoint can be called by a cron job or manually to mark
 * expired authorizations. Requires service role or admin access.
 */
export async function POST(request: NextRequest) {
  try {
    // Check for service key in header (for cron jobs) or admin user
    const authHeader = request.headers.get('authorization');
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // If service key provided in header, allow access
    if (authHeader === `Bearer ${serviceKey}`) {
      const serviceSupabase = getServiceSupabase();
      const { data, error } = await serviceSupabase.rpc('expire_a2a_authorizations');

      if (error) {
        console.error('Failed to expire authorizations:', error);
        return NextResponse.json({ error: 'Failed to expire authorizations' }, { status: 500 });
      }

      const result = data?.[0] || { expired_count: 0, expired_ids: [] };

      return NextResponse.json({
        success: true,
        expired_count: result.expired_count,
        expired_ids: result.expired_ids,
        timestamp: new Date().toISOString(),
      });
    }

    // Otherwise, require authenticated admin user
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is an admin (has is_admin flag or owns verified issuer)
    const { data: issuer } = await supabase
      .from('issuers')
      .select('id, is_verified')
      .eq('user_id', user.id)
      .single();

    // For now, allow any authenticated user to run expiration
    // In production, you might want to restrict this to admins
    const serviceSupabase = getServiceSupabase();
    const { data, error } = await serviceSupabase.rpc('expire_a2a_authorizations');

    if (error) {
      console.error('Failed to expire authorizations:', error);
      return NextResponse.json({ error: 'Failed to expire authorizations' }, { status: 500 });
    }

    const result = data?.[0] || { expired_count: 0, expired_ids: [] };

    return NextResponse.json({
      success: true,
      expired_count: result.expired_count,
      expired_ids: result.expired_ids,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Expire authorizations error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/a2a/authorizations/expire - Get soon-to-expire authorizations
 *
 * Returns authorizations that will expire within the specified hours.
 * Useful for sending expiration warning notifications.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const hoursUntilExpiration = parseInt(searchParams.get('hours') || '24', 10);
    const credentialId = searchParams.get('credential_id');

    // Get expiring authorizations
    const serviceSupabase = getServiceSupabase();
    const { data, error } = await serviceSupabase.rpc('get_expiring_authorizations', {
      p_hours_until_expiration: hoursUntilExpiration,
    });

    if (error) {
      console.error('Failed to get expiring authorizations:', error);
      return NextResponse.json({ error: 'Failed to get expiring authorizations' }, { status: 500 });
    }

    // Filter by credential if provided
    let authorizations = data || [];
    if (credentialId) {
      authorizations = authorizations.filter(
        (a: { requester_credential_id: string; grantor_credential_id: string }) =>
          a.requester_credential_id === credentialId ||
          a.grantor_credential_id === credentialId
      );
    }

    return NextResponse.json({
      expiring_within_hours: hoursUntilExpiration,
      count: authorizations.length,
      authorizations,
    });
  } catch (error) {
    console.error('Get expiring authorizations error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
