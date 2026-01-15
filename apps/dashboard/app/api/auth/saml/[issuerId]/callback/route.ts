import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  validateSamlResponse,
  isEmailDomainAllowed,
  mapSamlRoleToTeamRole,
  SSOConfiguration,
} from '@/lib/saml';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://agentid.dev';

// Service client for internal operations
function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * POST /api/auth/saml/[issuerId]/callback - SAML Assertion Consumer Service
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ issuerId: string }> }
) {
  try {
    const { issuerId } = await params;

    if (!issuerId) {
      return redirectWithError('Invalid SSO configuration');
    }

    const formData = await request.formData();
    const samlResponse = formData.get('SAMLResponse') as string;
    const relayState = formData.get('RelayState') as string;

    if (!samlResponse) {
      return redirectWithError('No SAML response received');
    }

    const serviceSupabase = getServiceSupabase();

    // Get SSO configuration
    const { data: ssoConfig, error: configError } = await serviceSupabase
      .from('sso_configurations')
      .select('*')
      .eq('issuer_id', issuerId)
      .eq('is_enabled', true)
      .single();

    if (configError || !ssoConfig) {
      return redirectWithError('SSO not configured or not enabled');
    }

    // Validate SAML response
    let profile;
    try {
      const result = await validateSamlResponse(ssoConfig as SSOConfiguration, samlResponse);
      profile = result.profile;
    } catch (validationError) {
      console.error('SAML validation error:', validationError);
      return redirectWithError('Invalid SAML response');
    }

    // Get email from profile
    const email = profile.email || profile.nameID;
    if (!email || !email.includes('@')) {
      return redirectWithError('No valid email in SAML response');
    }

    // Check domain restrictions
    if (!isEmailDomainAllowed(email, ssoConfig.allowed_domains || [])) {
      return redirectWithError('Email domain not allowed for this organization');
    }

    // Find or create user
    let userId: string;

    // Check if user exists
    const { data: existingUsers } = await serviceSupabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users.find(
      u => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (existingUser) {
      userId = existingUser.id;
    } else if (ssoConfig.auto_provision) {
      // Create new user via Supabase Auth
      const { data: newUser, error: createError } = await serviceSupabase.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          first_name: profile.firstName,
          last_name: profile.lastName,
          sso_provider: 'saml',
          sso_issuer_id: issuerId,
        },
      });

      if (createError || !newUser.user) {
        console.error('Failed to create SSO user:', createError);
        return redirectWithError('Failed to create user account');
      }

      userId = newUser.user.id;

      // Add user to team
      const role = mapSamlRoleToTeamRole(profile.role, ssoConfig.default_role);
      await serviceSupabase.from('team_members').insert({
        issuer_id: issuerId,
        user_id: userId,
        role,
        status: 'active',
      });

      // Log audit
      await serviceSupabase.from('audit_logs').insert({
        issuer_id: issuerId,
        user_id: userId,
        action: 'sso.user_provisioned',
        resource_type: 'user',
        resource_id: userId,
        details: {
          email,
          role,
          first_name: profile.firstName,
          last_name: profile.lastName,
        },
      });
    } else {
      return redirectWithError('User not found and auto-provisioning is disabled');
    }

    // Ensure user is team member
    const { data: existingMember } = await serviceSupabase
      .from('team_members')
      .select('id')
      .eq('issuer_id', issuerId)
      .eq('user_id', userId)
      .single();

    if (!existingMember && ssoConfig.auto_provision) {
      const role = mapSamlRoleToTeamRole(profile.role, ssoConfig.default_role);
      await serviceSupabase.from('team_members').insert({
        issuer_id: issuerId,
        user_id: userId,
        role,
        status: 'active',
      });
    }

    // Create SSO session record
    const sessionExpiry = new Date();
    sessionExpiry.setHours(sessionExpiry.getHours() + 8); // 8-hour session

    await serviceSupabase.from('sso_sessions').upsert({
      sso_config_id: ssoConfig.id,
      user_id: userId,
      saml_name_id: profile.nameID,
      saml_session_index: profile.sessionIndex,
      attributes: profile.attributes,
      expires_at: sessionExpiry.toISOString(),
    }, {
      onConflict: 'sso_config_id,user_id',
    });

    // Generate magic link for the user
    const { data: magicLink, error: linkError } = await serviceSupabase.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: {
        redirectTo: relayState || `${APP_URL}/credentials`,
      },
    });

    if (linkError || !magicLink.properties?.action_link) {
      console.error('Failed to generate magic link:', linkError);
      return redirectWithError('Failed to complete SSO login');
    }

    // Log successful SSO login
    await serviceSupabase.from('audit_logs').insert({
      issuer_id: issuerId,
      user_id: userId,
      action: 'sso.login',
      resource_type: 'session',
      details: {
        email,
        name_id: profile.nameID,
      },
    });

    // Redirect to magic link (this will set the session)
    return NextResponse.redirect(magicLink.properties.action_link);
  } catch (error) {
    console.error('SAML callback error:', error);
    return redirectWithError('SSO authentication failed');
  }
}

function redirectWithError(message: string): NextResponse {
  const errorUrl = new URL(`${APP_URL}/login`);
  errorUrl.searchParams.set('error', message);
  return NextResponse.redirect(errorUrl.toString());
}
