# AgentID

[![E2E Tests](https://github.com/backdooraccessed/agentid/actions/workflows/e2e-tests.yml/badge.svg)](https://github.com/backdooraccessed/agentid/actions/workflows/e2e-tests.yml)

Credential and Reputation Infrastructure for AI Agents.

## Overview

AgentID enables organizations to issue verifiable credentials to their AI agents and allows services to verify agent identity, permissions, and trustworthiness.

## Features

- **Credential Issuance**: Issue cryptographically signed credentials to AI agents
- **Credential Templates**: Reusable templates for faster credential issuance
- **Public Verification**: Verify credentials via simple REST API (single or batch)
- **Revocation**: Instantly revoke compromised or misbehaving agents
- **Reputation System**: Trust scores based on verification history and credential age
- **Webhooks**: Real-time notifications for credential events
- **API Keys**: Programmatic access with scoped permissions
- **Rate Limiting**: Built-in protection for all public endpoints
- **Analytics**: Usage metrics, verification stats, and daily activity tracking
- **Dashboard**: Web UI for managing credentials, API keys, webhooks, templates, and analytics
- **SDKs**: JavaScript/TypeScript and Python SDKs for easy integration

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **Crypto**: Ed25519 signatures
- **Hosting**: Vercel

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 9+
- Supabase CLI
- Supabase account

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd agentid

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Build shared package
pnpm --filter @agentid/shared build

# Run development server
pnpm dev
```

### Supabase Setup

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push

# Set Edge Function secrets
supabase secrets set SIGNING_KEY_SEED=$(openssl rand -hex 32)

# Deploy Edge Functions
supabase functions deploy sign-credential
```

## Project Structure

```
agentid/
├── apps/
│   └── dashboard/          # Next.js web app
├── packages/
│   ├── sdk/                # JavaScript/TypeScript SDK
│   ├── python-sdk/         # Python SDK
│   └── shared/             # Shared types and validation
├── supabase/
│   ├── migrations/         # Database schema
│   └── functions/          # Edge Functions
└── docs/                   # Documentation
```

## SDKs

### JavaScript/TypeScript SDK

```bash
npm install @agentid/sdk
```

```typescript
import { AgentIDClient } from '@agentid/sdk';

const client = new AgentIDClient();

// Verify a credential
const result = await client.verify({ credentialId: 'uuid' });
if (result.valid) {
  console.log(`Agent: ${result.credential.agent_name}`);
}

// Batch verification
const batch = await client.verifyBatch([
  { credentialId: 'uuid1' },
  { credentialId: 'uuid2' },
]);
console.log(`Valid: ${batch.summary.valid}/${batch.summary.total}`);
```

### Python SDK

```bash
pip install agentid
```

```python
from agentid import AgentIDClient

async with AgentIDClient() as client:
    # Verify a credential
    result = await client.verify(credential_id="uuid")
    if result.valid:
        print(f"Agent: {result.credential.agent_name}")

    # Batch verification
    batch = await client.verify_batch([
        {"credential_id": "uuid1"},
        {"credential_id": "uuid2"},
    ])
    print(f"Valid: {batch.summary.valid}/{batch.summary.total}")

    # Get reputation
    rep = await client.get_reputation(credential_id="uuid")
    print(f"Trust Score: {rep.trust_score}")
```

## API Reference

### Issue Credential

```bash
POST /api/credentials
Authorization: Bearer <token>

{
  "agent_id": "my-agent-v1",
  "agent_name": "My Trading Agent",
  "agent_type": "autonomous",
  "permissions": {
    "actions": ["read", "transact"],
    "domains": ["finance"],
    "resource_limits": {
      "max_transaction_value": 1000,
      "currency": "USD"
    }
  },
  "valid_until": "2025-12-31T23:59:59Z"
}
```

### Verify Credential (Public)

```bash
POST /api/verify

{
  "credential_id": "uuid"
}
```

Response:

```json
{
  "valid": true,
  "credential": {
    "agent_id": "my-agent-v1",
    "agent_name": "My Trading Agent",
    "permissions": {...},
    "valid_until": "2025-12-31T23:59:59Z"
  },
  "verification_time_ms": 45
}
```

### Batch Verification (Public)

```bash
POST /api/verify/batch

{
  "credentials": [
    { "credential_id": "uuid1" },
    { "credential_id": "uuid2" }
  ]
}
```

Response:

```json
{
  "results": [
    { "index": 0, "valid": true, "credential": {...} },
    { "index": 1, "valid": true, "credential": {...} }
  ],
  "summary": { "total": 2, "valid": 2, "invalid": 0 },
  "verification_time_ms": 150
}
```

### Revoke Credential

```bash
POST /api/credentials/{id}/revoke
Authorization: Bearer <token>

{
  "reason": "Compromised"
}
```

### Reputation API (Public)

```bash
# Get agent reputation
GET /api/reputation/agent/{credential_id}

# Get issuer reputation
GET /api/reputation/issuer/{issuer_id}

# Get leaderboard
GET /api/reputation/leaderboard?limit=10
```

Response (agent reputation):

```json
{
  "trust_score": 85,
  "verification_count": 42,
  "success_rate": 0.98,
  "credential_age_days": 30,
  "issuer_verified": true
}
```

### API Keys

Create API keys for programmatic access with scoped permissions.

```bash
# Create API key
POST /api/keys
Authorization: Bearer <session-token>

{
  "name": "Production Key",
  "description": "For production integration",
  "scopes": ["credentials:read", "credentials:write", "webhooks:read"],
  "expires_in_days": 90
}
```

Response:

```json
{
  "id": "uuid",
  "key": "agid_a1b2c3d4_...",
  "message": "API key created. Save this key - it will not be shown again."
}
```

Available scopes:
- `credentials:read` - Read credentials
- `credentials:write` - Issue and revoke credentials
- `webhooks:read` - List webhooks
- `webhooks:write` - Create and manage webhooks
- `reputation:read` - Read reputation data

Use API keys via Bearer token:

```bash
curl -H "Authorization: Bearer agid_a1b2c3d4_..." \
  https://agentid-woad.vercel.app/api/credentials
```

### Credential Templates

Create reusable templates for faster credential issuance.

```bash
# Create template
POST /api/templates
Authorization: Bearer <token>

{
  "name": "Production Assistant",
  "description": "Template for production AI assistants",
  "agent_type": "assistant",
  "permissions": ["read", "write", "api_access"],
  "validity_days": 90
}
```

Use template when issuing credentials:

```bash
POST /api/credentials
Authorization: Bearer <token>

{
  "template_id": "uuid",
  "agent_id": "my-agent-v1",
  "agent_name": "My Agent"
}
```

### Analytics

```bash
# Get usage analytics (last 30 days)
GET /api/analytics?days=30
Authorization: Bearer <token>
```

Response:

```json
{
  "period": { "start": "2025-12-14", "end": "2026-01-13", "days": 30 },
  "summary": {
    "total_credentials": 25,
    "active_credentials": 20,
    "credentials_issued": 5,
    "credentials_revoked": 2,
    "verifications_total": 1250,
    "verifications_successful": 1200,
    "verification_success_rate": "96.0%"
  },
  "daily": [...],
  "recent_verifications": [...]
}
```

### Webhooks

```bash
# Create webhook subscription
POST /api/webhooks
Authorization: Bearer <token>

{
  "url": "https://your-server.com/webhook",
  "events": ["credential.revoked", "credential.expired"]
}
```

Webhook payload:

```json
{
  "event": "credential.revoked",
  "timestamp": "2025-01-13T12:00:00Z",
  "data": {
    "credential_id": "uuid",
    "agent_id": "my-agent-v1",
    "revoked_at": "2025-01-13T12:00:00Z",
    "revocation_reason": "Compromised"
  }
}
```

Verify webhook signature:

```python
import hmac
import hashlib

def verify_webhook(payload: bytes, signature: str, secret: str) -> bool:
    expected = hmac.new(secret.encode(), payload, hashlib.sha256).hexdigest()
    return hmac.compare_digest(signature, expected)
```

## Rate Limiting

All public API endpoints are rate limited to prevent abuse:

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/verify` | 100 requests | 60 seconds |
| `/api/verify/batch` | 20 requests | 60 seconds |
| `/api/reputation/*` | 60 requests | 60 seconds |
| `/api/reputation/leaderboard` | 120 requests | 60 seconds |

Rate limit headers are included in responses:
- `X-RateLimit-Limit` - Maximum requests allowed
- `X-RateLimit-Remaining` - Requests remaining in window
- `X-RateLimit-Reset` - Unix timestamp when limit resets

## Dashboard

The web dashboard provides a UI for managing all features:

| Page | Path | Description |
|------|------|-------------|
| Credentials | `/credentials` | View and manage issued credentials |
| Issue New | `/credentials/new` | Issue new credentials |
| Templates | `/templates` | Create and manage credential templates |
| API Keys | `/api-keys` | Create and manage API keys |
| Webhooks | `/webhooks` | Configure webhook subscriptions |
| Analytics | `/analytics` | View usage metrics and statistics |
| Settings | `/settings` | Manage issuer profile |

## Trust Score Calculation

The reputation system calculates trust scores using a weighted formula:

| Factor | Weight | Description |
|--------|--------|-------------|
| Verification Score | 30% | Success rate of verifications |
| Longevity Score | 25% | Age of the credential |
| Activity Score | 20% | Recency of verifications |
| Issuer Score | 25% | Issuer verification status |

Scores range from 0-100, with higher scores indicating more trustworthy agents.

## Development

```bash
# Run all apps in development mode
pnpm dev

# Build all packages
pnpm build

# Type check
pnpm type-check

# Run Python SDK tests
cd packages/python-sdk && pytest
```

## Deployment

The app is designed for Vercel deployment:

```bash
# Deploy to Vercel
vercel --prod
```

Ensure these environment variables are set in Vercel:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Live Demo

- **Dashboard**: https://agentid-woad.vercel.app
- **API**: https://agentid-woad.vercel.app/api
- **Python SDK**: https://pypi.org/project/agentid/

## License

MIT
