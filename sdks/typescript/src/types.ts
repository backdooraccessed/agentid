/**
 * AgentID SDK Type Definitions
 */

/** Status of a credential */
export type CredentialStatus = 'active' | 'expired' | 'revoked';

/** Information about a credential issuer */
export interface IssuerInfo {
  issuer_id: string;
  name: string;
  issuer_type?: string;
  domain?: string;
  is_verified: boolean;
}

/** Conditions that must be met for a permission to apply */
export interface PermissionConditions {
  /** Time window when permission is valid */
  valid_hours?: { start: string; end: string; timezone?: string };
  /** Days of week when permission is valid */
  valid_days?: string[];
  /** Maximum requests per minute */
  max_requests_per_minute?: number;
  /** Maximum requests per day */
  max_requests_per_day?: number;
  /** Maximum records per request */
  max_records_per_request?: number;
  /** Fields allowed in response */
  allowed_fields?: string[];
  /** Geographic regions allowed */
  allowed_regions?: string[];
  /** Maximum transaction amount */
  max_transaction_amount?: number;
  /** Daily spend limit */
  daily_spend_limit?: number;
  /** Requires human approval */
  requires_approval?: boolean;
  /** Webhook for approval requests */
  approval_webhook?: string;
}

/** A structured permission */
export interface Permission {
  /** Resource pattern (supports wildcards) */
  resource: string;
  /** Allowed actions */
  actions: string[];
  /** Optional conditions */
  conditions?: PermissionConditions;
}

/** Constraints on a credential's validity */
export interface CredentialConstraints {
  valid_from: string;
  valid_until: string;
  allowed_domains?: string[];
  rate_limit?: number;
}

/** The full credential payload */
export interface CredentialPayload {
  credential_id: string;
  agent_id: string;
  agent_name: string;
  agent_type?: string;
  issuer: IssuerInfo;
  permissions: (string | Permission)[];
  constraints: CredentialConstraints;
  metadata?: Record<string, unknown>;
  signature: string;
}

/** Permission policy info returned during verification */
export interface PermissionPolicyInfo {
  id: string;
  name: string;
  version: number;
}

/** Result of verifying a credential */
export interface VerificationResult {
  valid: boolean;
  credential?: CredentialPayload;
  error?: string;
  error_code?: string;
  trust_score?: number;
  issuer_verified?: boolean;
  /** Permission policy info (if credential uses a policy) */
  permission_policy?: PermissionPolicyInfo;
  /** Whether permissions are live-updated via policy */
  live_permissions?: boolean;
}

/** Reputation information for an agent */
export interface ReputationInfo {
  trust_score: number;
  verification_count: number;
  success_rate?: number;
  incident_count?: number;
  last_verified?: string;
}

/** Full agent information including credential and reputation */
export interface AgentInfo {
  credential: CredentialPayload;
  reputation?: ReputationInfo;
  status: CredentialStatus;
}

/** Options for AgentCredential */
export interface AgentCredentialOptions {
  /** API key for private credentials */
  apiKey?: string;
  /** Base URL for AgentID API */
  apiBase?: string;
  /** Custom cache instance */
  cache?: CredentialCache;
  /** Automatically refresh credentials before expiry */
  autoRefresh?: boolean;
  /** Seconds before expiry to trigger refresh */
  refreshThreshold?: number;
  /** Secret for request signing */
  signingSecret?: string;
}

/** Options for CredentialVerifier */
export interface VerifierOptions {
  /** Base URL for AgentID API */
  apiBase?: string;
  /** Custom cache instance */
  cache?: CredentialCache;
  /** How long to cache verification results (ms) */
  cacheTtl?: number;
  /** Whether to verify request signatures */
  verifySignature?: boolean;
  /** Max age of request signatures (seconds) */
  signatureMaxAge?: number;
  /** Enable real-time revocation subscription */
  subscribeRevocations?: boolean;
  /** Callback when a credential is revoked */
  onRevocation?: (credentialId: string) => void;
  /** WebSocket URL for revocation stream */
  wsBase?: string;
}

/** Options for Express middleware */
export interface MiddlewareOptions {
  /** Require valid credential (default: true) */
  required?: boolean;
  /** Minimum trust score required */
  minTrustScore?: number;
  /** Required permissions */
  requiredPermissions?: string[];
  /** Custom policy function */
  policy?: (credential: CredentialPayload, req: unknown) => boolean | Promise<boolean>;
  /** Custom error handler */
  onError?: (error: Error, req: unknown, res: unknown, next: unknown) => void;
}

/** Headers injected by AgentID */
export interface AgentIDHeaders {
  'X-AgentID-Credential': string;
  'X-AgentID-Timestamp': string;
  'X-AgentID-Nonce': string;
  'X-AgentID-Signature': string;
}

/** Cache interface */
export interface CredentialCache {
  get(key: string): Promise<unknown> | unknown;
  set(key: string, value: unknown, ttl?: number): Promise<void> | void;
  delete(key: string): Promise<boolean> | boolean;
  clear(): Promise<void> | void;
}

/** Result of permission check */
export interface PermissionCheckResult {
  granted: boolean;
  reason?: string;
}

/** Context for permission checking */
export interface PermissionContext {
  /** Current time */
  time?: Date;
  /** Geographic region */
  region?: string;
  /** Transaction amount */
  amount?: number;
  /** Custom context values */
  [key: string]: unknown;
}
