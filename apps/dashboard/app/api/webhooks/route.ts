import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createWebhookRequestSchema } from '@agentid/shared';
import { generateWebhookSecret } from '@/lib/webhooks';

/**
 * GET /api/webhooks - List webhook subscriptions
 */
export async function GET() {
  try {
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

    // Get webhooks with recent delivery stats
    const { data: webhooks, error } = await supabase
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
        created_at
      `)
      .eq('issuer_id', issuer.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch webhooks:', error);
      return NextResponse.json(
        { error: 'Failed to fetch webhooks' },
        { status: 500 }
      );
    }

    return NextResponse.json({ webhooks });
  } catch (error) {
    console.error('Webhooks list error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/webhooks - Create webhook subscription
 */
export async function POST(request: NextRequest) {
  try {
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
    const parsed = createWebhookRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { url, events, description } = parsed.data;

    // Check for duplicate URL
    const { data: existing } = await supabase
      .from('webhook_subscriptions')
      .select('id')
      .eq('issuer_id', issuer.id)
      .eq('url', url)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'A webhook with this URL already exists' },
        { status: 409 }
      );
    }

    // Generate secret
    const secret = generateWebhookSecret();

    // Create subscription
    const { data: webhook, error } = await supabase
      .from('webhook_subscriptions')
      .insert({
        issuer_id: issuer.id,
        url,
        events,
        description,
        secret,
      })
      .select('id, url, events, description, is_active, created_at')
      .single();

    if (error) {
      console.error('Failed to create webhook:', error);
      return NextResponse.json(
        { error: 'Failed to create webhook' },
        { status: 500 }
      );
    }

    // Return webhook with secret (only shown once)
    return NextResponse.json({
      webhook: {
        ...webhook,
        secret,
      },
      message: 'Webhook created. Save the secret - it will not be shown again.',
    }, { status: 201 });
  } catch (error) {
    console.error('Webhook creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
