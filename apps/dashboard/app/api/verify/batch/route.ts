import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { batchVerificationRequestSchema } from '@agentid/shared';
import * as ed from '@noble/ed25519';
import {
  checkRateLimit,
  getClientIdentifier,
  RateLimits,
  rateLimitExceededResponse,
} from '@/lib/rate-limit';

// Maximum concurrent verifications to prevent overwhelming the database
const MAX_CONCURRENCY = 10;

// Error codes
const ErrorCodes = {
  INVALID_REQUEST: 'INVALID_REQUEST',
  MISSING_INPUT: 'MISSING_INPUT',
  CREDENTIAL_NOT_FOUND: 'CREDENTIAL_NOT_FOUND',
  CREDENTIAL_REVOKED: 'CREDENTIAL_REVOKED',
  CREDENTIAL_EXPIRED: 'CREDENTIAL_EXPIRED',
  CREDENTIAL_NOT_YET_VALID: 'CREDENTIAL_NOT_YET_VALID',
  INVALID_SIGNATURE: 'INVALID_SIGNATURE',
  ISSUER_NOT_FOUND: 'ISSUER_NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

// Generate request ID
function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// Lazy Supabase client
let supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!supabase) {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return supabase;
}

// Result type for individual verification
interface VerificationResult {
  index: number;
  valid: boolean;
  credential?: {
    agent_id: string;
    agent_name: string;
    agent_type: string;
    issuer: unknown;
    permissions: unknown;
    valid_until: string;
  };
  error?: {
    code: ErrorCode;
    message: string;
  };
}

// Verify a single credential by ID
async function verifyById(credentialId: string): Promise<{
  valid: boolean;
  credential?: VerificationResult['credential'];
  error?: { code: ErrorCode; message: string };
}> {
  const { data: dbCredential, error } = await getSupabase()
    .from('credentials')
    .select(`
      *,
      issuers!inner (public_key, is_verified, name, issuer_type)
    `)
    .eq('id', credentialId)
    .single();

  if (error || !dbCredential) {
    return {
      valid: false,
      error: { code: ErrorCodes.CREDENTIAL_NOT_FOUND, message: 'Credential not found' },
    };
  }

  if (dbCredential.status !== 'active') {
    return {
      valid: false,
      error: { code: ErrorCodes.CREDENTIAL_REVOKED, message: `Credential status: ${dbCredential.status}` },
    };
  }

  const now = new Date();
  const validFrom = new Date(dbCredential.valid_from);
  const validUntil = new Date(dbCredential.valid_until);

  if (now < validFrom) {
    return {
      valid: false,
      error: { code: ErrorCodes.CREDENTIAL_NOT_YET_VALID, message: 'Credential not yet valid' },
    };
  }

  if (now >= validUntil) {
    return {
      valid: false,
      error: { code: ErrorCodes.CREDENTIAL_EXPIRED, message: 'Credential expired' },
    };
  }

  const payload = dbCredential.credential_payload;
  const isSignatureValid = await verifySignature(payload, dbCredential.issuers.public_key);

  if (!isSignatureValid) {
    return {
      valid: false,
      error: { code: ErrorCodes.INVALID_SIGNATURE, message: 'Invalid signature' },
    };
  }

  return {
    valid: true,
    credential: {
      agent_id: payload.agent_id,
      agent_name: payload.agent_name,
      agent_type: payload.agent_type,
      issuer: payload.issuer,
      permissions: payload.permissions,
      valid_until: payload.constraints.valid_until,
    },
  };
}

// Verify a credential payload
async function verifyPayload(
  credential: {
    credential_id: string;
    agent_id: string;
    agent_name: string;
    agent_type: string;
    issuer: { issuer_id: string };
    permissions: unknown;
    constraints: { valid_from: string; valid_until: string };
    signature: string;
  }
): Promise<{
  valid: boolean;
  credential?: VerificationResult['credential'];
  error?: { code: ErrorCode; message: string };
}> {
  const now = new Date();
  const validFrom = new Date(credential.constraints.valid_from);
  const validUntil = new Date(credential.constraints.valid_until);

  if (now < validFrom) {
    return {
      valid: false,
      error: { code: ErrorCodes.CREDENTIAL_NOT_YET_VALID, message: 'Credential not yet valid' },
    };
  }

  if (now >= validUntil) {
    return {
      valid: false,
      error: { code: ErrorCodes.CREDENTIAL_EXPIRED, message: 'Credential expired' },
    };
  }

  const [issuerResult, credentialResult] = await Promise.all([
    getSupabase()
      .from('issuers')
      .select('public_key, is_verified')
      .eq('id', credential.issuer.issuer_id)
      .single(),
    getSupabase()
      .from('credentials')
      .select('status')
      .eq('id', credential.credential_id)
      .single(),
  ]);

  if (issuerResult.error || !issuerResult.data) {
    return {
      valid: false,
      error: { code: ErrorCodes.ISSUER_NOT_FOUND, message: 'Issuer not found' },
    };
  }

  if (credentialResult.data && credentialResult.data.status !== 'active') {
    return {
      valid: false,
      error: { code: ErrorCodes.CREDENTIAL_REVOKED, message: `Credential status: ${credentialResult.data.status}` },
    };
  }

  const isSignatureValid = await verifySignature(
    credential as unknown as Record<string, unknown>,
    issuerResult.data.public_key
  );

  if (!isSignatureValid) {
    return {
      valid: false,
      error: { code: ErrorCodes.INVALID_SIGNATURE, message: 'Invalid signature' },
    };
  }

  return {
    valid: true,
    credential: {
      agent_id: credential.agent_id,
      agent_name: credential.agent_name,
      agent_type: credential.agent_type,
      issuer: credential.issuer,
      permissions: credential.permissions,
      valid_until: credential.constraints.valid_until,
    },
  };
}

// Signature verification
async function verifySignature(
  payload: Record<string, unknown>,
  publicKey: string
): Promise<boolean> {
  try {
    const { signature, ...payloadWithoutSignature } = payload;
    if (!signature || typeof signature !== 'string') {
      return false;
    }

    const message = new TextEncoder().encode(canonicalJson(payloadWithoutSignature));
    const signatureBytes = new Uint8Array(base64DecodeToBuffer(signature));
    const publicKeyBytes = new Uint8Array(base64DecodeToBuffer(publicKey));

    return await ed.verifyAsync(signatureBytes, message, publicKeyBytes);
  } catch {
    return false;
  }
}

function base64DecodeToBuffer(str: string): ArrayBuffer {
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer as ArrayBuffer;
}

function canonicalJson(obj: unknown): string {
  if (obj === null || obj === undefined) {
    return JSON.stringify(obj);
  }
  if (typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalJson).join(',') + ']';
  }
  const keys = Object.keys(obj as Record<string, unknown>).sort();
  const pairs = keys.map(
    (key) => JSON.stringify(key) + ':' + canonicalJson((obj as Record<string, unknown>)[key])
  );
  return '{' + pairs.join(',') + '}';
}

// Process credentials with concurrency limit
async function processWithConcurrency<T, R>(
  items: T[],
  processor: (item: T, index: number) => Promise<R>,
  concurrency: number
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let currentIndex = 0;

  async function worker() {
    while (currentIndex < items.length) {
      const index = currentIndex++;
      results[index] = await processor(items[index], index);
    }
  }

  const workers = Array(Math.min(concurrency, items.length))
    .fill(null)
    .map(() => worker());

  await Promise.all(workers);
  return results;
}

export async function POST(request: NextRequest) {
  const startTime = performance.now();
  const requestId = generateRequestId();

  // Rate limiting (stricter for batch)
  const clientId = getClientIdentifier(request);
  const rateLimit = checkRateLimit(clientId, RateLimits.batchVerify);
  if (!rateLimit.success) {
    return rateLimitExceededResponse(rateLimit);
  }

  try {
    const body = await request.json();

    // Validate request
    const parsed = batchVerificationRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          results: [],
          summary: { total: 0, valid: 0, invalid: 0 },
          verification_time_ms: Math.round(performance.now() - startTime),
          request_id: requestId,
          error: {
            code: ErrorCodes.INVALID_REQUEST,
            message: 'Invalid request format',
            details: parsed.error.format(),
          },
        },
        { status: 400 }
      );
    }

    const { credentials, options } = parsed.data;
    const failFast = options?.fail_fast ?? false;
    const includeDetails = options?.include_details ?? true;

    // Process credentials with concurrency limit
    const results: VerificationResult[] = [];
    let validCount = 0;
    let invalidCount = 0;

    if (failFast) {
      // Sequential processing with early exit
      for (let i = 0; i < credentials.length; i++) {
        const cred = credentials[i];
        let result: VerificationResult;

        if (cred.credential_id) {
          const verifyResult = await verifyById(cred.credential_id);
          result = {
            index: i,
            valid: verifyResult.valid,
            credential: includeDetails ? verifyResult.credential : undefined,
            error: verifyResult.error,
          };
        } else if (cred.credential) {
          const verifyResult = await verifyPayload(cred.credential as Parameters<typeof verifyPayload>[0]);
          result = {
            index: i,
            valid: verifyResult.valid,
            credential: includeDetails ? verifyResult.credential : undefined,
            error: verifyResult.error,
          };
        } else {
          result = {
            index: i,
            valid: false,
            error: { code: ErrorCodes.MISSING_INPUT, message: 'Missing credential_id or credential' },
          };
        }

        results.push(result);
        if (result.valid) {
          validCount++;
        } else {
          invalidCount++;
          break; // Stop on first failure
        }
      }
    } else {
      // Parallel processing with concurrency limit
      const processedResults = await processWithConcurrency(
        credentials,
        async (cred, index) => {
          if (cred.credential_id) {
            const verifyResult = await verifyById(cred.credential_id);
            return {
              index,
              valid: verifyResult.valid,
              credential: includeDetails ? verifyResult.credential : undefined,
              error: verifyResult.error,
            };
          } else if (cred.credential) {
            const verifyResult = await verifyPayload(cred.credential as Parameters<typeof verifyPayload>[0]);
            return {
              index,
              valid: verifyResult.valid,
              credential: includeDetails ? verifyResult.credential : undefined,
              error: verifyResult.error,
            };
          } else {
            return {
              index,
              valid: false,
              error: { code: ErrorCodes.MISSING_INPUT as ErrorCode, message: 'Missing credential_id or credential' },
            };
          }
        },
        MAX_CONCURRENCY
      );

      results.push(...processedResults);
      validCount = results.filter((r) => r.valid).length;
      invalidCount = results.filter((r) => !r.valid).length;
    }

    // Log verifications (fire and forget)
    void (async () => {
      try {
        const logs = results.map((r) => ({
          credential_id: credentials[r.index].credential_id || credentials[r.index].credential?.credential_id || null,
          agent_id: r.credential?.agent_id || credentials[r.index].credential?.agent_id || null,
          is_valid: r.valid,
          failure_reason: r.error?.message || null,
          verification_time_ms: Math.round((performance.now() - startTime) / results.length),
        }));
        await getSupabase().from('verification_logs').insert(logs);
      } catch (err) {
        console.error(`[${requestId}] Failed to log batch verifications:`, err);
      }
    })();

    return NextResponse.json({
      results,
      summary: {
        total: credentials.length,
        valid: validCount,
        invalid: invalidCount,
      },
      verification_time_ms: Math.round(performance.now() - startTime),
      request_id: requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] Batch verification error:`, error);
    return NextResponse.json(
      {
        results: [],
        summary: { total: 0, valid: 0, invalid: 0 },
        verification_time_ms: Math.round(performance.now() - startTime),
        request_id: requestId,
        error: {
          code: ErrorCodes.INTERNAL_ERROR,
          message: 'Batch verification failed due to internal error',
        },
      },
      { status: 500 }
    );
  }
}
