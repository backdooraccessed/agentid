/**
 * A2A (Agent-to-Agent) Communication Utilities
 *
 * Provides helpers for:
 * - Signing A2A messages
 * - Signing authorization requests/responses
 * - Generating nonces
 * - Creating properly formatted payloads
 */

import * as ed from '@noble/ed25519';
import { canonicalJson, base64Encode, base64Decode } from './crypto';

// =============================================================================
// TYPES
// =============================================================================

export type A2AMessageType = 'text' | 'request' | 'response' | 'authorization' | 'data' | 'error';

export interface A2APermission {
  action: string;
  resource?: string;
  constraints?: {
    time_window?: string;
    allowed_days?: string[];
    allowed_regions?: string[];
    rate_limit_per_minute?: number;
    rate_limit_per_day?: number;
    custom?: Record<string, unknown>;
  };
}

export interface A2ASignedMessage {
  content: Record<string, unknown>;
  signature: string;
  signature_timestamp: number;
  nonce: string;
  message_type: A2AMessageType;
}

export interface A2ASignedAuthorization {
  requester_credential_id: string;
  grantor_credential_id: string;
  requested_permissions: A2APermission[];
  scope: string | null;
  constraints: Record<string, unknown> | null;
  valid_until: string | null;
  signature: string;
}

export interface A2ASignedAuthorizationResponse {
  authorization_id: string;
  grantor_credential_id: string;
  approved: boolean;
  signature: string;
}

// =============================================================================
// NONCE GENERATION
// =============================================================================

/**
 * Generate a cryptographically secure nonce for replay protection
 */
export function generateNonce(): string {
  const bytes = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    // Node.js fallback
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const nodeCrypto = require('crypto');
    const randomBytes = nodeCrypto.randomBytes(16);
    bytes.set(randomBytes);
  }
  return base64Encode(bytes);
}

/**
 * Get current Unix timestamp in seconds
 */
export function getCurrentTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}

// =============================================================================
// MESSAGE SIGNING
// =============================================================================

/**
 * Data structure for A2A message signing
 */
interface MessageSigningData {
  content: Record<string, unknown>;
  timestamp: number;
  nonce: string;
  conversation_id: string;
  message_type: A2AMessageType;
}

/**
 * Sign an A2A message
 *
 * @param params.content - The message content
 * @param params.conversationId - The conversation ID
 * @param params.messageType - Type of message
 * @param params.privateKey - The sender's private key (base64 Ed25519)
 *
 * @example
 * ```typescript
 * const signedMessage = await signMessage({
 *   content: { text: 'Hello agent!' },
 *   conversationId: 'conv-uuid',
 *   messageType: 'text',
 *   privateKey: 'base64-private-key',
 * });
 *
 * // Send to API
 * await fetch('/api/a2a/conversations/conv-uuid/messages', {
 *   method: 'POST',
 *   body: JSON.stringify({
 *     sender_credential_id: 'my-credential-id',
 *     ...signedMessage,
 *   }),
 * });
 * ```
 */
export async function signMessage(params: {
  content: Record<string, unknown>;
  conversationId: string;
  messageType?: A2AMessageType;
  privateKey: string;
}): Promise<A2ASignedMessage> {
  const { content, conversationId, messageType = 'text', privateKey } = params;

  const timestamp = getCurrentTimestamp();
  const nonce = generateNonce();

  const signingData: MessageSigningData = {
    content,
    timestamp,
    nonce,
    conversation_id: conversationId,
    message_type: messageType,
  };

  const message = new TextEncoder().encode(canonicalJson(signingData));
  const privateKeyBytes = base64Decode(privateKey);
  const signatureBytes = await ed.signAsync(message, privateKeyBytes);
  const signature = base64Encode(new Uint8Array(signatureBytes));

  return {
    content,
    signature,
    signature_timestamp: timestamp,
    nonce,
    message_type: messageType,
  };
}

// =============================================================================
// AUTHORIZATION SIGNING
// =============================================================================

/**
 * Sign an A2A authorization request
 *
 * @example
 * ```typescript
 * const signedAuth = await signAuthorizationRequest({
 *   requesterCredentialId: 'my-credential-id',
 *   grantorCredentialId: 'target-credential-id',
 *   requestedPermissions: [
 *     { action: 'data.read' },
 *     { action: 'data.write', constraints: { rate_limit_per_minute: 100 } },
 *   ],
 *   privateKey: 'base64-private-key',
 * });
 *
 * // Send to API
 * await fetch('/api/a2a/authorizations', {
 *   method: 'POST',
 *   body: JSON.stringify(signedAuth),
 * });
 * ```
 */
export async function signAuthorizationRequest(params: {
  requesterCredentialId: string;
  grantorCredentialId: string;
  requestedPermissions: A2APermission[];
  scope?: string;
  constraints?: Record<string, unknown>;
  validUntil?: string;
  privateKey: string;
}): Promise<A2ASignedAuthorization> {
  const {
    requesterCredentialId,
    grantorCredentialId,
    requestedPermissions,
    scope,
    constraints,
    validUntil,
    privateKey,
  } = params;

  const signingData = {
    requester_credential_id: requesterCredentialId,
    grantor_credential_id: grantorCredentialId,
    requested_permissions: requestedPermissions,
    scope: scope || null,
    constraints: constraints || null,
    valid_until: validUntil || null,
  };

  const message = new TextEncoder().encode(canonicalJson(signingData));
  const privateKeyBytes = base64Decode(privateKey);
  const signatureBytes = await ed.signAsync(message, privateKeyBytes);
  const signature = base64Encode(new Uint8Array(signatureBytes));

  return {
    ...signingData,
    signature,
  };
}

/**
 * Sign an A2A authorization response
 *
 * @example
 * ```typescript
 * const signedResponse = await signAuthorizationResponse({
 *   authorizationId: 'auth-uuid',
 *   grantorCredentialId: 'my-credential-id',
 *   approved: true,
 *   privateKey: 'base64-private-key',
 * });
 *
 * // Send to API
 * await fetch('/api/a2a/authorizations/auth-uuid', {
 *   method: 'POST',
 *   body: JSON.stringify(signedResponse),
 * });
 * ```
 */
export async function signAuthorizationResponse(params: {
  authorizationId: string;
  grantorCredentialId: string;
  approved: boolean;
  privateKey: string;
}): Promise<A2ASignedAuthorizationResponse> {
  const { authorizationId, grantorCredentialId, approved, privateKey } = params;

  const signingData = {
    authorization_id: authorizationId,
    grantor_credential_id: grantorCredentialId,
    approved,
  };

  const message = new TextEncoder().encode(canonicalJson(signingData));
  const privateKeyBytes = base64Decode(privateKey);
  const signatureBytes = await ed.signAsync(message, privateKeyBytes);
  const signature = base64Encode(new Uint8Array(signatureBytes));

  return {
    ...signingData,
    signature,
  };
}

// =============================================================================
// KEY GENERATION
// =============================================================================

/**
 * Generate an Ed25519 key pair for signing
 *
 * @returns Object with base64-encoded public and private keys
 *
 * @example
 * ```typescript
 * const keyPair = await generateSigningKeyPair();
 * // Store privateKey securely, register publicKey with AgentID
 * ```
 */
export async function generateSigningKeyPair(): Promise<{
  publicKey: string;
  privateKey: string;
}> {
  const privateKeyBytes = ed.utils.randomPrivateKey();
  const publicKeyBytes = await ed.getPublicKeyAsync(privateKeyBytes);

  return {
    publicKey: base64Encode(new Uint8Array(publicKeyBytes)),
    privateKey: base64Encode(new Uint8Array(privateKeyBytes)),
  };
}

/**
 * Get public key from private key
 */
export async function getPublicKey(privateKey: string): Promise<string> {
  const privateKeyBytes = base64Decode(privateKey);
  const publicKeyBytes = await ed.getPublicKeyAsync(privateKeyBytes);
  return base64Encode(new Uint8Array(publicKeyBytes));
}

// =============================================================================
// VERIFICATION (client-side)
// =============================================================================

/**
 * Verify an A2A message signature (client-side)
 *
 * Useful for verifying messages received from other agents.
 */
export async function verifyMessageSignature(params: {
  content: Record<string, unknown>;
  signature: string;
  signatureTimestamp: number;
  nonce: string;
  conversationId: string;
  messageType: A2AMessageType;
  senderPublicKey: string;
}): Promise<boolean> {
  const {
    content,
    signature,
    signatureTimestamp,
    nonce,
    conversationId,
    messageType,
    senderPublicKey,
  } = params;

  try {
    const signingData: MessageSigningData = {
      content,
      timestamp: signatureTimestamp,
      nonce,
      conversation_id: conversationId,
      message_type: messageType,
    };

    const message = new TextEncoder().encode(canonicalJson(signingData));
    const signatureBytes = base64Decode(signature);
    const publicKeyBytes = base64Decode(senderPublicKey);

    return await ed.verifyAsync(signatureBytes, message, publicKeyBytes);
  } catch {
    return false;
  }
}

// =============================================================================
// ENCRYPTION HELPERS
// =============================================================================

/**
 * Generate an ECDH key pair for encryption
 *
 * Uses P-256 curve for Web Crypto API compatibility.
 */
export async function generateEncryptionKeyPair(): Promise<{
  publicKey: string;
  privateKey: string;
}> {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    throw new Error('Web Crypto API not available');
  }

  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'ECDH',
      namedCurve: 'P-256',
    },
    true,
    ['deriveBits']
  );

  const publicKeyBuffer = await crypto.subtle.exportKey('raw', keyPair.publicKey);
  const privateKeyBuffer = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

  return {
    publicKey: base64Encode(new Uint8Array(publicKeyBuffer)),
    privateKey: base64Encode(new Uint8Array(privateKeyBuffer)),
  };
}
