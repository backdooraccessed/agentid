// =============================================================================
// AGENT TYPES
// =============================================================================

export const AGENT_TYPES = ['autonomous', 'supervised', 'hybrid'] as const;

export const AGENT_TYPE_LABELS: Record<(typeof AGENT_TYPES)[number], string> = {
  autonomous: 'Autonomous',
  supervised: 'Supervised',
  hybrid: 'Hybrid',
};

export const AGENT_TYPE_DESCRIPTIONS: Record<(typeof AGENT_TYPES)[number], string> = {
  autonomous: 'Operates independently without human oversight',
  supervised: 'Requires human approval for actions',
  hybrid: 'Mix of autonomous and supervised operations',
};

// =============================================================================
// ISSUER TYPES
// =============================================================================

export const ISSUER_TYPES = ['individual', 'organization', 'platform'] as const;

export const ISSUER_TYPE_LABELS: Record<(typeof ISSUER_TYPES)[number], string> = {
  individual: 'Individual',
  organization: 'Organization',
  platform: 'Platform',
};

// =============================================================================
// CREDENTIAL STATUS
// =============================================================================

export const CREDENTIAL_STATUSES = ['active', 'revoked', 'expired', 'suspended'] as const;

export const CREDENTIAL_STATUS_LABELS: Record<(typeof CREDENTIAL_STATUSES)[number], string> = {
  active: 'Active',
  revoked: 'Revoked',
  expired: 'Expired',
  suspended: 'Suspended',
};

// =============================================================================
// PERMISSIONS
// =============================================================================

export const PERMISSION_ACTIONS = [
  'read',
  'write',
  'transact',
  'communicate',
  'execute',
  'delete',
  'admin',
] as const;

export const PERMISSION_ACTION_LABELS: Record<(typeof PERMISSION_ACTIONS)[number], string> = {
  read: 'Read',
  write: 'Write',
  transact: 'Transact',
  communicate: 'Communicate',
  execute: 'Execute',
  delete: 'Delete',
  admin: 'Admin',
};

export const PERMISSION_ACTION_DESCRIPTIONS: Record<(typeof PERMISSION_ACTIONS)[number], string> = {
  read: 'Read data from services',
  write: 'Write or modify data',
  transact: 'Execute financial transactions',
  communicate: 'Send messages or notifications',
  execute: 'Execute code or run processes',
  delete: 'Delete or remove data',
  admin: 'Administrative operations',
};

export const PERMISSION_DOMAINS = [
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
] as const;

export const PERMISSION_DOMAIN_LABELS: Record<(typeof PERMISSION_DOMAINS)[number], string> = {
  finance: 'Finance',
  communication: 'Communication',
  data_access: 'Data Access',
  identity: 'Identity',
  contracts: 'Contracts',
  internal: 'Internal Systems',
  external_api: 'External APIs',
  code: 'Code Execution',
  user_data: 'User Data',
  financial: 'Financial',
  infrastructure: 'Infrastructure',
};

export const PERMISSION_DOMAIN_DESCRIPTIONS: Record<(typeof PERMISSION_DOMAINS)[number], string> = {
  finance: 'Financial services and transactions',
  communication: 'Email, messaging, and notifications',
  data_access: 'Database and file access',
  identity: 'Identity verification and management',
  contracts: 'Smart contracts and agreements',
  internal: 'Internal system access and operations',
  external_api: 'Third-party API access',
  code: 'Code execution and development tools',
  user_data: 'Customer and user data access',
  financial: 'Financial services and markets',
  infrastructure: 'Cloud and infrastructure resources',
};

// =============================================================================
// SIGNATURE
// =============================================================================

export const SIGNATURE_ALGORITHM = 'Ed25519';

// =============================================================================
// VALIDATION LIMITS
// =============================================================================

export const LIMITS = {
  AGENT_ID_MAX_LENGTH: 255,
  AGENT_NAME_MAX_LENGTH: 255,
  ISSUER_NAME_MAX_LENGTH: 255,
  DESCRIPTION_MAX_LENGTH: 1000,
  REVOCATION_REASON_MAX_LENGTH: 500,
  MAX_GEOGRAPHIC_RESTRICTIONS: 50,
  MAX_ALLOWED_SERVICES: 100,
  MAX_CREDENTIAL_VALIDITY_DAYS: 365,
} as const;

// =============================================================================
// CURRENCIES
// =============================================================================

export const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CNY'] as const;

// =============================================================================
// GEOGRAPHIC CODES (ISO 3166-1 alpha-2 subset)
// =============================================================================

export const COMMON_COUNTRY_CODES = [
  'US', 'GB', 'DE', 'FR', 'JP', 'CN', 'CA', 'AU', 'BR', 'IN',
  'IT', 'ES', 'NL', 'CH', 'SE', 'NO', 'DK', 'FI', 'SG', 'KR',
] as const;
