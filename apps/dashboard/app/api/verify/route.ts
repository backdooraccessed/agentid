import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { verificationRequestSchema } from '@agentid/shared';
import * as ed from '@noble/ed25519';
import { updateAgentReputation } from '@/lib/reputation';

// Error codes for structured error responses
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

type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

// Generate request ID for correlation
function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// Lazy initialization of Supabase client for public access
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

export async function POST(request: NextRequest) {
  const startTime = performance.now();
  const requestId = generateRequestId();

  try {
    const body = await request.json();

    // Validate request
    const parsed = verificationRequestSchema.safeParse(body);
    if (!parsed.success) {
      return logAndRespond({
        credentialId: null,
        agentId: null,
        isValid: false,
        errorCode: ErrorCodes.INVALID_REQUEST,
        failureReason: 'Invalid request format',
        startTime,
        requestId,
      });
    }

    const { credential_id, credential } = parsed.data;

    // Route 1: Verify by credential_id (database lookup)
    if (credential_id) {
      return await verifyById(credential_id, startTime, requestId);
    }

    // Route 2: Verify provided credential payload
    if (credential) {
      return await verifyPayload(credential, startTime, requestId);
    }

    return logAndRespond({
      credentialId: null,
      agentId: null,
      isValid: false,
      errorCode: ErrorCodes.MISSING_INPUT,
      failureReason: 'Must provide credential_id or credential',
      startTime,
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] Verification error:`, error);
    return NextResponse.json(
      {
        valid: false,
        error: {
          code: ErrorCodes.INTERNAL_ERROR,
          message: 'Verification failed due to internal error',
          request_id: requestId,
        },
      },
      { status: 500 }
    );
  }
}

async function verifyById(credentialId: string, startTime: number, requestId: string) {
  // Fetch credential with issuer info
  const { data: dbCredential, error } = await getSupabase()
    .from('credentials')
    .select(`
      *,
      issuers!inner (public_key, is_verified, name, issuer_type)
    `)
    .eq('id', credentialId)
    .single();

  if (error || !dbCredential) {
    return logAndRespond({
      credentialId,
      agentId: null,
      isValid: false,
      errorCode: ErrorCodes.CREDENTIAL_NOT_FOUND,
      failureReason: 'Credential not found',
      startTime,
      requestId,
    });
  }

  // Check status
  if (dbCredential.status !== 'active') {
    return logAndRespond({
      credentialId: dbCredential.id,
      agentId: dbCredential.agent_id,
      isValid: false,
      errorCode: ErrorCodes.CREDENTIAL_REVOKED,
      failureReason: `Credential status: ${dbCredential.status}`,
      startTime,
      requestId,
    });
  }

  // Check validity period
  const now = new Date();
  const validFrom = new Date(dbCredential.valid_from);
  const validUntil = new Date(dbCredential.valid_until);

  if (now < validFrom) {
    return logAndRespond({
      credentialId: dbCredential.id,
      agentId: dbCredential.agent_id,
      isValid: false,
      errorCode: ErrorCodes.CREDENTIAL_NOT_YET_VALID,
      failureReason: 'Credential not yet valid',
      startTime,
      requestId,
    });
  }

  if (now >= validUntil) {
    return logAndRespond({
      credentialId: dbCredential.id,
      agentId: dbCredential.agent_id,
      isValid: false,
      errorCode: ErrorCodes.CREDENTIAL_EXPIRED,
      failureReason: 'Credential expired',
      startTime,
      requestId,
    });
  }

  // Verify signature
  const payload = dbCredential.credential_payload;
  const isSignatureValid = await verifySignature(
    payload,
    dbCredential.issuers.public_key
  );

  if (!isSignatureValid) {
    return logAndRespond({
      credentialId: dbCredential.id,
      agentId: dbCredential.agent_id,
      isValid: false,
      errorCode: ErrorCodes.INVALID_SIGNATURE,
      failureReason: 'Invalid signature',
      startTime,
      requestId,
    });
  }

  // SUCCESS
  return logAndRespond({
    credentialId: dbCredential.id,
    agentId: dbCredential.agent_id,
    isValid: true,
    failureReason: null,
    startTime,
    requestId,
    credential: {
      agent_id: payload.agent_id,
      agent_name: payload.agent_name,
      agent_type: payload.agent_type,
      issuer: payload.issuer,
      permissions: payload.permissions,
      valid_until: payload.constraints.valid_until,
    },
  });
}

async function verifyPayload(
  credential: NonNullable<ReturnType<typeof verificationRequestSchema.parse>['credential']>,
  startTime: number,
  requestId: string
) {
  // Check validity period first (no DB call needed)
  const now = new Date();
  const validFrom = new Date(credential.constraints.valid_from);
  const validUntil = new Date(credential.constraints.valid_until);

  if (now < validFrom) {
    return logAndRespond({
      credentialId: credential.credential_id,
      agentId: credential.agent_id,
      isValid: false,
      errorCode: ErrorCodes.CREDENTIAL_NOT_YET_VALID,
      failureReason: 'Credential not yet valid',
      startTime,
      requestId,
    });
  }

  if (now >= validUntil) {
    return logAndRespond({
      credentialId: credential.credential_id,
      agentId: credential.agent_id,
      isValid: false,
      errorCode: ErrorCodes.CREDENTIAL_EXPIRED,
      failureReason: 'Credential expired',
      startTime,
      requestId,
    });
  }

  // Parallelize issuer lookup and credential status check
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
    return logAndRespond({
      credentialId: credential.credential_id,
      agentId: credential.agent_id,
      isValid: false,
      errorCode: ErrorCodes.ISSUER_NOT_FOUND,
      failureReason: 'Issuer not found',
      startTime,
      requestId,
    });
  }

  // Check credential status if it exists in DB
  if (credentialResult.data && credentialResult.data.status !== 'active') {
    return logAndRespond({
      credentialId: credential.credential_id,
      agentId: credential.agent_id,
      isValid: false,
      errorCode: ErrorCodes.CREDENTIAL_REVOKED,
      failureReason: `Credential status: ${credentialResult.data.status}`,
      startTime,
      requestId,
    });
  }

  // Verify signature
  const isSignatureValid = await verifySignature(credential, issuerResult.data.public_key);

  if (!isSignatureValid) {
    return logAndRespond({
      credentialId: credential.credential_id,
      agentId: credential.agent_id,
      isValid: false,
      errorCode: ErrorCodes.INVALID_SIGNATURE,
      failureReason: 'Invalid signature',
      startTime,
      requestId,
    });
  }

  // SUCCESS
  return logAndRespond({
    credentialId: credential.credential_id,
    agentId: credential.agent_id,
    isValid: true,
    failureReason: null,
    startTime,
    requestId,
    credential: {
      agent_id: credential.agent_id,
      agent_name: credential.agent_name,
      agent_type: credential.agent_type,
      issuer: credential.issuer,
      permissions: credential.permissions,
      valid_until: credential.constraints.valid_until,
    },
  });
}

async function verifySignature(
  payload: Record<string, unknown>,
  publicKey: string
): Promise<boolean> {
  try {
    // Extract signature from payload
    const { signature, ...payloadWithoutSignature } = payload;
    if (!signature || typeof signature !== 'string') {
      return false;
    }

    // Recreate message that was signed (canonical JSON for deterministic comparison)
    const message = new TextEncoder().encode(canonicalJson(payloadWithoutSignature));

    // Decode signature and public key from base64
    const signatureBytes = new Uint8Array(base64DecodeToBuffer(signature));
    const publicKeyBytes = new Uint8Array(base64DecodeToBuffer(publicKey));

    // Verify using real Ed25519 verification
    // This is asymmetric - only the private key can create valid signatures
    const isValid = await ed.verifyAsync(signatureBytes, message, publicKeyBytes);
    return isValid;
  } catch (error) {
    console.error('Signature verification error:', error);
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

/**
 * Create canonical JSON with sorted keys for deterministic hashing
 */
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

interface LogAndRespondParams {
  credentialId: string | null;
  agentId: string | null;
  isValid: boolean;
  errorCode?: ErrorCode;
  failureReason: string | null;
  startTime: number;
  requestId: string;
  credential?: {
    agent_id: string;
    agent_name: string;
    agent_type: string;
    issuer: unknown;
    permissions: unknown;
    valid_until: string;
  };
}

async function logAndRespond({
  credentialId,
  agentId,
  isValid,
  errorCode,
  failureReason,
  startTime,
  requestId,
  credential,
}: LogAndRespondParams) {
  const verificationTimeMs = Math.round(performance.now() - startTime);

  // Log verification and update reputation (fire and forget - don't block response)
  void (async () => {
    try {
      await getSupabase().from('verification_logs').insert({
        credential_id: credentialId,
        agent_id: agentId,
        is_valid: isValid,
        failure_reason: failureReason,
        verification_time_ms: verificationTimeMs,
      });

      // Update reputation if we have a credential ID
      if (credentialId) {
        await updateAgentReputation(credentialId, isValid);
      }
    } catch (err) {
      console.error(`[${requestId}] Failed to log verification or update reputation:`, err);
    }
  })();

  if (isValid && credential) {
    return NextResponse.json({
      valid: true,
      credential,
      verification_time_ms: verificationTimeMs,
      request_id: requestId,
    });
  }

  return NextResponse.json({
    valid: false,
    error: {
      code: errorCode,
      message: failureReason,
      request_id: requestId,
    },
    verification_time_ms: verificationTimeMs,
  });
}
