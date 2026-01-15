/**
 * Credential caching for AgentID SDK
 */

import type { CredentialCache } from './types';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  createdAt: number;
}

/**
 * In-memory credential cache with TTL support
 */
export class MemoryCache implements CredentialCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private readonly defaultTtl: number;

  /**
   * Create a new memory cache
   * @param defaultTtl Default TTL in milliseconds (default: 5 minutes)
   */
  constructor(defaultTtl = 5 * 60 * 1000) {
    this.defaultTtl = defaultTtl;
  }

  /**
   * Get a value from the cache
   */
  get(key: string): unknown {
    const entry = this.cache.get(key);
    if (!entry) {
      return undefined;
    }

    if (Date.now() >= entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.value;
  }

  /**
   * Set a value in the cache
   * @param key Cache key
   * @param value Value to cache
   * @param ttl TTL in milliseconds (uses default if not specified)
   */
  set(key: string, value: unknown, ttl?: number): void {
    const actualTtl = ttl ?? this.defaultTtl;
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + actualTtl,
      createdAt: Date.now(),
    });
  }

  /**
   * Delete a value from the cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all entries from the cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get the number of entries in the cache
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Get the TTL remaining for a key (in ms)
   */
  getTtl(key: string): number | undefined {
    const entry = this.cache.get(key);
    if (!entry || Date.now() >= entry.expiresAt) {
      return undefined;
    }
    return Math.max(0, entry.expiresAt - Date.now());
  }

  /**
   * Remove all expired entries
   */
  cleanupExpired(): number {
    let removed = 0;
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (now >= entry.expiresAt) {
        this.cache.delete(key);
        removed++;
      }
    }

    return removed;
  }
}

// Global cache instance
let globalCache: MemoryCache | undefined;

/**
 * Get or create the global credential cache
 */
export function getGlobalCache(): MemoryCache {
  if (!globalCache) {
    globalCache = new MemoryCache();
  }
  return globalCache;
}

/**
 * Set a custom global cache
 */
export function setGlobalCache(cache: MemoryCache): void {
  globalCache = cache;
}
