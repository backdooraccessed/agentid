/**
 * Offline credential verification
 */

import type {
  CredentialPayload,
  OfflineVerifyOptions,
  VerifyResult,
} from './types';
import { verifySignature } from './crypto';

/**
 * Verify a credential offline using the issuer's public key
 *
 * This function performs verification without making any network calls.
 * It validates:
 * 1. The credential's validity period (valid_from, valid_until)
 * 2. The cryptographic signature using Ed25519
 *
 * Note: Offline verification cannot check revocation status.
 * For revocation checking, use AgentIDClient.verify() instead.
 *
 * @param credential - The full credential payload to verify
 * @param options - Options including the issuer's public key
 * @returns Verification result
 *
 * @example
 * ```typescript
 * const result = await verifyCredential(credential, {
 *   issuerPublicKey: 'base64-encoded-public-key'
 * });
 *
 * if (result.valid) {
 *   console.log('Agent:', result.credential.agent_name);
 * }
 * ```
 */
export async function verifyCredential(
  credential: CredentialPayload,
  options: OfflineVerifyOptions
): Promise<VerifyResult> {
  const startTime = performance.now();

  // Check validity period
  const now = new Date();
  const validFrom = new Date(credential.constraints.valid_from);
  const validUntil = new Date(credential.constraints.valid_until);

  if (now < validFrom) {
    return {
      valid: false,
      error: {
        code: 'CREDENTIAL_NOT_YET_VALID',
        message: 'Credential is not yet valid',
        request_id: 'offline',
      },
      verification_time_ms: Math.round(performance.now() - startTime),
    };
  }

  if (now >= validUntil) {
    return {
      valid: false,
      error: {
        code: 'CREDENTIAL_EXPIRED',
        message: 'Credential has expired',
        request_id: 'offline',
      },
      verification_time_ms: Math.round(performance.now() - startTime),
    };
  }

  // Verify signature
  const isSignatureValid = await verifySignature(
    credential as unknown as Record<string, unknown>,
    options.issuerPublicKey
  );

  if (!isSignatureValid) {
    return {
      valid: false,
      error: {
        code: 'INVALID_SIGNATURE',
        message: 'Invalid credential signature',
        request_id: 'offline',
      },
      verification_time_ms: Math.round(performance.now() - startTime),
    };
  }

  // Success
  return {
    valid: true,
    credential: {
      agent_id: credential.agent_id,
      agent_name: credential.agent_name,
      agent_type: credential.agent_type,
      issuer: credential.issuer,
      permissions: credential.permissions,
      valid_until: credential.constraints.valid_until,
    },
    verification_time_ms: Math.round(performance.now() - startTime),
  };
}
