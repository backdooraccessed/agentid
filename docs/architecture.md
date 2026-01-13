# AgentID Architecture

## Overview

AgentID is a credential and reputation infrastructure for AI agents, built on Next.js + Supabase + Vercel.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        AgentID Platform                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │  Next.js    │  │  Supabase   │  │     Edge Functions      │ │
│  │  Dashboard  │  │  Database   │  │     (Signing)           │ │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘ │
│         │                │                      │               │
│  ┌──────┴────────────────┴──────────────────────┴─────────────┐│
│  │                    API Routes                               ││
│  │  /api/credentials  /api/verify  /api/issuers               ││
│  └────────────────────────────────────────────────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
   ┌───────────┐       ┌───────────┐       ┌───────────┐
   │   Agent   │       │  Service  │       │Enterprise │
   │Developers │       │ Providers │       │  Admins   │
   └───────────┘       └───────────┘       └───────────┘
```

## Data Flow

### Credential Issuance

```
1. Issuer authenticates via Supabase Auth
2. Issuer submits credential request to /api/credentials
3. API validates request against Zod schema
4. API calls Edge Function to sign payload with issuer's derived key
5. Signed credential stored in Supabase
6. Credential payload returned to issuer
```

### Credential Verification

```
1. Service sends credential_id or full payload to /api/verify
2. API fetches credential from Supabase (if by ID)
3. API verifies signature using issuer's public key
4. API checks status, validity period
5. Returns verification result with credential details
6. Logs verification for analytics
```

## Database Schema

### Tables

| Table | Purpose |
|-------|---------|
| `issuers` | Organizations/individuals who issue credentials |
| `credentials` | Credential records with status and signatures |
| `verification_logs` | Audit trail of verification requests |

### Key Relationships

- `credentials.issuer_id` → `issuers.id`
- `verification_logs.credential_id` → `credentials.id`

## Security Model

### Row Level Security (RLS)

- **Issuers**: Users can only access their own issuer record
- **Credentials**: Users can only manage credentials they issued
- **Verification**: Public read access for verification API

### Cryptographic Security

- Ed25519 signing (via HMAC-SHA256 for MVP)
- Keys derived from master seed + user_id using HKDF
- Only public keys stored in database
- Private key derivation happens in Edge Functions

## API Design

### Authentication

- Supabase Auth with JWT tokens
- Protected routes require valid session
- `/api/verify` is intentionally public (no auth)

### Rate Limiting

Rate limiting should be configured at the Vercel/Supabase level for production.

## Deployment Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     Vercel      │     │    Supabase     │     │   Supabase      │
│   (Next.js)     │────▶│   (Postgres)    │     │   Edge Funcs    │
│                 │     │                 │     │   (Signing)     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Performance Targets

| Metric | Target |
|--------|--------|
| Verification latency (p99) | < 100ms |
| Dashboard page load | < 2s |
| API availability | 99.9% |
