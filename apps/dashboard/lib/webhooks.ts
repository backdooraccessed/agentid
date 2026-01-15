/**
 * Webhook delivery utilities
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Lazy-initialized service client for webhook operations
// Using 'any' for database type since webhook tables aren't in generated types yet
let serviceClient: SupabaseClient<any> | null = null;

function getServiceClient(): SupabaseClient<any> {
  if (!serviceClient) {
    serviceClient = createClient(supabaseUrl, supabaseServiceKey);
  }
  return serviceClient;
}

/**
 * Webhook event types
 */
export type WebhookEvent =
  | 'credential.revoked'
  | 'credential.issued'
  | 'credential.expired'
  | 'authorization.requested'
  | 'authorization.responded';

/**
 * Webhook payload structure
 */
export interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  data: Record<string, unknown>;
}

/**
 * HMAC-SHA256 signature for webhook payload
 */
async function signPayload(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Calculate exponential backoff delay
 */
function getBackoffDelay(attempt: number): number {
  // 1min, 5min, 15min, 1hr, 4hr
  const delays = [60, 300, 900, 3600, 14400];
  return (delays[Math.min(attempt, delays.length - 1)] || 14400) * 1000;
}

/**
 * Deliver a webhook to a single subscription
 */
async function deliverWebhook(
  subscription: {
    id: string;
    url: string;
    secret: string;
  },
  deliveryId: string,
  payload: WebhookPayload
): Promise<{ success: boolean; status?: number; error?: string }> {
  const payloadString = JSON.stringify(payload);
  const signature = await signPayload(payloadString, subscription.secret);
  const timestamp = Math.floor(Date.now() / 1000).toString();

  try {
    const response = await fetch(subscription.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-AgentID-Signature': signature,
        'X-AgentID-Timestamp': timestamp,
        'X-AgentID-Delivery-ID': deliveryId,
      },
      body: payloadString,
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (response.ok) {
      return { success: true, status: response.status };
    }

    const errorBody = await response.text().catch(() => 'Unknown error');
    return {
      success: false,
      status: response.status,
      error: errorBody.slice(0, 500)
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Trigger webhooks for an event
 */
export async function triggerWebhooks(
  issuerId: string,
  event: WebhookEvent,
  data: Record<string, unknown>,
  credentialId?: string
): Promise<{ triggered: number; failed: number }> {
  const supabase = getServiceClient();

  // Get active subscriptions for this event
  const { data: subscriptions, error: fetchError } = await supabase
    .from('webhook_subscriptions')
    .select('id, url, secret')
    .eq('issuer_id', issuerId)
    .eq('is_active', true)
    .contains('events', [event]);

  if (fetchError || !subscriptions?.length) {
    return { triggered: 0, failed: 0 };
  }

  const payload: WebhookPayload = {
    event,
    timestamp: new Date().toISOString(),
    data,
  };

  let triggered = 0;
  let failed = 0;

  // Process webhooks in parallel
  await Promise.all(
    subscriptions.map(async (subscription) => {
      // Create delivery record
      const { data: delivery, error: insertError } = await supabase
        .from('webhook_deliveries')
        .insert({
          subscription_id: subscription.id,
          credential_id: credentialId,
          event_type: event,
          payload,
          status: 'pending',
          attempts: 1,
        })
        .select('id')
        .single();

      if (insertError || !delivery) {
        failed++;
        return;
      }

      // Attempt delivery
      const result = await deliverWebhook(subscription, delivery.id, payload);

      if (result.success) {
        // Mark as delivered
        await supabase
          .from('webhook_deliveries')
          .update({
            status: 'delivered',
            response_status: result.status,
            delivered_at: new Date().toISOString(),
          })
          .eq('id', delivery.id);

        // Update subscription success tracking
        await supabase
          .from('webhook_subscriptions')
          .update({
            consecutive_failures: 0,
            last_triggered_at: new Date().toISOString(),
            last_success_at: new Date().toISOString(),
          })
          .eq('id', subscription.id);

        triggered++;
      } else {
        // Schedule retry
        const nextAttempt = new Date(Date.now() + getBackoffDelay(1));

        await supabase
          .from('webhook_deliveries')
          .update({
            status: 'retrying',
            response_status: result.status,
            response_body: result.error,
            next_attempt_at: nextAttempt.toISOString(),
          })
          .eq('id', delivery.id);

        // Update subscription failure tracking
        const { data: currentSub } = await supabase
          .from('webhook_subscriptions')
          .select('consecutive_failures')
          .eq('id', subscription.id)
          .single();

        const failures = (currentSub?.consecutive_failures || 0) + 1;

        await supabase
          .from('webhook_subscriptions')
          .update({
            consecutive_failures: failures,
            last_triggered_at: new Date().toISOString(),
            last_failure_at: new Date().toISOString(),
            last_failure_reason: result.error,
            // Auto-disable after 5 consecutive failures
            is_active: failures < 5,
          })
          .eq('id', subscription.id);

        failed++;
      }
    })
  );

  return { triggered, failed };
}

/**
 * Generate a secure webhook secret
 */
export function generateWebhookSecret(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return 'whsec_' + Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Verify webhook signature (for consumers to use)
 */
export async function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const expectedSignature = await signPayload(payload, secret);
  return signature === expectedSignature;
}
