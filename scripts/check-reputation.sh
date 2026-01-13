#!/bin/bash
SUPABASE_URL="https://jgsxssphnrquaietjicm.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impnc3hzc3BobnJxdWFpZXRqaWNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyODA4MjksImV4cCI6MjA4Mzg1NjgyOX0.On2MsjB8nmnUzL8ItHP2nYrkpihMTFhuSYSG6ku2WLo"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impnc3hzc3BobnJxdWFpZXRqaWNtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODI4MDgyOSwiZXhwIjoyMDgzODU2ODI5fQ.t3bkSWfQk3u93MIRam1CQ__L0lFz0dIcsRB3nOh40kA"

echo "=== Agent Reputation ==="
curl -s "$SUPABASE_URL/rest/v1/agent_reputation?select=*" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY"

echo ""
echo ""
echo "=== Issuer Reputation ==="
curl -s "$SUPABASE_URL/rest/v1/issuer_reputation?select=*" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY"

echo ""
echo ""
echo "=== API Leaderboard ==="
curl -s "https://agentid-woad.vercel.app/api/reputation/leaderboard"

echo ""
echo ""
echo "=== Agent Reputation via API ==="
curl -s "https://agentid-woad.vercel.app/api/reputation/agent/a749aeb8-61fb-4419-b808-1079893cd996"
