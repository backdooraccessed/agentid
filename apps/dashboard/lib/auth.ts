/**
 * Authentication utilities supporting both session and API key auth
 */

import { createClient } from '@/lib/supabase/server';
import { validateApiKey, ApiKeyInfo, hasScope, ApiKeyScope, logApiKeyUsage } from '@/lib/api-keys';
import { NextRequest } from 'next/server';
import { getClientIdentifier } from '@/lib/rate-limit';

export interface AuthResult {
  authenticated: boolean;
  issuerId: string | null;
  userId: string | null;
  apiKeyInfo: ApiKeyInfo | null;
  error: string | null;
}

/**
 * Authenticate a request using session or API key
 */
export async function authenticateRequest(request: NextRequest): Promise<AuthResult> {
  // Check for API key in Authorization header
  const authHeader = request.headers.get('authorization');

  if (authHeader?.startsWith('Bearer agid_')) {
    // API key authentication
    const apiKey = authHeader.slice(7); // Remove "Bearer "
    const keyInfo = await validateApiKey(apiKey);

    if (!keyInfo) {
      return {
        authenticated: false,
        issuerId: null,
        userId: null,
        apiKeyInfo: null,
        error: 'Invalid or expired API key',
      };
    }

    return {
      authenticated: true,
      issuerId: keyInfo.issuerId,
      userId: null,
      apiKeyInfo: keyInfo,
      error: null,
    };
  }

  // Session authentication
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      authenticated: false,
      issuerId: null,
      userId: null,
      apiKeyInfo: null,
      error: 'Unauthorized',
    };
  }

  // Get issuer profile
  const { data: issuer } = await supabase
    .from('issuers')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!issuer) {
    return {
      authenticated: true,
      issuerId: null,
      userId: user.id,
      apiKeyInfo: null,
      error: 'Issuer profile not found',
    };
  }

  return {
    authenticated: true,
    issuerId: issuer.id,
    userId: user.id,
    apiKeyInfo: null,
    error: null,
  };
}

/**
 * Check if auth result has required scope (for API key auth)
 */
export function checkScope(auth: AuthResult, requiredScope: ApiKeyScope): boolean {
  // Session auth has all permissions
  if (auth.userId && !auth.apiKeyInfo) {
    return true;
  }

  // API key auth needs specific scope
  if (auth.apiKeyInfo) {
    return hasScope(auth.apiKeyInfo, requiredScope);
  }

  return false;
}

/**
 * Log API key usage after request completion
 */
export async function logRequestUsage(
  auth: AuthResult,
  request: NextRequest,
  statusCode: number,
  responseTimeMs: number
): Promise<void> {
  if (auth.apiKeyInfo) {
    const ipAddress = getClientIdentifier(request);
    const userAgent = request.headers.get('user-agent');

    await logApiKeyUsage(
      auth.apiKeyInfo.id,
      new URL(request.url).pathname,
      request.method,
      statusCode,
      responseTimeMs,
      ipAddress,
      userAgent
    );
  }
}
