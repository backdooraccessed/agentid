import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schema for alert update
const updateAlertSchema = z.object({
  status: z.enum(['acknowledged', 'resolved', 'dismissed']),
  resolution_note: z.string().max(500).optional(),
});

// GET /api/alerts/[id] - Get single alert
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

    // Get the alert
    const { data: alert, error } = await supabase
      .from('alert_events')
      .select(
        `
        *,
        alert_rules (id, name, rule_type, config, severity),
        credentials (id, agent_name, agent_id, status)
      `
      )
      .eq('id', id)
      .eq('issuer_id', issuer.id)
      .single();

    if (error || !alert) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
    }

    return NextResponse.json({ alert });
  } catch (error) {
    console.error('Alert GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/alerts/[id] - Update alert status (acknowledge/resolve)
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
    const parsed = updateAlertSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { status, resolution_note } = parsed.data;

    // Build update object
    const updates: Record<string, unknown> = {
      status,
    };

    if (status === 'acknowledged') {
      updates.acknowledged_at = new Date().toISOString();
      updates.acknowledged_by = user.id;
    } else if (status === 'resolved' || status === 'dismissed') {
      updates.resolved_at = new Date().toISOString();
      updates.resolved_by = user.id;
      if (resolution_note) {
        updates.resolution_note = resolution_note;
      }
    }

    // Update the alert
    const { data: alert, error } = await supabase
      .from('alert_events')
      .update(updates)
      .eq('id', id)
      .eq('issuer_id', issuer.id)
      .select()
      .single();

    if (error || !alert) {
      console.error('Failed to update alert:', error);
      return NextResponse.json({ error: 'Failed to update alert' }, { status: 500 });
    }

    return NextResponse.json({ alert });
  } catch (error) {
    console.error('Alert PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
