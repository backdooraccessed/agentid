# AgentID: Functional Product Roadmap v2

## The Problem With Our Current Approach

The previous roadmap focused on enterprise features (SSO, team management, audit logs). But those are **administrative overhead** - they don't make the product more useful.

**Honest assessment of current product:**
- We issue signed JSON blobs
- We verify those blobs exist
- We display a number called "trust score"
- Nothing is actually enforced

**Why would anyone pay for this?** They wouldn't. API keys do the same thing.

---

## The Core Question: What Should AgentID Actually DO?

For AgentID to be valuable, it needs to **do things that API keys can't**:

| API Keys | AgentID Should Do |
|----------|-------------------|
| Authenticate requests | Authenticate + authorize based on permissions |
| Static (revoke = redeploy) | Dynamic (revoke instantly, no redeploy) |
| Binary (valid/invalid) | Graduated trust (score 0-100) |
| No context about the caller | Rich metadata (who made this, what can they do) |
| No cross-platform identity | Portable identity across services |
| No accountability | Full audit trail back to issuer |

---

## Functional Roadmap: What We'll Build

### Track 1: Agent-Side (Make credentials usable)

#### 1.1 Agent SDK
**What it does:** Makes it trivial for agents to present credentials.

```python
# Python SDK
from agentid import AgentCredential

# Initialize once
cred = AgentCredential("cred_xxx")

# Auto-inject into any HTTP request
response = cred.request("https://api.example.com/data")
# Automatically adds:
# - X-AgentID-Credential header
# - X-AgentID-Signature (request signature)
# - X-AgentID-Timestamp (replay prevention)

# Or wrap an existing client
import httpx
client = cred.wrap(httpx.Client())
client.get("https://api.example.com/data")  # Headers auto-added
```

```typescript
// TypeScript SDK
import { AgentCredential } from '@agentid/sdk';

const cred = new AgentCredential('cred_xxx');

// Wrap fetch
const response = await cred.fetch('https://api.example.com/data');

// Or get headers to add yourself
const headers = cred.getHeaders({ method: 'POST', body: '...' });
```

**Why it matters:**
- Reduces integration from "read docs + implement" to "npm install + 2 lines"
- Standardizes how credentials are presented
- Handles signature, timestamp, renewal automatically

**Key features:**
- Auto-renewal before expiration
- Credential caching (don't fetch every request)
- Offline signature generation
- Framework integrations (LangChain, etc.)

---

#### 1.2 Framework Integrations
**What it does:** First-class support in AI agent frameworks.

**LangChain:**
```python
from langchain.agents import create_react_agent
from agentid.langchain import AgentIDCallback

agent = create_react_agent(...)
agent.invoke(
    {"input": "..."},
    callbacks=[AgentIDCallback(credential_id="cred_xxx")]
)
# Every tool call now includes AgentID headers
```

**CrewAI:**
```python
from crewai import Agent
from agentid.crewai import with_credential

@with_credential("cred_xxx")
class ResearchAgent(Agent):
    # All HTTP requests include credential
    pass
```

**OpenAI Assistants:**
```typescript
import { withAgentID } from '@agentid/openai';

const assistant = withAgentID(openai.beta.assistants.create({
  // ...
}), 'cred_xxx');
```

**Why it matters:**
- Most agents are built with these frameworks
- Native integration = instant adoption
- Positions AgentID as infrastructure layer

---

### Track 2: Verifier-Side (Make verification actionable)

#### 2.1 Verification Middleware
**What it does:** Drop-in middleware that verifies and authorizes agent requests.

```typescript
// Express middleware
import { agentIDMiddleware } from '@agentid/express';

app.use('/api', agentIDMiddleware({
  // Require valid credential for all /api routes
  required: true,

  // Minimum trust score
  minTrustScore: 50,

  // Required permissions for this endpoint
  requiredPermissions: ['data:read'],

  // Custom policy
  policy: async (credential) => {
    // Allow if issuer is verified
    return credential.issuer.is_verified;
  }
}));

// Access credential in route handlers
app.get('/api/data', (req, res) => {
  const { agentId, agentName, permissions } = req.agentCredential;
  // ...
});
```

```python
# FastAPI middleware
from agentid.fastapi import AgentIDMiddleware, require_permission

app.add_middleware(AgentIDMiddleware)

@app.get("/api/data")
@require_permission("data:read")
async def get_data(credential: AgentCredential = Depends()):
    return {"agent": credential.agent_name}
```

**Why it matters:**
- Services can protect endpoints without building verification logic
- Consistent authorization across the ecosystem
- Policy-based access control (not just authentication)

---

#### 2.2 Policy Engine
**What it does:** Define complex access policies declaratively.

```yaml
# agentid-policy.yaml
policies:
  - name: "production-api"
    match:
      paths: ["/api/v1/*"]
    require:
      credential: true
      min_trust_score: 70
      issuer_verified: true
      permissions:
        - "api:access"

  - name: "sensitive-data"
    match:
      paths: ["/api/v1/users/*", "/api/v1/payments/*"]
    require:
      min_trust_score: 90
      permissions:
        - "data:sensitive"
      conditions:
        # Only during business hours
        time_window: "09:00-17:00 America/New_York"
        # Only from allowed IPs
        ip_allowlist: ["10.0.0.0/8"]

  - name: "public-read"
    match:
      paths: ["/api/v1/public/*"]
      methods: ["GET"]
    require:
      credential: false  # Optional but logged if present
```

**Why it matters:**
- Enterprises need policy-based controls
- Declarative = auditable, version-controlled
- Can be enforced at gateway level (see 2.3)

---

#### 2.3 AgentID Gateway (Future - Major Feature)
**What it does:** A reverse proxy that enforces AgentID policies on any backend.

```
┌─────────┐     ┌──────────────┐     ┌─────────────┐
│  Agent  │────▶│  AgentID     │────▶│  Your API   │
│         │     │  Gateway     │     │  (unchanged)│
└─────────┘     └──────────────┘     └─────────────┘
                      │
                      ▼
               ┌──────────────┐
               │  AgentID     │
               │  API         │
               └──────────────┘
```

**Deployment options:**
1. **Cloud Gateway** - We host, you point DNS
2. **Self-hosted** - Docker container in your infra
3. **Sidecar** - Kubernetes sidecar pattern

**Configuration:**
```yaml
# gateway.yaml
upstream:
  url: "https://api.internal.example.com"

authentication:
  type: "agentid"
  required: true

policies:
  - path: "/api/*"
    min_trust_score: 50
    required_permissions: ["api:access"]

rate_limiting:
  # Rate limit based on trust score
  base_rate: 100  # requests/minute
  trust_multiplier: true  # Higher trust = higher limits

logging:
  # Log all requests with credential info
  destination: "https://logs.example.com/ingest"
```

**Why it matters:**
- **Zero code changes** to existing APIs
- Centralized policy enforcement
- Built-in rate limiting, logging, analytics
- This is the "enterprise product" - not SSO

---

### Track 3: Real-Time Features (What API keys can't do)

#### 3.1 Instant Revocation
**What it does:** Revoke a credential and have it blocked everywhere within seconds.

**Current problem:** If you revoke a credential, verifiers who cached the result still accept it.

**Solution: Revocation broadcast**

```typescript
// Verifier subscribes to revocation stream
import { AgentIDVerifier } from '@agentid/sdk';

const verifier = new AgentIDVerifier({
  // Subscribe to real-time revocations
  subscribeRevocations: true,

  // Callback when credential is revoked
  onRevocation: (credentialId) => {
    // Clear from local cache, block immediately
    cache.delete(credentialId);
  }
});

// Or check revocation status inline (with caching)
const result = await verifier.verify(credential, {
  // Max age of cached revocation check
  maxRevocationAge: 60_000  // 1 minute
});
```

**Implementation:**
- WebSocket connection from verifier SDK to AgentID
- Push revocation events in real-time
- Fallback to polling if WebSocket unavailable

**Why it matters:**
- Critical for security incidents ("agent compromised, revoke NOW")
- API keys require redeploy, this is instant
- Differentiator from static credentials

---

#### 3.2 Live Permission Updates
**What it does:** Change what an agent can do without re-issuing the credential.

**Current problem:** Permissions are baked into the credential. Changing permissions = new credential = agent reconfiguration.

**Solution: Permission policies**

```typescript
// Issue credential with policy reference
const credential = await agentid.credentials.issue({
  agent_id: "agent-123",
  agent_name: "Support Bot",

  // Instead of static permissions:
  // permissions: ["read", "write"]

  // Reference a mutable policy:
  permission_policy_id: "policy_xxx"
});

// Update policy without touching credential
await agentid.policies.update("policy_xxx", {
  permissions: ["read"]  // Removed "write"
});

// Next verification returns updated permissions
// Agent doesn't need to do anything
```

**Verifier experience:**
```typescript
const result = await verifier.verify(credential);
// result.permissions reflects CURRENT policy, not issuance-time
```

**Why it matters:**
- Operational reality: permissions change frequently
- Don't want to reissue credentials for every change
- Audit trail of permission changes over time

---

#### 3.3 Usage Alerts & Anomaly Detection
**What it does:** Alert issuers when their agents behave unusually.

```typescript
// Configure alerts
await agentid.alerts.create({
  credential_id: "cred_xxx",

  triggers: [
    // Alert if verification fails
    { event: "verification_failed", threshold: 3, window: "1h" },

    // Alert if used from unexpected location
    { event: "geo_anomaly", expected_regions: ["US", "EU"] },

    // Alert if usage pattern changes
    { event: "usage_spike", threshold_multiplier: 5 },

    // Alert if permission violation attempted
    { event: "permission_denied" }
  ],

  notify: {
    webhook: "https://example.com/alerts",
    email: "security@example.com"
  }
});
```

**Dashboard view:**
- Real-time usage graphs per credential
- Anomaly highlights
- One-click revocation from alert

**Why it matters:**
- Security monitoring without building it yourself
- Early warning of compromised agents
- Compliance requirement for many orgs

---

### Track 4: Agent Registry & Discovery

#### 4.1 Agent Registry
**What it does:** Public directory of agents with their capabilities.

**For agent operators:**
```typescript
// Register agent in directory (optional)
await agentid.registry.register({
  credential_id: "cred_xxx",

  // Public profile
  display_name: "Support Bot",
  description: "Customer support agent for Acme Corp",
  categories: ["customer-support", "enterprise"],

  // Capabilities (what can this agent do)
  capabilities: [
    "answer-questions",
    "create-tickets",
    "lookup-orders"
  ],

  // How to interact
  endpoint: "https://api.acme.com/agent",
  documentation_url: "https://docs.acme.com/agent",

  // Contact
  support_email: "support@acme.com"
});
```

**For agent consumers:**
```typescript
// Search for agents
const agents = await agentid.registry.search({
  capabilities: ["customer-support"],
  min_trust_score: 80,
  issuer_verified: true
});

// Returns:
[{
  credential_id: "cred_xxx",
  display_name: "Support Bot",
  trust_score: 92,
  issuer: { name: "Acme Corp", verified: true },
  capabilities: ["answer-questions", "create-tickets"],
  endpoint: "https://api.acme.com/agent"
}]
```

**Why it matters:**
- Discoverability: "I need an agent that can do X"
- Trust signal: verified agents in public directory
- Foundation for agent marketplace

---

#### 4.2 Agent-to-Agent Communication
**What it does:** Standardized protocol for agents to verify each other.

**Scenario:** Agent A needs to call Agent B's API. How does B know A is legitimate?

**Solution: Mutual credential exchange**

```python
# Agent A calling Agent B
from agentid import AgentCredential

cred_a = AgentCredential("cred_a")

# Make request to Agent B
response = cred_a.request(
    "https://agent-b.example.com/api/task",
    require_peer_credential=True,  # Require B to identify itself
    min_peer_trust_score=70
)

# response includes B's verified credential
print(response.peer_credential.agent_name)  # "Agent B"
print(response.peer_credential.trust_score)  # 85
```

**Protocol:**
```
Agent A                              Agent B
   │                                    │
   │  POST /api/task                    │
   │  X-AgentID-Credential: cred_a      │
   │  X-AgentID-Require-Peer: true      │
   │ ─────────────────────────────────▶ │
   │                                    │
   │         200 OK                     │
   │  X-AgentID-Credential: cred_b      │
   │ ◀───────────────────────────────── │
   │                                    │
```

**Why it matters:**
- Enables trusted agent swarms
- Foundation for agent-to-agent commerce
- No human-in-the-loop required

---

### Track 5: Structured Permissions (Making Authorization Real)

#### 5.1 Permission Schema
**What it does:** Standard format for expressing what agents can do.

**Current problem:** Permissions are arbitrary strings. `["read", "write"]` means nothing standard.

**Solution: Structured permissions**

```typescript
interface Permission {
  // What resource (URI pattern)
  resource: string;  // "https://api.example.com/users/*"

  // What actions
  actions: ("read" | "write" | "delete" | "admin")[];

  // Under what conditions
  conditions?: {
    // Time restrictions
    valid_hours?: { start: string; end: string; timezone: string };
    valid_days?: ("mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun")[];

    // Rate limits
    max_requests_per_minute?: number;
    max_requests_per_day?: number;

    // Data restrictions
    max_records_per_request?: number;
    allowed_fields?: string[];  // Only these fields in response

    // Geographic restrictions
    allowed_regions?: string[];

    // Financial limits
    max_transaction_amount?: number;
    daily_spend_limit?: number;
  };

  // Require human approval?
  requires_approval?: boolean;
  approval_webhook?: string;
}
```

**Example: Stripe integration**
```json
{
  "permissions": [
    {
      "resource": "https://api.stripe.com/v1/charges",
      "actions": ["read", "write"],
      "conditions": {
        "max_transaction_amount": 10000,
        "daily_spend_limit": 50000,
        "requires_approval": true,
        "approval_webhook": "https://acme.com/approve"
      }
    },
    {
      "resource": "https://api.stripe.com/v1/customers",
      "actions": ["read"],
      "conditions": {
        "allowed_fields": ["id", "email", "name"]
      }
    }
  ]
}
```

**Why it matters:**
- Permissions become enforceable, not just documentation
- Verifiers can make real authorization decisions
- Standard format = interoperability

---

#### 5.2 Permission Verification
**What it does:** Verifiers can check if a permission allows a specific action.

```typescript
import { checkPermission } from '@agentid/sdk';

// In your API handler
app.post('/api/users', async (req, res) => {
  const credential = req.agentCredential;

  const allowed = checkPermission(credential.permissions, {
    resource: 'https://api.example.com/users',
    action: 'write',
    context: {
      // Current request context
      time: new Date(),
      region: req.geo.country,
      amount: req.body.amount
    }
  });

  if (!allowed.granted) {
    return res.status(403).json({
      error: 'Permission denied',
      reason: allowed.reason  // "Exceeds daily spend limit"
    });
  }

  // Process request...
});
```

**Why it matters:**
- Actual enforcement, not just attestation
- Clear denial reasons for debugging
- Context-aware authorization

---

## Implementation Priority

### Phase 1: Make It Usable (Now)
| Feature | Why First | Effort |
|---------|-----------|--------|
| Agent SDK (Python/TS) | Can't grow without easy integration | Medium |
| Verification Middleware (Express/FastAPI) | Verifiers need drop-in solution | Medium |
| Structured Permissions | Foundation for authorization | Medium |

### Phase 2: Make It Better Than API Keys
| Feature | Why | Effort |
|---------|-----|--------|
| Instant Revocation | Security differentiator | Medium |
| Live Permission Updates | Operational necessity | Medium |
| Usage Alerts | Security/compliance | Medium |

### Phase 3: Make It a Platform
| Feature | Why | Effort |
|---------|-----|--------|
| Agent Registry | Network effects, discovery | High |
| A2A Protocol | Enable agent ecosystems | High |
| Gateway | Zero-code adoption | High |

---

## What We're NOT Building (For Now)

| Feature | Why Skip |
|---------|----------|
| SSO/SAML | Administrative, not functional |
| Team management | Nice-to-have, not must-have |
| Custom domains | Vanity, not value |
| Audit log retention tiers | Monetization theater |

These are **enterprise upsells**, not product value. Build them after we have users who want them.

---

## Success Criteria

**Phase 1 Success:**
- 10+ agents using SDK to present credentials
- 5+ services using middleware to verify
- Verification latency < 100ms

**Phase 2 Success:**
- Revocation propagates in < 5 seconds
- Permission changes take effect immediately
- 3+ security incidents caught by alerts

**Phase 3 Success:**
- 100+ agents in public registry
- Agent-to-agent requests occurring
- Gateway processing 1M+ requests/month

---

## The Pitch (Revised)

**Before:** "AgentID is a credential system for AI agents"
→ "So... fancy API keys?"

**After:** "AgentID is the authorization layer for AI agents. Issue credentials with real permissions. Revoke instantly. Know exactly what every agent can do."
→ "That's actually useful."

---

## Next Steps

1. **Build Agent SDK** - Python first (most AI agents), then TypeScript
2. **Build Verification Middleware** - Express and FastAPI
3. **Implement Structured Permissions** - Schema + enforcement
4. **Add Instant Revocation** - WebSocket-based broadcast
5. **Launch Agent Registry** - Public directory of verified agents

Start with the SDK. Nothing else matters if agents can't easily present credentials.
