# AgentID - Claude Code Guidelines

## Project Overview

AgentID is a credential and reputation infrastructure for AI agents built with Next.js 15, Supabase, and Vercel.

## Stack

- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **Validation**: Zod schemas in @agentid/shared
- **Hosting**: Vercel

## Project Structure

```
agentid/
├── apps/dashboard/         # Next.js web application
├── packages/shared/        # Shared types and validation
├── supabase/              # Database migrations and Edge Functions
└── docs/                  # Documentation
```

## Key Commands

```bash
# Development
pnpm dev                    # Start all apps in dev mode
pnpm build                  # Build all packages

# Individual packages
pnpm --filter @agentid/dashboard dev
pnpm --filter @agentid/shared build

# Supabase
supabase db push           # Apply migrations
supabase functions deploy  # Deploy Edge Functions
```

## Development Guidelines

1. **Types first**: All data structures defined in `packages/shared/src/types.ts`
2. **Validate inputs**: Use Zod schemas from `packages/shared/src/validation.ts`
3. **RLS always**: Every table has Row Level Security enabled
4. **Server Components default**: Use Client Components only when needed

## API Routes

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/api/credentials` | POST | Yes | Issue credential |
| `/api/credentials` | GET | Yes | List credentials |
| `/api/credentials/[id]` | GET | Yes | Get credential |
| `/api/credentials/[id]/revoke` | POST | Yes | Revoke credential |
| `/api/verify` | POST | **No** | Public verification |
| `/api/issuers/register` | POST | Yes | Register issuer |
| `/api/issuers/register` | GET | Yes | Get issuer profile |

## Database Tables

- `issuers`: Credential issuers (linked to Supabase Auth)
- `credentials`: Issued credentials with signatures
- `verification_logs`: Verification audit trail

## Environment Variables

Required:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Edge Function secrets (via `supabase secrets set`):
- `SIGNING_KEY_SEED`

## Project Best Practices Checklist

> Review before starting any new project or major feature.

### Pre-Coding
- [ ] Write a detailed spec/PRD first (user flows, features, edge cases)
- [ ] Create state machine diagrams for complex components
- [ ] Gather real UI references from production apps (Mobbin)
- [ ] Ask clarifying questions before writing code
- [ ] Confirm tech stack (prefer Svelte + Vite over React)

### During Development
- Be specific, break tasks into small chunks
- Use structured tags: `<role>`, `<task>`, `<constraints>`
- Role-play expert personas for specialized tasks
- Compact context regularly
- Test manually after autonomous runs

### Long Sessions (40+ min)
- Use Ralph technique for autonomous loops
- Or compact context and restart fresh

### Useful Tools
- Claude-Mem (persistent memory)
- Hyperbrowser MCP (`/docs fetch <url>`)
- Claude Skills (for niche frameworks)
