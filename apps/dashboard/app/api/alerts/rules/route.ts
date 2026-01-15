import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schema for alert rule creation
const createRuleSchema = z.object({
  credential_id: z.string().uuid().optional(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  rule_type: z.enum([
    'verification_failed',
    'geo_anomaly',
    'usage_spike',
    'permission_denied',
    'credential_expiring',
    'trust_score_drop',
  ]),
  severity: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  config: z.record(z.unknown()).default({}),
  notify_webhook: z.string().url().optional().nullable(),
  notify_email: z.string().email().optional().nullable(),
  notify_in_dashboard: z.boolean().default(true),
  cooldown_minutes: z.number().int().min(1).max(10080).default(60), // max 1 week
  is_active: z.boolean().default(true),
});

// GET /api/alerts/rules - List alert rules
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
    const credentialId = searchParams.get('credential_id');
    const ruleType = searchParams.get('rule_type');
    const isActive = searchParams.get('is_active');

    // Build query
    let query = supabase
      .from('alert_rules')
      .select(
        `
        *,
        credentials (id, agent_name, agent_id)
      `
      )
      .eq('issuer_id', issuer.id)
      .order('created_at', { ascending: false });

    if (credentialId) {
      query = query.eq('credential_id', credentialId);
    }

    if (ruleType) {
      query = query.eq('rule_type', ruleType);
    }

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    }

    const { data: rules, error } = await query;

    if (error) {
      console.error('Failed to fetch alert rules:', error);
      return NextResponse.json({ error: 'Failed to fetch alert rules' }, { status: 500 });
    }

    return NextResponse.json({ rules });
  } catch (error) {
    console.error('Alert rules GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/alerts/rules - Create alert rule
export async function POST(request: NextRequest) {
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

    // Parse and validate request body
    const body = await request.json();
    const parsed = createRuleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // If credential_id provided, verify it belongs to this issuer
    if (data.credential_id) {
      const { data: credential, error: credError } = await supabase
        .from('credentials')
        .select('id')
        .eq('id', data.credential_id)
        .eq('issuer_id', issuer.id)
        .single();

      if (credError || !credential) {
        return NextResponse.json({ error: 'Credential not found' }, { status: 404 });
      }
    }

    // Create the rule
    const { data: rule, error } = await supabase
      .from('alert_rules')
      .insert({
        issuer_id: issuer.id,
        credential_id: data.credential_id || null,
        name: data.name,
        description: data.description || null,
        rule_type: data.rule_type,
        severity: data.severity,
        config: data.config,
        notify_webhook: data.notify_webhook || null,
        notify_email: data.notify_email || null,
        notify_in_dashboard: data.notify_in_dashboard,
        cooldown_minutes: data.cooldown_minutes,
        is_active: data.is_active,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create alert rule:', error);
      return NextResponse.json({ error: 'Failed to create alert rule' }, { status: 500 });
    }

    return NextResponse.json({ rule }, { status: 201 });
  } catch (error) {
    console.error('Alert rules POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
