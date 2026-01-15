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

// =============================================================================
// BATCH VERIFICATION
// =============================================================================

export interface BatchVerificationRequest {
  credentials: Array<{
    credential_id?: string;
    credential?: CredentialPayload;
  }>;
  options?: {
    fail_fast?: boolean;
    include_details?: boolean;
  };
}

export interface BatchVerificationResultItem {
  index: number;
  valid: boolean;
  credential?: {
    agent_id: string;
    agent_name: string;
    agent_type: AgentType;
    issuer: IssuerPublic;
    permissions: Permissions;
    valid_until: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface BatchVerificationResponse {
  results: BatchVerificationResultItem[];
  summary: {
    total: number;
    valid: number;
    invalid: number;
  };
  verification_time_ms: number;
  request_id: string;
}

// =============================================================================
// WEBHOOKS
// =============================================================================

export type WebhookEvent = 'credential.revoked' | 'credential.issued' | 'credential.expired';

export interface WebhookSubscription {
  id: string;
  issuer_id: string;
  url: string;
  events: WebhookEvent[];
  secret: string;
  is_active: boolean;
  consecutive_failures: number;
  last_failure_at?: string | null;
  last_failure_reason?: string | null;
  description?: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface WebhookDelivery {
  id: string;
  subscription_id: string;
  event_type: WebhookEvent;
  payload: Record<string, unknown>;
  status: 'pending' | 'delivered' | 'failed' | 'retrying';
  attempts: number;
  response_status?: number | null;
  response_body?: string | null;
  created_at: string;
  delivered_at?: string | null;
}

export interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  data: Record<string, unknown>;
}

export interface CreateWebhookRequest {
  url: string;
  events?: WebhookEvent[];
  description?: string;
}

export interface UpdateWebhookRequest {
  url?: string;
  events?: WebhookEvent[];
  is_active?: boolean;
  description?: string;
}

// =============================================================================
// REPUTATION
// =============================================================================

export interface AgentReputation {
  id: string;
  agent_id: string;
  credential_id: string;
  issuer_id: string;
  trust_score: number;
  verification_score: number;
  longevity_score: number;
  total_verifications: number;
  successful_verifications: number;
  failed_verifications: number;
  last_verification_at?: string | null;
  score_factors: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface IssuerReputation {
  id: string;
  issuer_id: string;
  trust_score: number;
  total_credentials: number;
  active_credentials: number;
  revoked_credentials: number;
  total_verifications: number;
  avg_credential_age_days?: number | null;
  created_at: string;
  updated_at: string;
}

export interface ReputationResponse {
  trust_score: number;
  verification_count: number;
  success_rate: number;
  credential_age_days: number;
  issuer_verified: boolean;
}

// =============================================================================
// MARKETPLACE
// =============================================================================

export type AppStatus = 'draft' | 'pending' | 'live' | 'rejected' | 'unlisted';

export type PricingType = 'free' | 'freemium' | 'paid' | 'contact';

export interface AppCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  display_order: number;
  created_at: string;
}

export interface App {
  id: string;
  issuer_id: string;
  credential_id?: string | null;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  icon_url?: string | null;
  demo_video_url?: string | null;
  app_url: string;
  demo_url?: string | null;
  github_url?: string | null;
  docs_url?: string | null;
  pricing_type: PricingType;
  pricing_amount?: number | null;
  pricing_currency: string;
  status: AppStatus;
  featured: boolean;
  verified: boolean;
  view_count: number;
  click_count: number;
  review_count: number;
  average_rating?: number | null;
  tags?: string[] | null;
  created_at: string;
  updated_at: string;
  published_at?: string | null;
}

export interface AppWithDetails extends App {
  categories: AppCategory[];
  screenshots: AppScreenshot[];
  issuer?: {
    name: string;
    is_verified: boolean;
  };
  credential?: {
    agent_name: string;
    trust_score?: number;
  } | null;
}

export interface AppScreenshot {
  id: string;
  app_id: string;
  image_url: string;
  caption?: string | null;
  display_order: number;
  created_at: string;
}

export interface AppReview {
  id: string;
  app_id: string;
  user_id: string;
  rating: number;
  title?: string | null;
  content?: string | null;
  helpful_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateAppRequest {
  name: string;
  tagline: string;
  description: string;
  icon_url?: string;
  demo_video_url?: string;
  app_url: string;
  demo_url?: string;
  github_url?: string;
  docs_url?: string;
  pricing_type: PricingType;
  pricing_amount?: number;
  category_ids: string[];
  tags?: string[];
  credential_id?: string;
  screenshots?: { image_url: string; caption?: string }[];
}

export interface UpdateAppRequest {
  name?: string;
  tagline?: string;
  description?: string;
  icon_url?: string;
  demo_video_url?: string;
  app_url?: string;
  demo_url?: string;
  github_url?: string;
  docs_url?: string;
  pricing_type?: PricingType;
  pricing_amount?: number;
  category_ids?: string[];
  tags?: string[];
  credential_id?: string;
  screenshots?: { image_url: string; caption?: string }[];
}
