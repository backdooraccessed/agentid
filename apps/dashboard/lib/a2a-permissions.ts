/**
 * A2A Permission Constraint Evaluation
 *
 * Evaluates permission constraints for A2A authorization checks.
 * Constraints can include time windows, rate limits, geographic restrictions, etc.
 */

import { createClient } from '@supabase/supabase-js';

// Service client for rate limit tracking
function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Permission constraints that can be evaluated
 */
export interface A2APermissionConstraints {
  time_window?: string; // e.g., "09:00-17:00"
  allowed_days?: string[]; // e.g., ["monday", "tuesday", "wednesday"]
  allowed_regions?: string[]; // e.g., ["US", "EU"]
  rate_limit_per_minute?: number;
  rate_limit_per_day?: number;
  custom?: Record<string, unknown>;
}

/**
 * Context for evaluating constraints
 */
export interface A2AEvaluationContext {
  /** Current region of the request */
  region?: string | null;
  /** Current hour (0-23) */
  currentHour?: number;
  /** Current day of week (lowercase) */
  currentDay?: string;
  /** Requester credential ID for rate limiting */
  requesterCredentialId?: string;
  /** Grantor credential ID for rate limiting */
  grantorCredentialId?: string;
  /** Authorization ID for rate limiting */
  authorizationId?: string;
  /** The action being checked */
  action?: string;
}

/**
 * Result of constraint evaluation
 */
export interface A2AConstraintEvaluationResult {
  granted: boolean;
  reason?: string;
  constraints_applied: string[];
  rate_limit_remaining?: number;
}

/**
 * Parse a time window string (e.g., "09:00-17:00") into hours
 */
function parseTimeWindow(window: string): { start: number; end: number } | null {
  const match = window.match(/^(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})$/);
  if (!match) return null;

  const startHour = parseInt(match[1], 10);
  const endHour = parseInt(match[3], 10);

  return { start: startHour, end: endHour };
}

/**
 * Check if current time is within a time window
 */
function isWithinTimeWindow(currentHour: number, window: string): boolean {
  const parsed = parseTimeWindow(window);
  if (!parsed) return true; // Invalid format, allow

  if (parsed.start <= parsed.end) {
    // Normal window (e.g., 09:00-17:00)
    return currentHour >= parsed.start && currentHour < parsed.end;
  } else {
    // Overnight window (e.g., 22:00-06:00)
    return currentHour >= parsed.start || currentHour < parsed.end;
  }
}

/**
 * Check if current day is in allowed days
 */
function isAllowedDay(currentDay: string, allowedDays: string[]): boolean {
  const normalizedCurrent = currentDay.toLowerCase();
  const normalizedAllowed = allowedDays.map((d) => d.toLowerCase());
  return normalizedAllowed.includes(normalizedCurrent);
}

/**
 * Check if region is allowed
 */
function isAllowedRegion(region: string | null | undefined, allowedRegions: string[]): boolean {
  if (!region) return true; // No region info, allow
  const normalizedRegion = region.toUpperCase();
  const normalizedAllowed = allowedRegions.map((r) => r.toUpperCase());
  return normalizedAllowed.includes(normalizedRegion);
}

// In-memory rate limit store (should use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Check and update rate limit
 */
async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<{ allowed: boolean; remaining: number }> {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now >= entry.resetAt) {
    // New window
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: limit - entry.count };
}

/**
 * Evaluate A2A permission constraints
 */
export async function evaluateA2AConstraints(
  constraints: A2APermissionConstraints | null | undefined,
  context: A2AEvaluationContext
): Promise<A2AConstraintEvaluationResult> {
  const constraintsApplied: string[] = [];

  // No constraints = always granted
  if (!constraints || Object.keys(constraints).length === 0) {
    return {
      granted: true,
      constraints_applied: [],
    };
  }

  // 1. Check time window
  if (constraints.time_window && context.currentHour !== undefined) {
    constraintsApplied.push('time_window');
    if (!isWithinTimeWindow(context.currentHour, constraints.time_window)) {
      return {
        granted: false,
        reason: `Request outside allowed time window: ${constraints.time_window}`,
        constraints_applied: constraintsApplied,
      };
    }
  }

  // 2. Check allowed days
  if (constraints.allowed_days && context.currentDay) {
    constraintsApplied.push('allowed_days');
    if (!isAllowedDay(context.currentDay, constraints.allowed_days)) {
      return {
        granted: false,
        reason: `Request not allowed on ${context.currentDay}. Allowed days: ${constraints.allowed_days.join(', ')}`,
        constraints_applied: constraintsApplied,
      };
    }
  }

  // 3. Check geographic restrictions
  if (constraints.allowed_regions && constraints.allowed_regions.length > 0) {
    constraintsApplied.push('allowed_regions');
    if (!isAllowedRegion(context.region, constraints.allowed_regions)) {
      return {
        granted: false,
        reason: `Request from region ${context.region || 'unknown'} not allowed. Allowed regions: ${constraints.allowed_regions.join(', ')}`,
        constraints_applied: constraintsApplied,
      };
    }
  }

  // 4. Check per-minute rate limit
  let rateLimitRemaining: number | undefined;
  if (constraints.rate_limit_per_minute && context.authorizationId && context.action) {
    constraintsApplied.push('rate_limit_per_minute');
    const key = `a2a:${context.authorizationId}:${context.action}:minute`;
    const result = await checkRateLimit(key, constraints.rate_limit_per_minute, 60 * 1000);
    rateLimitRemaining = result.remaining;

    if (!result.allowed) {
      return {
        granted: false,
        reason: `Rate limit exceeded: ${constraints.rate_limit_per_minute} requests per minute`,
        constraints_applied: constraintsApplied,
        rate_limit_remaining: 0,
      };
    }
  }

  // 5. Check per-day rate limit
  if (constraints.rate_limit_per_day && context.authorizationId && context.action) {
    constraintsApplied.push('rate_limit_per_day');
    const key = `a2a:${context.authorizationId}:${context.action}:day`;
    const result = await checkRateLimit(key, constraints.rate_limit_per_day, 24 * 60 * 60 * 1000);

    if (!result.allowed) {
      return {
        granted: false,
        reason: `Daily rate limit exceeded: ${constraints.rate_limit_per_day} requests per day`,
        constraints_applied: constraintsApplied,
        rate_limit_remaining: 0,
      };
    }
    rateLimitRemaining = Math.min(rateLimitRemaining ?? Infinity, result.remaining);
  }

  // All constraints passed
  return {
    granted: true,
    constraints_applied: constraintsApplied,
    rate_limit_remaining: rateLimitRemaining,
  };
}

/**
 * Match an action against a permission
 *
 * Supports wildcards:
 * - "read" matches "read"
 * - "data.*" matches "data.read", "data.write"
 * - "*" matches everything
 */
export function matchAction(permission: string, action: string): boolean {
  // Exact match
  if (permission === action) return true;

  // Wildcard match
  if (permission === '*') return true;

  // Prefix wildcard (e.g., "data.*" matches "data.read")
  if (permission.endsWith('.*')) {
    const prefix = permission.slice(0, -2);
    return action.startsWith(prefix + '.');
  }

  return false;
}

/**
 * Find matching permission from a list
 */
export function findMatchingPermission(
  permissions: Array<{ action: string; resource?: string; constraints?: A2APermissionConstraints }>,
  action: string,
  resource?: string
): { action: string; resource?: string; constraints?: A2APermissionConstraints } | null {
  for (const permission of permissions) {
    if (matchAction(permission.action, action)) {
      // If permission has a resource restriction, check it
      if (permission.resource && resource) {
        if (permission.resource === resource || permission.resource === '*') {
          return permission;
        }
      } else if (!permission.resource) {
        // Permission has no resource restriction
        return permission;
      }
    }
  }
  return null;
}

/**
 * Full A2A authorization check with constraint evaluation
 */
export async function checkA2AAuthorizationWithConstraints(params: {
  requesterCredentialId: string;
  grantorCredentialId: string;
  action: string;
  resource?: string;
  context?: Partial<A2AEvaluationContext>;
}): Promise<{
  authorized: boolean;
  authorization_id?: string;
  reason?: string;
  constraints_applied?: string[];
  valid_until?: string;
  rate_limit_remaining?: number;
}> {
  const { requesterCredentialId, grantorCredentialId, action, resource, context = {} } = params;

  const supabase = getServiceSupabase();

  // Find valid authorization
  const { data: authorizations, error } = await supabase
    .from('a2a_authorization_requests')
    .select('id, requested_permissions, constraints, valid_until')
    .eq('requester_credential_id', requesterCredentialId)
    .eq('grantor_credential_id', grantorCredentialId)
    .eq('status', 'approved')
    .or('valid_until.is.null,valid_until.gt.now()');

  if (error) {
    console.error('Failed to check authorization:', error);
    return { authorized: false, reason: 'Database error' };
  }

  if (!authorizations || authorizations.length === 0) {
    return { authorized: false, reason: 'No valid authorization found' };
  }

  // Check each authorization for matching permission
  for (const auth of authorizations) {
    const permissions = auth.requested_permissions as Array<{
      action: string;
      resource?: string;
      constraints?: A2APermissionConstraints;
    }>;

    const matchingPermission = findMatchingPermission(permissions, action, resource);
    if (!matchingPermission) continue;

    // Merge permission-level constraints with authorization-level constraints
    const mergedConstraints: A2APermissionConstraints = {
      ...(auth.constraints as A2APermissionConstraints || {}),
      ...(matchingPermission.constraints || {}),
    };

    // Evaluate constraints
    const evaluationContext: A2AEvaluationContext = {
      currentHour: context.currentHour ?? new Date().getHours(),
      currentDay: context.currentDay ?? new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase(),
      region: context.region,
      requesterCredentialId,
      grantorCredentialId,
      authorizationId: auth.id,
      action,
    };

    const constraintResult = await evaluateA2AConstraints(mergedConstraints, evaluationContext);

    if (constraintResult.granted) {
      return {
        authorized: true,
        authorization_id: auth.id,
        constraints_applied: constraintResult.constraints_applied,
        valid_until: auth.valid_until,
        rate_limit_remaining: constraintResult.rate_limit_remaining,
      };
    } else {
      // This authorization doesn't grant access due to constraints, try next
      continue;
    }
  }

  return { authorized: false, reason: 'No authorization with valid constraints found' };
}
