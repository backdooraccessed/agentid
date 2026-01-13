/**
 * AgentID SDK
 *
 * JavaScript SDK for verifying AI agent credentials issued by AgentID.
 *
 * @example
 * ```typescript
 * import { AgentIDClient } from '@agentid/sdk';
 *
 * const client = new AgentIDClient();
 *
 * // Verify a credential
 * const result = await client.verify({ credential_id: 'uuid' });
 *
 * if (result.valid) {
 *   console.log('Agent:', result.credential.agent_name);
 * }
 * ```
 *
 * @packageDocumentation
 */

// Main client
export { AgentIDClient } from './client';

// Standalone verification
export { verifyCredential } from './verify';

// Crypto utilities (for advanced use cases)
export {
  verifySignature,
  canonicalJson,
  base64Decode,
  base64Encode,
} from './crypto';

// Types
export type {
  // Client types
  ClientOptions,
  VerifyOptions,
  VerifyResult,
  OfflineVerifyOptions,
  // Batch verification types
  BatchVerifyOptions,
  BatchVerifyResult,
  BatchVerifyResultItem,
  // Credential types
  CredentialPayload,
  CredentialConstraints,
  VerifiedCredential,
  VerifyError,
  // Issuer types
  IssuerInfo,
  IssuerType,
  // Agent types
  AgentType,
  // Reputation types
  ReputationInfo,
  // Error types
  ErrorCode,
} from './types';

// Error classes
export {
  AgentIDError,
  InvalidRequestError,
  MissingInputError,
  CredentialNotFoundError,
  CredentialRevokedError,
  CredentialExpiredError,
  CredentialNotYetValidError,
  InvalidSignatureError,
  IssuerNotFoundError,
  InternalError,
  NetworkError,
  TimeoutError,
  createErrorFromCode,
} from './errors';
