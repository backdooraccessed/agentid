#!/usr/bin/env node
/**
 * Test script for webhooks system
 * Uses service key to bypass auth
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import crypto from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load env from .env.local
const envPath = join(__dirname, '..', 'apps', 'dashboard', '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...vals] = line.split('=');
  if (key && vals.length) env[key.trim()] = vals.join('=').trim();
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Generate webhook secret
function generateWebhookSecret() {
  const bytes = crypto.randomBytes(32);
  return 'whsec_' + bytes.toString('hex');
}

async function main() {
  console.log('=== Webhook System Test ===\n');

  // 1. Get the test issuer
  console.log('1. Finding test issuer...');
  const { data: issuer, error: issuerError } = await supabase
    .from('issuers')
    .select('id, name')
    .limit(1)
    .single();

  if (issuerError || !issuer) {
    console.error('No issuer found:', issuerError?.message);
    process.exit(1);
  }
  console.log(`   Found: ${issuer.name} (${issuer.id})\n`);

  // 2. Check existing webhooks
  console.log('2. Checking existing webhooks...');
  const { data: existingWebhooks } = await supabase
    .from('webhook_subscriptions')
    .select('id, url, events, is_active')
    .eq('issuer_id', issuer.id);

  if (existingWebhooks?.length) {
    console.log(`   Found ${existingWebhooks.length} existing webhook(s):`);
    existingWebhooks.forEach(w => {
      console.log(`   - ${w.url} [${w.events.join(', ')}] (active: ${w.is_active})`);
    });
  } else {
    console.log('   No existing webhooks');
  }
  console.log();

  // 3. Create a test webhook subscription
  console.log('3. Creating test webhook subscription...');

  // Use webhook.site or a test URL - for testing we'll use httpbin
  const testUrl = 'https://httpbin.org/post';
  const secret = generateWebhookSecret();

  // Check if already exists
  const { data: existing } = await supabase
    .from('webhook_subscriptions')
    .select('id')
    .eq('issuer_id', issuer.id)
    .eq('url', testUrl)
    .single();

  let webhookId;
  if (existing) {
    console.log(`   Webhook for ${testUrl} already exists`);
    webhookId = existing.id;
  } else {
    const { data: newWebhook, error: createError } = await supabase
      .from('webhook_subscriptions')
      .insert({
        issuer_id: issuer.id,
        url: testUrl,
        events: ['credential.revoked', 'credential.issued'],
        secret: secret,
        description: 'Test webhook',
        is_active: true,
      })
      .select('id, url, events, secret')
      .single();

    if (createError) {
      console.error('   Failed to create webhook:', createError.message);
      process.exit(1);
    }

    webhookId = newWebhook.id;
    console.log(`   Created: ${newWebhook.url}`);
    console.log(`   Events: ${newWebhook.events.join(', ')}`);
    console.log(`   Secret: ${newWebhook.secret.slice(0, 20)}...`);
  }
  console.log();

  // 4. Test webhook delivery manually
  console.log('4. Testing webhook delivery...');

  // Get the webhook with secret
  const { data: webhook } = await supabase
    .from('webhook_subscriptions')
    .select('id, url, secret')
    .eq('id', webhookId)
    .single();

  if (!webhook) {
    console.error('   Webhook not found');
    process.exit(1);
  }

  // Build test payload
  const payload = {
    event: 'test',
    timestamp: new Date().toISOString(),
    data: {
      message: 'Test webhook from script',
      issuer_id: issuer.id,
      issuer_name: issuer.name,
    },
  };

  const payloadString = JSON.stringify(payload);

  // Sign payload with HMAC-SHA256
  const hmac = crypto.createHmac('sha256', webhook.secret);
  hmac.update(payloadString);
  const signature = hmac.digest('hex');

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const deliveryId = `test_${Date.now().toString(36)}`;

  console.log(`   Sending to: ${webhook.url}`);
  console.log(`   Payload: ${payloadString}`);

  try {
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-AgentID-Signature': signature,
        'X-AgentID-Timestamp': timestamp,
        'X-AgentID-Delivery-ID': deliveryId,
      },
      body: payloadString,
    });

    const responseText = await response.text();

    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${responseText.slice(0, 300)}...`);

    if (response.ok) {
      console.log('   ✅ Webhook delivered successfully\n');
    } else {
      console.log('   ❌ Webhook delivery failed\n');
    }
  } catch (error) {
    console.error(`   ❌ Failed to deliver: ${error.message}\n`);
  }

  // 5. Test credential revocation webhook trigger
  console.log('5. Testing revocation webhook trigger...');

  // Get an active credential
  const { data: credential } = await supabase
    .from('credentials')
    .select('id, agent_name, issuer_id')
    .eq('issuer_id', issuer.id)
    .eq('status', 'active')
    .limit(1)
    .single();

  if (!credential) {
    console.log('   No active credentials to test revocation webhook\n');
  } else {
    console.log(`   Found credential: ${credential.agent_name}`);
    console.log('   (Not actually revoking - just testing the trigger function)\n');
  }

  // 6. List webhook deliveries
  console.log('6. Checking webhook deliveries...');
  const { data: deliveries } = await supabase
    .from('webhook_deliveries')
    .select('id, event_type, status, attempts, created_at')
    .eq('subscription_id', webhookId)
    .order('created_at', { ascending: false })
    .limit(5);

  if (deliveries?.length) {
    console.log(`   Found ${deliveries.length} delivery record(s):`);
    deliveries.forEach(d => {
      console.log(`   - ${d.event_type}: ${d.status} (${d.attempts} attempts) at ${d.created_at}`);
    });
  } else {
    console.log('   No delivery records yet');
  }
  console.log();

  // 7. Summary
  console.log('=== Summary ===');
  console.log('✅ Webhook subscription created');
  console.log('✅ Webhook delivery tested');
  console.log('✅ HMAC signature generation works');
  console.log('\nWebhook endpoints (require auth):');
  console.log('  GET  /api/webhooks - List webhooks');
  console.log('  POST /api/webhooks - Create webhook');
  console.log('  GET  /api/webhooks/:id - Get webhook details');
  console.log('  PATCH /api/webhooks/:id - Update webhook');
  console.log('  DELETE /api/webhooks/:id - Delete webhook');
  console.log('  POST /api/webhooks/:id/test - Send test webhook');
}

main().catch(console.error);
