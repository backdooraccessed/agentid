/**
 * Core credential handling for AgentID SDK
 */

import { getGlobalCache } from './cache';
import {
  AgentIDError,
  AuthenticationError,
  CredentialExpiredError,
  CredentialInvalidError,
  CredentialNotFoundError,
  CredentialRevokedError,
  NetworkError,
  RateLimitError,
} from './errors';
import { RequestSigner } from './signature';
import type {
  AgentCredentialOptions,
  AgentIDHeaders,
  CredentialCache,
  CredentialPayload,
  CredentialStatus,
  VerificationResult,
} from './types';

export const DEFAULT_API_BASE = 'https://agentid.dev';

/**
 * An AI agent's credential for authentication and authorization.
 *
 * @example
 * ```typescript
 * const cred = new AgentCredential('cred_xxx');
 *
 * // Make authenticated request
 * const response = await cred.fetch('https://api.example.com/data');
 *
 * // Or get headers to add yourself
 * const headers = await cred.getHeaders('GET', 'https://api.example.com/data');
 * ```
 */
export class AgentCredential {
  public readonly credentialId: string;
  public readonly apiBase: string;
  public readonly autoRefresh: boolean;
  public readonly refreshThreshold: number;

  private readonly apiKey?: string;
  private readonly cache: CredentialCache;
  private readonly signer: RequestSigner;

  private credentialData?: CredentialPayload;
  private status?: CredentialStatus;

  constructor(credentialId: string, options: AgentCredentialOptions = {}) {
    this.credentialId = credentialId;
    this.apiKey = options.apiKey;
    this.apiBase = (options.apiBase ?? DEFAULT_API_BASE).replace(/\/$/, '');
    this.cache = options.cache ?? getGlobalCache();
    this.autoRefresh = options.autoRefresh ?? true;
    this.refreshThreshold = (options.refreshThreshold ?? 300) * 1000; // Convert to ms

    this.signer = new RequestSigner(credentialId, options.signingSecret);
  }

  /** Get the cache key for this credential */
  get cacheKey(): string {
    return `credential:${this.credentialId}`;
  }

  /** Check if credential data has been loaded */
  get isLoaded(): boolean {
    return this.credentialData !== undefined;
  }

  /** Check if the credential has expired */
  get isExpired(): boolean {
    if (!this.credentialData) return true;
    const validUntil = new Date(this.credentialData.constraints.valid_until).getTime();
    return Date.now() >= validUntil;
  }

  /** Check if the credential is active and valid */
  get isActive(): boolean {
    return this.status === 'active' && !this.isExpired;
  }

  /** Get milliseconds until credential expires */
  get timeToExpiry(): number {
    if (!this.credentialData) return 0;
    const validUntil = new Date(this.credentialData.constraints.valid_until).getTime();
    return Math.max(0, validUntil - Date.now());
  }

  /** Check if the credential should be refreshed */
  get needsRefresh(): boolean {
    return this.timeToExpiry < this.refreshThreshold;
  }

  /** Get the loaded credential data */
  get data(): CredentialPayload | undefined {
    return this.credentialData;
  }

  /**
   * Load credential data from the API or cache.
   *
   * @param force Force refresh even if cached
   * @returns The credential payload
   */
  async load(force = false): Promise<CredentialPayload> {
    // Check cache first
    if (!force) {
      const cached = this.cache.get(this.cacheKey) as CredentialPayload | undefined;
      if (cached) {
        this.credentialData = cached;
        this.status = 'active';
        if (!this.needsRefresh) {
          return this.credentialData;
        }
      }
    }

    // Fetch from API
    const result = await this.fetchCredential();
    this.updateFromResult(result);

    if (!this.credentialData) {
      throw new CredentialInvalidError('No credential data returned');
    }

    return this.credentialData;
  }

  /**
   * Get headers to include in a request.
   *
   * @param method HTTP method
   * @param url Request URL
   * @param body Request body (for signature)
   * @returns Headers object
   */
  async getHeaders(
    method = 'GET',
    url = '',
    body?: string | null
  ): Promise<AgentIDHeaders> {
    return this.signer.signRequest(method, url, body);
  }

  /**
   * Make an HTTP request with credential headers.
   *
   * @param url URL to request
   * @param init Fetch init options
   * @returns Fetch response
   */
  async fetch(url: string, init: RequestInit = {}): Promise<Response> {
    // Ensure credential is loaded
    if (!this.isLoaded || (this.autoRefresh && this.needsRefresh)) {
      await this.load();
    }

    const method = init.method ?? 'GET';
    const body = typeof init.body === 'string' ? init.body : null;

    // Add credential headers
    const credHeaders = await this.getHeaders(method, url, body);
    const headers = new Headers(init.headers);
    for (const [key, value] of Object.entries(credHeaders)) {
      headers.set(key, value);
    }

    return globalThis.fetch(url, {
      ...init,
      headers,
    });
  }

  /**
   * Create a fetch function that automatically includes credentials.
   *
   * @returns A fetch-like function
   */
  createFetch(): typeof fetch {
    return (input: string | URL | Request, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      return this.fetch(url, init);
    };
  }

  private getApiHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'agentid-js/0.1.0',
    };
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }
    return headers;
  }

  private async fetchCredential(): Promise<VerificationResult> {
    const url = `${this.apiBase}/api/verify`;

    let response: Response;
    try {
      response = await globalThis.fetch(url, {
        method: 'POST',
        headers: this.getApiHeaders(),
        body: JSON.stringify({ credential_id: this.credentialId }),
      });
    } catch (error) {
      throw new NetworkError(
        `Failed to connect to AgentID API: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error : undefined
      );
    }

    return this.handleVerifyResponse(response);
  }

  private async handleVerifyResponse(response: Response): Promise<VerificationResult> {
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      throw new RateLimitError(
        'Rate limit exceeded',
        retryAfter ? parseInt(retryAfter, 10) : undefined
      );
    }

    if (response.status === 401) {
      throw new AuthenticationError('Invalid API key');
    }

    let data: VerificationResult;
    try {
      data = await response.json() as VerificationResult;
    } catch {
      throw new AgentIDError('Invalid response from API');
    }

    if (response.status === 404 || data.error_code === 'CREDENTIAL_NOT_FOUND') {
      throw new CredentialNotFoundError(this.credentialId);
    }

    if (!response.ok) {
      throw new AgentIDError(data.error ?? 'Unknown error', data.error_code);
    }

    return data;
  }

  private updateFromResult(result: VerificationResult): void {
    if (!result.valid) {
      const errorCode = result.error_code;
      if (errorCode === 'CREDENTIAL_EXPIRED') {
        this.status = 'expired';
        throw new CredentialExpiredError(result.error);
      } else if (errorCode === 'CREDENTIAL_REVOKED') {
        this.status = 'revoked';
        throw new CredentialRevokedError(result.error);
      } else {
        throw new CredentialInvalidError(result.error);
      }
    }

    this.credentialData = result.credential;
    this.status = 'active';

    // Cache the credential data
    if (this.credentialData) {
      const ttl = Math.min(this.timeToExpiry, 60 * 60 * 1000); // Max 1 hour
      this.cache.set(this.cacheKey, this.credentialData, ttl);
    }
  }
}

/**
 * Make a single request with an agent credential.
 *
 * This is a convenience function for one-off requests. For multiple
 * requests, create an AgentCredential instance and reuse it.
 *
 * @param credentialId The credential ID
 * @param url URL to request
 * @param init Fetch init options
 * @returns Fetch response
 */
export async function agentFetch(
  credentialId: string,
  url: string,
  init?: RequestInit
): Promise<Response> {
  const cred = new AgentCredential(credentialId);
  return cred.fetch(url, init);
}
