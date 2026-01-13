// =============================================================================
// AGENT TYPES
// =============================================================================

export type AgentType = 'autonomous' | 'supervised' | 'hybrid';

export type IssuerType = 'individual' | 'organization' | 'platform';

export type CredentialStatus = 'active' | 'revoked' | 'expired' | 'suspended';

// =============================================================================
// PERMISSIONS
// =============================================================================

export type PermissionAction = 'read' | 'write' | 'transact' | 'communicate';

export type PermissionDomain =
  | 'finance'
  | 'communication'
  | 'data_access'
  | 'identity'
  | 'contracts';

export interface ResourceLimits {
  max_transaction_value?: number;
  currency?: string;
  daily_limit?: number;
  rate_limit_per_minute?: number;
}

export interface Permissions {
  actions: PermissionAction[];
  domains: PermissionDomain[];
  resource_limits: ResourceLimits;
}

// =============================================================================
// ISSUER
// =============================================================================

export interface Issuer {
  id: string;
  user_id: string;
  name: string;
  issuer_type: IssuerType;
  domain?: string | null;
  description?: string | null;
  is_verified: boolean;
  verified_at?: string | null;
  public_key: string;
  key_id: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface IssuerPublic {
  issuer_id: string;
  issuer_type: IssuerType;
  issuer_verified: boolean;
  name: string;
}

// =============================================================================
// CREDENTIAL
// =============================================================================

export interface CredentialConstraints {
  valid_from: string;
  valid_until: string;
  geographic_restrictions: string[];
  allowed_services: string[];
}

export interface CredentialPayload {
  credential_id: string;
  agent_id: string;
  agent_name: string;
  agent_type: AgentType;
  issuer: IssuerPublic;
  permissions: Permissions;
  constraints: CredentialConstraints;
  issued_at: string;
  signature: string;
}

export interface Credential {
  id: string;
  issuer_id: string;
  agent_id: string;
  agent_name: string;
  agent_type: AgentType;
  permissions: Permissions;
  valid_from: string;
  valid_until: string;
  geographic_restrictions: string[];
  allowed_services: string[];
  status: CredentialStatus;
  revoked_at?: string | null;
  revocation_reason?: string | null;
  signature: string;
  signature_algorithm: string;
  key_id: string;
  credential_payload: CredentialPayload;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// VERIFICATION
// =============================================================================

export interface VerificationRequest {
  credential_id?: string;
  credential?: CredentialPayload;
}

export interface VerificationResponse {
  valid: boolean;
  reason?: string;
  credential?: {
    agent_id: string;
    agent_name: string;
    agent_type: AgentType;
    issuer: IssuerPublic;
    permissions: Permissions;
    valid_until: string;
  };
  verification_time_ms: number;
}

export interface VerificationLog {
  id: string;
  credential_id?: string | null;
  agent_id?: string | null;
  is_valid: boolean;
  failure_reason?: string | null;
  verifier_ip?: string | null;
  verifier_user_agent?: string | null;
  request_context?: Record<string, unknown> | null;
  verification_time_ms?: number | null;
  created_at: string;
}

// =============================================================================
// API REQUESTS
// =============================================================================

export interface IssueCredentialRequest {
  agent_id: string;
  agent_name: string;
  agent_type: AgentType;
  permissions: Permissions;
  valid_from?: string;
  valid_until: string;
  geographic_restrictions?: string[];
  allowed_services?: string[];
  metadata?: Record<string, unknown>;
}

export interface RegisterIssuerRequest {
  name: string;
  issuer_type: IssuerType;
  domain?: string;
  description?: string;
}

export interface RevokeCredentialRequest {
  reason?: string;
}

// =============================================================================
// API RESPONSES
// =============================================================================

export interface ApiError {
  error: string;
  details?: Record<string, unknown>;
}

export interface IssueCredentialResponse {
  credential: CredentialPayload;
}

export interface RegisterIssuerResponse {
  issuer: Issuer;
}
