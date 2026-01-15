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
