# AgentID RLS Policies Documentation

## Overview

AgentID uses Row Level Security (RLS) to ensure data access control at the database level. All tables have RLS enabled with explicit policies.

## Access Model

| Role | Description |
|------|-------------|
| `anon` | Public/unauthenticated requests (verification API) |
| `authenticated` | Logged-in users (issuers using the dashboard) |
| `service_role` | Full access for Edge Functions and admin operations |

## Issuers Table

| Policy | Role | Operation | Rule |
|--------|------|-----------|------|
| Read own record | `authenticated` | SELECT | `user_id = auth.uid()` |
| Update own record | `authenticated` | UPDATE | `user_id = auth.uid()` |
| Create profile | `authenticated` | INSERT | `user_id = auth.uid()` |

**Notes:**
- Issuers can only see and modify their own profile
- Verification status (`is_verified`) can only be changed by admins via `service_role`
- One issuer profile per Supabase Auth user

## Credentials Table

| Policy | Role | Operation | Rule |
|--------|------|-----------|------|
| Read own credentials | `authenticated` | SELECT | Issuer owns the credential |
| Create credentials | `authenticated` | INSERT | Issuer owns the credential |
| Update own credentials | `authenticated` | UPDATE | Issuer owns the credential |
| **Public read** | `anon` | SELECT | All credentials readable |

**Notes:**
- **Critical:** Public read access is intentional for the verification API
- Credential payloads are designed to be shareable (contain only public info)
- Private keys are never stored in credentials
- Issuers can revoke by updating status to 'revoked'

## Verification Logs Table

| Policy | Role | Operation | Rule |
|--------|------|-----------|------|
| Read logs for own credentials | `authenticated` | SELECT | Credential belongs to issuer |
| **Public insert** | `anon` | INSERT | Anyone can log verifications |
| Authenticated insert | `authenticated` | INSERT | Anyone can log verifications |

**Notes:**
- Verification logs are append-only
- Public insert allows tracking all verification attempts
- No personally identifiable information should be stored in logs
- IP addresses should be hashed before storage (application layer)

## Security Considerations

1. **No DELETE policies**: Data is preserved for audit purposes
2. **Service role bypass**: Edge Functions use service role for signing operations
3. **Public credentials**: By design - credentials are meant to be verified publicly
4. **Key security**: Private keys never leave Edge Functions / Supabase secrets
