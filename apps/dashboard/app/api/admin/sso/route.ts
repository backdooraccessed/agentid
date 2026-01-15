import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { getSpEntityId, getAcsUrl, getSloUrl } from '@/lib/saml';

// Service client for internal operations
function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * GET /api/admin/sso - Get SSO configuration for current issuer
 */
export async function GET() {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get issuer with admin check
    const { data: issuer } = await supabase
      .from('issuers')
      .select('id, name')
      .eq('user_id', user.id)
      .single();

    if (!issuer) {
      // Check team membership
      const { data: teamMember } = await supabase
        .from('team_members')
        .select('issuer_id, role')
        .eq('user_id', user.id)
        .in('role', ['owner', 'admin'])
        .single();

      if (!teamMember) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }

      const { data: ssoConfig } = await supabase
        .from('sso_configurations')
        .select('*')
        .eq('issuer_id', teamMember.issuer_id)
        .single();

      return NextResponse.json({
        config: ssoConfig || null,
        sp_metadata: {
          entity_id: getSpEntityId(teamMember.issuer_id),
          acs_url: getAcsUrl(teamMember.issuer_id),
          slo_url: getSloUrl(teamMember.issuer_id),
        },
      });
    }

    const { data: ssoConfig } = await supabase
      .from('sso_configurations')
      .select('*')
      .eq('issuer_id', issuer.id)
      .single();

    return NextResponse.json({
      config: ssoConfig || null,
      sp_metadata: {
        entity_id: getSpEntityId(issuer.id),
        acs_url: getAcsUrl(issuer.id),
        slo_url: getSloUrl(issuer.id),
      },
    });
  } catch (error) {
    console.error('Get SSO config error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/sso - Create or update SSO configuration
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      entity_id,
      sso_url,
      slo_url,
      certificate,
      attribute_mapping,
      auto_provision,
      default_role,
      allowed_domains,
      is_enabled,
    } = body;

    // Validate required fields
    if (!entity_id || !sso_url || !certificate) {
      return NextResponse.json(
        { error: 'Missing required fields: entity_id, sso_url, certificate' },
        { status: 400 }
      );
    }

    // Get issuer ID
    let issuerId: string | null = null;

    const { data: issuer } = await supabase
      .from('issuers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (issuer) {
      issuerId = issuer.id;
    } else {
      const { data: teamMember } = await supabase
        .from('team_members')
        .select('issuer_id')
        .eq('user_id', user.id)
        .in('role', ['owner', 'admin'])
        .single();

      if (teamMember) {
        issuerId = teamMember.issuer_id;
      }
    }

    if (!issuerId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const serviceSupabase = getServiceSupabase();

    // Check if config already exists
    const { data: existingConfig } = await serviceSupabase
      .from('sso_configurations')
      .select('id')
      .eq('issuer_id', issuerId)
      .single();

    const configData = {
      issuer_id: issuerId,
      name: name || 'SSO',
      entity_id,
      sso_url,
      slo_url: slo_url || null,
      certificate,
      attribute_mapping: attribute_mapping || {
        email: 'email',
        firstName: 'firstName',
        lastName: 'lastName',
        role: 'role',
      },
      auto_provision: auto_provision ?? true,
      default_role: default_role || 'member',
      allowed_domains: allowed_domains || [],
      is_enabled: is_enabled ?? false,
    };

    let result;
    if (existingConfig) {
      // Update existing
      const { data, error } = await serviceSupabase
        .from('sso_configurations')
        .update(configData)
        .eq('id', existingConfig.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Create new
      const { data, error } = await serviceSupabase
        .from('sso_configurations')
        .insert(configData)
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    // Log to audit
    await serviceSupabase.from('audit_logs').insert({
      issuer_id: issuerId,
      user_id: user.id,
      action: existingConfig ? 'sso.updated' : 'sso.created',
      resource_type: 'sso_configuration',
      resource_id: result.id,
      details: {
        name: configData.name,
        entity_id: configData.entity_id,
        is_enabled: configData.is_enabled,
      },
    });

    return NextResponse.json({
      config: result,
      message: existingConfig ? 'SSO configuration updated' : 'SSO configuration created',
    });
  } catch (error) {
    console.error('Save SSO config error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/sso - Delete SSO configuration
 */
export async function DELETE() {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get issuer ID
    let issuerId: string | null = null;

    const { data: issuer } = await supabase
      .from('issuers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (issuer) {
      issuerId = issuer.id;
    } else {
      const { data: teamMember } = await supabase
        .from('team_members')
        .select('issuer_id')
        .eq('user_id', user.id)
        .in('role', ['owner', 'admin'])
        .single();

      if (teamMember) {
        issuerId = teamMember.issuer_id;
      }
    }

    if (!issuerId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const serviceSupabase = getServiceSupabase();

    // Delete config
    const { error } = await serviceSupabase
      .from('sso_configurations')
      .delete()
      .eq('issuer_id', issuerId);

    if (error) throw error;

    // Log to audit
    await serviceSupabase.from('audit_logs').insert({
      issuer_id: issuerId,
      user_id: user.id,
      action: 'sso.deleted',
      resource_type: 'sso_configuration',
      details: {},
    });

    return NextResponse.json({ message: 'SSO configuration deleted' });
  } catch (error) {
    console.error('Delete SSO config error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
