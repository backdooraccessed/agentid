import { z } from 'zod';

// =============================================================================
// ENUMS
// =============================================================================

export const agentTypeSchema = z.enum(['autonomous', 'supervised', 'hybrid']);

export const issuerTypeSchema = z.enum(['individual', 'organization', 'platform']);

export const credentialStatusSchema = z.enum(['active', 'revoked', 'expired', 'suspended']);

export const permissionActionSchema = z.enum(['read', 'write', 'transact', 'communicate']);

export const permissionDomainSchema = z.enum([
  'finance',
  'communication',
  'data_access',
  'identity',
  'contracts',
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
    .regex(/^[a-zA-Z0-9][a-zA-Z0-9-]*\.[a-zA-Z]{2,}$/, 'Invalid domain format')
    .optional(),
  description: z.string().max(1000).optional(),
});

// =============================================================================
// VERIFICATION REQUESTS
// =============================================================================

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
  })
  .refine((data) => data.credential_id || data.credential, {
    message: 'Either credential_id or credential must be provided',
  });

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type IssueCredentialRequestInput = z.infer<typeof issueCredentialRequestSchema>;
export type RevokeCredentialRequestInput = z.infer<typeof revokeCredentialRequestSchema>;
export type RegisterIssuerRequestInput = z.infer<typeof registerIssuerRequestSchema>;
export type VerificationRequestInput = z.infer<typeof verificationRequestSchema>;
