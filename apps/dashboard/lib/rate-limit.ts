/**
 * Rate limiting utilities for API endpoints
 *
 * Uses in-memory storage. Note: This works per serverless instance,
 * so limits are not shared across instances on Vercel.
 * For production with strict limits, consider Upstash Redis.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetAt < now) {
        rateLimitStore.delete(key);
      }
    }
  }, 60000); // Clean every minute
}

export interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  limit: number;
  /** Time window in seconds */
  windowSeconds: number;
  /** Identifier for the rate limit (e.g., 'verify', 'batch') */
  identifier: string;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

/**
 * Check and update rate limit for a given key
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;
  const storeKey = `${config.identifier}:${key}`;

  let entry = rateLimitStore.get(storeKey);

  // Create new entry if none exists or window has expired
  if (!entry || entry.resetAt < now) {
    entry = {
      count: 0,
      resetAt: now + windowMs,
    };
  }

  // Check if limit exceeded
  if (entry.count >= config.limit) {
    return {
      success: false,
      limit: config.limit,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  // Increment count
  entry.count++;
  rateLimitStore.set(storeKey, entry);

  return {
    success: true,
    limit: config.limit,
    remaining: config.limit - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Get client identifier from request
 * Uses X-Forwarded-For header (Vercel), falls back to X-Real-IP, then 'anonymous'
 */
export function getClientIdentifier(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  return 'anonymous';
}

/**
 * Rate limit configurations for different endpoints
 */
export const RateLimits = {
  // Public verification endpoint
  verify: {
    limit: 100,
    windowSeconds: 60,
    identifier: 'verify',
  } as RateLimitConfig,

  // Batch verification (lower limit due to higher resource usage)
  batchVerify: {
    limit: 20,
    windowSeconds: 60,
    identifier: 'batch-verify',
  } as RateLimitConfig,

  // Reputation endpoints
  reputation: {
    limit: 60,
    windowSeconds: 60,
    identifier: 'reputation',
  } as RateLimitConfig,

  // Leaderboard (cacheable, higher limit)
  leaderboard: {
    limit: 120,
    windowSeconds: 60,
    identifier: 'leaderboard',
  } as RateLimitConfig,

  // Authentication attempts (strict)
  auth: {
    limit: 10,
    windowSeconds: 300,
    identifier: 'auth',
  } as RateLimitConfig,

  // Credential issuance (authenticated, moderate limit)
  issue: {
    limit: 30,
    windowSeconds: 60,
    identifier: 'issue',
  } as RateLimitConfig,

  // Webhook creation
  webhook: {
    limit: 10,
    windowSeconds: 60,
    identifier: 'webhook',
  } as RateLimitConfig,

  // Directory listing
  directory: {
    limit: 60,
    windowSeconds: 60,
    identifier: 'directory',
  } as RateLimitConfig,
} as const;

/**
 * Create rate limit headers for response
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetAt / 1000).toString(),
  };
}

/**
 * Create a rate limit exceeded response
 */
export function rateLimitExceededResponse(result: RateLimitResult): Response {
  const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);

  return new Response(
    JSON.stringify({
      error: 'Too many requests',
      message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
      retry_after: retryAfter,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': retryAfter.toString(),
        ...rateLimitHeaders(result),
      },
    }
  );
}

// ============================================================================
// Per-Permission Rate Limiting
// ============================================================================

// Store for per-permission rate limits (credential:permission -> count)
const permissionRateLimitStore = new Map<string, {
  minuteCount: number;
  minuteResetAt: number;
  dayCount: number;
  dayResetAt: number;
}>();

export interface PermissionRateLimitConfig {
  max_requests_per_minute?: number;
  max_requests_per_day?: number;
}

export interface PermissionRateLimitResult {
  allowed: boolean;
  reason?: string;
  minute_remaining?: number;
  day_remaining?: number;
}

/**
 * Check and update rate limit for a specific permission on a credential
 */
export function checkPermissionRateLimit(
  credentialId: string,
  permission: string,
  config: PermissionRateLimitConfig
): PermissionRateLimitResult {
  // If no rate limits configured, allow
  if (!config.max_requests_per_minute && !config.max_requests_per_day) {
    return { allowed: true };
  }

  const now = Date.now();
  const storeKey = `${credentialId}:${permission}`;

  let entry = permissionRateLimitStore.get(storeKey);

  // Initialize or reset windows
  if (!entry) {
    entry = {
      minuteCount: 0,
      minuteResetAt: now + 60000, // 1 minute
      dayCount: 0,
      dayResetAt: now + 86400000, // 24 hours
    };
  }

  // Reset minute window if expired
  if (entry.minuteResetAt < now) {
    entry.minuteCount = 0;
    entry.minuteResetAt = now + 60000;
  }

  // Reset day window if expired
  if (entry.dayResetAt < now) {
    entry.dayCount = 0;
    entry.dayResetAt = now + 86400000;
  }

  // Check minute limit
  if (config.max_requests_per_minute && entry.minuteCount >= config.max_requests_per_minute) {
    return {
      allowed: false,
      reason: `Rate limit exceeded: ${config.max_requests_per_minute} requests per minute`,
      minute_remaining: 0,
      day_remaining: config.max_requests_per_day ? config.max_requests_per_day - entry.dayCount : undefined,
    };
  }

  // Check day limit
  if (config.max_requests_per_day && entry.dayCount >= config.max_requests_per_day) {
    return {
      allowed: false,
      reason: `Rate limit exceeded: ${config.max_requests_per_day} requests per day`,
      minute_remaining: config.max_requests_per_minute ? config.max_requests_per_minute - entry.minuteCount : undefined,
      day_remaining: 0,
    };
  }

  // Increment counts
  entry.minuteCount++;
  entry.dayCount++;
  permissionRateLimitStore.set(storeKey, entry);

  return {
    allowed: true,
    minute_remaining: config.max_requests_per_minute ? config.max_requests_per_minute - entry.minuteCount : undefined,
    day_remaining: config.max_requests_per_day ? config.max_requests_per_day - entry.dayCount : undefined,
  };
}

/**
 * Get current rate limit status without incrementing
 */
export function getPermissionRateLimitStatus(
  credentialId: string,
  permission: string,
  config: PermissionRateLimitConfig
): {
  minute_count: number;
  minute_remaining: number;
  day_count: number;
  day_remaining: number;
} {
  const storeKey = `${credentialId}:${permission}`;
  const entry = permissionRateLimitStore.get(storeKey);
  const now = Date.now();

  if (!entry) {
    return {
      minute_count: 0,
      minute_remaining: config.max_requests_per_minute || Infinity,
      day_count: 0,
      day_remaining: config.max_requests_per_day || Infinity,
    };
  }

  const minuteCount = entry.minuteResetAt < now ? 0 : entry.minuteCount;
  const dayCount = entry.dayResetAt < now ? 0 : entry.dayCount;

  return {
    minute_count: minuteCount,
    minute_remaining: (config.max_requests_per_minute || Infinity) - minuteCount,
    day_count: dayCount,
    day_remaining: (config.max_requests_per_day || Infinity) - dayCount,
  };
}

/**
 * Extract rate limit config from permission conditions
 */
export function extractRateLimitConfig(conditions: unknown): PermissionRateLimitConfig | null {
  if (!conditions || typeof conditions !== 'object') {
    return null;
  }

  const cond = conditions as Record<string, unknown>;
  const config: PermissionRateLimitConfig = {};

  if (typeof cond.max_requests_per_minute === 'number') {
    config.max_requests_per_minute = cond.max_requests_per_minute;
  }

  if (typeof cond.max_requests_per_day === 'number') {
    config.max_requests_per_day = cond.max_requests_per_day;
  }

  return Object.keys(config).length > 0 ? config : null;
}
