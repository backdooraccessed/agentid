import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { verificationRequestSchema } from '@agentid/shared';
import * as ed from '@noble/ed25519';

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

  try {
    const body = await request.json();

    // Validate request
    const parsed = verificationRequestSchema.safeParse(body);
    if (!parsed.success) {
      return logAndRespond({
        credentialId: null,
        agentId: null,
        isValid: false,
        failureReason: 'Invalid request format',
        startTime,
      });
    }

    const { credential_id, credential } = parsed.data;

    // Route 1: Verify by credential_id (database lookup)
    if (credential_id) {
      return await verifyById(credential_id, startTime);
    }

    // Route 2: Verify provided credential payload
    if (credential) {
      return await verifyPayload(credential, startTime);
    }

    return logAndRespond({
      credentialId: null,
      agentId: null,
      isValid: false,
      failureReason: 'Must provide credential_id or credential',
      startTime,
    });
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { valid: false, error: 'Verification failed' },
      { status: 500 }
    );
  }
}

async function verifyById(credentialId: string, startTime: number) {
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
      failureReason: 'Credential not found',
      startTime,
    });
  }

  // Check status
  if (dbCredential.status !== 'active') {
    return logAndRespond({
      credentialId: dbCredential.id,
      agentId: dbCredential.agent_id,
      isValid: false,
      failureReason: `Credential status: ${dbCredential.status}`,
      startTime,
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
      failureReason: 'Credential not yet valid',
      startTime,
    });
  }

  if (now >= validUntil) {
    return logAndRespond({
      credentialId: dbCredential.id,
      agentId: dbCredential.agent_id,
      isValid: false,
      failureReason: 'Credential expired',
      startTime,
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
      failureReason: 'Invalid signature',
      startTime,
    });
  }

  // SUCCESS
  return logAndRespond({
    credentialId: dbCredential.id,
    agentId: dbCredential.agent_id,
    isValid: true,
    failureReason: null,
    startTime,
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
  startTime: number
) {
  // Fetch issuer public key
  const { data: issuer, error } = await getSupabase()
    .from('issuers')
    .select('public_key, is_verified')
    .eq('id', credential.issuer.issuer_id)
    .single();

  if (error || !issuer) {
    return logAndRespond({
      credentialId: credential.credential_id,
      agentId: credential.agent_id,
      isValid: false,
      failureReason: 'Issuer not found',
      startTime,
    });
  }

  // Check validity period
  const now = new Date();
  const validFrom = new Date(credential.constraints.valid_from);
  const validUntil = new Date(credential.constraints.valid_until);

  if (now < validFrom) {
    return logAndRespond({
      credentialId: credential.credential_id,
      agentId: credential.agent_id,
      isValid: false,
      failureReason: 'Credential not yet valid',
      startTime,
    });
  }

  if (now >= validUntil) {
    return logAndRespond({
      credentialId: credential.credential_id,
      agentId: credential.agent_id,
      isValid: false,
      failureReason: 'Credential expired',
      startTime,
    });
  }

  // Verify signature
  const isSignatureValid = await verifySignature(credential, issuer.public_key);

  if (!isSignatureValid) {
    return logAndRespond({
      credentialId: credential.credential_id,
      agentId: credential.agent_id,
      isValid: false,
      failureReason: 'Invalid signature',
      startTime,
    });
  }

  // Also check if credential exists and is active in DB
  const { data: dbCredential } = await getSupabase()
    .from('credentials')
    .select('status')
    .eq('id', credential.credential_id)
    .single();

  if (dbCredential && dbCredential.status !== 'active') {
    return logAndRespond({
      credentialId: credential.credential_id,
      agentId: credential.agent_id,
      isValid: false,
      failureReason: `Credential status: ${dbCredential.status}`,
      startTime,
    });
  }

  // SUCCESS
  return logAndRespond({
    credentialId: credential.credential_id,
    agentId: credential.agent_id,
    isValid: true,
    failureReason: null,
    startTime,
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
  failureReason: string | null;
  startTime: number;
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
  failureReason,
  startTime,
  credential,
}: LogAndRespondParams) {
  const verificationTimeMs = Math.round(performance.now() - startTime);

  // Log verification (fire and forget - don't block response)
  void (async () => {
    try {
      await getSupabase().from('verification_logs').insert({
        credential_id: credentialId,
        agent_id: agentId,
        is_valid: isValid,
        failure_reason: failureReason,
        verification_time_ms: verificationTimeMs,
      });
    } catch (err) {
      console.error('Failed to log verification:', err);
    }
  })();

  if (isValid && credential) {
    return NextResponse.json({
      valid: true,
      credential,
      verification_time_ms: verificationTimeMs,
    });
  }

  return NextResponse.json({
    valid: false,
    reason: failureReason,
    verification_time_ms: verificationTimeMs,
  });
}
