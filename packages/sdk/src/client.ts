/**
 * AgentID Client for online credential verification
 */

import type {
  ClientOptions,
  VerifyOptions,
  VerifyResult,
  CredentialPayload,
  OfflineVerifyOptions,
} from './types';
import { NetworkError, TimeoutError } from './errors';
import { verifyCredential } from './verify';

const DEFAULT_BASE_URL = 'https://agentid.vercel.app';
const DEFAULT_TIMEOUT = 5000;

/**
 * AgentID Client for verifying AI agent credentials
 *
 * @example
 * ```typescript
 * import { AgentIDClient } from '@agentid/sdk';
 *
 * const client = new AgentIDClient();
 *
 * // Verify by credential ID
 * const result = await client.verify({ credential_id: 'uuid' });
 *
 * if (result.valid) {
 *   console.log('Agent:', result.credential.agent_name);
 *   console.log('Permissions:', result.credential.permissions);
 * } else {
 *   console.error('Invalid:', result.error.code);
 * }
 * ```
 */
export class AgentIDClient {
  private readonly baseUrl: string;
  private readonly timeout: number;

  /**
   * Create a new AgentID client
   *
   * @param options - Client configuration options
   */
  constructor(options: ClientOptions = {}) {
    this.baseUrl = options.baseUrl || DEFAULT_BASE_URL;
    this.timeout = options.timeout || DEFAULT_TIMEOUT;
  }

  /**
   * Verify a credential online
   *
   * Supports two verification modes:
   * 1. By credential_id - Looks up the credential in AgentID and verifies it
   * 2. By credential payload - Verifies the provided credential against AgentID
   *
   * @param options - Verification options (credential_id or credential)
   * @returns Verification result
   *
   * @example
   * ```typescript
   * // Verify by ID
   * const result = await client.verify({ credential_id: 'uuid' });
   *
   * // Verify full payload
   * const result = await client.verify({ credential: credentialPayload });
   * ```
   */
  async verify(options: VerifyOptions): Promise<VerifyResult> {
    const startTime = performance.now();

    try {
      const response = await fetch(`${this.baseUrl}/api/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
        signal: AbortSignal.timeout(this.timeout),
      });

      const result = await response.json() as VerifyResult;
      return result;
    } catch (error) {
      const elapsed = Math.round(performance.now() - startTime);

      // Handle timeout
      if (error instanceof Error && error.name === 'TimeoutError') {
        throw new TimeoutError(
          `Request timed out after ${this.timeout}ms`,
          undefined
        );
      }

      // Handle network errors
      if (error instanceof TypeError) {
        throw new NetworkError(
          `Network error: ${error.message}`,
          undefined
        );
      }

      // Re-throw other errors
      throw error;
    }
  }

  /**
   * Verify a credential offline using the issuer's public key
   *
   * This method performs verification without making any network calls.
   * Note: Offline verification cannot check revocation status.
   *
   * @param credential - The full credential payload to verify
   * @param options - Options including the issuer's public key
   * @returns Verification result
   *
   * @example
   * ```typescript
   * const result = await client.verifyOffline(credential, {
   *   issuerPublicKey: 'base64-encoded-public-key'
   * });
   * ```
   */
  async verifyOffline(
    credential: CredentialPayload,
    options: OfflineVerifyOptions
  ): Promise<VerifyResult> {
    return verifyCredential(credential, options);
  }
}
