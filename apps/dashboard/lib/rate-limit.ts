/**
 * Rate limiting utilities for API endpoints
 *
 * Uses Upstash Redis for distributed rate limiting across serverless instances.
 * Falls back to in-memory storage if Upstash is not configured (development).
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Check if Upstash is configured
const isUpstashConfigured = !!(
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
);

// Initialize Redis client (only if configured)
const redis = isUpstashConfigured
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

// In-memory fallback for development
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const inMemoryStore = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically (only for in-memory)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of inMemoryStore.entries()) {
      if (entry.resetAt < now) {
        inMemoryStore.delete(key);
      }
    }
  }, 60000);
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

// Cache for Upstash rate limiters (created per config)
const rateLimiterCache = new Map<string, Ratelimit>();

/**
 * Get or create an Upstash rate limiter for a given config
 */
function getUpstashRateLimiter(config: RateLimitConfig): Ratelimit {
  const cacheKey = `${config.identifier}:${config.limit}:${config.windowSeconds}`;

  if (!rateLimiterCache.has(cacheKey)) {
    const limiter = new Ratelimit({
      redis: redis!,
      limiter: Ratelimit.slidingWindow(config.limit, `${config.windowSeconds} s`),
      prefix: `ratelimit:${config.identifier}`,
      analytics: true,
    });
    rateLimiterCache.set(cacheKey, limiter);
  }

  return rateLimiterCache.get(cacheKey)!;
}

/**
 * In-memory rate limit check (fallback for development)
 */
function checkRateLimitInMemory(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;
  const storeKey = `${config.identifier}:${key}`;

  let entry = inMemoryStore.get(storeKey);

  if (!entry || entry.resetAt < now) {
    entry = {
      count: 0,
      resetAt: now + windowMs,
    };
  }

  if (entry.count >= config.limit) {
    return {
      success: false,
      limit: config.limit,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  entry.count++;
  inMemoryStore.set(storeKey, entry);

  return {
    success: true,
    limit: config.limit,
    remaining: config.limit - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Check and update rate limit for a given key
 * Uses Upstash Redis if configured, falls back to in-memory
 */
export async function checkRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  // Use in-memory fallback if Upstash is not configured
  if (!isUpstashConfigured || !redis) {
    return checkRateLimitInMemory(key, config);
  }

  try {
    const limiter = getUpstashRateLimiter(config);
    const result = await limiter.limit(key);

    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      resetAt: result.reset,
    };
  } catch (error) {
    // Log error but don't block requests if rate limiting fails
    console.error('Rate limit check failed, allowing request:', error);
    return {
      success: true,
      limit: config.limit,
      remaining: config.limit - 1,
      resetAt: Date.now() + config.windowSeconds * 1000,
    };
  }
}

/**
 * Synchronous version for backwards compatibility
 * Note: This will use in-memory if Upstash is configured but called synchronously
 * Prefer using the async version when possible
 */
export function checkRateLimitSync(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  // Always use in-memory for sync version
  return checkRateLimitInMemory(key, config);
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
