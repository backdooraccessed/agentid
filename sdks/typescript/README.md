# AgentID TypeScript SDK

Official TypeScript/JavaScript SDK for [AgentID](https://agentid.dev) - Identity and authorization for AI agents.

## Installation

```bash
npm install @agentid/sdk
# or
yarn add @agentid/sdk
# or
pnpm add @agentid/sdk
```

## Quick Start

### For AI Agents (Presenting Credentials)

```typescript
import { AgentCredential } from '@agentid/sdk';

// Initialize with your credential ID
const cred = new AgentCredential('cred_xxx');

// Make authenticated requests
const response = await cred.fetch('https://api.example.com/data');
const data = await response.json();
```

### For Services (Verifying Credentials)

```typescript
import { CredentialVerifier, checkPermission } from '@agentid/sdk';

const verifier = new CredentialVerifier();

// Verify from request headers
const result = await verifier.verifyRequest({
  headers: Object.fromEntries(request.headers),
  method: 'GET',
  url: request.url,
});

if (result.valid) {
  console.log(`Request from: ${result.credential.agent_name}`);
  console.log(`Trust score: ${result.trust_score}`);
} else {
  console.log(`Invalid: ${result.error}`);
}
```

## Usage

### AgentCredential

The main class for agents to present their credentials:

```typescript
import { AgentCredential } from '@agentid/sdk';

// Basic initialization
const cred = new AgentCredential('cred_xxx');

// With options
const cred = new AgentCredential('cred_xxx', {
  apiKey: 'key_xxx',           // For private credentials
  apiBase: 'https://custom.agentid.dev/api',
  autoRefresh: true,            // Refresh before expiry
  refreshThreshold: 300,        // Refresh 5 min before expiry
});
```

#### Making Requests

```typescript
// Simple GET
const response = await cred.fetch('https://api.example.com/data');

// POST with body
const response = await cred.fetch('https://api.example.com/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'New User' }),
});
```

#### Getting Headers

If you want to add headers to your own fetch calls:

```typescript
const headers = await cred.getHeaders('POST', 'https://api.example.com/data', body);
// Returns:
// {
//   'X-AgentID-Credential': 'cred_xxx',
//   'X-AgentID-Timestamp': '1234567890',
//   'X-AgentID-Nonce': 'abc123...',
//   'X-AgentID-Signature': 'base64signature',
// }
```

#### Creating a Fetch Function

```typescript
// Create a fetch function that auto-includes credentials
const authenticatedFetch = cred.createFetch();

// Use it like regular fetch
const response = await authenticatedFetch('https://api.example.com/data');
```

### Express Middleware

```typescript
import express from 'express';
import { agentIDMiddleware, requirePermission } from '@agentid/sdk/express';

const app = express();

// Protect all /api routes
app.use('/api', agentIDMiddleware({
  required: true,              // Require valid credential
  minTrustScore: 50,          // Minimum trust score
  requiredPermissions: ['api:access'],
}));

// Access credential in route handlers
app.get('/api/data', (req, res) => {
  const { agent_name, agent_id } = req.agentCredential!;
  res.json({ message: `Hello, ${agent_name}!` });
});

// Per-route permission checks
app.post('/api/users',
  requirePermission('users:write'),
  (req, res) => {
    // Only agents with 'users:write' permission reach here
  }
);
```

### CredentialVerifier

For services that need to verify incoming agent requests:

```typescript
import { CredentialVerifier, checkPermission } from '@agentid/sdk';

const verifier = new CredentialVerifier({
  cacheTtl: 5 * 60 * 1000,     // Cache verifications for 5 min
  verifySignature: true,       // Verify request signatures
  signatureMaxAge: 300,        // Max 5 min old signatures
});

// Verify by credential ID
const result = await verifier.verifyCredential('cred_xxx');

// Verify from request headers
const result = await verifier.verifyRequest({
  headers: { 'X-AgentID-Credential': 'cred_xxx', ... },
  method: 'POST',
  url: 'https://your-api.com/endpoint',
  body: requestBody,
});

if (result.valid) {
  // Check permissions
  const allowed = checkPermission(result.credential.permissions, {
    resource: 'https://your-api.com/users',
    action: 'write',
    context: { amount: 100 },
  });

  if (allowed.granted) {
    // Process request
  } else {
    // Deny with reason
    console.log(allowed.reason);
  }
}
```

### Permission Checking

```typescript
import { checkPermission } from '@agentid/sdk';

// Example permissions from a credential
const permissions = [
  {
    resource: 'https://api.example.com/users/*',
    actions: ['read', 'write'],
    conditions: {
      max_transaction_amount: 10000,
      allowed_regions: ['US', 'EU'],
    },
  },
];

// Check if action is allowed
const result = checkPermission(permissions, {
  resource: 'https://api.example.com/users/123',
  action: 'write',
  context: {
    amount: 5000,
    region: 'US',
  },
});

if (result.granted) {
  // Action allowed
} else {
  console.log(`Denied: ${result.reason}`);
}
```

## Credential Lifecycle

```typescript
const cred = new AgentCredential('cred_xxx');

// Load credential data
await cred.load();

// Check status
console.log(cred.isLoaded);      // Has credential been fetched?
console.log(cred.isActive);      // Is it active and not expired?
console.log(cred.isExpired);     // Has it expired?
console.log(cred.timeToExpiry);  // Milliseconds until expiration
console.log(cred.needsRefresh);  // Should we refresh soon?

// Force refresh
await cred.load(true);

// Access credential data
console.log(cred.data?.agent_name);
```

## Error Handling

```typescript
import {
  AgentCredential,
  CredentialNotFoundError,
  CredentialExpiredError,
  CredentialRevokedError,
  RateLimitError,
  NetworkError,
} from '@agentid/sdk';

const cred = new AgentCredential('cred_xxx');

try {
  await cred.load();
} catch (error) {
  if (error instanceof CredentialNotFoundError) {
    console.log("Credential doesn't exist");
  } else if (error instanceof CredentialExpiredError) {
    console.log('Credential has expired');
  } else if (error instanceof CredentialRevokedError) {
    console.log('Credential was revoked');
  } else if (error instanceof RateLimitError) {
    console.log(`Rate limited, retry after ${error.retryAfter}s`);
  } else if (error instanceof NetworkError) {
    console.log('Network error connecting to AgentID');
  }
}
```

## Caching

```typescript
import { AgentCredential, MemoryCache, setGlobalCache } from '@agentid/sdk';

// Use default global cache
const cred = new AgentCredential('cred_xxx');

// Use custom cache instance
const cache = new MemoryCache(10 * 60 * 1000); // 10 minute TTL
const cred = new AgentCredential('cred_xxx', { cache });

// Or set a new global cache
setGlobalCache(new MemoryCache(15 * 60 * 1000));
```

## Types

All types are exported for TypeScript users:

```typescript
import type {
  CredentialPayload,
  CredentialStatus,
  IssuerInfo,
  Permission,
  PermissionConditions,
  VerificationResult,
  AgentCredentialOptions,
  VerifierOptions,
  MiddlewareOptions,
} from '@agentid/sdk';
```

## API Reference

### AgentCredential

| Property | Type | Description |
|----------|------|-------------|
| `credentialId` | `string` | The credential ID |
| `isLoaded` | `boolean` | Whether credential data has been loaded |
| `isActive` | `boolean` | Whether credential is active and valid |
| `isExpired` | `boolean` | Whether credential has expired |
| `timeToExpiry` | `number` | Milliseconds until expiration |
| `needsRefresh` | `boolean` | Whether credential should be refreshed |
| `data` | `CredentialPayload \| undefined` | The loaded credential data |

| Method | Description |
|--------|-------------|
| `load(force?)` | Load credential data from API or cache |
| `getHeaders(method, url, body?)` | Get headers to include in requests |
| `fetch(url, init?)` | Make an HTTP request with credentials |
| `createFetch()` | Create a fetch function with credentials |

### CredentialVerifier

| Method | Description |
|--------|-------------|
| `verifyCredential(id, options?)` | Verify a credential by ID |
| `verifyRequest(options)` | Verify a request with AgentID headers |

### Express Middleware

| Function | Description |
|----------|-------------|
| `agentIDMiddleware(options?)` | Create verification middleware |
| `requirePermission(...permissions)` | Require specific permissions |
| `requireTrustScore(minScore)` | Require minimum trust score |

## Development

```bash
# Clone and install
git clone https://github.com/agentid/agentid-js
cd agentid-js
pnpm install

# Build
pnpm build

# Run tests
pnpm test

# Type checking
pnpm typecheck
```

## License

MIT
