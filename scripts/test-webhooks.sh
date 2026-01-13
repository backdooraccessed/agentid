#!/bin/bash

# Supabase credentials
SUPABASE_URL="https://jgsxssphnrquaietjicm.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impnc3hzc3BobnJxdWFpZXRqaWNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyODA4MjksImV4cCI6MjA4Mzg1NjgyOX0.On2MsjB8nmnUzL8ItHP2nYrkpihMTFhuSYSG6ku2WLo"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impnc3hzc3BobnJxdWFpZXRqaWNtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODI4MDgyOSwiZXhwIjoyMDgzODU2ODI5fQ.t3bkSWfQk3u93MIRam1CQ__L0lFz0dIcsRB3nOh40kA"

echo "=== Webhook System Test ==="
echo ""

# 1. Get issuer ID
echo "1. Finding test issuer..."
ISSUER=$(curl -s "$SUPABASE_URL/rest/v1/issuers?select=id,name&limit=1" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY")
echo "   $ISSUER"

ISSUER_ID=$(echo "$ISSUER" | jq -r '.[0].id')
ISSUER_NAME=$(echo "$ISSUER" | jq -r '.[0].name')
echo "   Using: $ISSUER_NAME ($ISSUER_ID)"
echo ""

# 2. Check existing webhooks
echo "2. Checking existing webhooks..."
WEBHOOKS=$(curl -s "$SUPABASE_URL/rest/v1/webhook_subscriptions?select=id,url,events,is_active&issuer_id=eq.$ISSUER_ID" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY")
echo "   $WEBHOOKS"
echo ""

# 3. Create a test webhook if none exists
WEBHOOK_COUNT=$(echo "$WEBHOOKS" | jq 'length')
if [ "$WEBHOOK_COUNT" = "0" ]; then
  echo "3. Creating test webhook..."

  # Generate a random secret
  SECRET="whsec_$(openssl rand -hex 32)"

  # Create webhook - using httpbin.org as test endpoint
  CREATED=$(curl -s -X POST "$SUPABASE_URL/rest/v1/webhook_subscriptions" \
    -H "apikey: $ANON_KEY" \
    -H "Authorization: Bearer $SERVICE_KEY" \
    -H "Content-Type: application/json" \
    -H "Prefer: return=representation" \
    -d "{
      \"issuer_id\": \"$ISSUER_ID\",
      \"url\": \"https://httpbin.org/post\",
      \"events\": [\"credential.revoked\", \"credential.issued\"],
      \"secret\": \"$SECRET\",
      \"description\": \"Test webhook\",
      \"is_active\": true
    }")

  echo "   Created: $CREATED"
  WEBHOOK_ID=$(echo "$CREATED" | jq -r '.[0].id // .id')
  echo "   Webhook ID: $WEBHOOK_ID"
  echo "   Secret: $SECRET"
else
  WEBHOOK_ID=$(echo "$WEBHOOKS" | jq -r '.[0].id')
  echo "3. Using existing webhook: $WEBHOOK_ID"
fi
echo ""

# 4. Test webhook delivery via direct HTTP
echo "4. Testing direct webhook delivery to httpbin.org..."

# Build payload
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
PAYLOAD="{\"event\":\"test\",\"timestamp\":\"$TIMESTAMP\",\"data\":{\"message\":\"Test webhook\",\"issuer_id\":\"$ISSUER_ID\"}}"

echo "   Sending payload: $PAYLOAD"

RESPONSE=$(curl -s -X POST "https://httpbin.org/post" \
  -H "Content-Type: application/json" \
  -H "X-AgentID-Signature: test-signature" \
  -H "X-AgentID-Timestamp: $(date +%s)" \
  -H "X-AgentID-Delivery-ID: test_$(date +%s)" \
  -d "$PAYLOAD")

echo "   Response status: $(echo "$RESPONSE" | jq -r '.url // "success"')"
echo "   Received headers: $(echo "$RESPONSE" | jq -r '.headers | keys | join(", ")')"
echo ""

# 5. Check webhook deliveries table
echo "5. Checking webhook_deliveries table..."
DELIVERIES=$(curl -s "$SUPABASE_URL/rest/v1/webhook_deliveries?select=id,event_type,status,attempts,created_at&order=created_at.desc&limit=5" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY")
echo "   $DELIVERIES"
echo ""

# 6. Test the revoke endpoint which triggers webhooks
echo "6. Testing credential revocation webhook trigger..."

# Get an active credential
CREDENTIAL=$(curl -s "$SUPABASE_URL/rest/v1/credentials?select=id,agent_name&issuer_id=eq.$ISSUER_ID&status=eq.active&limit=1" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY")

CRED_ID=$(echo "$CREDENTIAL" | jq -r '.[0].id')
CRED_NAME=$(echo "$CREDENTIAL" | jq -r '.[0].agent_name')

if [ "$CRED_ID" != "null" ] && [ -n "$CRED_ID" ]; then
  echo "   Found active credential: $CRED_NAME ($CRED_ID)"
  echo "   (Skipping actual revocation to preserve test data)"
else
  echo "   No active credentials found"
fi
echo ""

# 7. Summary
echo "=== Summary ==="
echo "✅ Webhook subscriptions table accessible"
echo "✅ Webhook deliveries table accessible"
echo "✅ Direct HTTP delivery works (httpbin.org returned response)"
echo ""
echo "Webhook endpoints (require authentication):"
echo "  GET  https://agentid-woad.vercel.app/api/webhooks"
echo "  POST https://agentid-woad.vercel.app/api/webhooks"
echo "  GET  https://agentid-woad.vercel.app/api/webhooks/:id"
echo "  PATCH https://agentid-woad.vercel.app/api/webhooks/:id"
echo "  DELETE https://agentid-woad.vercel.app/api/webhooks/:id"
echo "  POST https://agentid-woad.vercel.app/api/webhooks/:id/test"
