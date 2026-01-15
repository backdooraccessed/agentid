import { describe, it, expect, beforeEach, vi } from 'vitest';

import { CredentialVerifier, checkPermission } from '../src/verifier';
import { MemoryCache } from '../src/cache';

describe('CredentialVerifier', () => {
  let verifier: CredentialVerifier;
  let cache: MemoryCache;

  beforeEach(() => {
    cache = new MemoryCache();
    verifier = new CredentialVerifier({ cache });
    vi.resetAllMocks();
  });

  describe('initialization', () => {
    it('should use defaults', () => {
      const v = new CredentialVerifier();
      expect(v).toBeDefined();
    });

    it('should accept custom options', () => {
      const v = new CredentialVerifier({
        apiBase: 'https://custom.api.com/api',
        cacheTtl: 10000,
        verifySignature: false,
        signatureMaxAge: 600,
      });
      expect(v).toBeDefined();
    });
  });

  describe('verifyRequest', () => {
    it('should fail with missing credential header', async () => {
      const result = await verifier.verifyRequest({
        headers: {},
        method: 'GET',
        url: 'https://api.example.com/data',
      });

      expect(result.valid).toBe(false);
      expect(result.error_code).toBe('MISSING_CREDENTIAL');
    });

    it('should fail with missing signature headers', async () => {
      const result = await verifier.verifyRequest({
        headers: { 'X-AgentID-Credential': 'cred_123' },
        method: 'GET',
        url: 'https://api.example.com/data',
      });

      expect(result.valid).toBe(false);
      expect(result.error_code).toBe('MISSING_SIGNATURE');
    });

    it('should fail with expired timestamp', async () => {
      const oldTimestamp = String(Math.floor(Date.now() / 1000) - 600);

      const result = await verifier.verifyRequest({
        headers: {
          'X-AgentID-Credential': 'cred_123',
          'X-AgentID-Timestamp': oldTimestamp,
          'X-AgentID-Signature': 'sig_abc',
        },
        method: 'GET',
        url: 'https://api.example.com/data',
      });

      expect(result.valid).toBe(false);
      expect(result.error_code).toBe('SIGNATURE_EXPIRED');
    });

    it('should fail with invalid timestamp', async () => {
      const result = await verifier.verifyRequest({
        headers: {
          'X-AgentID-Credential': 'cred_123',
          'X-AgentID-Timestamp': 'not_a_number',
          'X-AgentID-Signature': 'sig_abc',
        },
        method: 'GET',
        url: 'https://api.example.com/data',
      });

      expect(result.valid).toBe(false);
      expect(result.error_code).toBe('INVALID_TIMESTAMP');
    });

    it('should handle case-insensitive headers', async () => {
      // With signature verification disabled for this test
      const v = new CredentialVerifier({ cache, verifySignature: false });

      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({
          valid: true,
          credential: {
            credential_id: 'cred_123',
            agent_id: 'agent_123',
            agent_name: 'Test',
            issuer: { issuer_id: 'i', name: 'Test', is_verified: true },
            permissions: [],
            constraints: {
              valid_from: new Date().toISOString(),
              valid_until: new Date(Date.now() + 86400000).toISOString(),
            },
            signature: 'sig',
          },
          trust_score: 80,
        }),
      };

      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      const result = await v.verifyRequest({
        headers: {
          'x-agentid-credential': 'cred_123',
        },
        method: 'GET',
        url: 'https://api.example.com/data',
      });

      expect(result.valid).toBe(true);
    });
  });
});

describe('checkPermission', () => {
  describe('string permissions', () => {
    it('should match exact action', () => {
      const result = checkPermission(['read', 'write'], {
        resource: 'any',
        action: 'read',
      });
      expect(result.granted).toBe(true);
    });

    it('should reject non-matching action', () => {
      const result = checkPermission(['read'], {
        resource: 'any',
        action: 'write',
      });
      expect(result.granted).toBe(false);
    });

    it('should match wildcard', () => {
      const result = checkPermission(['*'], {
        resource: 'any',
        action: 'delete',
      });
      expect(result.granted).toBe(true);
    });
  });

  describe('structured permissions', () => {
    it('should match resource pattern', () => {
      const permissions = [
        {
          resource: 'https://api.example.com/users/*',
          actions: ['read', 'write'],
        },
      ];

      const result = checkPermission(permissions, {
        resource: 'https://api.example.com/users/123',
        action: 'read',
      });
      expect(result.granted).toBe(true);
    });

    it('should reject non-matching resource', () => {
      const permissions = [
        {
          resource: 'https://api.example.com/users/*',
          actions: ['read'],
        },
      ];

      const result = checkPermission(permissions, {
        resource: 'https://api.example.com/admin/settings',
        action: 'read',
      });
      expect(result.granted).toBe(false);
    });

    it('should reject non-matching action', () => {
      const permissions = [
        {
          resource: 'https://api.example.com/users/*',
          actions: ['read'],
        },
      ];

      const result = checkPermission(permissions, {
        resource: 'https://api.example.com/users/123',
        action: 'write',
      });
      expect(result.granted).toBe(false);
    });

    it('should enforce amount limit', () => {
      const permissions = [
        {
          resource: 'https://api.example.com/payments/*',
          actions: ['write'],
          conditions: {
            max_transaction_amount: 10000,
          },
        },
      ];

      // Within limit
      let result = checkPermission(permissions, {
        resource: 'https://api.example.com/payments/new',
        action: 'write',
        context: { amount: 5000 },
      });
      expect(result.granted).toBe(true);

      // Exceeds limit
      result = checkPermission(permissions, {
        resource: 'https://api.example.com/payments/new',
        action: 'write',
        context: { amount: 50000 },
      });
      expect(result.granted).toBe(false);
      expect(result.reason).toContain('exceeds limit');
    });

    it('should enforce region restriction', () => {
      const permissions = [
        {
          resource: 'https://api.example.com/*',
          actions: ['read'],
          conditions: {
            allowed_regions: ['US', 'EU'],
          },
        },
      ];

      // Allowed region
      let result = checkPermission(permissions, {
        resource: 'https://api.example.com/data',
        action: 'read',
        context: { region: 'US' },
      });
      expect(result.granted).toBe(true);

      // Disallowed region
      result = checkPermission(permissions, {
        resource: 'https://api.example.com/data',
        action: 'read',
        context: { region: 'CN' },
      });
      expect(result.granted).toBe(false);
      expect(result.reason).toContain('not allowed');
    });

    it('should check multiple permissions', () => {
      const permissions = [
        {
          resource: 'https://api.example.com/users/*',
          actions: ['read'],
        },
        {
          resource: 'https://api.example.com/admin/*',
          actions: ['read', 'write'],
        },
      ];

      // First permission matches
      let result = checkPermission(permissions, {
        resource: 'https://api.example.com/users/123',
        action: 'read',
      });
      expect(result.granted).toBe(true);

      // Second permission matches
      result = checkPermission(permissions, {
        resource: 'https://api.example.com/admin/settings',
        action: 'write',
      });
      expect(result.granted).toBe(true);

      // Neither matches
      result = checkPermission(permissions, {
        resource: 'https://api.example.com/users/123',
        action: 'write',
      });
      expect(result.granted).toBe(false);
    });
  });
});
