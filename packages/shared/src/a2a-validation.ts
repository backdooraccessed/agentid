import { z } from 'zod';

// =============================================================================
// A2A VALIDATION SCHEMAS
// =============================================================================

/**
 * Valid A2A authorization statuses
 */
export const a2aAuthorizationStatusSchema = z.enum([
  'pending',
  'approved',
  'denied',
  'revoked',
  'expired',
]);

/**
 * Valid A2A message types
 */
export const a2aMessageTypeSchema = z.enum([
  'text',
  'request',
  'response',
  'authorization',
  'data',
  'error',
]);

/**
 * Valid A2A conversation statuses
 */
export const a2aConversationStatusSchema = z.enum([
  'active',
  'closed',
  'blocked',
]);

// =============================================================================
// PERMISSION SCHEMAS
// =============================================================================

/**
 * Permission constraints schema
 */
export const a2aPermissionConstraintsSchema = z.object({
  time_window: z.string().optional(),
  allowed_days: z.array(z.string()).optional(),
  allowed_regions: z.array(z.string()).optional(),
  rate_limit_per_minute: z.number().int().positive().optional(),
  rate_limit_per_day: z.number().int().positive().optional(),
  custom: z.record(z.unknown()).optional(),
}).strict();

/**
 * A2A permission schema
 */
export const a2aPermissionSchema = z.object({
  action: z.string().min(1),
  resource: z.string().optional(),
  constraints: a2aPermissionConstraintsSchema.optional(),
});

// =============================================================================
// AUTHORIZATION SCHEMAS
// =============================================================================

/**
 * Create authorization request schema
 */
export const a2aCreateAuthorizationRequestSchema = z.object({
  requester_credential_id: z.string().uuid(),
  grantor_credential_id: z.string().uuid(),
  requested_permissions: z.array(a2aPermissionSchema).min(1),
  scope: z.string().optional(),
  constraints: z.record(z.unknown()).optional(),
  valid_until: z.string().datetime().optional(),
  signature: z.string().min(1),
});

/**
 * Respond to authorization request schema
 */
export const a2aRespondAuthorizationRequestSchema = z.object({
  grantor_credential_id: z.string().uuid(),
  approved: z.boolean(),
  message: z.string().optional(),
  signature: z.string().min(1),
});

/**
 * Check authorization schema
 */
export const a2aCheckAuthorizationSchema = z.object({
  requester_credential_id: z.string().uuid(),
  grantor_credential_id: z.string().uuid(),
  action: z.string().min(1),
  resource: z.string().optional(),
  context: z.record(z.unknown()).optional(),
});

// =============================================================================
// CONVERSATION SCHEMAS
// =============================================================================

/**
 * Start conversation request schema
 */
export const a2aStartConversationSchema = z.object({
  initiator_credential_id: z.string().uuid(),
  recipient_credential_id: z.string().uuid(),
  subject: z.string().max(500).optional(),
});

/**
 * Update conversation schema
 */
export const a2aUpdateConversationSchema = z.object({
  status: a2aConversationStatusSchema.optional(),
});

// =============================================================================
// MESSAGE SCHEMAS
// =============================================================================

/**
 * Encryption metadata schema
 */
export const a2aEncryptionMetadataSchema = z.object({
  algorithm: z.string().min(1),
  sender_key_id: z.string().optional(),
  recipient_key_id: z.string().optional(),
  iv: z.string().min(1),
  tag: z.string().optional(),
});

/**
 * Send message request schema
 */
export const a2aSendMessageSchema = z.object({
  sender_credential_id: z.string().uuid(),
  message_type: a2aMessageTypeSchema.default('text'),
  content: z.record(z.unknown()),
  signature: z.string().min(1),
  signature_timestamp: z.number().int(),
  nonce: z.string().min(1),
  reply_to_id: z.string().uuid().optional(),
  encrypted: z.boolean().default(false),
  encryption_metadata: a2aEncryptionMetadataSchema.optional(),
}).refine(
  (data) => {
    // If message is encrypted, metadata must be provided
    if (data.encrypted && !data.encryption_metadata) {
      return false;
    }
    return true;
  },
  {
    message: 'Encrypted messages must include encryption_metadata',
    path: ['encryption_metadata'],
  }
);

/**
 * Mark message as delivered schema
 */
export const a2aMarkDeliveredSchema = z.object({
  message_ids: z.array(z.string().uuid()).min(1),
});

/**
 * Mark message as read schema
 */
export const a2aMarkReadSchema = z.object({
  message_ids: z.array(z.string().uuid()).min(1),
});

// =============================================================================
// ENCRYPTION KEY SCHEMAS
// =============================================================================

/**
 * Register encryption key schema
 */
export const a2aRegisterKeySchema = z.object({
  credential_id: z.string().uuid(),
  public_key: z.string().min(1),
  key_algorithm: z.string().default('ecdh-p256'),
  expires_at: z.string().datetime().optional(),
});

// =============================================================================
// SIGNING DATA SCHEMAS (for client-side signing)
// =============================================================================

/**
 * Data to sign for a message
 */
export const a2aMessageSigningDataSchema = z.object({
  content: z.record(z.unknown()),
  timestamp: z.number().int(),
  nonce: z.string().min(1),
  conversation_id: z.string().uuid(),
  message_type: a2aMessageTypeSchema,
});

/**
 * Data to sign for an authorization request
 */
export const a2aAuthorizationSigningDataSchema = z.object({
  requester_credential_id: z.string().uuid(),
  grantor_credential_id: z.string().uuid(),
  requested_permissions: z.array(a2aPermissionSchema),
  scope: z.string().nullable(),
  constraints: z.record(z.unknown()).nullable(),
  valid_until: z.string().nullable(),
});

/**
 * Data to sign for an authorization response
 */
export const a2aAuthorizationResponseSigningDataSchema = z.object({
  authorization_id: z.string().uuid(),
  grantor_credential_id: z.string().uuid(),
  approved: z.boolean(),
});

// Type exports
export type A2ACreateAuthorizationRequest = z.infer<typeof a2aCreateAuthorizationRequestSchema>;
export type A2ARespondAuthorizationRequest = z.infer<typeof a2aRespondAuthorizationRequestSchema>;
export type A2ACheckAuthorization = z.infer<typeof a2aCheckAuthorizationSchema>;
export type A2AStartConversation = z.infer<typeof a2aStartConversationSchema>;
export type A2ASendMessage = z.infer<typeof a2aSendMessageSchema>;
export type A2ARegisterKey = z.infer<typeof a2aRegisterKeySchema>;
export type A2AMessageSigningData = z.infer<typeof a2aMessageSigningDataSchema>;
export type A2AAuthorizationSigningData = z.infer<typeof a2aAuthorizationSigningDataSchema>;
export type A2AAuthorizationResponseSigningData = z.infer<typeof a2aAuthorizationResponseSigningDataSchema>;
