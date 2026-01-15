import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import {
  calculateTrend,
  detectAnomalies,
  forecast,
  groupByPeriod,
  type DataPoint,
} from '@/lib/analytics';

// Service client for internal operations
function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * GET /api/analytics/trends - Get trend analysis for various metrics
 *
 * Query params:
 *   - metric: verifications | trust_score | credentials (default: verifications)
 *   - days: Number of days to analyze (default: 30, max: 365)
 *   - period: hour | day | week | month (default: day)
 *   - include_forecast: true/false (default: false)
 *   - include_anomalies: true/false (default: false)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get issuer
    const { data: issuer } = await supabase
      .from('issuers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!issuer) {
      return NextResponse.json({ error: 'Issuer not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const metric = searchParams.get('metric') || 'verifications';
    const days = Math.min(parseInt(searchParams.get('days') || '30'), 365);
    const period = (searchParams.get('period') || 'day') as 'hour' | 'day' | 'week' | 'month';
    const includeForecast = searchParams.get('include_forecast') === 'true';
    const includeAnomalies = searchParams.get('include_anomalies') === 'true';

    const serviceSupabase = getServiceSupabase();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let data: DataPoint[] = [];

    switch (metric) {
      case 'verifications': {
        const { data: events } = await serviceSupabase
          .from('verification_events')
          .select('verified_at')
          .eq('issuer_id', issuer.id)
          .gte('verified_at', startDate.toISOString())
          .order('verified_at', { ascending: true });

        // Count verifications per period
        const counts = new Map<string, number>();
        for (const event of events || []) {
          const date = new Date(event.verified_at);
          const key = date.toISOString().slice(0, 10);
          counts.set(key, (counts.get(key) || 0) + 1);
        }

        data = Array.from(counts.entries()).map(([date, count]) => ({
          timestamp: `${date}T00:00:00.000Z`,
          value: count,
        }));
        break;
      }

      case 'trust_score': {
        // Get credentials for issuer
        const { data: credentials } = await serviceSupabase
          .from('credentials')
          .select('id')
          .eq('issuer_id', issuer.id);

        const credentialIds = (credentials || []).map(c => c.id);

        if (credentialIds.length > 0) {
          const { data: history } = await serviceSupabase
            .from('trust_score_history')
            .select('trust_score, created_at')
            .in('credential_id', credentialIds)
            .gte('created_at', startDate.toISOString())
            .order('created_at', { ascending: true });

          data = (history || []).map(h => ({
            timestamp: h.created_at,
            value: h.trust_score,
          }));
        }
        break;
      }

      case 'credentials': {
        const { data: credentials } = await serviceSupabase
          .from('credentials')
          .select('created_at')
          .eq('issuer_id', issuer.id)
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: true });

        // Count credentials created per day
        const counts = new Map<string, number>();
        for (const cred of credentials || []) {
          const date = new Date(cred.created_at);
          const key = date.toISOString().slice(0, 10);
          counts.set(key, (counts.get(key) || 0) + 1);
        }

        data = Array.from(counts.entries()).map(([date, count]) => ({
          timestamp: `${date}T00:00:00.000Z`,
          value: count,
        }));
        break;
      }

      default:
        return NextResponse.json({ error: 'Invalid metric' }, { status: 400 });
    }

    // Group by requested period
    const groupedData = groupByPeriod(data, period);

    // Calculate trend
    const trend = calculateTrend(groupedData);

    // Build response
    const response: {
      metric: string;
      period: string;
      days: number;
      data: DataPoint[];
      trend: typeof trend;
      forecast?: DataPoint[];
      anomalies?: ReturnType<typeof detectAnomalies>;
    } = {
      metric,
      period,
      days,
      data: groupedData,
      trend,
    };

    // Add forecast if requested
    if (includeForecast) {
      const forecastPeriods = Math.min(7, Math.ceil(days / 4));
      response.forecast = forecast(groupedData, forecastPeriods);
    }

    // Add anomaly detection if requested
    if (includeAnomalies) {
      response.anomalies = detectAnomalies(groupedData);
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Analytics trends error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
