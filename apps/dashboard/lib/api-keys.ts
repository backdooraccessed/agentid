/**
 * API Keys management utilities
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createHash, randomBytes } from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Lazy-initialized service client
let serviceClient: SupabaseClient | null = null;

function getServiceClient(): SupabaseClient {
  if (!serviceClient) {
    serviceClient = createClient(supabaseUrl, supabaseServiceKey);
  }
  return serviceClient;
}

/**
 * Available API key scopes
 */
export const ApiKeyScopes = {
  CREDENTIALS_READ: 'credentials:read',
  CREDENTIALS_WRITE: 'credentials:write',
  WEBHOOKS_READ: 'webhooks:read',
  WEBHOOKS_WRITE: 'webhooks:write',
  REPUTATION_READ: 'reputation:read',
} as const;

export type ApiKeyScope = (typeof ApiKeyScopes)[keyof typeof ApiKeyScopes];

/**
 * Generate a new API key
 * Format: agid_<prefix>_<random>
 */
export function generateApiKey(): { key: string; prefix: string; hash: string } {
  const prefix = randomBytes(4).toString('hex'); // 8 chars
  const secret = randomBytes(24).toString('hex'); // 48 chars
  const key = `agid_${prefix}_${secret}`;
  const hash = hashApiKey(key);

  return { key, prefix, hash };
}

/**
 * Hash an API key for storage
 */
export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

/**
 * Extract prefix from API key
 */
export function getKeyPrefix(key: string): string | null {
  const match = key.match(/^agid_([a-f0-9]{8})_/);
  return match ? match[1] : null;
}

/**
 * Validate API key format
 */
export function isValidKeyFormat(key: string): boolean {
  return /^agid_[a-f0-9]{8}_[a-f0-9]{48}$/.test(key);
}

/**
 * API key info returned after validation
 */
export interface ApiKeyInfo {
  id: string;
  issuerId: string;
  name: string;
  scopes: ApiKeyScope[];
  rateLimitOverride: number | null;
}

/**
 * Validate an API key and return its info
 */
export async function validateApiKey(key: string): Promise<ApiKeyInfo | null> {
  if (!isValidKeyFormat(key)) {
    return null;
  }

  const hash = hashApiKey(key);
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from('api_keys')
    .select('id, issuer_id, name, scopes, rate_limit_override, is_active, expires_at, usage_count')
    .eq('key_hash', hash)
    .single();

  if (error || !data) {
    return null;
  }

  // Check if active
  if (!data.is_active) {
    return null;
  }

  // Check expiration
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return null;
  }

  // Update last used
  void supabase
    .from('api_keys')
    .update({
      last_used_at: new Date().toISOString(),
      usage_count: data.usage_count + 1,
    })
    .eq('id', data.id);

  return {
    id: data.id,
    issuerId: data.issuer_id,
    name: data.name,
    scopes: data.scopes as ApiKeyScope[],
    rateLimitOverride: data.rate_limit_override,
  };
}

/**
 * Check if API key has required scope
 */
export function hasScope(keyInfo: ApiKeyInfo, requiredScope: ApiKeyScope): boolean {
  return keyInfo.scopes.includes(requiredScope);
}

/**
 * Log API key usage
 */
export async function logApiKeyUsage(
  apiKeyId: string,
  endpoint: string,
  method: string,
  statusCode: number,
  responseTimeMs: number,
  ipAddress: string | null,
  userAgent: string | null
): Promise<void> {
  const supabase = getServiceClient();

  await supabase.from('api_key_usage').insert({
    api_key_id: apiKeyId,
    endpoint,
    method,
    status_code: statusCode,
    response_time_ms: responseTimeMs,
    ip_address: ipAddress,
    user_agent: userAgent,
  });
}

/**
 * Create a new API key for an issuer
 */
export async function createApiKey(
  issuerId: string,
  name: string,
  description: string | null,
  scopes: ApiKeyScope[],
  expiresAt: Date | null
): Promise<{ id: string; key: string } | null> {
  const supabase = getServiceClient();
  const { key, prefix, hash } = generateApiKey();

  const { data, error } = await supabase
    .from('api_keys')
    .insert({
      issuer_id: issuerId,
      name,
      description,
      key_hash: hash,
      key_prefix: prefix,
      scopes,
      expires_at: expiresAt?.toISOString() || null,
    })
    .select('id')
    .single();

  if (error || !data) {
    console.error('Failed to create API key:', error);
    return null;
  }

  // Return the actual key (only time it's available)
  return { id: data.id, key };
}

/**
 * Revoke an API key
 */
export async function revokeApiKey(keyId: string, issuerId: string): Promise<boolean> {
  const supabase = getServiceClient();

  const { error } = await supabase
    .from('api_keys')
    .update({ is_active: false })
    .eq('id', keyId)
    .eq('issuer_id', issuerId);

  return !error;
}

/**
 * Delete an API key
 */
export async function deleteApiKey(keyId: string, issuerId: string): Promise<boolean> {
  const supabase = getServiceClient();

  const { error } = await supabase
    .from('api_keys')
    .delete()
    .eq('id', keyId)
    .eq('issuer_id', issuerId);

  return !error;
}

/**
 * List API keys for an issuer (without the actual keys)
 */
export async function listApiKeys(issuerId: string): Promise<Array<{
  id: string;
  name: string;
  description: string | null;
  keyPrefix: string;
  scopes: ApiKeyScope[];
  isActive: boolean;
  lastUsedAt: string | null;
  usageCount: number;
  expiresAt: string | null;
  createdAt: string;
}>> {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from('api_keys')
    .select(`
      id,
      name,
      description,
      key_prefix,
      scopes,
      is_active,
      last_used_at,
      usage_count,
      expires_at,
      created_at
    `)
    .eq('issuer_id', issuerId)
    .order('created_at', { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((key) => ({
    id: key.id,
    name: key.name,
    description: key.description,
    keyPrefix: key.key_prefix,
    scopes: key.scopes as ApiKeyScope[],
    isActive: key.is_active,
    lastUsedAt: key.last_used_at,
    usageCount: key.usage_count,
    expiresAt: key.expires_at,
    createdAt: key.created_at,
  }));
}

/**
 * Get API key usage stats
 */
export async function getApiKeyUsageStats(
  apiKeyId: string,
  days: number = 7
): Promise<{
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgResponseTime: number;
  requestsByEndpoint: Record<string, number>;
}> {
  const supabase = getServiceClient();
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabase
    .from('api_key_usage')
    .select('endpoint, status_code, response_time_ms')
    .eq('api_key_id', apiKeyId)
    .gte('created_at', since.toISOString());

  if (error || !data) {
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      avgResponseTime: 0,
      requestsByEndpoint: {},
    };
  }

  const totalRequests = data.length;
  const successfulRequests = data.filter((r) => r.status_code >= 200 && r.status_code < 300).length;
  const failedRequests = totalRequests - successfulRequests;
  const avgResponseTime = data.length > 0
    ? data.reduce((sum, r) => sum + (r.response_time_ms || 0), 0) / data.length
    : 0;

  const requestsByEndpoint: Record<string, number> = {};
  for (const req of data) {
    requestsByEndpoint[req.endpoint] = (requestsByEndpoint[req.endpoint] || 0) + 1;
  }

  return {
    totalRequests,
    successfulRequests,
    failedRequests,
    avgResponseTime: Math.round(avgResponseTime),
    requestsByEndpoint,
  };
}
