# @agentid/sdk

JavaScript SDK for verifying AI agent credentials issued by AgentID.

## Installation

```bash
npm install @agentid/sdk
# or
pnpm add @agentid/sdk
# or
yarn add @agentid/sdk
```

## Quick Start

```typescript
import { AgentIDClient } from '@agentid/sdk';

const client = new AgentIDClient();

// Verify a credential by ID
const result = await client.verify({ credential_id: 'credential-uuid' });

if (result.valid) {
  console.log('Agent verified:', result.credential.agent_name);
  console.log('Permissions:', result.credential.permissions);
} else {
  console.error('Verification failed:', result.error.code, result.error.message);
}
```

## API Reference

### AgentIDClient

The main client for online credential verification.

```typescript
import { AgentIDClient } from '@agentid/sdk';

const client = new AgentIDClient({
  baseUrl: 'https://agentid.vercel.app', // optional, this is the default
  timeout: 5000, // optional, request timeout in ms
});
```

#### client.verify(options)

Verify a credential online.

```typescript
// Verify by credential ID
const result = await client.verify({
  credential_id: 'uuid',
});

// Or verify a full credential payload
const result = await client.verify({
  credential: credentialPayload,
});
```

**Returns:** `Promise<VerifyResult>`

```typescript
interface VerifyResult {
  valid: boolean;
  credential?: {
    agent_id: string;
    agent_name: string;
    agent_type: AgentType;
    issuer: IssuerInfo;
    permissions: Record<string, unknown>;
    valid_until: string;
  };
  error?: {
    code: ErrorCode;
    message: string;
    request_id: string;
  };
  verification_time_ms: number;
}
```

#### client.verifyOffline(credential, options)

Verify a credential offline using the issuer's public key.

```typescript
const result = await client.verifyOffline(credential, {
  issuerPublicKey: 'base64-encoded-public-key',
});
```

> **Note:** Offline verification cannot check revocation status. For revocation checking, use `verify()` instead.

### Standalone Verification

For offline-only scenarios, you can use the standalone `verifyCredential` function:

```typescript
import { verifyCredential } from '@agentid/sdk';

const result = await verifyCredential(credential, {
  issuerPublicKey: 'base64-encoded-public-key',
});
```

## Error Handling

The SDK provides typed error classes for each error code:

```typescript
import {
  AgentIDError,
  CredentialNotFoundError,
  CredentialExpiredError,
  InvalidSignatureError,
  NetworkError,
  TimeoutError,
} from '@agentid/sdk';

try {
  const result = await client.verify({ credential_id: 'uuid' });

  if (!result.valid) {
    // Handle verification failure (credential issue, not network issue)
    console.error(result.error.code, result.error.message);
  }
} catch (error) {
  if (error instanceof TimeoutError) {
    console.error('Request timed out');
  } else if (error instanceof NetworkError) {
    console.error('Network error:', error.message);
  } else {
    throw error;
  }
}
```

### Error Codes

| Code | Description |
|------|-------------|
| `INVALID_REQUEST` | Malformed request |
| `MISSING_INPUT` | Neither credential_id nor credential provided |
| `CREDENTIAL_NOT_FOUND` | Credential does not exist |
| `CREDENTIAL_REVOKED` | Credential has been revoked |
| `CREDENTIAL_EXPIRED` | Credential validity period has ended |
| `CREDENTIAL_NOT_YET_VALID` | Credential validity period has not started |
| `INVALID_SIGNATURE` | Cryptographic signature verification failed |
| `ISSUER_NOT_FOUND` | Credential issuer not found |
| `INTERNAL_ERROR` | Server-side error |
| `NETWORK_ERROR` | Network connectivity issue |
| `TIMEOUT_ERROR` | Request exceeded timeout |

## Framework Integration

### Express Middleware

```typescript
import { AgentIDClient } from '@agentid/sdk';

const agentid = new AgentIDClient();

// Middleware to verify agent credentials
const verifyAgent = async (req, res, next) => {
  const credentialHeader = req.headers['x-agent-credential'];

  if (!credentialHeader) {
    return res.status(401).json({ error: 'Missing agent credential' });
  }

  try {
    const credential = JSON.parse(credentialHeader);
    const result = await agentid.verify({ credential });

    if (!result.valid) {
      return res.status(403).json({
        error: 'Invalid credential',
        code: result.error.code,
      });
    }

    // Attach verified credential to request
    req.agent = result.credential;
    next();
  } catch (error) {
    return res.status(400).json({ error: 'Invalid credential format' });
  }
};

// Use the middleware
app.post('/api/agents/action', verifyAgent, (req, res) => {
  console.log('Agent:', req.agent.agent_name);
  // Handle agent action...
});
```

### Next.js API Route

```typescript
import { AgentIDClient } from '@agentid/sdk';

const agentid = new AgentIDClient();

export async function POST(request: Request) {
  const credentialId = request.headers.get('x-agent-credential-id');

  if (!credentialId) {
    return Response.json({ error: 'Missing credential' }, { status: 401 });
  }

  const result = await agentid.verify({ credential_id: credentialId });

  if (!result.valid) {
    return Response.json({ error: result.error }, { status: 403 });
  }

  // Agent is verified, proceed with action
  return Response.json({ success: true, agent: result.credential.agent_name });
}
```

## Crypto Utilities

For advanced use cases, the SDK exports low-level crypto utilities:

```typescript
import { verifySignature, canonicalJson, base64Decode, base64Encode } from '@agentid/sdk';

// Manually verify a signature
const isValid = await verifySignature(payload, publicKey);

// Create canonical JSON (sorted keys, deterministic)
const canonical = canonicalJson({ b: 2, a: 1 }); // '{"a":1,"b":2}'
```

## TypeScript Support

The SDK is written in TypeScript and exports all types:

```typescript
import type {
  CredentialPayload,
  VerifyResult,
  AgentType,
  ErrorCode,
} from '@agentid/sdk';
```

## Requirements

- Node.js 18+ (for `fetch` and `AbortSignal.timeout`)
- Or modern browser with Fetch API support

## License

MIT
