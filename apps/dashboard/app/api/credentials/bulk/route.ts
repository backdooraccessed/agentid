import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { authenticateRequest, checkScope } from '@/lib/auth';
import { ApiKeyScopes } from '@/lib/api-keys';

/**
 * POST /api/credentials/bulk - Bulk operations on credentials
 * Actions: revoke, renew
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate (session or API key)
    const auth = await authenticateRequest(request);

    if (!auth.authenticated) {
      return NextResponse.json(
        { error: auth.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!auth.issuerId) {
      return NextResponse.json(
        { error: 'Issuer profile not found' },
        { status: 404 }
      );
    }

    // Check scope for API key auth
    if (auth.apiKeyInfo && !checkScope(auth, ApiKeyScopes.CREDENTIALS_WRITE)) {
      return NextResponse.json(
        { error: 'API key lacks credentials:write scope' },
        { status: 403 }
      );
    }

    const supabase = auth.apiKeyInfo
      ? createServiceClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
      : await createClient();

    const body = await request.json();
    const { action, credential_ids, reason, extend_days } = body;

    if (!action || !credential_ids || !Array.isArray(credential_ids)) {
      return NextResponse.json(
        { error: 'action and credential_ids array are required' },
        { status: 400 }
      );
    }

    if (credential_ids.length === 0) {
      return NextResponse.json(
        { error: 'credential_ids cannot be empty' },
        { status: 400 }
      );
    }

    if (credential_ids.length > 100) {
      return NextResponse.json(
        { error: 'Maximum 100 credentials per bulk operation' },
        { status: 400 }
      );
    }

    // Verify all credentials belong to this issuer
    const { data: credentials, error: fetchError } = await supabase
      .from('credentials')
      .select('id, agent_id, status')
      .eq('issuer_id', auth.issuerId)
      .in('id', credential_ids);

    if (fetchError) {
      return NextResponse.json(
        { error: 'Failed to fetch credentials' },
        { status: 500 }
      );
    }

    const foundIds = new Set(credentials?.map(c => c.id) || []);
    const notFoundIds = credential_ids.filter(id => !foundIds.has(id));

    if (notFoundIds.length > 0) {
      return NextResponse.json(
        { error: `Credentials not found: ${notFoundIds.slice(0, 5).join(', ')}${notFoundIds.length > 5 ? '...' : ''}` },
        { status: 404 }
      );
    }

    const results: { id: string; success: boolean; error?: string }[] = [];

    switch (action) {
      case 'revoke': {
        for (const cred of credentials || []) {
          if (cred.status === 'revoked') {
            results.push({ id: cred.id, success: false, error: 'Already revoked' });
            continue;
          }

          const { error: updateError } = await supabase
            .from('credentials')
            .update({
              status: 'revoked',
              revoked_at: new Date().toISOString(),
              revocation_reason: reason || 'Bulk revocation',
            })
            .eq('id', cred.id);

          if (updateError) {
            results.push({ id: cred.id, success: false, error: 'Update failed' });
          } else {
            results.push({ id: cred.id, success: true });

            // Log to audit (fire and forget)
            void supabase.from('audit_logs').insert({
              issuer_id: auth.issuerId,
              action: 'credential.revoked',
              resource_type: 'credential',
              resource_id: cred.id,
              details: { agent_id: cred.agent_id, reason: reason || 'Bulk revocation', bulk: true },
            });
          }
        }
        break;
      }

      case 'renew': {
        const days = extend_days || 90;
        if (days < 1 || days > 365) {
          return NextResponse.json(
            { error: 'extend_days must be between 1 and 365' },
            { status: 400 }
          );
        }

        for (const cred of credentials || []) {
          if (cred.status === 'revoked') {
            results.push({ id: cred.id, success: false, error: 'Cannot renew revoked credential' });
            continue;
          }

          // Fetch full credential for renewal
          const { data: fullCred } = await supabase
            .from('credentials')
            .select('*, issuers!inner(id, user_id)')
            .eq('id', cred.id)
            .single();

          if (!fullCred) {
            results.push({ id: cred.id, success: false, error: 'Credential not found' });
            continue;
          }

          const now = new Date();
          const currentValidUntil = new Date(fullCred.valid_until);
          const baseDate = currentValidUntil > now ? currentValidUntil : now;
          const newValidUntil = new Date(baseDate);
          newValidUntil.setDate(newValidUntil.getDate() + days);

          // Update payload
          const payload = fullCred.credential_payload;
          payload.constraints.valid_until = newValidUntil.toISOString();

          // Re-sign
          const { data: signed, error: signError } = await supabase.functions.invoke(
            'sign-credential',
            {
              body: {
                action: 'sign',
                issuer_id: fullCred.issuers.id,
                payload: { ...payload, signature: undefined },
              },
            }
          );

          if (signError || !signed?.signature) {
            results.push({ id: cred.id, success: false, error: 'Signing failed' });
            continue;
          }

          const { error: updateError } = await supabase
            .from('credentials')
            .update({
              valid_until: newValidUntil.toISOString(),
              credential_payload: { ...payload, signature: signed.signature },
              status: 'active',
              updated_at: new Date().toISOString(),
            })
            .eq('id', cred.id);

          if (updateError) {
            results.push({ id: cred.id, success: false, error: 'Update failed' });
          } else {
            results.push({ id: cred.id, success: true });

            // Log to audit (fire and forget)
            void supabase.from('audit_logs').insert({
              issuer_id: auth.issuerId,
              action: 'credential.renewed',
              resource_type: 'credential',
              resource_id: cred.id,
              details: { agent_id: cred.agent_id, extend_days: days, bulk: true },
            });
          }
        }
        break;
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}. Supported: revoke, renew` },
          { status: 400 }
        );
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return NextResponse.json({
      action,
      results,
      summary: {
        total: results.length,
        successful,
        failed,
      },
    });
  } catch (error) {
    console.error('Bulk operation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
