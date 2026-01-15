import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { verificationRequestSchema } from '@agentid/shared';
import * as ed from '@noble/ed25519';
import { updateAgentReputation } from '@/lib/reputation';
import {
  checkRateLimit,
  getClientIdentifier,
  RateLimits,
  rateLimitHeaders,
  rateLimitExceededResponse,
} from '@/lib/rate-limit';
import { sendAlertNotificationEmail } from '@/lib/email';
import { checkPermission, PermissionCheckResult } from '@/lib/permissions';

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

// Extract region from Vercel geo headers
function getRegionFromRequest(request: NextRequest): string | null {
  // Vercel provides geo info via headers
  const country = request.headers.get('x-vercel-ip-country');
  if (country) return country;

  // Fallback to CF headers (if behind Cloudflare)
  const cfCountry = request.headers.get('cf-ipcountry');
  if (cfCountry) return cfCountry;

  return null;
}

// Send alert notifications (webhook and email)
async function sendAlertNotifications(alertEventId: string) {
  try {
    // Fetch the alert event with rule info
    const { data: event, error } = await getSupabase()
      .from('alert_events')
      .select(`
        *,
        alert_rules (
          notify_webhook,
          notify_email,
          name
        )
      `)
      .eq('id', alertEventId)
      .single();

    if (error || !event) {
      console.error('Failed to fetch alert event for notifications:', error);
      return;
    }

    const rule = event.alert_rules;

    // Send webhook notification
    if (rule?.notify_webhook) {
      try {
        const webhookPayload = {
          event_type: 'alert.triggered',
          alert: {
            id: event.id,
            rule_name: rule.name,
            severity: event.severity,
            title: event.title,
            message: event.message,
            event_data: event.event_data,
            credential_id: event.credential_id,
            triggered_at: event.triggered_at,
          },
        };

        const response = await fetch(rule.notify_webhook, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-AgentID-Event': 'alert.triggered',
          },
          body: JSON.stringify(webhookPayload),
        });

        // Update webhook status
        await getSupabase()
          .from('alert_events')
          .update({
            webhook_sent_at: new Date().toISOString(),
            webhook_response_code: response.status,
          })
          .eq('id', alertEventId);
      } catch (webhookError) {
        console.error('Failed to send alert webhook:', webhookError);
      }
    }

    // Send email notification
    if (rule?.notify_email) {
      const emailResult = await sendAlertNotificationEmail({
        email: rule.notify_email,
        alertTitle: event.title,
        alertMessage: event.message,
        severity: event.severity,
        ruleName: rule.name,
        credentialId: event.credential_id,
        eventData: event.event_data,
      });

      if (emailResult.success) {
        await getSupabase()
          .from('alert_events')
          .update({ email_sent_at: new Date().toISOString() })
          .eq('id', alertEventId);
      } else {
        console.error(`[Alert] Failed to send email: ${emailResult.error}`);
      }
    }
  } catch (err) {
    console.error('Failed to send alert notifications:', err);
  }
}

export async function POST(request: NextRequest) {
  const startTime = performance.now();
  const requestId = generateRequestId();
  const region = getRegionFromRequest(request);

  // Rate limiting
  const clientId = getClientIdentifier(request);
  const rateLimit = checkRateLimit(clientId, RateLimits.verify);
  if (!rateLimit.success) {
    return rateLimitExceededResponse(rateLimit);
  }

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
        region,
      });
    }

    const { credential_id, credential, check_permission } = parsed.data;

    // Route 1: Verify by credential_id (database lookup)
    if (credential_id) {
      return await verifyById(credential_id, startTime, requestId, region, check_permission);
    }

    // Route 2: Verify provided credential payload
    if (credential) {
      return await verifyPayload(credential, startTime, requestId, region, check_permission);
    }

    return logAndRespond({
      credentialId: null,
      agentId: null,
      isValid: false,
      errorCode: ErrorCodes.MISSING_INPUT,
      failureReason: 'Must provide credential_id or credential',
      startTime,
      requestId,
      region,
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

async function verifyById(
  credentialId: string,
  startTime: number,
  requestId: string,
  region: string | null,
  permissionCheck?: { action: string; resource?: string; context?: Record<string, unknown> }
) {
  // Fetch credential with issuer info and permission policy
  const { data: dbCredential, error } = await getSupabase()
    .from('credentials')
    .select(`
      *,
      issuers!inner (public_key, is_verified, name, issuer_type),
      permission_policies (id, name, permissions, version, is_active)
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
      region,
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
      region,
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
      region,
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
      region,
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
      region,
    });
  }

  // Determine effective permissions (policy takes precedence if active)
  const policy = dbCredential.permission_policies;
  const usePolicy = policy && policy.is_active;
  const effectivePermissions = usePolicy ? policy.permissions : payload.permissions;

  // Perform permission check if requested
  let permissionCheckResult: PermissionCheckResult | undefined;
  if (permissionCheck) {
    permissionCheckResult = checkPermission(
      {
        action: permissionCheck.action,
        resource: permissionCheck.resource,
        context: permissionCheck.context,
      },
      effectivePermissions,
      {
        region,
        currentHour: new Date().getHours(),
        currentDay: new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase(),
      }
    );
  }

  // SUCCESS
  return logAndRespond({
    credentialId: dbCredential.id,
    agentId: dbCredential.agent_id,
    isValid: true,
    failureReason: null,
    startTime,
    requestId,
    region,
    credential: {
      agent_id: payload.agent_id,
      agent_name: payload.agent_name,
      agent_type: payload.agent_type,
      issuer: payload.issuer,
      permissions: effectivePermissions,
      valid_until: payload.constraints.valid_until,
    },
    // Include policy info for transparency
    policy: usePolicy
      ? {
          id: policy.id,
          name: policy.name,
          version: policy.version,
        }
      : undefined,
    // Include permission check result if requested
    permissionCheckResult,
  });
}

async function verifyPayload(
  credential: NonNullable<ReturnType<typeof verificationRequestSchema.parse>['credential']>,
  startTime: number,
  requestId: string,
  region: string | null,
  permissionCheck?: { action: string; resource?: string; context?: Record<string, unknown> }
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
      region,
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
      region,
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
      region,
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
      region,
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
      region,
    });
  }

  // Perform permission check if requested
  let permissionCheckResult: PermissionCheckResult | undefined;
  if (permissionCheck) {
    permissionCheckResult = checkPermission(
      {
        action: permissionCheck.action,
        resource: permissionCheck.resource,
        context: permissionCheck.context,
      },
      credential.permissions,
      {
        region,
        currentHour: new Date().getHours(),
        currentDay: new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase(),
      }
    );
  }

  // SUCCESS
  return logAndRespond({
    credentialId: credential.credential_id,
    agentId: credential.agent_id,
    isValid: true,
    failureReason: null,
    startTime,
    requestId,
    region,
    credential: {
      agent_id: credential.agent_id,
      agent_name: credential.agent_name,
      agent_type: credential.agent_type,
      issuer: credential.issuer,
      permissions: credential.permissions,
      valid_until: credential.constraints.valid_until,
    },
    permissionCheckResult,
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
  region?: string | null;
  credential?: {
    agent_id: string;
    agent_name: string;
    agent_type: string;
    issuer: unknown;
    permissions: unknown;
    valid_until: string;
  };
  policy?: {
    id: string;
    name: string;
    version: number;
  };
  permissionCheckResult?: PermissionCheckResult;
}

async function logAndRespond({
  credentialId,
  agentId,
  isValid,
  errorCode,
  failureReason,
  startTime,
  requestId,
  region,
  credential,
  policy,
  permissionCheckResult,
}: LogAndRespondParams) {
  const verificationTimeMs = Math.round(performance.now() - startTime);

  // Log verification, update reputation, and check alerts (fire and forget - don't block response)
  void (async () => {
    try {
      // Log to verification_logs
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

        // Record usage metrics for anomaly detection
        await getSupabase().rpc('record_usage_metric', {
          p_credential_id: credentialId,
          p_success: isValid,
          p_permission_denied: failureReason?.toLowerCase().includes('permission') || false,
          p_region: region || null,
          p_verification_time_ms: verificationTimeMs,
        });

        // Check and trigger alerts
        const { data: alertResult } = await getSupabase().rpc('check_verification_alerts', {
          p_credential_id: credentialId,
          p_success: isValid,
          p_failure_reason: failureReason || null,
          p_region: region || null,
        });

        // If alert triggered, send notifications asynchronously
        if (alertResult?.[0]?.alert_triggered && alertResult[0].alert_event_id) {
          void sendAlertNotifications(alertResult[0].alert_event_id);
        }

        // Also log to verification_events for analytics (get issuer_id from credential)
        const { data: credData } = await getSupabase()
          .from('credentials')
          .select('issuer_id')
          .eq('id', credentialId)
          .single();

        if (credData?.issuer_id && agentId) {
          await getSupabase().from('verification_events').insert({
            credential_id: credentialId,
            issuer_id: credData.issuer_id,
            agent_id: agentId,
            success: isValid,
            failure_reason: failureReason,
          });
        }
      }
    } catch (err) {
      console.error(`[${requestId}] Failed to log verification or update reputation:`, err);
    }
  })();

  if (isValid && credential) {
    const response: Record<string, unknown> = {
      valid: true,
      credential,
      verification_time_ms: verificationTimeMs,
      request_id: requestId,
    };

    // Include policy info if permissions come from a policy
    // This enables verifiers to know permissions may update without re-verification
    if (policy) {
      response.permission_policy = policy;
      response.live_permissions = true;
    }

    // Include permission check result if a check was requested
    if (permissionCheckResult) {
      response.permission_check = permissionCheckResult;
    }

    return NextResponse.json(response);
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
