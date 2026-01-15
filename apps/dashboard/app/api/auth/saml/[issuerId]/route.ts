import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  generateAuthUrl,
  SSOConfiguration,
} from '@/lib/saml';

// Service client for internal operations
function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * GET /api/auth/saml/[issuerId] - Initiate SAML login
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ issuerId: string }> }
) {
  try {
    const { issuerId } = await params;
    const returnUrl = request.nextUrl.searchParams.get('return_url') || '/credentials';

    if (!issuerId) {
      return NextResponse.json({ error: 'Issuer ID required' }, { status: 400 });
    }

    const serviceSupabase = getServiceSupabase();

    // Get SSO configuration
    const { data: ssoConfig, error } = await serviceSupabase
      .from('sso_configurations')
      .select('*')
      .eq('issuer_id', issuerId)
      .eq('is_enabled', true)
      .single();

    if (error || !ssoConfig) {
      return NextResponse.json(
        { error: 'SSO not configured or not enabled for this organization' },
        { status: 404 }
      );
    }

    // Generate SAML auth URL with return URL as relay state
    const authUrl = await generateAuthUrl(ssoConfig as SSOConfiguration, returnUrl);

    // Redirect to IdP
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('SAML login initiation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
