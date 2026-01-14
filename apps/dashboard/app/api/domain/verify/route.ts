import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import dns from 'dns';
import { promisify } from 'util';

const resolveTxt = promisify(dns.resolveTxt);

// POST: Initiate or verify domain
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { action } = body; // 'generate' or 'verify'

  // Get issuer profile
  const { data: issuer, error: issuerError } = await supabase
    .from('issuers')
    .select('id, domain, domain_verification_token, domain_verified_at')
    .eq('user_id', user.id)
    .single();

  if (issuerError || !issuer) {
    return NextResponse.json(
      { error: 'Issuer profile not found. Please create one first.' },
      { status: 404 }
    );
  }

  if (!issuer.domain) {
    return NextResponse.json(
      { error: 'No domain set. Please add a domain in settings first.' },
      { status: 400 }
    );
  }

  // Action: Generate verification token
  if (action === 'generate') {
    const token = `agentid-verify=${crypto.randomUUID().replace(/-/g, '')}`;

    const { error: updateError } = await supabase
      .from('issuers')
      .update({ domain_verification_token: token })
      .eq('id', issuer.id);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to generate token' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      token,
      domain: issuer.domain,
      instructions: {
        dns: {
          type: 'TXT',
          host: '_agentid',
          value: token,
          fullRecord: `_agentid.${issuer.domain}`,
        },
      },
    });
  }

  // Action: Verify domain
  if (action === 'verify') {
    if (!issuer.domain_verification_token) {
      return NextResponse.json(
        { error: 'No verification token generated. Please generate one first.' },
        { status: 400 }
      );
    }

    // Log the attempt
    await supabase.from('domain_verification_attempts').insert({
      issuer_id: issuer.id,
      domain: issuer.domain,
      method: 'dns_txt',
      status: 'pending',
    });

    try {
      // Check DNS TXT record
      const txtRecords = await resolveTxt(`_agentid.${issuer.domain}`);
      const flatRecords = txtRecords.flat();

      const isVerified = flatRecords.some(
        (record) => record === issuer.domain_verification_token
      );

      if (isVerified) {
        // Update issuer as verified
        await supabase
          .from('issuers')
          .update({
            domain_verified_at: new Date().toISOString(),
            domain_verification_method: 'dns_txt',
          })
          .eq('id', issuer.id);

        // Log success
        await supabase
          .from('domain_verification_attempts')
          .update({ status: 'success' })
          .eq('issuer_id', issuer.id)
          .eq('status', 'pending')
          .order('attempted_at', { ascending: false })
          .limit(1);

        // Log audit event
        await supabase.from('audit_logs').insert({
          issuer_id: issuer.id,
          user_id: user.id,
          action: 'domain.verified',
          resource_type: 'issuer',
          resource_id: issuer.id,
          details: { domain: issuer.domain, method: 'dns_txt' },
        });

        return NextResponse.json({
          success: true,
          verified: true,
          domain: issuer.domain,
          verified_at: new Date().toISOString(),
        });
      } else {
        // Log failure
        await supabase
          .from('domain_verification_attempts')
          .update({
            status: 'failed',
            failure_reason: 'TXT record not found or does not match',
          })
          .eq('issuer_id', issuer.id)
          .eq('status', 'pending')
          .order('attempted_at', { ascending: false })
          .limit(1);

        return NextResponse.json({
          success: true,
          verified: false,
          domain: issuer.domain,
          error: 'Verification failed. TXT record not found or does not match.',
          expected: issuer.domain_verification_token,
          found: flatRecords,
        });
      }
    } catch (dnsError: unknown) {
      const errorMessage = dnsError instanceof Error ? dnsError.message : 'Unknown DNS error';

      // Log failure
      await supabase
        .from('domain_verification_attempts')
        .update({
          status: 'failed',
          failure_reason: `DNS lookup failed: ${errorMessage}`,
        })
        .eq('issuer_id', issuer.id)
        .eq('status', 'pending')
        .order('attempted_at', { ascending: false })
        .limit(1);

      return NextResponse.json({
        success: true,
        verified: false,
        domain: issuer.domain,
        error: `DNS lookup failed: ${errorMessage}`,
        hint: 'Make sure the TXT record is properly configured and DNS has propagated (can take up to 48 hours).',
      });
    }
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

// GET: Check verification status
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: issuer } = await supabase
    .from('issuers')
    .select('id, domain, domain_verification_token, domain_verified_at, domain_verification_method')
    .eq('user_id', user.id)
    .single();

  if (!issuer) {
    return NextResponse.json({ error: 'Issuer not found' }, { status: 404 });
  }

  // Get recent verification attempts
  const { data: attempts } = await supabase
    .from('domain_verification_attempts')
    .select('*')
    .eq('issuer_id', issuer.id)
    .order('attempted_at', { ascending: false })
    .limit(5);

  return NextResponse.json({
    domain: issuer.domain,
    verified: !!issuer.domain_verified_at,
    verified_at: issuer.domain_verified_at,
    method: issuer.domain_verification_method,
    token: issuer.domain_verification_token,
    recent_attempts: attempts || [],
  });
}
