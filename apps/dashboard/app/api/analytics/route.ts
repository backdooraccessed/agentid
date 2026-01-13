import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { authenticateRequest, checkScope } from '@/lib/auth';
import { ApiKeyScopes } from '@/lib/api-keys';

/**
 * GET /api/analytics - Get issuer analytics
 * Query params:
 *   - days: Number of days to fetch (default: 30, max: 365)
 *   - metrics: Comma-separated list of metrics to include
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate (session or API key)
    const auth = await authenticateRequest(request);

    if (!auth.authenticated) {
      return NextResponse.json(
        { error: auth.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!auth.issuerId) {
      return NextResponse.json(
        { error: 'Issuer profile not found' },
        { status: 404 }
      );
    }

    // Check scope for API key auth (requires credentials:read for analytics)
    if (auth.apiKeyInfo && !checkScope(auth, ApiKeyScopes.CREDENTIALS_READ)) {
      return NextResponse.json(
        { error: 'API key lacks credentials:read scope' },
        { status: 403 }
      );
    }

    const supabase = auth.apiKeyInfo
      ? createServiceClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
      : await createClient();

    // Parse query params
    const { searchParams } = new URL(request.url);
    const days = Math.min(parseInt(searchParams.get('days') || '30'), 365);
    const since = new Date();
    since.setDate(since.getDate() - days);

    // Fetch daily analytics
    const { data: dailyAnalytics, error: analyticsError } = await supabase
      .from('issuer_analytics')
      .select('*')
      .eq('issuer_id', auth.issuerId)
      .gte('date', since.toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (analyticsError) {
      console.error('Analytics fetch error:', analyticsError);
      return NextResponse.json(
        { error: 'Failed to fetch analytics' },
        { status: 500 }
      );
    }

    // Calculate totals
    const totals = (dailyAnalytics || []).reduce(
      (acc, day) => ({
        credentials_issued: acc.credentials_issued + (day.credentials_issued || 0),
        credentials_revoked: acc.credentials_revoked + (day.credentials_revoked || 0),
        verifications_total: acc.verifications_total + (day.verifications_total || 0),
        verifications_successful: acc.verifications_successful + (day.verifications_successful || 0),
        verifications_failed: acc.verifications_failed + (day.verifications_failed || 0),
        api_requests_total: acc.api_requests_total + (day.api_requests_total || 0),
      }),
      {
        credentials_issued: 0,
        credentials_revoked: 0,
        verifications_total: 0,
        verifications_successful: 0,
        verifications_failed: 0,
        api_requests_total: 0,
      }
    );

    // Get current stats
    const { data: currentStats } = await supabase
      .from('credentials')
      .select('status')
      .eq('issuer_id', auth.issuerId);

    const activeCredentials = (currentStats || []).filter(c => c.status === 'active').length;
    const totalCredentials = (currentStats || []).length;

    // Get recent verifications
    const { data: recentVerifications } = await supabase
      .from('verification_events')
      .select('id, agent_id, success, verified_at')
      .eq('issuer_id', auth.issuerId)
      .order('verified_at', { ascending: false })
      .limit(10);

    // Calculate verification success rate
    const successRate = totals.verifications_total > 0
      ? (totals.verifications_successful / totals.verifications_total * 100).toFixed(1)
      : '0.0';

    return NextResponse.json({
      period: {
        start: since.toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0],
        days,
      },
      summary: {
        total_credentials: totalCredentials,
        active_credentials: activeCredentials,
        credentials_issued: totals.credentials_issued,
        credentials_revoked: totals.credentials_revoked,
        verifications_total: totals.verifications_total,
        verifications_successful: totals.verifications_successful,
        verifications_failed: totals.verifications_failed,
        verification_success_rate: `${successRate}%`,
        api_requests_total: totals.api_requests_total,
      },
      daily: (dailyAnalytics || []).map(day => ({
        date: day.date,
        credentials_issued: day.credentials_issued,
        credentials_revoked: day.credentials_revoked,
        verifications_total: day.verifications_total,
        verifications_successful: day.verifications_successful,
        verifications_failed: day.verifications_failed,
        api_requests_total: day.api_requests_total,
      })),
      recent_verifications: (recentVerifications || []).map(v => ({
        id: v.id,
        agent_id: v.agent_id,
        success: v.success,
        verified_at: v.verified_at,
      })),
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
