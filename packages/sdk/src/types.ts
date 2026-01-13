/**
 * AgentID SDK Types
 */

/**
 * Error codes returned by the AgentID verification API
 */
export type ErrorCode =
  | 'INVALID_REQUEST'
  | 'MISSING_INPUT'
  | 'CREDENTIAL_NOT_FOUND'
  | 'CREDENTIAL_REVOKED'
  | 'CREDENTIAL_EXPIRED'
  | 'CREDENTIAL_NOT_YET_VALID'
  | 'INVALID_SIGNATURE'
  | 'ISSUER_NOT_FOUND'
  | 'INTERNAL_ERROR'
  | 'NETWORK_ERROR'
  | 'TIMEOUT_ERROR';

/**
 * Agent types supported by AgentID
 */
export type AgentType =
  | 'autonomous'
  | 'assistant'
  | 'bot'
  | 'service'
  | 'other';

/**
 * Issuer types
 */
export type IssuerType =
  | 'individual'
  | 'organization'
  | 'enterprise';

/**
 * Information about the credential issuer
 */
export interface IssuerInfo {
  issuer_id: string;
  issuer_type: IssuerType;
  issuer_verified: boolean;
  name: string;
}

/**
 * Credential constraints (validity period, restrictions)
 */
export interface CredentialConstraints {
  valid_from: string;
  valid_until: string;
  geographic_restrictions?: string[];
  allowed_services?: string[];
}

/**
 * Full credential payload as issued by AgentID
 */
export interface CredentialPayload {
  credential_id: string;
  agent_id: string;
  agent_name: string;
  agent_type: AgentType;
  issuer: IssuerInfo;
  permissions: Record<string, unknown>;
  constraints: CredentialConstraints;
  issued_at: string;
  signature: string;
}

/**
 * Options for the verify method
 */
export interface VerifyOptions {
  /** Verify by credential ID (requires network call) */
  credential_id?: string;
  /** Verify a full credential payload */
  credential?: CredentialPayload;
}

/**
 * Verified credential information returned on success
 */
export interface VerifiedCredential {
  agent_id: string;
  agent_name: string;
  agent_type: AgentType;
  issuer: IssuerInfo;
  permissions: Record<string, unknown>;
  valid_until: string;
}

/**
 * Error information returned on verification failure
 */
export interface VerifyError {
  code: ErrorCode;
  message: string;
  request_id: string;
}

/**
 * Result of credential verification
 */
export interface VerifyResult {
  /** Whether the credential is valid */
  valid: boolean;
  /** Credential details (only present if valid) */
  credential?: VerifiedCredential;
  /** Error details (only present if invalid) */
  error?: VerifyError;
  /** Time taken for verification in milliseconds */
  verification_time_ms: number;
}

/**
 * Configuration options for AgentIDClient
 */
export interface ClientOptions {
  /** Base URL of the AgentID API (default: https://agentid.vercel.app) */
  baseUrl?: string;
  /** Request timeout in milliseconds (default: 5000) */
  timeout?: number;
}

/**
 * Options for offline verification
 */
export interface OfflineVerifyOptions {
  /** Issuer's public key for signature verification (base64 encoded) */
  issuerPublicKey: string;
}
