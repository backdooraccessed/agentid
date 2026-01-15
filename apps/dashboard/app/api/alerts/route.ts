import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/alerts - List triggered alerts
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get issuer for this user
    const { data: issuer, error: issuerError } = await supabase
      .from('issuers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (issuerError || !issuer) {
      return NextResponse.json({ error: 'Issuer not found' }, { status: 404 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const severity = searchParams.get('severity');
    const credentialId = searchParams.get('credential_id');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = supabase
      .from('alert_events')
      .select(
        `
        *,
        alert_rules (id, name, rule_type),
        credentials (id, agent_name, agent_id)
      `,
        { count: 'exact' }
      )
      .eq('issuer_id', issuer.id)
      .order('triggered_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    if (severity) {
      query = query.eq('severity', severity);
    }

    if (credentialId) {
      query = query.eq('credential_id', credentialId);
    }

    const { data: alerts, count, error } = await query;

    if (error) {
      console.error('Failed to fetch alerts:', error);
      return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 });
    }

    // Get summary stats
    const { data: summary } = await supabase
      .from('v_alert_summary')
      .select('*')
      .eq('issuer_id', issuer.id)
      .single();

    return NextResponse.json({
      alerts,
      total: count,
      summary: summary || {
        triggered_count: 0,
        acknowledged_count: 0,
        critical_count: 0,
        high_count: 0,
        last_24h_count: 0,
      },
    });
  } catch (error) {
    console.error('Alerts GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
