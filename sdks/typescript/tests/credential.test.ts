import { describe, it, expect, beforeEach, vi } from 'vitest';

import { AgentCredential } from '../src/credential';
import { MemoryCache } from '../src/cache';
import {
  CredentialNotFoundError,
  CredentialExpiredError,
  CredentialRevokedError,
} from '../src/errors';

describe('AgentCredential', () => {
  let cache: MemoryCache;

  beforeEach(() => {
    cache = new MemoryCache();
    vi.resetAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with credential ID', () => {
      const cred = new AgentCredential('cred_test');
      expect(cred.credentialId).toBe('cred_test');
      expect(cred.apiBase).toBe('https://agentid.dev/api');
      expect(cred.autoRefresh).toBe(true);
    });

    it('should accept custom options', () => {
      const cred = new AgentCredential('cred_test', {
        apiBase: 'https://custom.api.com/api',
        autoRefresh: false,
        refreshThreshold: 600,
        cache,
      });

      expect(cred.apiBase).toBe('https://custom.api.com/api');
      expect(cred.autoRefresh).toBe(false);
      expect(cred.refreshThreshold).toBe(600 * 1000);
    });

    it('should strip trailing slash from apiBase', () => {
      const cred = new AgentCredential('cred_test', {
        apiBase: 'https://api.example.com/',
      });
      expect(cred.apiBase).toBe('https://api.example.com');
    });
  });

  describe('properties', () => {
    it('should have correct cache key', () => {
      const cred = new AgentCredential('cred_abc123');
      expect(cred.cacheKey).toBe('credential:cred_abc123');
    });

    it('should report isLoaded as false initially', () => {
      const cred = new AgentCredential('cred_test');
      expect(cred.isLoaded).toBe(false);
    });

    it('should report isExpired as true when not loaded', () => {
      const cred = new AgentCredential('cred_test');
      expect(cred.isExpired).toBe(true);
    });

    it('should report timeToExpiry as 0 when not loaded', () => {
      const cred = new AgentCredential('cred_test');
      expect(cred.timeToExpiry).toBe(0);
    });
  });

  describe('getHeaders', () => {
    it('should generate required headers', async () => {
      const cred = new AgentCredential('cred_test');
      const headers = await cred.getHeaders('GET', 'https://api.example.com/data');

      expect(headers['X-AgentID-Credential']).toBe('cred_test');
      expect(headers['X-AgentID-Timestamp']).toBeDefined();
      expect(headers['X-AgentID-Nonce']).toBeDefined();
      expect(headers['X-AgentID-Signature']).toBeDefined();
    });

    it('should generate different nonces', async () => {
      const cred = new AgentCredential('cred_test');
      const headers1 = await cred.getHeaders('GET', 'https://api.example.com');
      const headers2 = await cred.getHeaders('GET', 'https://api.example.com');

      expect(headers1['X-AgentID-Nonce']).not.toBe(headers2['X-AgentID-Nonce']);
    });
  });

  describe('load', () => {
    it('should throw CredentialNotFoundError for non-existent credential', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({
          valid: false,
          error: 'Credential not found',
          error_code: 'CREDENTIAL_NOT_FOUND',
        }),
      };

      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      const cred = new AgentCredential('cred_nonexistent', { cache });

      await expect(cred.load()).rejects.toThrow(CredentialNotFoundError);
    });

    it('should throw CredentialExpiredError for expired credential', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({
          valid: false,
          error: 'Credential expired',
          error_code: 'CREDENTIAL_EXPIRED',
        }),
      };

      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      const cred = new AgentCredential('cred_expired', { cache });

      await expect(cred.load()).rejects.toThrow(CredentialExpiredError);
    });

    it('should throw CredentialRevokedError for revoked credential', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({
          valid: false,
          error: 'Credential revoked',
          error_code: 'CREDENTIAL_REVOKED',
        }),
      };

      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      const cred = new AgentCredential('cred_revoked', { cache });

      await expect(cred.load()).rejects.toThrow(CredentialRevokedError);
    });

    it('should successfully load valid credential', async () => {
      const validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const mockData = {
        valid: true,
        credential: {
          credential_id: 'cred_test',
          agent_id: 'agent_123',
          agent_name: 'Test Agent',
          issuer: {
            issuer_id: 'issuer_123',
            name: 'Test Issuer',
            is_verified: true,
          },
          permissions: ['read', 'write'],
          constraints: {
            valid_from: new Date().toISOString(),
            valid_until: validUntil,
          },
          signature: 'test_signature',
        },
        trust_score: 85,
      };

      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => mockData,
      };

      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      const cred = new AgentCredential('cred_test', { cache });
      const result = await cred.load();

      expect(cred.isLoaded).toBe(true);
      expect(result.agent_name).toBe('Test Agent');
      expect(result.agent_id).toBe('agent_123');
    });

    it('should use cache on second load', async () => {
      const validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const mockData = {
        valid: true,
        credential: {
          credential_id: 'cred_test',
          agent_id: 'agent_123',
          agent_name: 'Test Agent',
          issuer: { issuer_id: 'issuer_123', name: 'Test Issuer', is_verified: true },
          permissions: [],
          constraints: { valid_from: new Date().toISOString(), valid_until: validUntil },
          signature: 'sig',
        },
        trust_score: 80,
      };

      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => mockData,
      };

      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      const cred1 = new AgentCredential('cred_test', { cache });
      await cred1.load();
      expect(global.fetch).toHaveBeenCalledTimes(1);

      const cred2 = new AgentCredential('cred_test', { cache });
      await cred2.load();
      // Should use cache, not call API again
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should bypass cache when force=true', async () => {
      const validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const mockData = {
        valid: true,
        credential: {
          credential_id: 'cred_test',
          agent_id: 'agent_123',
          agent_name: 'Test Agent',
          issuer: { issuer_id: 'issuer_123', name: 'Test Issuer', is_verified: true },
          permissions: [],
          constraints: { valid_from: new Date().toISOString(), valid_until: validUntil },
          signature: 'sig',
        },
        trust_score: 80,
      };

      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => mockData,
      };

      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      const cred = new AgentCredential('cred_test', { cache });
      await cred.load();
      expect(global.fetch).toHaveBeenCalledTimes(1);

      await cred.load(true);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });
});
