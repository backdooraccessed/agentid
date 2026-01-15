# AgentID: MVP to Product Roadmap

## Executive Summary

AgentID currently provides basic credential issuance and verification for AI agents. To become the industry standard for AI agent identity, we need to expand into four strategic pillars:

1. **Authorization Layer** - Move beyond identity to permissions
2. **Trust Network** - Build a decentralized web of trust
3. **Enterprise Readiness** - Features that unlock enterprise adoption
4. **Ecosystem Integration** - Become the "Login with AgentID" standard

---

## Market Context & Strategic Reasoning

### The Problem Space is Expanding

The AI agent landscape is evolving rapidly:

- **2024**: Simple chatbots and assistants
- **2025**: Autonomous agents performing multi-step tasks
- **2026+**: Agent swarms, agent-to-agent commerce, autonomous systems

As agents become more autonomous, the trust problem compounds:
- How do you know which agent is making a request?
- What is this agent authorized to do?
- Who is responsible if something goes wrong?
- Can agents trust other agents?

### Why Current Solutions Fall Short

| Current Approach | Limitation |
|-----------------|------------|
| API Keys | No identity, just authentication. Can't express permissions or track behavior |
| OAuth Tokens | Designed for humans, not agents. No agent-specific metadata |
| Custom Headers | Non-standard, no verification, no reputation |
| "Trust the Framework" | Centralized trust in one provider (OpenAI, Anthropic, etc.) |

### AgentID's Opportunity

Position AgentID as the **identity layer for the agentic web** - the standard protocol that enables:
- Agent-to-service trust
- Agent-to-agent trust
- Cross-platform portability
- Compliance and accountability

---

## Phase 1: Authorization Layer (Foundation)

**Timeline**: Immediate priority
**Goal**: Move from "who is this agent?" to "what can this agent do?"

### 1.1 Scoped Permissions System

**Current State**: Credentials have a flat `permissions` array with arbitrary strings.

**Problem**: No standard permission model. Each integrator interprets permissions differently. No way to express conditional or hierarchical permissions.

**Solution**: Implement a structured permission model:

```typescript
interface Permission {
  // Resource being accessed
  resource: string;           // e.g., "api.stripe.com/charges"

  // Actions allowed
  actions: string[];          // e.g., ["read", "create"]

  // Conditions (optional)
  conditions?: {
    max_amount?: number;      // e.g., 10000 (cents)
    time_window?: string;     // e.g., "business_hours"
    require_approval?: boolean;
    rate_limit?: number;
  };

  // Scope limitations
  scope?: {
    tenant_id?: string;
    environment?: "production" | "staging" | "development";
    geographic?: string[];    // e.g., ["US", "EU"]
  };
}
```

**Why This Matters**:
- Verifiers can make authorization decisions, not just authentication
- Enables fine-grained access control ("can read, but not write")
- Supports compliance requirements ("can only access US data")
- Reduces attack surface when credentials are compromised

**Implementation**:
1. Add `structured_permissions` field to credential schema
2. Update credential issuance UI with permission builder
3. Create permission templates for common use cases
4. Update verification API to return parsed permissions

### 1.2 Permission Delegation

**Problem**: An agent may need to delegate a subset of its permissions to another agent (sub-agent pattern common in LangChain, AutoGPT).

**Solution**: Delegation chains with attenuation:

```typescript
interface DelegatedCredential {
  parent_credential_id: string;
  delegated_permissions: Permission[];  // Must be subset of parent
  delegation_chain: string[];           // Full chain for audit
  max_delegation_depth: number;         // Prevent infinite chains
}
```

**Why This Matters**:
- Enables agent orchestration patterns
- Maintains accountability (can trace back to root issuer)
- Limits blast radius (delegated credential can't exceed parent's permissions)

**Use Case Example**:
1. Company issues credential to "Orchestrator Agent" with full permissions
2. Orchestrator delegates limited credential to "Research Agent" (read-only)
3. Research Agent can be verified, and verifier sees full delegation chain

### 1.3 Real-Time Permission Updates

**Current State**: Permissions are baked into the credential at issuance. Changing permissions requires revoking and re-issuing.

**Problem**: Operational nightmare for enterprises. Every permission change = new credential = agent reconfiguration.

**Solution**: Dynamic permission binding:

```typescript
// Credential references a permission policy
interface Credential {
  // ... existing fields
  permission_policy_id: string;  // References mutable policy
}

// Policy can be updated without re-issuing credential
interface PermissionPolicy {
  id: string;
  version: number;
  permissions: Permission[];
  updated_at: string;
}
```

**Verification Flow**:
1. Verifier checks credential signature (immutable)
2. Verifier fetches current permission policy (mutable)
3. Returns both credential validity AND current permissions

**Why This Matters**:
- Zero-downtime permission changes
- Centralized policy management for enterprises
- Audit trail of permission changes over time

---

## Phase 2: Trust Network (Differentiation)

**Timeline**: After Phase 1
**Goal**: Build a decentralized web of trust, not just point-to-point credentials

### 2.1 Issuer Verification Tiers

**Current State**: Binary `is_verified` flag. No clarity on what "verified" means.

**Problem**: Enterprises need to know the rigor of verification. A self-registered issuer vs. a legally verified corporation have different trust profiles.

**Solution**: Tiered verification system:

| Tier | Name | Requirements | Trust Signal |
|------|------|--------------|--------------|
| 0 | Unverified | Email only | Basic identity |
| 1 | Domain Verified | DNS TXT record | Controls domain |
| 2 | Organization Verified | Business documents | Legal entity confirmed |
| 3 | Extended Verified | Security audit + insurance | Enterprise-grade |

**Implementation**:
1. Add `verification_tier` to issuers table
2. Create verification workflows for each tier
3. Display tier badges in directory and verification responses
4. Allow verifiers to set minimum tier requirements

**Why This Matters**:
- Enterprises can require Tier 2+ for production access
- Creates premium tier (revenue opportunity)
- Differentiates from self-signed approaches

### 2.2 Cross-Issuer Trust Endorsements

**Problem**: Trust is currently siloed. Issuer A's agents have no relationship with Issuer B's agents.

**Solution**: Allow issuers to endorse other issuers:

```typescript
interface TrustEndorsement {
  endorser_id: string;      // Issuer making the endorsement
  endorsed_id: string;      // Issuer being endorsed
  trust_level: number;      // 1-100
  categories: string[];     // What they're trusted for
  evidence_url?: string;    // Link to due diligence
  expires_at: string;
}
```

**Trust Calculation**:
- Direct trust: Issuer A explicitly trusts Issuer B
- Transitive trust: A trusts B, B trusts C → A has indirect trust in C (with decay)
- Web of trust score: Aggregated from all endorsements

**Why This Matters**:
- Enables trust discovery ("I trust Google, Google trusts this startup")
- Creates network effects (more issuers = more valuable)
- Mirrors real-world trust relationships

### 2.3 Behavioral Reputation

**Current State**: Trust score based on verification success rate only.

**Problem**: Doesn't capture agent behavior quality. An agent that technically "works" but behaves poorly should have lower trust.

**Solution**: Expand reputation signals:

```typescript
interface BehavioralSignals {
  // Verification metrics (existing)
  verification_success_rate: number;
  total_verifications: number;

  // New: Behavioral metrics
  incident_reports: number;        // Times agent was reported
  rate_limit_violations: number;   // Abusive patterns
  permission_violations: number;   // Attempted unauthorized access

  // New: Positive signals
  successful_transactions: number; // Completed intended tasks
  uptime_percentage: number;       // Availability
  response_quality_score: number;  // From verifier feedback
}
```

**Reputation API Enhancement**:
```json
GET /api/reputation/agent/{id}

{
  "trust_score": 85,
  "breakdown": {
    "verification": 90,
    "behavior": 80,
    "longevity": 85,
    "issuer": 88
  },
  "signals": {
    "total_verifications": 15000,
    "incident_reports": 2,
    "successful_transactions": 14500
  },
  "trend": "stable"  // or "improving", "declining"
}
```

**Why This Matters**:
- Trust becomes meaningful, not just checkbox
- Bad actors get identified and deprioritized
- Creates accountability pressure on issuers

### 2.4 Incident Reporting

**Problem**: No mechanism to report problematic agents. Bad behavior goes untracked.

**Solution**: Incident reporting system:

```typescript
interface IncidentReport {
  reporter_id: string;           // Who's reporting
  credential_id: string;         // Which credential
  incident_type: "spam" | "abuse" | "unauthorized" | "fraud" | "other";
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  evidence_url?: string;
  reported_at: string;
}
```

**Workflow**:
1. Any verifier can submit incident report
2. Reports aggregated and weighted by reporter reputation
3. Issuers notified of incidents against their agents
4. High-severity incidents trigger automatic trust score reduction

**Why This Matters**:
- Community policing of bad actors
- Creates accountability for issuers
- Data for ML-based threat detection

---

## Phase 3: Enterprise Readiness (Revenue)

**Timeline**: Parallel with Phase 2
**Goal**: Features that unlock paid enterprise adoption

### 3.1 Organization & Team Management

**Current State**: Single user per issuer. No team support.

**Problem**: Enterprises have multiple people managing credentials. No role separation.

**Solution**: Full organization model:

```typescript
interface Organization {
  id: string;
  name: string;
  billing_email: string;
  plan: "free" | "pro" | "enterprise";

  // Feature flags based on plan
  features: {
    max_credentials: number;      // 10, 1000, unlimited
    max_team_members: number;     // 1, 10, unlimited
    api_rate_limit: number;       // 100, 10000, unlimited
    sla_guarantee: boolean;
    dedicated_support: boolean;
    custom_domain: boolean;
    audit_log_retention_days: number;
  };
}

interface TeamMember {
  user_id: string;
  organization_id: string;
  role: "owner" | "admin" | "member" | "readonly";
  permissions: string[];         // Granular permissions
  invited_at: string;
  accepted_at?: string;
}
```

**Roles & Permissions**:
| Role | Issue Creds | Revoke | View Analytics | Manage Team | Billing |
|------|-------------|--------|----------------|-------------|---------|
| Owner | ✓ | ✓ | ✓ | ✓ | ✓ |
| Admin | ✓ | ✓ | ✓ | ✓ | ✗ |
| Member | ✓ | ✓ | ✓ | ✗ | ✗ |
| Readonly | ✗ | ✗ | ✓ | ✗ | ✗ |

**Why This Matters**:
- Required for any enterprise sale
- Enables self-serve growth (invite teammates)
- Foundation for billing/monetization

### 3.2 Audit Logging & Compliance

**Current State**: Basic verification_logs table. No comprehensive audit trail.

**Problem**: Enterprises need audit logs for compliance (SOC 2, HIPAA, etc.).

**Solution**: Comprehensive audit system:

```typescript
interface AuditEvent {
  id: string;
  organization_id: string;
  actor: {
    type: "user" | "api_key" | "system";
    id: string;
    ip_address: string;
    user_agent: string;
  };
  action: string;              // e.g., "credential.issued"
  resource: {
    type: string;              // e.g., "credential"
    id: string;
  };
  changes?: {
    before: object;
    after: object;
  };
  timestamp: string;
  request_id: string;
}
```

**Events to Track**:
- `credential.issued`, `credential.revoked`, `credential.renewed`
- `team.member_added`, `team.member_removed`, `team.role_changed`
- `settings.updated`, `api_key.created`, `api_key.revoked`
- `webhook.created`, `webhook.deleted`
- `login.success`, `login.failed`, `password.changed`

**Export & Retention**:
- Export to CSV/JSON for compliance reports
- Configurable retention (30 days free, 1 year pro, 7 years enterprise)
- Integration with SIEM tools (Splunk, DataDog)

**Why This Matters**:
- Required for SOC 2 Type II certification
- Enterprise procurement checkbox
- Forensic capability for incident response

### 3.3 SSO & Directory Integration

**Problem**: Enterprises want to use existing identity providers. Don't want another set of credentials.

**Solution**: SSO support via SAML/OIDC:

```typescript
interface SSOConfiguration {
  organization_id: string;
  provider: "okta" | "azure_ad" | "google_workspace" | "onelogin" | "custom";

  // SAML config
  saml_entity_id?: string;
  saml_sso_url?: string;
  saml_certificate?: string;

  // OIDC config
  oidc_issuer?: string;
  oidc_client_id?: string;
  oidc_client_secret?: string;  // Encrypted

  // Mapping
  attribute_mapping: {
    email: string;
    name: string;
    role?: string;
  };

  // Settings
  require_sso: boolean;         // Disable password login
  auto_provision: boolean;      // Create users on first login
}
```

**Why This Matters**:
- Enterprise IT requirement
- Reduces onboarding friction
- Better security (centralized access control)

### 3.4 Custom Domains & White-Labeling

**Problem**: Enterprises want credentials from `agents.their-company.com`, not `agentid.dev`.

**Solution**: Custom domain support:

```typescript
interface CustomDomain {
  organization_id: string;
  domain: string;                 // e.g., "agents.acme.com"

  // Verification
  verification_method: "dns" | "file";
  verification_token: string;
  verified_at?: string;

  // SSL
  ssl_status: "pending" | "active" | "failed";
  ssl_expires_at?: string;

  // Branding
  branding: {
    logo_url?: string;
    primary_color?: string;
    company_name?: string;
  };
}
```

**What Gets White-Labeled**:
- Verification badge URLs
- Credential display pages
- API endpoints (optional CNAME)
- Email notifications

**Why This Matters**:
- Brand consistency for enterprises
- Higher perceived value
- Premium feature (revenue)

### 3.5 SLA & Priority Support

**Problem**: Enterprises need guarantees and support channels.

**Solution**: Tiered support model:

| Feature | Free | Pro | Enterprise |
|---------|------|-----|------------|
| Uptime SLA | Best effort | 99.9% | 99.99% |
| Support | Community | Email (24h) | Slack + Phone (1h) |
| Dedicated CSM | ✗ | ✗ | ✓ |
| Custom contracts | ✗ | ✗ | ✓ |
| On-prem option | ✗ | ✗ | ✓ |

**Implementation**:
- Status page with historical uptime
- Priority queue for enterprise API requests
- Dedicated Slack channel per enterprise customer

---

## Phase 4: Ecosystem Integration (Network Effects)

**Timeline**: After Phase 3 foundation
**Goal**: Become the standard - "Login with AgentID"

### 4.1 Framework SDKs

**Problem**: Developers need to manually integrate AgentID. Friction = low adoption.

**Solution**: First-class SDKs for major frameworks:

**LangChain Integration**:
```python
from langchain.agents import AgentID

# Automatic credential injection
agent = AgentID.wrap(
    my_agent,
    credential_id="cred_xxx",
    auto_present=True  # Adds credential to all requests
)
```

**AutoGPT Plugin**:
```yaml
# autogpt.yaml
plugins:
  - agentid:
      credential_id: ${AGENTID_CREDENTIAL}
      verify_peers: true  # Verify other agents
```

**OpenAI Function Calling**:
```typescript
// Credential as a tool
const tools = [
  agentid.createVerificationTool(),  // Lets agent verify others
  agentid.createCredentialTool(),    // Presents own credential
];
```

**Priority Frameworks**:
1. LangChain (Python + JS)
2. AutoGPT
3. CrewAI
4. Microsoft AutoGen
5. OpenAI Assistants API

**Why This Matters**:
- Reduces integration from hours to minutes
- Network effects (framework users = AgentID users)
- Positions as infrastructure, not just a tool

### 4.2 Verification Widget

**Problem**: Services want to verify agents but don't want to build UI.

**Solution**: Embeddable verification widget:

```html
<!-- Drop-in verification badge -->
<script src="https://agentid.dev/widget.js"></script>
<agentid-badge credential-id="cred_xxx"></agentid-badge>

<!-- Interactive verification modal -->
<agentid-verify
  on-success="handleVerified"
  on-failure="handleFailed"
  required-permissions='["data_read"]'
/>
```

**Widget Features**:
- Real-time verification status
- Permission display
- Trust score visualization
- Customizable styling

**Why This Matters**:
- Reduces integration friction
- Consistent UX across ecosystem
- Viral distribution (widget links back to AgentID)

### 4.3 Agent Directory & Discovery

**Current State**: Issuer directory only. Can't discover individual agents.

**Problem**: No way to find agents for specific tasks. No marketplace.

**Solution**: Agent discovery platform:

```typescript
interface AgentListing {
  credential_id: string;
  agent_name: string;
  description: string;

  // Discoverability
  categories: string[];          // e.g., ["customer_support", "coding"]
  capabilities: string[];

  // Trust signals
  trust_score: number;
  verification_count: number;

  // Availability
  status: "available" | "busy" | "offline";
  api_endpoint?: string;

  // Economics (future)
  pricing_model?: "free" | "per_request" | "subscription";
  price_per_request?: number;
}
```

**Search & Discovery**:
- Search by capability ("agents that can book flights")
- Filter by trust score, issuer tier
- Sort by reputation, popularity

**Why This Matters**:
- Creates marketplace dynamics
- Agents become discoverable, not just verifiable
- Future revenue via transaction fees

### 4.4 Agent-to-Agent Protocol

**Problem**: Agents verifying each other requires custom integration.

**Solution**: Standard protocol for agent-to-agent trust:

```typescript
// Standard headers for agent requests
interface AgentRequestHeaders {
  "X-AgentID-Credential": string;     // Presenting agent's credential
  "X-AgentID-Signature": string;      // Request signature
  "X-AgentID-Timestamp": string;      // Replay prevention
  "X-AgentID-Require-Trust": string;  // Minimum trust score required
}

// Response includes verification result
interface AgentResponseHeaders {
  "X-AgentID-Verified": "true" | "false";
  "X-AgentID-Trust-Score": string;
  "X-AgentID-Permissions": string;    // JSON-encoded
}
```

**Mutual Authentication Flow**:
1. Agent A makes request with credential headers
2. Agent B verifies A's credential via AgentID
3. Agent B responds with its own credential
4. Agent A verifies B's credential
5. Both agents now have mutual trust context

**Why This Matters**:
- Enables agent swarms and collaboration
- Standard protocol = interoperability
- Critical for agent-to-agent commerce

### 4.5 Credential Portability Standard

**Problem**: If AgentID fails, credentials become worthless. Vendor lock-in concerns.

**Solution**: Open standard for credential format:

```typescript
// Based on W3C Verifiable Credentials
interface PortableCredential {
  "@context": ["https://www.w3.org/2018/credentials/v1", "https://agentid.dev/v1"];
  type: ["VerifiableCredential", "AgentCredential"];

  issuer: {
    id: string;           // DID or HTTPS URL
    name: string;
  };

  credentialSubject: {
    id: string;           // Agent DID
    name: string;
    permissions: Permission[];
  };

  issuanceDate: string;
  expirationDate: string;

  proof: {
    type: "Ed25519Signature2020";
    created: string;
    verificationMethod: string;
    proofPurpose: "assertionMethod";
    proofValue: string;
  };
}
```

**Benefits**:
- Credentials can be verified without AgentID infrastructure
- Interoperability with other credential systems
- Addresses enterprise vendor lock-in concerns

---

## Monetization Strategy

### Free Tier
- 10 active credentials
- 1,000 verifications/month
- Basic analytics
- Community support

### Pro ($49/month)
- 1,000 active credentials
- 100,000 verifications/month
- Full analytics
- Email support (24h)
- Custom templates
- Webhook integrations

### Enterprise (Custom)
- Unlimited credentials
- Unlimited verifications
- SSO/SAML
- Custom domain
- SLA guarantee
- Dedicated support
- Audit log retention
- On-premise option

### Transaction Revenue (Future)
- Agent marketplace fees (10% of transaction)
- Premium verification badges
- Trust endorsement fees

---

## Technical Architecture Evolution

### Current (MVP)
```
┌─────────────┐     ┌─────────────┐
│  Dashboard  │────▶│  Supabase   │
│  (Next.js)  │     │  (Postgres) │
└─────────────┘     └─────────────┘
       │
       ▼
┌─────────────┐
│  Vercel     │
│  (Hosting)  │
└─────────────┘
```

### Phase 2+ (Scaled)
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Dashboard  │────▶│  API Layer  │────▶│  Supabase   │
│  (Next.js)  │     │  (Separate) │     │  (Postgres) │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │   Redis     │
                    │  (Cache +   │
                    │  Rate Limit)│
                    └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  Analytics  │
                    │  Pipeline   │
                    └─────────────┘
```

### Key Infrastructure Additions
1. **Dedicated API Service** - Separate from dashboard for scalability
2. **Redis/Valkey** - Caching, rate limiting, real-time features
3. **Analytics Pipeline** - ClickHouse or similar for high-volume queries
4. **CDN** - For verification badges and widgets
5. **Background Jobs** - For webhooks, notifications, trust recalculation

---

## Prioritization Matrix

| Feature | Impact | Effort | Revenue | Priority |
|---------|--------|--------|---------|----------|
| Scoped Permissions | High | Medium | Indirect | P0 |
| Issuer Verification Tiers | High | Low | Direct | P0 |
| Team Management | High | Medium | Direct | P0 |
| Audit Logging | Medium | Medium | Direct | P1 |
| LangChain SDK | High | Medium | Indirect | P1 |
| Permission Delegation | Medium | High | Indirect | P1 |
| Behavioral Reputation | Medium | Medium | Indirect | P2 |
| SSO Integration | Medium | High | Direct | P2 |
| Custom Domains | Low | Medium | Direct | P2 |
| Agent Discovery | High | High | Direct | P3 |
| A2A Protocol | High | High | Indirect | P3 |

---

## Success Metrics

### Adoption
- Monthly Active Issuers
- Credentials Issued (cumulative)
- Monthly Verifications
- SDK Downloads

### Engagement
- Credentials per Issuer
- Verification Success Rate
- API Integration Rate (% using API vs dashboard)

### Revenue
- MRR/ARR
- Conversion Rate (Free → Paid)
- Net Revenue Retention
- Customer Acquisition Cost

### Trust Network
- Average Trust Score
- Cross-Issuer Endorsements
- Incident Report Rate
- Mean Time to Revocation

---

## Conclusion

AgentID has a solid MVP foundation. The path to product-market fit requires:

1. **Depth** (Phase 1-2): Make credentials more useful with permissions and trust
2. **Enterprise** (Phase 3): Unlock the paying customer segment
3. **Ecosystem** (Phase 4): Become the standard through integrations

The key insight: **AgentID should not just verify identity, but enable trust-based authorization**. This positions us as essential infrastructure, not just a nice-to-have verification tool.

Next immediate action: Implement scoped permissions and issuer verification tiers to validate enterprise interest before building the full stack.
