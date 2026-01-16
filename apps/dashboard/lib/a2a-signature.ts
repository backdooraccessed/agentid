/**
 * A2A Message Signature Verification
 *
 * Verifies Ed25519 signatures on A2A messages to ensure:
 * 1. Message authenticity - the sender is who they claim to be
 * 2. Message integrity - the content hasn't been tampered with
 * 3. Non-repudiation - sender cannot deny sending the message
 */

import * as ed from '@noble/ed25519';
import { createClient } from '@supabase/supabase-js';

// Service client for internal operations
function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * The message structure that gets signed by the sender.
 * Order matters - this must match what the client signs.
 */
export interface SignedMessageData {
  content: Record<string, unknown>;
  timestamp: number;
  nonce: string;
  conversation_id: string;
  message_type: string;
}

/**
 * Create canonical JSON with sorted keys for deterministic signing/verification.
 * This ensures the same object always produces the same string regardless of
 * property insertion order.
 */
export function canonicalJson(obj: unknown): string {
  if (obj === null || obj === undefined) {
    return JSON.stringify(obj);
  }
  if (typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalJson).join(',') + ']';
  }
  const keys = Object.keys(obj as Record<string, unknown>).sort();
  const pairs = keys.map(
    (key) => JSON.stringify(key) + ':' + canonicalJson((obj as Record<string, unknown>)[key])
  );
  return '{' + pairs.join(',') + '}';
}

/**
 * Decode base64 string to ArrayBuffer
 */
function base64DecodeToBuffer(str: string): ArrayBuffer {
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer as ArrayBuffer;
}

export interface VerifySignatureResult {
  valid: boolean;
  error?: string;
  issuer_id?: string;
  public_key?: string;
}

/**
 * Verify an A2A message signature.
 *
 * @param params.senderCredentialId - The credential ID of the message sender
 * @param params.conversationId - The conversation this message belongs to
 * @param params.messageType - Type of message (text, request, response, etc.)
 * @param params.content - The message content object
 * @param params.signature - Base64-encoded Ed25519 signature
 * @param params.signatureTimestamp - Unix timestamp when the message was signed
 * @param params.nonce - Unique nonce for replay protection
 *
 * @returns Object with `valid` boolean and optional `error` message
 */
export async function verifyA2AMessageSignature(params: {
  senderCredentialId: string;
  conversationId: string;
  messageType: string;
  content: Record<string, unknown>;
  signature: string;
  signatureTimestamp: number;
  nonce: string;
}): Promise<VerifySignatureResult> {
  const {
    senderCredentialId,
    conversationId,
    messageType,
    content,
    signature,
    signatureTimestamp,
    nonce,
  } = params;

  try {
    // Step 1: Look up the sender credential's issuer public key
    const supabase = getServiceSupabase();
    const { data: credential, error: credError } = await supabase
      .from('credentials')
      .select(`
        id,
        status,
        issuer_id,
        issuers!inner (
          id,
          public_key,
          is_verified
        )
      `)
      .eq('id', senderCredentialId)
      .single();

    if (credError || !credential) {
      return {
        valid: false,
        error: 'Sender credential not found',
      };
    }

    // Step 2: Check credential is active
    if (credential.status !== 'active') {
      return {
        valid: false,
        error: `Sender credential is not active (status: ${credential.status})`,
      };
    }

    // Step 3: Get issuer public key
    // Supabase returns the joined issuer as an object (not array) due to !inner join
    const issuer = credential.issuers as unknown as { id: string; public_key: string; is_verified: boolean };
    const publicKey = issuer.public_key;

    if (!publicKey) {
      return {
        valid: false,
        error: 'Issuer public key not found',
      };
    }

    // Step 4: Reconstruct the signed message
    // The sender must sign this exact structure
    const signedData: SignedMessageData = {
      content,
      timestamp: signatureTimestamp,
      nonce,
      conversation_id: conversationId,
      message_type: messageType,
    };

    const message = new TextEncoder().encode(canonicalJson(signedData));

    // Step 5: Decode signature and public key from base64
    let signatureBytes: Uint8Array;
    let publicKeyBytes: Uint8Array;

    try {
      signatureBytes = new Uint8Array(base64DecodeToBuffer(signature));
    } catch {
      return {
        valid: false,
        error: 'Invalid signature format (not valid base64)',
      };
    }

    try {
      publicKeyBytes = new Uint8Array(base64DecodeToBuffer(publicKey));
    } catch {
      return {
        valid: false,
        error: 'Invalid public key format',
      };
    }

    // Step 6: Verify Ed25519 signature
    const isValid = await ed.verifyAsync(signatureBytes, message, publicKeyBytes);

    if (!isValid) {
      return {
        valid: false,
        error: 'Signature verification failed - message may have been tampered with or sender is impersonating',
        issuer_id: issuer.id,
        public_key: publicKey,
      };
    }

    return {
      valid: true,
      issuer_id: issuer.id,
      public_key: publicKey,
    };
  } catch (error) {
    console.error('A2A signature verification error:', error);
    return {
      valid: false,
      error: 'Internal error during signature verification',
    };
  }
}

/**
 * Verify an A2A authorization request signature.
 *
 * Authorization requests have a different structure than messages.
 */
export async function verifyA2AAuthorizationSignature(params: {
  requesterCredentialId: string;
  grantorCredentialId: string;
  requestedPermissions: unknown[];
  scope?: string;
  constraints?: Record<string, unknown>;
  validUntil?: string;
  signature: string;
}): Promise<VerifySignatureResult> {
  const {
    requesterCredentialId,
    grantorCredentialId,
    requestedPermissions,
    scope,
    constraints,
    validUntil,
    signature,
  } = params;

  try {
    // Look up the requester credential's issuer public key
    const supabase = getServiceSupabase();
    const { data: credential, error: credError } = await supabase
      .from('credentials')
      .select(`
        id,
        status,
        issuer_id,
        issuers!inner (
          id,
          public_key,
          is_verified
        )
      `)
      .eq('id', requesterCredentialId)
      .single();

    if (credError || !credential) {
      return {
        valid: false,
        error: 'Requester credential not found',
      };
    }

    if (credential.status !== 'active') {
      return {
        valid: false,
        error: `Requester credential is not active (status: ${credential.status})`,
      };
    }

    const issuer = credential.issuers as unknown as { id: string; public_key: string; is_verified: boolean };
    const publicKey = issuer.public_key;

    if (!publicKey) {
      return {
        valid: false,
        error: 'Issuer public key not found',
      };
    }

    // Reconstruct the signed authorization request
    // Must match what the client signs
    const signedData = {
      requester_credential_id: requesterCredentialId,
      grantor_credential_id: grantorCredentialId,
      requested_permissions: requestedPermissions,
      scope: scope || null,
      constraints: constraints || null,
      valid_until: validUntil || null,
    };

    const message = new TextEncoder().encode(canonicalJson(signedData));

    let signatureBytes: Uint8Array;
    let publicKeyBytes: Uint8Array;

    try {
      signatureBytes = new Uint8Array(base64DecodeToBuffer(signature));
    } catch {
      return {
        valid: false,
        error: 'Invalid signature format (not valid base64)',
      };
    }

    try {
      publicKeyBytes = new Uint8Array(base64DecodeToBuffer(publicKey));
    } catch {
      return {
        valid: false,
        error: 'Invalid public key format',
      };
    }

    const isValid = await ed.verifyAsync(signatureBytes, message, publicKeyBytes);

    if (!isValid) {
      return {
        valid: false,
        error: 'Authorization request signature verification failed',
        issuer_id: issuer.id,
        public_key: publicKey,
      };
    }

    return {
      valid: true,
      issuer_id: issuer.id,
      public_key: publicKey,
    };
  } catch (error) {
    console.error('A2A authorization signature verification error:', error);
    return {
      valid: false,
      error: 'Internal error during signature verification',
    };
  }
}

/**
 * Verify an A2A authorization response signature.
 *
 * The grantor signs their response (approve/deny).
 */
export async function verifyA2AAuthorizationResponseSignature(params: {
  grantorCredentialId: string;
  authorizationId: string;
  approved: boolean;
  signature: string;
}): Promise<VerifySignatureResult> {
  const {
    grantorCredentialId,
    authorizationId,
    approved,
    signature,
  } = params;

  try {
    const supabase = getServiceSupabase();
    const { data: credential, error: credError } = await supabase
      .from('credentials')
      .select(`
        id,
        status,
        issuer_id,
        issuers!inner (
          id,
          public_key,
          is_verified
        )
      `)
      .eq('id', grantorCredentialId)
      .single();

    if (credError || !credential) {
      return {
        valid: false,
        error: 'Grantor credential not found',
      };
    }

    if (credential.status !== 'active') {
      return {
        valid: false,
        error: `Grantor credential is not active (status: ${credential.status})`,
      };
    }

    const issuer = credential.issuers as unknown as { id: string; public_key: string; is_verified: boolean };
    const publicKey = issuer.public_key;

    if (!publicKey) {
      return {
        valid: false,
        error: 'Issuer public key not found',
      };
    }

    // Reconstruct the signed response
    const signedData = {
      authorization_id: authorizationId,
      grantor_credential_id: grantorCredentialId,
      approved,
    };

    const message = new TextEncoder().encode(canonicalJson(signedData));

    let signatureBytes: Uint8Array;
    let publicKeyBytes: Uint8Array;

    try {
      signatureBytes = new Uint8Array(base64DecodeToBuffer(signature));
    } catch {
      return {
        valid: false,
        error: 'Invalid signature format (not valid base64)',
      };
    }

    try {
      publicKeyBytes = new Uint8Array(base64DecodeToBuffer(publicKey));
    } catch {
      return {
        valid: false,
        error: 'Invalid public key format',
      };
    }

    const isValid = await ed.verifyAsync(signatureBytes, message, publicKeyBytes);

    if (!isValid) {
      return {
        valid: false,
        error: 'Authorization response signature verification failed',
        issuer_id: issuer.id,
        public_key: publicKey,
      };
    }

    return {
      valid: true,
      issuer_id: issuer.id,
      public_key: publicKey,
    };
  } catch (error) {
    console.error('A2A authorization response signature verification error:', error);
    return {
      valid: false,
      error: 'Internal error during signature verification',
    };
  }
}
