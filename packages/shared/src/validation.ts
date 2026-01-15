import { z } from 'zod';
import { AGENT_PROFILES } from './agent-profiles';

// =============================================================================
// ENUMS
// =============================================================================

export const agentTypeSchema = z.enum(['autonomous', 'supervised', 'hybrid']);

export const agentProfileSchema = z.enum(AGENT_PROFILES as unknown as [string, ...string[]]);

export const issuerTypeSchema = z.enum(['individual', 'organization', 'platform']);

export const credentialStatusSchema = z.enum(['active', 'revoked', 'expired', 'suspended']);

export const permissionActionSchema = z.enum([
  'read',
  'write',
  'transact',
  'communicate',
  'execute',
  'delete',
  'admin',
]);

export const permissionDomainSchema = z.enum([
  'finance',
  'communication',
  'data_access',
  'identity',
  'contracts',
  'internal',
  'external_api',
  'code',
  'user_data',
  'financial',
  'infrastructure',
]);

// =============================================================================
// PERMISSIONS
// =============================================================================

export const resourceLimitsSchema = z.object({
  max_transaction_value: z.number().positive().optional(),
  currency: z.string().length(3).optional(),
  daily_limit: z.number().positive().optional(),
  rate_limit_per_minute: z.number().positive().int().optional(),
});

export const permissionsSchema = z.object({
  actions: z.array(permissionActionSchema).min(1),
  domains: z.array(permissionDomainSchema).min(1),
  resource_limits: resourceLimitsSchema.default({}),
});

// =============================================================================
// CREDENTIAL REQUESTS
// =============================================================================

export const issueCredentialRequestSchema = z.object({
  agent_id: z
    .string()
    .min(1, 'agent_id is required')
    .max(255, 'agent_id too long')
    .regex(/^[a-zA-Z0-9_-]+$/, 'agent_id must be alphanumeric with underscores/hyphens'),
  agent_name: z
    .string()
    .min(1, 'agent_name is required')
    .max(255, 'agent_name too long'),
  agent_type: agentTypeSchema,
  agent_profile: agentProfileSchema.optional(),
  permissions: permissionsSchema,
  valid_from: z.string().datetime().optional(),
  valid_until: z.string().datetime(),
  geographic_restrictions: z.array(z.string().length(2)).optional(),
  allowed_services: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const revokeCredentialRequestSchema = z.object({
  reason: z.string().max(500).optional(),
});

// =============================================================================
// ISSUER REQUESTS
// =============================================================================

export const registerIssuerRequestSchema = z.object({
  name: z
    .string()
    .min(1, 'name is required')
    .max(255, 'name too long'),
  issuer_type: issuerTypeSchema,
  domain: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^[a-zA-Z0-9][a-zA-Z0-9-]*\.[a-zA-Z]{2,}$/.test(val),
      'Invalid domain format'
    ),
  description: z.string().max(1000).optional(),
});

// =============================================================================
// VERIFICATION REQUESTS
// =============================================================================

// Permission check request - used to verify if a specific action is permitted
export const permissionCheckSchema = z.object({
  action: z.string().min(1, 'action is required'),
  resource: z.string().optional(),
  context: z.record(z.unknown()).optional(),
});

export const verificationRequestSchema = z
  .object({
    credential_id: z.string().uuid().optional(),
    credential: z
      .object({
        credential_id: z.string().uuid(),
        agent_id: z.string(),
        agent_name: z.string(),
        agent_type: agentTypeSchema,
        issuer: z.object({
          issuer_id: z.string().uuid(),
          issuer_type: issuerTypeSchema,
          issuer_verified: z.boolean(),
          name: z.string(),
        }),
        permissions: permissionsSchema,
        constraints: z.object({
          valid_from: z.string().datetime(),
          valid_until: z.string().datetime(),
          geographic_restrictions: z.array(z.string()),
          allowed_services: z.array(z.string()),
        }),
        issued_at: z.string().datetime(),
        signature: z.string(),
      })
      .optional(),
    // Optional permission check - verifies if a specific action is permitted
    check_permission: permissionCheckSchema.optional(),
  })
  .refine((data) => data.credential_id || data.credential, {
    message: 'Either credential_id or credential must be provided',
  });

// =============================================================================
// BATCH VERIFICATION REQUESTS
// =============================================================================

const singleCredentialSchema = z
  .object({
    credential_id: z.string().uuid().optional(),
    credential: z
      .object({
        credential_id: z.string().uuid(),
        agent_id: z.string(),
        agent_name: z.string(),
        agent_type: agentTypeSchema,
        issuer: z.object({
          issuer_id: z.string().uuid(),
          issuer_type: issuerTypeSchema,
          issuer_verified: z.boolean(),
          name: z.string(),
        }),
        permissions: permissionsSchema,
        constraints: z.object({
          valid_from: z.string().datetime(),
          valid_until: z.string().datetime(),
          geographic_restrictions: z.array(z.string()),
          allowed_services: z.array(z.string()),
        }),
        issued_at: z.string().datetime(),
        signature: z.string(),
      })
      .optional(),
  })
  .refine((data) => data.credential_id || data.credential, {
    message: 'Either credential_id or credential must be provided',
  });

export const batchVerificationRequestSchema = z.object({
  credentials: z
    .array(singleCredentialSchema)
    .min(1, 'At least one credential is required')
    .max(100, 'Maximum 100 credentials per batch'),
  options: z
    .object({
      fail_fast: z.boolean().default(false),
      include_details: z.boolean().default(true),
    })
    .optional(),
});

// =============================================================================
// WEBHOOK REQUESTS
// =============================================================================

export const webhookEventSchema = z.enum([
  'credential.revoked',
  'credential.issued',
  'credential.expired',
  'authorization.requested',
  'authorization.responded',
]);

export const createWebhookRequestSchema = z.object({
  url: z.string().url('Invalid webhook URL'),
  events: z.array(webhookEventSchema).min(1).default(['credential.revoked']),
  description: z.string().max(500).optional(),
});

export const updateWebhookRequestSchema = z.object({
  url: z.string().url('Invalid webhook URL').optional(),
  events: z.array(webhookEventSchema).min(1).optional(),
  is_active: z.boolean().optional(),
  description: z.string().max(500).optional(),
});

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type IssueCredentialRequestInput = z.infer<typeof issueCredentialRequestSchema>;
export type RevokeCredentialRequestInput = z.infer<typeof revokeCredentialRequestSchema>;
export type RegisterIssuerRequestInput = z.infer<typeof registerIssuerRequestSchema>;
export type VerificationRequestInput = z.infer<typeof verificationRequestSchema>;
export type PermissionCheckInput = z.infer<typeof permissionCheckSchema>;
export type BatchVerificationRequestInput = z.infer<typeof batchVerificationRequestSchema>;
export type CreateWebhookRequestInput = z.infer<typeof createWebhookRequestSchema>;
export type UpdateWebhookRequestInput = z.infer<typeof updateWebhookRequestSchema>;
