// =============================================================================
// A2A (AGENT-TO-AGENT) TYPES
// =============================================================================

/**
 * Status of an A2A authorization request
 */
export type A2AAuthorizationStatus = 'pending' | 'approved' | 'denied' | 'revoked' | 'expired';

/**
 * Type of A2A message
 */
export type A2AMessageType = 'text' | 'request' | 'response' | 'authorization' | 'data' | 'error';

/**
 * Status of an A2A conversation
 */
export type A2AConversationStatus = 'active' | 'closed' | 'blocked';

// =============================================================================
// AUTHORIZATION TYPES
// =============================================================================

/**
 * A permission that can be requested in an A2A authorization
 */
export interface A2APermission {
  action: string;
  resource?: string;
  constraints?: A2APermissionConstraints;
}

/**
 * Constraints that can be applied to a permission
 */
export interface A2APermissionConstraints {
  /** Time window when permission is valid (e.g., "09:00-17:00") */
  time_window?: string;
  /** Days of week when permission is valid */
  allowed_days?: string[];
  /** Geographic regions where permission is valid */
  allowed_regions?: string[];
  /** Maximum requests per minute */
  rate_limit_per_minute?: number;
  /** Maximum requests per day */
  rate_limit_per_day?: number;
  /** Custom constraints */
  custom?: Record<string, unknown>;
}

/**
 * Request to create an A2A authorization
 */
export interface A2AAuthorizationRequest {
  requester_credential_id: string;
  grantor_credential_id: string;
  requested_permissions: A2APermission[];
  scope?: string;
  constraints?: Record<string, unknown>;
  valid_until?: string;
  signature: string;
}

/**
 * Response to an A2A authorization request
 */
export interface A2AAuthorizationResponse {
  grantor_credential_id: string;
  approved: boolean;
  message?: string;
  signature: string;
}

/**
 * Full A2A authorization record
 */
export interface A2AAuthorization {
  id: string;
  requester_credential_id: string;
  grantor_credential_id: string;
  requested_permissions: A2APermission[];
  scope?: string | null;
  constraints?: Record<string, unknown> | null;
  status: A2AAuthorizationStatus;
  valid_from: string;
  valid_until?: string | null;
  request_signature: string;
  response_signature?: string | null;
  response_message?: string | null;
  created_at: string;
  updated_at: string;
  responded_at?: string | null;
}

/**
 * Result of checking an A2A authorization
 */
export interface A2AAuthorizationCheckResult {
  authorized: boolean;
  authorization_id?: string;
  constraints?: Record<string, unknown>;
  valid_until?: string;
  reason?: string;
}

// =============================================================================
// CONVERSATION TYPES
// =============================================================================

/**
 * An A2A conversation between two agents
 */
export interface A2AConversation {
  id: string;
  initiator_credential_id: string;
  recipient_credential_id: string;
  subject?: string | null;
  status: A2AConversationStatus;
  encryption_enabled: boolean;
  last_message_at?: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Request to start a new A2A conversation
 */
export interface A2AConversationRequest {
  initiator_credential_id: string;
  recipient_credential_id: string;
  subject?: string;
}

// =============================================================================
// MESSAGE TYPES
// =============================================================================

/**
 * Data structure that must be signed when sending a message
 */
export interface A2ASignedMessageData {
  content: Record<string, unknown>;
  timestamp: number;
  nonce: string;
  conversation_id: string;
  message_type: A2AMessageType;
}

/**
 * Request to send an A2A message
 */
export interface A2ASendMessageRequest {
  sender_credential_id: string;
  message_type?: A2AMessageType;
  content: Record<string, unknown>;
  signature: string;
  signature_timestamp: number;
  nonce: string;
  reply_to_id?: string;
  encrypted?: boolean;
  encryption_metadata?: A2AEncryptionMetadata;
}

/**
 * An A2A message
 */
export interface A2AMessage {
  id: string;
  conversation_id: string;
  sender_credential_id: string;
  message_type: A2AMessageType;
  content: Record<string, unknown>;
  signature: string;
  signature_timestamp: number;
  nonce: string;
  reply_to_id?: string | null;
  encrypted: boolean;
  encryption_metadata?: A2AEncryptionMetadata | null;
  delivered: boolean;
  delivered_at?: string | null;
  read_at?: string | null;
  created_at: string;
}

// =============================================================================
// ENCRYPTION TYPES
// =============================================================================

/**
 * Encryption key for A2A conversations
 */
export interface A2AEncryptionKey {
  id: string;
  conversation_id: string;
  credential_id: string;
  public_key: string;
  key_algorithm: string;
  expires_at?: string | null;
  created_at: string;
}

/**
 * Metadata for an encrypted message
 */
export interface A2AEncryptionMetadata {
  algorithm: string;
  sender_key_id?: string;
  recipient_key_id?: string;
  iv: string;
  tag?: string;
}

/**
 * Encrypted message content
 */
export interface A2AEncryptedContent {
  ciphertext: string;
  iv: string;
  tag?: string;
}

// =============================================================================
// SIGNING HELPERS
// =============================================================================

// Note: Signing data schemas are defined in a2a-validation.ts to avoid duplication

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

/**
 * Response when creating an authorization request
 */
export interface A2ACreateAuthorizationResponse {
  authorization_id: string;
  message: string;
}

/**
 * Response when responding to an authorization request
 */
export interface A2ARespondAuthorizationResponse {
  message: string;
  status: 'approved' | 'denied';
}

/**
 * Response when sending a message
 */
export interface A2ASendMessageResponse {
  message_id: string;
  message: string;
}

/**
 * Response when listing messages
 */
export interface A2AListMessagesResponse {
  messages: A2AMessage[];
  conversation_id: string;
}

/**
 * Response when checking authorization
 */
export interface A2ACheckAuthorizationResponse {
  authorized: boolean;
  authorization_id?: string;
  constraints?: Record<string, unknown>;
  valid_until?: string;
}
