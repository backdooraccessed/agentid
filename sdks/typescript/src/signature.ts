/**
 * Cryptographic signature utilities for AgentID
 */

import type { AgentIDHeaders } from './types';

/**
 * Convert object to canonical JSON string.
 * Keys are sorted alphabetically for consistent hashing.
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
 * Generate a cryptographically secure nonce
 */
export function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Compute SHA-256 hash
 */
async function sha256(message: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  return crypto.subtle.digest('SHA-256', data);
}

/**
 * Convert ArrayBuffer to base64
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

/**
 * Compute HMAC-SHA256
 */
async function hmacSha256(key: string, message: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  const messageData = encoder.encode(message);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  return crypto.subtle.sign('HMAC', cryptoKey, messageData);
}

export interface SignRequestOptions {
  method: string;
  url: string;
  body?: string | null;
  timestamp?: number;
  credentialId: string;
  secret?: string;
}

/**
 * Generate a signature for an HTTP request.
 */
export async function generateRequestSignature(options: SignRequestOptions): Promise<string> {
  const { method, url, body, timestamp = Math.floor(Date.now() / 1000), credentialId, secret } =
    options;

  // Compute body hash
  let bodyHash = '';
  if (body) {
    const hash = await sha256(body);
    bodyHash = arrayBufferToBase64(hash);
  }

  // Build signing string
  const signingString = `${method.toUpperCase()}\n${url}\n${timestamp}\n${credentialId}\n${bodyHash}`;

  // Generate signature
  let signature: ArrayBuffer;
  if (secret) {
    signature = await hmacSha256(secret, signingString);
  } else {
    signature = await sha256(signingString);
  }

  return arrayBufferToBase64(signature);
}

/**
 * Verify a request signature
 */
export async function verifyRequestSignature(
  signature: string,
  options: SignRequestOptions & { maxAgeSeconds?: number }
): Promise<boolean> {
  const { maxAgeSeconds = 300, timestamp = 0 } = options;

  // Check timestamp freshness
  const currentTime = Math.floor(Date.now() / 1000);
  if (Math.abs(currentTime - timestamp) > maxAgeSeconds) {
    return false;
  }

  // Generate expected signature
  const expected = await generateRequestSignature(options);

  // Constant-time comparison (best effort in JS)
  if (signature.length !== expected.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < signature.length; i++) {
    result |= signature.charCodeAt(i) ^ expected.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Request signer class for maintaining signing state
 */
export class RequestSigner {
  constructor(
    private readonly credentialId: string,
    private readonly signingSecret?: string
  ) {}

  /**
   * Sign a request and return headers to include
   */
  async signRequest(
    method: string,
    url: string,
    body?: string | null
  ): Promise<AgentIDHeaders> {
    const timestamp = Math.floor(Date.now() / 1000);
    const nonce = generateNonce();

    const signature = await generateRequestSignature({
      method,
      url,
      body,
      timestamp,
      credentialId: this.credentialId,
      secret: this.signingSecret,
    });

    return {
      'X-AgentID-Credential': this.credentialId,
      'X-AgentID-Timestamp': String(timestamp),
      'X-AgentID-Nonce': nonce,
      'X-AgentID-Signature': signature,
    };
  }
}
