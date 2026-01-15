import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schema for alert rule update
const updateRuleSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  config: z.record(z.unknown()).optional(),
  notify_webhook: z.string().url().optional().nullable(),
  notify_email: z.string().email().optional().nullable(),
  notify_in_dashboard: z.boolean().optional(),
  cooldown_minutes: z.number().int().min(1).max(10080).optional(),
  is_active: z.boolean().optional(),
});

// GET /api/alerts/rules/[id] - Get single alert rule
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Get the rule
    const { data: rule, error } = await supabase
      .from('alert_rules')
      .select(
        `
        *,
        credentials (id, agent_name, agent_id)
      `
      )
      .eq('id', id)
      .eq('issuer_id', issuer.id)
      .single();

    if (error || !rule) {
      return NextResponse.json({ error: 'Alert rule not found' }, { status: 404 });
    }

    // Get recent triggered alerts for this rule
    const { data: recentAlerts } = await supabase
      .from('alert_events')
      .select('id, title, severity, status, triggered_at')
      .eq('alert_rule_id', id)
      .order('triggered_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      rule,
      recent_alerts: recentAlerts || [],
    });
  } catch (error) {
    console.error('Alert rule GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/alerts/rules/[id] - Update alert rule
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
    const parsed = updateRuleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Build update object
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    const data = parsed.data;
    if (data.name !== undefined) updates.name = data.name;
    if (data.description !== undefined) updates.description = data.description;
    if (data.severity !== undefined) updates.severity = data.severity;
    if (data.config !== undefined) updates.config = data.config;
    if (data.notify_webhook !== undefined) updates.notify_webhook = data.notify_webhook;
    if (data.notify_email !== undefined) updates.notify_email = data.notify_email;
    if (data.notify_in_dashboard !== undefined) updates.notify_in_dashboard = data.notify_in_dashboard;
    if (data.cooldown_minutes !== undefined) updates.cooldown_minutes = data.cooldown_minutes;
    if (data.is_active !== undefined) updates.is_active = data.is_active;

    // Update the rule
    const { data: rule, error } = await supabase
      .from('alert_rules')
      .update(updates)
      .eq('id', id)
      .eq('issuer_id', issuer.id)
      .select()
      .single();

    if (error || !rule) {
      console.error('Failed to update alert rule:', error);
      return NextResponse.json({ error: 'Failed to update alert rule' }, { status: 500 });
    }

    return NextResponse.json({ rule });
  } catch (error) {
    console.error('Alert rule PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/alerts/rules/[id] - Delete alert rule
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Delete the rule (cascade will delete associated events)
    const { error } = await supabase
      .from('alert_rules')
      .delete()
      .eq('id', id)
      .eq('issuer_id', issuer.id);

    if (error) {
      console.error('Failed to delete alert rule:', error);
      return NextResponse.json({ error: 'Failed to delete alert rule' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Alert rule DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
