# AgentID

Credential and Reputation Infrastructure for AI Agents.

## Overview

AgentID enables organizations to issue verifiable credentials to their AI agents and allows services to verify agent identity, permissions, and trustworthiness.

## Features

- **Credential Issuance**: Issue cryptographically signed credentials to AI agents
- **Public Verification**: Verify credentials via simple REST API
- **Revocation**: Instantly revoke compromised or misbehaving agents
- **Dashboard**: Web UI for managing credentials and settings

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
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
│   └── shared/             # Shared types and validation
├── supabase/
│   ├── migrations/         # Database schema
│   └── functions/          # Edge Functions
└── docs/                   # Documentation
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

### Revoke Credential

```bash
POST /api/credentials/{id}/revoke
Authorization: Bearer <token>

{
  "reason": "Compromised"
}
```

## Development

```bash
# Run all apps in development mode
pnpm dev

# Build all packages
pnpm build

# Type check
pnpm type-check
```

## Deployment

The app is designed for Vercel deployment:

```bash
# Deploy to Vercel
vercel
```

Ensure these environment variables are set in Vercel:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## License

MIT
