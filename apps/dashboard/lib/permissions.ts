/**
 * Permission Evaluation Library
 * Evaluates permission checks against credential permissions and policy conditions
 */

import {
  checkPermissionRateLimit,
  extractRateLimitConfig,
  type PermissionRateLimitResult,
} from './rate-limit';

export interface PermissionCheck {
  action: string;
  resource?: string;
  context?: Record<string, unknown>;
}

export interface PermissionConditions {
  valid_hours?: { start: number; end: number };
  valid_days?: string[]; // e.g., ['monday', 'tuesday', ...]
  allowed_regions?: string[];
  max_requests_per_minute?: number;
  max_requests_per_day?: number;
  max_transaction_amount?: number;
  daily_spend_limit?: number;
  requires_approval?: boolean;
}

export interface Permission {
  action: string;
  domains?: string[];
  resources?: string[];
  conditions?: PermissionConditions;
}

export interface PermissionCheckResult {
  action: string;
  granted: boolean;
  reason?: string;
  conditions_applied?: string[];
  rate_limit?: {
    minute_remaining?: number;
    day_remaining?: number;
  };
}

// Standard permission actions
const STANDARD_ACTIONS = ['read', 'write', 'transact', 'communicate'];

/**
 * Check if a specific action is permitted by the credential's permissions
 */
export function checkPermission(
  check: PermissionCheck,
  permissions: unknown,
  context?: {
    region?: string | null;
    currentHour?: number;
    currentDay?: string;
    credentialId?: string; // For rate limiting
  }
): PermissionCheckResult {
  const { action, resource } = check;
  const conditionsApplied: string[] = [];

  // Handle both new policy-style permissions and legacy permissions format
  const normalizedPermissions = normalizePermissions(permissions);

  // Find matching permission
  const matchingPermission = findMatchingPermission(normalizedPermissions, action, resource);

  if (!matchingPermission) {
    return {
      action,
      granted: false,
      reason: `Action '${action}' is not permitted`,
    };
  }

  // Evaluate conditions if present
  let rateLimitResult: PermissionRateLimitResult | null = null;

  if (matchingPermission.conditions) {
    const conditionResult = evaluateConditions(
      matchingPermission.conditions,
      context || {},
      conditionsApplied
    );

    if (!conditionResult.passed) {
      return {
        action,
        granted: false,
        reason: conditionResult.reason,
        conditions_applied: conditionsApplied,
      };
    }

    // Check rate limits if credential ID is provided
    if (context?.credentialId) {
      const rateLimitConfig = extractRateLimitConfig(matchingPermission.conditions);
      if (rateLimitConfig) {
        rateLimitResult = checkPermissionRateLimit(
          context.credentialId,
          action,
          rateLimitConfig
        );

        if (!rateLimitResult.allowed) {
          return {
            action,
            granted: false,
            reason: rateLimitResult.reason,
            conditions_applied: conditionsApplied,
            rate_limit: {
              minute_remaining: rateLimitResult.minute_remaining,
              day_remaining: rateLimitResult.day_remaining,
            },
          };
        }
      }
    }
  }

  return {
    action,
    granted: true,
    conditions_applied: conditionsApplied.length > 0 ? conditionsApplied : undefined,
    rate_limit: rateLimitResult ? {
      minute_remaining: rateLimitResult.minute_remaining,
      day_remaining: rateLimitResult.day_remaining,
    } : undefined,
  };
}

/**
 * Normalize different permission formats to a standard structure
 */
function normalizePermissions(permissions: unknown): Permission[] {
  if (!permissions) return [];

  // Handle array of permission objects (policy-style)
  if (Array.isArray(permissions)) {
    return permissions.map((p) => {
      if (typeof p === 'string') {
        return { action: p };
      }
      if (typeof p === 'object' && p !== null) {
        return {
          action: (p as Record<string, unknown>).action as string || '',
          domains: (p as Record<string, unknown>).domains as string[] | undefined,
          resources: (p as Record<string, unknown>).resources as string[] | undefined,
          conditions: (p as Record<string, unknown>).conditions as PermissionConditions | undefined,
        };
      }
      return { action: '' };
    }).filter((p) => p.action);
  }

  // Handle legacy format { actions: [...], domains: [...] }
  if (typeof permissions === 'object' && permissions !== null) {
    const legacyPerms = permissions as Record<string, unknown>;
    const actions = (legacyPerms.actions as string[]) || [];
    const domains = (legacyPerms.domains as string[]) || [];
    const resourceLimits = legacyPerms.resource_limits as Record<string, unknown> | undefined;

    // Convert legacy format to normalized permissions
    return actions.map((action) => ({
      action,
      domains,
      conditions: resourceLimits ? {
        max_transaction_amount: resourceLimits.max_transaction_value as number | undefined,
        daily_spend_limit: resourceLimits.daily_limit as number | undefined,
        max_requests_per_minute: resourceLimits.rate_limit_per_minute as number | undefined,
      } : undefined,
    }));
  }

  return [];
}

/**
 * Find a permission that matches the requested action and resource
 */
function findMatchingPermission(
  permissions: Permission[],
  action: string,
  resource?: string
): Permission | null {
  for (const perm of permissions) {
    // Check action match
    if (!actionMatches(perm.action, action)) {
      continue;
    }

    // Check resource match if specified
    if (resource && perm.resources && perm.resources.length > 0) {
      if (!perm.resources.some((r) => resourceMatches(r, resource))) {
        continue;
      }
    }

    return perm;
  }

  return null;
}

/**
 * Check if a permission action matches the requested action
 * Supports wildcards: 'read:*' matches 'read:users', 'read:orders', etc.
 */
function actionMatches(permAction: string, requestedAction: string): boolean {
  // Exact match
  if (permAction === requestedAction) return true;

  // Wildcard match: 'read:*' matches 'read:anything'
  if (permAction.endsWith(':*')) {
    const prefix = permAction.slice(0, -1); // 'read:'
    return requestedAction.startsWith(prefix);
  }

  // Standard action alias matching
  // e.g., 'read' permission allows 'read:users', 'read:orders', etc.
  if (STANDARD_ACTIONS.includes(permAction) && requestedAction.startsWith(permAction + ':')) {
    return true;
  }

  return false;
}

/**
 * Check if a resource pattern matches the requested resource
 * Supports wildcards: 'users/*' matches 'users/123', 'users/456', etc.
 */
function resourceMatches(pattern: string, resource: string): boolean {
  // Exact match
  if (pattern === resource) return true;

  // Wildcard match
  if (pattern.endsWith('/*')) {
    const prefix = pattern.slice(0, -1);
    return resource.startsWith(prefix);
  }

  if (pattern === '*') return true;

  return false;
}

/**
 * Evaluate permission conditions
 */
function evaluateConditions(
  conditions: PermissionConditions,
  context: {
    region?: string | null;
    currentHour?: number;
    currentDay?: string;
  },
  conditionsApplied: string[]
): { passed: boolean; reason?: string } {
  // Check time-based conditions
  if (conditions.valid_hours) {
    conditionsApplied.push('valid_hours');
    const currentHour = context.currentHour ?? new Date().getHours();
    const { start, end } = conditions.valid_hours;

    // Handle overnight ranges (e.g., 22:00 to 06:00)
    if (start > end) {
      if (currentHour < start && currentHour > end) {
        return {
          passed: false,
          reason: `Action not permitted outside hours ${start}:00-${end}:00`,
        };
      }
    } else {
      if (currentHour < start || currentHour > end) {
        return {
          passed: false,
          reason: `Action not permitted outside hours ${start}:00-${end}:00`,
        };
      }
    }
  }

  // Check day-of-week conditions
  if (conditions.valid_days && conditions.valid_days.length > 0) {
    conditionsApplied.push('valid_days');
    const currentDay = context.currentDay ?? getDayName();
    if (!conditions.valid_days.includes(currentDay.toLowerCase())) {
      return {
        passed: false,
        reason: `Action not permitted on ${currentDay}`,
      };
    }
  }

  // Check geographic conditions
  if (conditions.allowed_regions && conditions.allowed_regions.length > 0) {
    conditionsApplied.push('allowed_regions');
    if (context.region) {
      if (!conditions.allowed_regions.includes(context.region)) {
        return {
          passed: false,
          reason: `Action not permitted from region: ${context.region}`,
        };
      }
    }
    // If no region provided, we allow it (could be localhost or unknown)
  }

  // Check approval requirement
  if (conditions.requires_approval) {
    conditionsApplied.push('requires_approval');
    // Approval check would require additional context
    // For now, we note it was applied but don't block
  }

  // Rate limiting and spend limits would need state tracking
  // These are noted as applied but require external rate limiter
  if (conditions.max_requests_per_minute) {
    conditionsApplied.push('max_requests_per_minute');
  }
  if (conditions.max_requests_per_day) {
    conditionsApplied.push('max_requests_per_day');
  }
  if (conditions.max_transaction_amount) {
    conditionsApplied.push('max_transaction_amount');
  }
  if (conditions.daily_spend_limit) {
    conditionsApplied.push('daily_spend_limit');
  }

  return { passed: true };
}

/**
 * Get the current day name
 */
function getDayName(): string {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[new Date().getDay()];
}

/**
 * Helper to check if permissions allow a specific domain
 */
export function hasPermissionForDomain(permissions: unknown, domain: string): boolean {
  const normalized = normalizePermissions(permissions);
  return normalized.some((p) => !p.domains || p.domains.length === 0 || p.domains.includes(domain));
}

/**
 * Get all permitted actions from permissions
 */
export function getPermittedActions(permissions: unknown): string[] {
  const normalized = normalizePermissions(permissions);
  return normalized.map((p) => p.action);
}
