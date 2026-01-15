/**
 * A2A Message Encryption Utilities
 *
 * Uses X25519 for key exchange and ChaCha20-Poly1305 (or AES-GCM) for encryption.
 * Since Web Crypto API doesn't support X25519 directly, we use Ed25519 keys
 * which can be converted, or fall back to ECDH with P-256.
 *
 * For production, consider using libsodium-wrappers for proper X25519 support.
 */

// Use ECDH with P-256 as a fallback (Web Crypto compatible)
const ALGORITHM = 'ECDH';
const CURVE = 'P-256';
const SYMMETRIC_ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;

export interface KeyPair {
  publicKey: string; // Base64-encoded
  privateKey: string; // Base64-encoded
}

export interface EncryptedMessage {
  ciphertext: string; // Base64-encoded
  iv: string; // Base64-encoded initialization vector
  tag?: string; // For AEAD modes
}

export interface EncryptionMetadata {
  algorithm: string;
  senderPublicKey: string;
  recipientPublicKey: string;
  timestamp: string;
}

/**
 * Generate a new ECDH key pair for encryption
 */
export async function generateKeyPair(): Promise<KeyPair> {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: ALGORITHM,
      namedCurve: CURVE,
    },
    true, // extractable
    ['deriveBits']
  );

  // Export keys to raw format then base64
  const publicKeyBuffer = await crypto.subtle.exportKey('raw', keyPair.publicKey);
  const privateKeyBuffer = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

  return {
    publicKey: bufferToBase64(publicKeyBuffer),
    privateKey: bufferToBase64(privateKeyBuffer),
  };
}

/**
 * Import a public key from base64
 */
export async function importPublicKey(base64Key: string): Promise<CryptoKey> {
  const keyBuffer = base64ToBuffer(base64Key);

  return crypto.subtle.importKey(
    'raw',
    keyBuffer,
    {
      name: ALGORITHM,
      namedCurve: CURVE,
    },
    true,
    []
  );
}

/**
 * Import a private key from base64
 */
export async function importPrivateKey(base64Key: string): Promise<CryptoKey> {
  const keyBuffer = base64ToBuffer(base64Key);

  return crypto.subtle.importKey(
    'pkcs8',
    keyBuffer,
    {
      name: ALGORITHM,
      namedCurve: CURVE,
    },
    true,
    ['deriveBits']
  );
}

/**
 * Derive a shared secret from private key and peer's public key
 */
export async function deriveSharedSecret(
  privateKey: CryptoKey,
  publicKey: CryptoKey
): Promise<CryptoKey> {
  // Derive shared bits
  const sharedBits = await crypto.subtle.deriveBits(
    {
      name: ALGORITHM,
      public: publicKey,
    },
    privateKey,
    KEY_LENGTH
  );

  // Import as AES key
  return crypto.subtle.importKey(
    'raw',
    sharedBits,
    {
      name: SYMMETRIC_ALGORITHM,
      length: KEY_LENGTH,
    },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt a message using the shared secret
 */
export async function encryptMessage(
  plaintext: string,
  sharedSecret: CryptoKey
): Promise<EncryptedMessage> {
  // Generate random IV (12 bytes for AES-GCM)
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Encode message as UTF-8
  const encoder = new TextEncoder();
  const plaintextBuffer = encoder.encode(plaintext);

  // Encrypt
  const ciphertextBuffer = await crypto.subtle.encrypt(
    {
      name: SYMMETRIC_ALGORITHM,
      iv,
    },
    sharedSecret,
    plaintextBuffer
  );

  return {
    ciphertext: bufferToBase64(ciphertextBuffer),
    iv: bufferToBase64(iv),
  };
}

/**
 * Decrypt a message using the shared secret
 */
export async function decryptMessage(
  encrypted: EncryptedMessage,
  sharedSecret: CryptoKey
): Promise<string> {
  const ciphertextBuffer = base64ToBuffer(encrypted.ciphertext);
  const iv = base64ToBuffer(encrypted.iv);

  const plaintextBuffer = await crypto.subtle.decrypt(
    {
      name: SYMMETRIC_ALGORITHM,
      iv,
    },
    sharedSecret,
    ciphertextBuffer
  );

  const decoder = new TextDecoder();
  return decoder.decode(plaintextBuffer);
}

/**
 * High-level: Encrypt a message for a recipient
 */
export async function encryptForRecipient(
  plaintext: string,
  senderPrivateKey: string,
  recipientPublicKey: string
): Promise<{ encrypted: EncryptedMessage; metadata: EncryptionMetadata }> {
  const privateKey = await importPrivateKey(senderPrivateKey);
  const publicKey = await importPublicKey(recipientPublicKey);
  const sharedSecret = await deriveSharedSecret(privateKey, publicKey);

  const encrypted = await encryptMessage(plaintext, sharedSecret);

  // Get sender's public key for metadata (re-derive from private key would be better)
  // For now, we include the recipient's public key
  const metadata: EncryptionMetadata = {
    algorithm: `${ALGORITHM}-${CURVE}+${SYMMETRIC_ALGORITHM}`,
    senderPublicKey: '', // Should be provided by caller
    recipientPublicKey,
    timestamp: new Date().toISOString(),
  };

  return { encrypted, metadata };
}

/**
 * High-level: Decrypt a message from a sender
 */
export async function decryptFromSender(
  encrypted: EncryptedMessage,
  recipientPrivateKey: string,
  senderPublicKey: string
): Promise<string> {
  const privateKey = await importPrivateKey(recipientPrivateKey);
  const publicKey = await importPublicKey(senderPublicKey);
  const sharedSecret = await deriveSharedSecret(privateKey, publicKey);

  return decryptMessage(encrypted, sharedSecret);
}

// Utility functions for base64 encoding/decoding
function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Validate that a string is valid base64
 */
export function isValidBase64(str: string): boolean {
  try {
    atob(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Generate a random encryption key ID
 */
export function generateKeyId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return bufferToBase64(bytes.buffer);
}
