import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateWebhookRequestSchema } from '@agentid/shared';

/**
 * GET /api/webhooks/[id] - Get webhook details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get issuer profile
    const { data: issuer } = await supabase
      .from('issuers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!issuer) {
      return NextResponse.json(
        { error: 'Issuer profile not found' },
        { status: 404 }
      );
    }

    // Get webhook with delivery history
    const { data: webhook, error } = await supabase
      .from('webhook_subscriptions')
      .select(`
        id,
        url,
        events,
        description,
        is_active,
        consecutive_failures,
        last_triggered_at,
        last_success_at,
        last_failure_at,
        last_failure_reason,
        created_at,
        updated_at
      `)
      .eq('id', id)
      .eq('issuer_id', issuer.id)
      .single();

    if (error || !webhook) {
      return NextResponse.json(
        { error: 'Webhook not found' },
        { status: 404 }
      );
    }

    // Get recent deliveries
    const { data: deliveries } = await supabase
      .from('webhook_deliveries')
      .select(`
        id,
        event_type,
        status,
        attempts,
        response_status,
        delivered_at,
        created_at
      `)
      .eq('subscription_id', id)
      .order('created_at', { ascending: false })
      .limit(20);

    return NextResponse.json({
      webhook,
      deliveries: deliveries || [],
    });
  } catch (error) {
    console.error('Webhook fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/webhooks/[id] - Update webhook
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get issuer profile
    const { data: issuer } = await supabase
      .from('issuers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!issuer) {
      return NextResponse.json(
        { error: 'Issuer profile not found' },
        { status: 404 }
      );
    }

    // Parse and validate request
    const body = await request.json();
    const parsed = updateWebhookRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.format() },
        { status: 400 }
      );
    }

    // Build update object
    const updates: Record<string, unknown> = {};
    if (parsed.data.url !== undefined) updates.url = parsed.data.url;
    if (parsed.data.events !== undefined) updates.events = parsed.data.events;
    if (parsed.data.is_active !== undefined) {
      updates.is_active = parsed.data.is_active;
      // Reset failure count when re-enabling
      if (parsed.data.is_active) {
        updates.consecutive_failures = 0;
      }
    }
    if (parsed.data.description !== undefined) updates.description = parsed.data.description;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No updates provided' },
        { status: 400 }
      );
    }

    // Update webhook
    const { data: webhook, error } = await supabase
      .from('webhook_subscriptions')
      .update(updates)
      .eq('id', id)
      .eq('issuer_id', issuer.id)
      .select('id, url, events, description, is_active, updated_at')
      .single();

    if (error || !webhook) {
      return NextResponse.json(
        { error: 'Webhook not found or update failed' },
        { status: 404 }
      );
    }

    return NextResponse.json({ webhook });
  } catch (error) {
    console.error('Webhook update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/webhooks/[id] - Delete webhook
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get issuer profile
    const { data: issuer } = await supabase
      .from('issuers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!issuer) {
      return NextResponse.json(
        { error: 'Issuer profile not found' },
        { status: 404 }
      );
    }

    // Delete webhook (cascades to deliveries)
    const { error } = await supabase
      .from('webhook_subscriptions')
      .delete()
      .eq('id', id)
      .eq('issuer_id', issuer.id);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete webhook' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook delete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
