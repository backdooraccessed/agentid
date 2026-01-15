# AgentID TypeScript SDK

The AgentID TypeScript SDK provides type-safe integration with the AgentID credential and verification system.

## Installation

```bash
npm install @agentid/sdk
# or
yarn add @agentid/sdk
# or
pnpm add @agentid/sdk
```

## Quick Start

```typescript
import { AgentID } from '@agentid/sdk';

// Initialize with your API key
const client = new AgentID({ apiKey: 'your-api-key' });

// Verify a credential
const result = await client.verify({ credentialId: 'cred-uuid-here' });
if (result.valid) {
  console.log(`Agent ${result.credential?.agentName} is verified`);
}
```

## Configuration

```typescript
import { AgentID } from '@agentid/sdk';

// Full configuration
const client = new AgentID({
  apiKey: 'your-api-key',
  baseUrl: 'https://agentid.dev/api', // Optional, defaults to production
  timeout: 30000, // Request timeout in milliseconds
});
```

## Verification

### Basic Verification

```typescript
// Verify by credential ID
const result = await client.verify({ credentialId: 'uuid-here' });

// Access result
console.log(result.valid);                    // true/false
console.log(result.credential?.agentId);
console.log(result.credential?.agentName);
console.log(result.issuer?.name);
console.log(result.trustScore);
```

### Verification with Permission Check

```typescript
// Verify and check specific permission
const result = await client.verify({
  credentialId: 'uuid-here',
  checkPermission: {
    action: 'read:users',
    resource: 'users/123',
    context: { amount: 100 }
  }
});

if (result.permissionCheck) {
  console.log(result.permissionCheck.granted);  // true/false
  console.log(result.permissionCheck.reason);
}
```

### Batch Verification

```typescript
// Verify multiple credentials at once
const results = await client.verifyBatch([
  { credentialId: 'uuid-1' },
  { credentialId: 'uuid-2' },
  { credentialId: 'uuid-3' },
]);

for (const result of results) {
  console.log(`${result.credentialId}: ${result.valid}`);
}
```

## Credential Management

### Issue Credential

```typescript
const credential = await client.credentials.create({
  agentId: 'agent-unique-id',
  agentName: 'My AI Agent',
  agentType: 'llm',
  agentDescription: 'A helpful AI assistant',
  permissions: {
    actions: ['read', 'write'],
    domains: ['api.example.com']
  },
  validDays: 365
});

console.log(credential.id);
console.log(credential.signature);
```

### Get Credential

```typescript
const credential = await client.credentials.get('credential-uuid');
console.log(credential.agentName);
console.log(credential.status);
```

### List Credentials

```typescript
const credentials = await client.credentials.list({
  status: 'active',
  limit: 10
});

for (const cred of credentials) {
  console.log(`${cred.agentName}: ${cred.status}`);
}
```

### Revoke Credential

```typescript
await client.credentials.revoke('uuid-here', {
  reason: 'No longer needed'
});
```

## Express.js Integration

```typescript
import express from 'express';
import { AgentID, createExpressMiddleware } from '@agentid/sdk';

const app = express();
const agentId = new AgentID({ apiKey: 'your-api-key' });

// Create middleware
const verifyAgent = createExpressMiddleware(agentId);

// Protect routes
app.get('/protected', verifyAgent(), (req, res) => {
  // req.agentCredential is available
  res.json({ agent: req.agentCredential?.agentName });
});

// Require specific permission
app.post('/data', verifyAgent({ permission: 'write:data' }), (req, res) => {
  res.json({ status: 'created' });
});
```

## Next.js Integration

```typescript
// middleware.ts
import { createNextMiddleware } from '@agentid/sdk';

const agentIdMiddleware = createNextMiddleware({
  apiKey: process.env.AGENTID_API_KEY!,
});

export async function middleware(request: Request) {
  return agentIdMiddleware(request);
}

export const config = {
  matcher: '/api/:path*',
};
```

```typescript
// pages/api/protected.ts (or app/api/protected/route.ts)
import { withAgentVerification } from '@agentid/sdk';

export const GET = withAgentVerification(
  async (req, { credential }) => {
    return Response.json({ agent: credential.agentName });
  },
  { apiKey: process.env.AGENTID_API_KEY! }
);
```

## Error Handling

```typescript
import { AgentID } from '@agentid/sdk';
import {
  AgentIDError,
  AuthenticationError,
  CredentialNotFoundError,
  ValidationError,
  RateLimitError
} from '@agentid/sdk';

const client = new AgentID({ apiKey: 'your-api-key' });

try {
  const result = await client.verify({ credentialId: 'uuid' });
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.log('Invalid API key');
  } else if (error instanceof CredentialNotFoundError) {
    console.log('Credential does not exist');
  } else if (error instanceof RateLimitError) {
    console.log(`Rate limited. Retry after ${error.retryAfter} seconds`);
  } else if (error instanceof AgentIDError) {
    console.log(`AgentID error: ${error.message}`);
  }
}
```

## Types

The SDK exports all types for full TypeScript support:

```typescript
import type {
  VerificationResult,
  Credential,
  CredentialPayload,
  Permission,
  PermissionCheck,
  PermissionCheckResult,
  Issuer,
  VerifyOptions,
  CreateCredentialOptions,
} from '@agentid/sdk';
```

## Environment Variables

The SDK supports configuration via environment variables:

```bash
AGENTID_API_KEY=your-api-key
AGENTID_BASE_URL=https://agentid.dev/api
```

```typescript
import { AgentID } from '@agentid/sdk';

// Will use environment variables automatically
const client = new AgentID();
```

## Browser Usage

The SDK works in browser environments:

```typescript
import { AgentID } from '@agentid/sdk';

// In browser, pass credential to backend for verification
// Never expose API keys in client-side code

const client = new AgentID({
  baseUrl: '/api/agentid-proxy', // Your backend proxy
});

const result = await client.verify({ credentialId: 'uuid' });
```

## React Hook Example

```typescript
// hooks/useAgentVerification.ts
import { useState, useEffect } from 'react';
import { AgentID, VerificationResult } from '@agentid/sdk';

export function useAgentVerification(credentialId: string) {
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const verify = async () => {
      try {
        const client = new AgentID({ apiKey: process.env.NEXT_PUBLIC_AGENTID_KEY! });
        const verificationResult = await client.verify({ credentialId });
        setResult(verificationResult);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [credentialId]);

  return { result, loading, error };
}
```

## Examples

See the [examples directory](../sdks/typescript/examples/) for complete working examples:

- `basic-verification.ts` - Simple verification flow
- `express-protected.ts` - Protected Express.js endpoints
- `nextjs-middleware.ts` - Next.js API protection
- `batch-processing.ts` - Processing multiple credentials
- `react-component.tsx` - React verification component
