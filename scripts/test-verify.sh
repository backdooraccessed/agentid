#!/bin/bash

echo "=== Verify Single Credential ==="
curl -s -X POST "https://agentid-dashboard.vercel.app/api/verify" \
  -H "Content-Type: application/json" \
  -d '{"credential_id":"a749aeb8-61fb-4419-b808-1079893cd996"}'

echo ""
echo ""
echo "=== Batch Verify ==="
curl -s -X POST "https://agentid-dashboard.vercel.app/api/verify/batch" \
  -H "Content-Type: application/json" \
  -d '{"credentials":[{"credential_id":"a749aeb8-61fb-4419-b808-1079893cd996"},{"credential_id":"092bca2f-40a3-4ae2-9757-8f3ed9f070f8"}]}'

echo ""
echo ""
echo "=== Reputation Leaderboard ==="
curl -s "https://agentid-dashboard.vercel.app/api/reputation/leaderboard"
