/**
 * AgentID TypeScript SDK
 *
 * Identity and authorization for AI agents.
 *
 * @example
 * ```typescript
 * import { AgentCredential } from '@agentid/sdk';
 *
 * // Create credential
 * const cred = new AgentCredential('cred_xxx');
 *
 * // Make authenticated request
 * const response = await cred.fetch('https://api.example.com/data');
 * ```
 *
 * @example
 * ```typescript
 * // For services verifying credentials
 * import { CredentialVerifier, checkPermission } from '@agentid/sdk';
 *
 * const verifier = new CredentialVerifier();
 * const result = await verifier.verifyRequest({
 *   headers: request.headers,
 *   method: 'GET',
 *   url: request.url,
 * });
 *
 * if (result.valid) {
 *   console.log(`Request from: ${result.credential.agent_name}`);
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Express middleware
 * import { agentIDMiddleware } from '@agentid/sdk/express';
 *
 * app.use('/api', agentIDMiddleware({
 *   required: true,
 *   minTrustScore: 50,
 * }));
 * ```
 *
 * @packageDocumentation
 */

// Core
export { AgentCredential, agentFetch } from './credential';
export { CredentialVerifier, checkPermission } from './verifier';

// Cache
export { MemoryCache, getGlobalCache, setGlobalCache } from './cache';

// Signature
export {
  RequestSigner,
  generateRequestSignature,
  verifyRequestSignature,
  generateNonce,
  canonicalJson,
} from './signature';

// Revocation
export {
  RevocationSubscriber,
  createRevocationAwareCache,
} from './revocation';

export type {
  RevocationEvent,
  RevocationSubscriberOptions,
  ConnectionState,
} from './revocation';

// Registry
export { AgentRegistry, createRegistry } from './registry';

export type {
  AgentRegistrationOptions,
  AgentSearchOptions,
  AgentProfile,
  AgentSearchResult,
  Category,
  RegistryOptions,
} from './registry';

// A2A Protocol
export { A2AClient, createA2AClient } from './a2a';

export type {
  A2AMessageType,
  A2AMessageContent,
  A2AConversation,
  A2AMessage,
  A2AAuthorizationRequest,
  A2AClientOptions,
  StartConversationOptions,
  SendMessageOptions,
  RequestAuthorizationOptions,
  RespondToAuthorizationOptions,
  ConversationStatus,
  AuthorizationStatus,
} from './a2a';

// Errors
export {
  AgentIDError,
  AuthenticationError,
  CredentialExpiredError,
  CredentialInvalidError,
  CredentialNotFoundError,
  CredentialRevokedError,
  NetworkError,
  RateLimitError,
  SignatureError,
} from './errors';

// Types
export type {
  AgentCredentialOptions,
  AgentIDHeaders,
  AgentInfo,
  CredentialCache,
  CredentialConstraints,
  CredentialPayload,
  CredentialStatus,
  IssuerInfo,
  MiddlewareOptions,
  Permission,
  PermissionCheckResult,
  PermissionConditions,
  PermissionContext,
  ReputationInfo,
  VerificationResult,
  VerifierOptions,
} from './types';
