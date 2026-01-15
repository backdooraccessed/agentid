import { describe, it, expect, beforeEach, vi } from 'vitest';

import { MemoryCache, getGlobalCache, setGlobalCache } from '../src/cache';

describe('MemoryCache', () => {
  let cache: MemoryCache;

  beforeEach(() => {
    cache = new MemoryCache(60000); // 1 minute default TTL
  });

  describe('get/set', () => {
    it('should store and retrieve values', () => {
      cache.set('key1', { value: 'test' });
      expect(cache.get('key1')).toEqual({ value: 'test' });
    });

    it('should return undefined for non-existent keys', () => {
      expect(cache.get('nonexistent')).toBeUndefined();
    });

    it('should return undefined for expired keys', async () => {
      cache.set('key1', { value: 'test' }, 10); // 10ms TTL
      await new Promise((resolve) => setTimeout(resolve, 20));
      expect(cache.get('key1')).toBeUndefined();
    });

    it('should use custom TTL', async () => {
      cache.set('key1', { value: 'test' }, 100);
      expect(cache.get('key1')).toEqual({ value: 'test' });

      await new Promise((resolve) => setTimeout(resolve, 150));
      expect(cache.get('key1')).toBeUndefined();
    });
  });

  describe('delete', () => {
    it('should delete existing keys', () => {
      cache.set('key1', { value: 'test' });
      expect(cache.delete('key1')).toBe(true);
      expect(cache.get('key1')).toBeUndefined();
    });

    it('should return false for non-existent keys', () => {
      expect(cache.delete('nonexistent')).toBe(false);
    });
  });

  describe('clear', () => {
    it('should remove all entries', () => {
      cache.set('key1', { value: '1' });
      cache.set('key2', { value: '2' });
      cache.set('key3', { value: '3' });

      cache.clear();

      expect(cache.size()).toBe(0);
      expect(cache.get('key1')).toBeUndefined();
    });
  });

  describe('size', () => {
    it('should return correct count', () => {
      expect(cache.size()).toBe(0);

      cache.set('key1', { value: '1' });
      expect(cache.size()).toBe(1);

      cache.set('key2', { value: '2' });
      expect(cache.size()).toBe(2);
    });
  });

  describe('getTtl', () => {
    it('should return remaining TTL', () => {
      cache.set('key1', { value: 'test' }, 10000);
      const ttl = cache.getTtl('key1');
      expect(ttl).toBeGreaterThan(9000);
      expect(ttl).toBeLessThanOrEqual(10000);
    });

    it('should return undefined for non-existent keys', () => {
      expect(cache.getTtl('nonexistent')).toBeUndefined();
    });

    it('should return undefined for expired keys', async () => {
      cache.set('key1', { value: 'test' }, 10);
      await new Promise((resolve) => setTimeout(resolve, 20));
      expect(cache.getTtl('key1')).toBeUndefined();
    });
  });

  describe('cleanupExpired', () => {
    it('should remove expired entries', async () => {
      cache.set('key1', { value: '1' }, 10);
      cache.set('key2', { value: '2' }, 10);
      cache.set('key3', { value: '3' }, 10000);

      await new Promise((resolve) => setTimeout(resolve, 20));

      const removed = cache.cleanupExpired();
      expect(removed).toBe(2);
      expect(cache.size()).toBe(1);
      expect(cache.get('key3')).toEqual({ value: '3' });
    });
  });
});

describe('Global Cache', () => {
  it('should return singleton', () => {
    const cache1 = getGlobalCache();
    const cache2 = getGlobalCache();
    expect(cache1).toBe(cache2);
  });

  it('should allow setting custom global cache', () => {
    const customCache = new MemoryCache(120000);
    setGlobalCache(customCache);
    expect(getGlobalCache()).toBe(customCache);
  });
});
