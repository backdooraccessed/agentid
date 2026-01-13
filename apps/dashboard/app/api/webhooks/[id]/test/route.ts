import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/webhooks/[id]/test - Send a test webhook
 */
export async function POST(
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
      .select('id, name')
      .eq('user_id', user.id)
      .single();

    if (!issuer) {
      return NextResponse.json(
        { error: 'Issuer profile not found' },
        { status: 404 }
      );
    }

    // Get webhook
    const { data: webhook, error } = await supabase
      .from('webhook_subscriptions')
      .select('id, url, secret, events')
      .eq('id', id)
      .eq('issuer_id', issuer.id)
      .single();

    if (error || !webhook) {
      return NextResponse.json(
        { error: 'Webhook not found' },
        { status: 404 }
      );
    }

    // Build test payload
    const payload = {
      event: 'test',
      timestamp: new Date().toISOString(),
      data: {
        message: 'This is a test webhook from AgentID',
        issuer_id: issuer.id,
        issuer_name: issuer.name,
        webhook_id: webhook.id,
        subscribed_events: webhook.events,
      },
    };

    // Sign payload
    const payloadString = JSON.stringify(payload);
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(webhook.secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(payloadString));
    const signature = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    // Send test webhook
    const testDeliveryId = `test_${Date.now().toString(36)}`;
    const timestamp = Math.floor(Date.now() / 1000).toString();

    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-AgentID-Signature': signature,
          'X-AgentID-Timestamp': timestamp,
          'X-AgentID-Delivery-ID': testDeliveryId,
        },
        body: payloadString,
        signal: AbortSignal.timeout(10000),
      });

      const responseBody = await response.text().catch(() => '');

      if (response.ok) {
        return NextResponse.json({
          success: true,
          status: response.status,
          message: 'Test webhook delivered successfully',
        });
      } else {
        return NextResponse.json({
          success: false,
          status: response.status,
          message: 'Webhook endpoint returned an error',
          response: responseBody.slice(0, 500),
        });
      }
    } catch (fetchError) {
      const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown error';
      return NextResponse.json({
        success: false,
        message: `Failed to deliver webhook: ${errorMessage}`,
      });
    }
  } catch (error) {
    console.error('Webhook test error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
