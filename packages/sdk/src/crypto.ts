/**
 * Cryptographic utilities for AgentID SDK
 * Uses Ed25519 for signature verification
 */

import * as ed from '@noble/ed25519';

/**
 * Create canonical JSON with sorted keys for deterministic hashing
 * This ensures the same payload always produces the same signature
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
 * Decode a base64 string to Uint8Array
 */
export function base64Decode(str: string): Uint8Array {
  // Handle both browser and Node.js environments
  if (typeof atob === 'function') {
    const binary = atob(str);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } else {
    // Node.js fallback
    return new Uint8Array(Buffer.from(str, 'base64'));
  }
}

/**
 * Encode a Uint8Array to base64 string
 */
export function base64Encode(bytes: Uint8Array): string {
  // Handle both browser and Node.js environments
  if (typeof btoa === 'function') {
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  } else {
    // Node.js fallback
    return Buffer.from(bytes).toString('base64');
  }
}

/**
 * Verify an Ed25519 signature
 *
 * @param payload - The credential payload (with signature included)
 * @param publicKey - The issuer's public key (base64 encoded)
 * @returns true if signature is valid, false otherwise
 */
export async function verifySignature(
  payload: Record<string, unknown>,
  publicKey: string
): Promise<boolean> {
  try {
    // Extract signature from payload
    const { signature, ...payloadWithoutSignature } = payload;
    if (!signature || typeof signature !== 'string') {
      return false;
    }

    // Recreate message that was signed (canonical JSON for deterministic comparison)
    const message = new TextEncoder().encode(canonicalJson(payloadWithoutSignature));

    // Decode signature and public key from base64
    const signatureBytes = base64Decode(signature);
    const publicKeyBytes = base64Decode(publicKey);

    // Verify using Ed25519
    const isValid = await ed.verifyAsync(signatureBytes, message, publicKeyBytes);
    return isValid;
  } catch {
    return false;
  }
}
