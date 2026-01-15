/**
 * Credential verification for services using AgentID
 */

import { getGlobalCache } from './cache';
import { AgentIDError, NetworkError, RateLimitError } from './errors';
import { RevocationSubscriber } from './revocation';
import type {
  CredentialCache,
  CredentialPayload,
  Permission,
  PermissionCheckResult,
  PermissionContext,
  VerificationResult,
  VerifierOptions,
} from './types';

const DEFAULT_API_BASE = 'https://agentid.dev';

/**
 * Extract credential info from request headers
 */
function extractCredentialInfo(headers: Record<string, string | undefined>): {
  credentialId?: string;
  timestamp?: string;
  nonce?: string;
  signature?: string;
} {
  // Normalize header names (case-insensitive)
  const normalized: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (value) {
      normalized[key.toLowerCase()] = value;
    }
  }

  return {
    credentialId: normalized['x-agentid-credential'],
    timestamp: normalized['x-agentid-timestamp'],
    nonce: normalized['x-agentid-nonce'],
    signature: normalized['x-agentid-signature'],
  };
}

/**
 * Verify AgentID credentials from incoming requests.
 *
 * @example
 * ```typescript
 * const verifier = new CredentialVerifier();
 *
 * // Verify from headers
 * const result = await verifier.verifyRequest({
 *   headers: request.headers,
 *   method: 'POST',
 *   url: request.url,
 * });
 *
 * if (result.valid) {
 *   console.log(`Request from: ${result.credential.agent_name}`);
 * }
 * ```
 */
export class CredentialVerifier {
  private readonly apiBase: string;
  private readonly cache: CredentialCache;
  private readonly cacheTtl: number;
  private readonly verifySignature: boolean;
  private readonly signatureMaxAge: number;
  private readonly revocationSubscriber?: RevocationSubscriber;
  private readonly onRevocation?: (credentialId: string) => void;

  constructor(options: VerifierOptions = {}) {
    this.apiBase = (options.apiBase ?? DEFAULT_API_BASE).replace(/\/$/, '');
    this.cache = options.cache ?? getGlobalCache();
    this.cacheTtl = options.cacheTtl ?? 5 * 60 * 1000; // 5 minutes
    this.verifySignature = options.verifySignature ?? true;
    this.signatureMaxAge = options.signatureMaxAge ?? 300; // 5 minutes
    this.onRevocation = options.onRevocation;

    // Set up revocation subscription if enabled
    if (options.subscribeRevocations) {
      this.revocationSubscriber = new RevocationSubscriber({
        apiBase: this.apiBase,
        wsBase: options.wsBase,
        cache: this.cache,
        onRevocation: (event) => {
          if (this.onRevocation) {
            this.onRevocation(event.credential_id);
          }
        },
      });

      // Auto-connect (don't await, let it connect in background)
      this.revocationSubscriber.connect().catch(() => {
        // Silently fall back to polling on connection error
      });
    }
  }

  /**
   * Check if a credential is known to be revoked.
   * Only works if subscribeRevocations is enabled.
   */
  isRevoked(credentialId: string): boolean {
    return this.revocationSubscriber?.isRevoked(credentialId) ?? false;
  }

  /**
   * Get the revocation subscriber for direct access.
   */
  getRevocationSubscriber(): RevocationSubscriber | undefined {
    return this.revocationSubscriber;
  }

  /**
   * Disconnect from revocation stream and clean up.
   */
  disconnect(): void {
    this.revocationSubscriber?.disconnect();
  }

  /**
   * Verify a credential by ID.
   */
  async verifyCredential(
    credentialId: string,
    options: { useCache?: boolean; checkRevocation?: boolean } = {}
  ): Promise<VerificationResult> {
    const { useCache = true, checkRevocation = true } = options;

    // Check if credential is known to be revoked
    if (checkRevocation && this.isRevoked(credentialId)) {
      return {
        valid: false,
        error: 'Credential has been revoked',
        error_code: 'CREDENTIAL_REVOKED',
      };
    }

    // Check cache
    if (useCache) {
      const cacheKey = `verify:${credentialId}`;
      const cached = this.cache.get(cacheKey) as VerificationResult | undefined;
      if (cached) {
        return cached;
      }
    }

    // Call API
    const url = `${this.apiBase}/api/verify`;
    let response: Response;

    try {
      response = await globalThis.fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential_id: credentialId }),
      });
    } catch (error) {
      throw new NetworkError(
        `Failed to verify credential: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error : undefined
      );
    }

    const result = await this.handleResponse(response);

    // Cache successful verifications
    if (useCache && result.valid) {
      const cacheKey = `verify:${credentialId}`;
      this.cache.set(cacheKey, result, this.cacheTtl);
    }

    return result;
  }

  /**
   * Verify a request with AgentID headers.
   */
  async verifyRequest(options: {
    headers: Record<string, string | undefined>;
    method: string;
    url: string;
    body?: string | null;
  }): Promise<VerificationResult> {
    const { headers } = options;
    const { credentialId, timestamp, signature } = extractCredentialInfo(headers);

    if (!credentialId) {
      return {
        valid: false,
        error: 'Missing X-AgentID-Credential header',
        error_code: 'MISSING_CREDENTIAL',
      };
    }

    // Verify signature if enabled
    if (this.verifySignature) {
      if (!timestamp || !signature) {
        return {
          valid: false,
          error: 'Missing signature headers',
          error_code: 'MISSING_SIGNATURE',
        };
      }

      const ts = parseInt(timestamp, 10);
      if (isNaN(ts)) {
        return {
          valid: false,
          error: 'Invalid timestamp',
          error_code: 'INVALID_TIMESTAMP',
        };
      }

      const now = Math.floor(Date.now() / 1000);
      if (Math.abs(now - ts) > this.signatureMaxAge) {
        return {
          valid: false,
          error: 'Request signature expired',
          error_code: 'SIGNATURE_EXPIRED',
        };
      }
    }

    // Verify credential
    return this.verifyCredential(credentialId);
  }

  private async handleResponse(response: Response): Promise<VerificationResult> {
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      throw new RateLimitError(
        'Rate limit exceeded',
        retryAfter ? parseInt(retryAfter, 10) : undefined
      );
    }

    let data: VerificationResult;
    try {
      data = await response.json() as VerificationResult;
    } catch {
      throw new AgentIDError('Invalid response from API');
    }

    return data;
  }
}

/**
 * Check if permissions allow a specific action.
 *
 * @example
 * ```typescript
 * const allowed = checkPermission(credential.permissions, {
 *   resource: 'https://api.example.com/users',
 *   action: 'write',
 *   context: { amount: 5000 },
 * });
 *
 * if (allowed.granted) {
 *   // Process request
 * } else {
 *   // Deny with reason
 *   console.log(allowed.reason);
 * }
 * ```
 */
export function checkPermission(
  permissions: (string | Permission)[],
  options: {
    resource: string;
    action: string;
    context?: PermissionContext;
  }
): PermissionCheckResult {
  const { resource, action, context = {} } = options;

  for (const perm of permissions) {
    // Handle string permissions (legacy)
    if (typeof perm === 'string') {
      if (perm === '*' || perm === action) {
        return { granted: true };
      }
      continue;
    }

    // Handle structured permissions
    // Check resource match (supports wildcards)
    if (!matchWildcard(resource, perm.resource)) {
      continue;
    }

    // Check action
    if (!perm.actions.includes(action) && !perm.actions.includes('*')) {
      continue;
    }

    // Check conditions if present
    if (perm.conditions) {
      // Check amount limits
      if (perm.conditions.max_transaction_amount !== undefined) {
        const amount = context.amount as number | undefined;
        if (amount !== undefined && amount > perm.conditions.max_transaction_amount) {
          return {
            granted: false,
            reason: `Amount ${amount} exceeds limit ${perm.conditions.max_transaction_amount}`,
          };
        }
      }

      // Check region
      if (perm.conditions.allowed_regions) {
        const region = context.region as string | undefined;
        if (region && !perm.conditions.allowed_regions.includes(region)) {
          return {
            granted: false,
            reason: `Region ${region} not allowed`,
          };
        }
      }

      // Check daily spend limit
      if (perm.conditions.daily_spend_limit !== undefined) {
        const dailySpent = context.dailySpent as number | undefined;
        const amount = context.amount as number | undefined;
        if (
          dailySpent !== undefined &&
          amount !== undefined &&
          dailySpent + amount > perm.conditions.daily_spend_limit
        ) {
          return {
            granted: false,
            reason: `Would exceed daily spend limit of ${perm.conditions.daily_spend_limit}`,
          };
        }
      }
    }

    // All checks passed
    return { granted: true };
  }

  // No matching permission found
  return {
    granted: false,
    reason: `No permission for ${action} on ${resource}`,
  };
}

/**
 * Match a string against a wildcard pattern
 */
function matchWildcard(str: string, pattern: string): boolean {
  // Convert glob pattern to regex
  const regexPattern = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&') // Escape special chars except * and ?
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');

  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(str);
}

// Re-export types for convenience
export type { VerificationResult, CredentialPayload, Permission };
