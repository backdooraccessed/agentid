import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/compliance/export - Comprehensive compliance export
 * Exports all audit-relevant data for compliance reporting
 * Query params:
 *   - format: json | csv (default: json)
 *   - from: Start date (ISO format, default: 30 days ago)
 *   - to: End date (ISO format, default: now)
 *   - include: Comma-separated list of data types:
 *       credentials, verifications, audit_logs, policies, authorizations, team_activity
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get issuer
    const { data: issuer } = await supabase
      .from('issuers')
      .select('id, name')
      .eq('user_id', user.id)
      .single();

    if (!issuer) {
      return NextResponse.json({ error: 'Issuer not found' }, { status: 404 });
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';

    const defaultFrom = new Date();
    defaultFrom.setDate(defaultFrom.getDate() - 30);
    const from = searchParams.get('from') || defaultFrom.toISOString();
    const to = searchParams.get('to') || new Date().toISOString();

    const includeParam = searchParams.get('include') || 'credentials,verifications,audit_logs,policies,authorizations,team_activity';
    const include = includeParam.split(',').map(s => s.trim());

    const exportData: ComplianceExport = {
      meta: {
        exported_at: new Date().toISOString(),
        exported_by: user.email || user.id,
        issuer: {
          id: issuer.id,
          name: issuer.name,
        },
        date_range: {
          from,
          to,
        },
        format,
      },
      credentials: [],
      verifications: [],
      audit_logs: [],
      policies: [],
      authorizations: [],
      team_activity: [],
    };

    // Fetch credentials
    if (include.includes('credentials')) {
      const { data: credentials } = await supabase
        .from('credentials')
        .select('id, agent_id, agent_name, agent_type, status, valid_from, valid_until, created_at, revoked_at, revocation_reason')
        .eq('issuer_id', issuer.id)
        .gte('created_at', from)
        .lte('created_at', to)
        .order('created_at', { ascending: false });

      exportData.credentials = credentials || [];
    }

    // Fetch verification events
    if (include.includes('verifications')) {
      const { data: verifications } = await supabase
        .from('verification_events')
        .select('id, agent_id, success, failure_reason, verification_time_ms, verified_at')
        .eq('issuer_id', issuer.id)
        .gte('verified_at', from)
        .lte('verified_at', to)
        .order('verified_at', { ascending: false });

      exportData.verifications = verifications || [];
    }

    // Fetch audit logs
    if (include.includes('audit_logs')) {
      const { data: auditLogs } = await supabase
        .from('audit_logs')
        .select('id, action, resource_type, resource_id, details, ip_address, created_at')
        .eq('issuer_id', issuer.id)
        .gte('created_at', from)
        .lte('created_at', to)
        .order('created_at', { ascending: false });

      exportData.audit_logs = auditLogs || [];
    }

    // Fetch permission policies
    if (include.includes('policies')) {
      const { data: policies } = await supabase
        .from('permission_policies')
        .select('id, name, description, permissions, conditions, is_default, priority, created_at, updated_at')
        .eq('issuer_id', issuer.id)
        .order('created_at', { ascending: false });

      exportData.policies = (policies || []).map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        permissions: p.permissions,
        conditions: p.conditions,
        is_default: p.is_default,
        priority: p.priority,
        created_at: p.created_at,
        updated_at: p.updated_at,
      }));
    }

    // Fetch A2A authorization history
    if (include.includes('authorizations')) {
      // Get credentials for this issuer first
      const { data: issuerCredentials } = await supabase
        .from('credentials')
        .select('id')
        .eq('issuer_id', issuer.id);

      const credentialIds = (issuerCredentials || []).map(c => c.id);

      if (credentialIds.length > 0) {
        const { data: authorizations } = await supabase
          .from('a2a_authorization_requests')
          .select(`
            id,
            requester_credential_id,
            grantor_credential_id,
            requested_permissions,
            scope_description,
            status,
            response_message,
            created_at,
            responded_at
          `)
          .or(`requester_credential_id.in.(${credentialIds.join(',')}),grantor_credential_id.in.(${credentialIds.join(',')})`)
          .gte('created_at', from)
          .lte('created_at', to)
          .order('created_at', { ascending: false });

        exportData.authorizations = (authorizations || []).map(a => ({
          id: a.id,
          requester_credential_id: a.requester_credential_id,
          grantor_credential_id: a.grantor_credential_id,
          requested_permissions: a.requested_permissions,
          scope_description: a.scope_description,
          status: a.status,
          response_message: a.response_message,
          created_at: a.created_at,
          responded_at: a.responded_at,
          role: credentialIds.includes(a.requester_credential_id) ? 'requester' : 'grantor',
        }));
      }
    }

    // Fetch team activity
    if (include.includes('team_activity')) {
      // Get team members
      const { data: teamMembers } = await supabase
        .from('team_members')
        .select('id, user_id, role, status, created_at, updated_at')
        .eq('issuer_id', issuer.id);

      // Get team invitations
      const { data: invitations } = await supabase
        .from('team_invitations')
        .select('id, email, role, created_at, expires_at, accepted_at')
        .eq('issuer_id', issuer.id)
        .gte('created_at', from)
        .lte('created_at', to)
        .order('created_at', { ascending: false });

      exportData.team_activity = {
        members: (teamMembers || []).map(m => ({
          id: m.id,
          user_id: m.user_id,
          role: m.role,
          status: m.status,
          joined_at: m.created_at,
          updated_at: m.updated_at,
        })),
        invitations: (invitations || []).map(i => ({
          id: i.id,
          email: i.email,
          role: i.role,
          sent_at: i.created_at,
          expires_at: i.expires_at,
          accepted_at: i.accepted_at,
          status: i.accepted_at ? 'accepted' : new Date(i.expires_at) < new Date() ? 'expired' : 'pending',
        })),
      };
    }

    // Log export action
    await supabase.from('audit_logs').insert({
      issuer_id: issuer.id,
      action: 'compliance.exported',
      resource_type: 'compliance',
      details: {
        format,
        date_range: { from, to },
        include,
        counts: {
          credentials: exportData.credentials.length,
          verifications: exportData.verifications.length,
          audit_logs: exportData.audit_logs.length,
          policies: exportData.policies.length,
          authorizations: exportData.authorizations.length,
          team_members: Array.isArray(exportData.team_activity) ? 0 : exportData.team_activity.members?.length || 0,
          team_invitations: Array.isArray(exportData.team_activity) ? 0 : exportData.team_activity.invitations?.length || 0,
        },
      },
    });

    const timestamp = new Date().toISOString().split('T')[0];

    if (format === 'csv') {
      // Generate multi-sheet CSV (concatenated with section headers)
      const csvSections: string[] = [];

      if (include.includes('credentials') && exportData.credentials.length > 0) {
        csvSections.push('# CREDENTIALS');
        csvSections.push('id,agent_id,agent_name,agent_type,status,valid_from,valid_until,created_at,revoked_at,revocation_reason');
        for (const c of exportData.credentials) {
          csvSections.push([
            c.id,
            escapeCsv(c.agent_id),
            escapeCsv(c.agent_name),
            c.agent_type,
            c.status,
            c.valid_from,
            c.valid_until,
            c.created_at,
            c.revoked_at || '',
            escapeCsv(c.revocation_reason || ''),
          ].join(','));
        }
      }

      if (include.includes('verifications') && exportData.verifications.length > 0) {
        csvSections.push('');
        csvSections.push('# VERIFICATION EVENTS');
        csvSections.push('id,agent_id,success,failure_reason,verification_time_ms,verified_at');
        for (const v of exportData.verifications) {
          csvSections.push([
            v.id,
            escapeCsv(v.agent_id),
            v.success,
            escapeCsv(v.failure_reason || ''),
            v.verification_time_ms || '',
            v.verified_at,
          ].join(','));
        }
      }

      if (include.includes('audit_logs') && exportData.audit_logs.length > 0) {
        csvSections.push('');
        csvSections.push('# AUDIT LOGS');
        csvSections.push('id,action,resource_type,resource_id,details,ip_address,created_at');
        for (const a of exportData.audit_logs) {
          csvSections.push([
            a.id,
            a.action,
            a.resource_type,
            a.resource_id || '',
            escapeCsv(JSON.stringify(a.details)),
            a.ip_address || '',
            a.created_at,
          ].join(','));
        }
      }

      if (include.includes('policies') && exportData.policies.length > 0) {
        csvSections.push('');
        csvSections.push('# PERMISSION POLICIES');
        csvSections.push('id,name,description,permissions,conditions,is_default,priority,created_at,updated_at');
        for (const p of exportData.policies) {
          csvSections.push([
            p.id,
            escapeCsv(p.name),
            escapeCsv(p.description || ''),
            escapeCsv(JSON.stringify(p.permissions)),
            escapeCsv(JSON.stringify(p.conditions)),
            p.is_default,
            p.priority,
            p.created_at,
            p.updated_at,
          ].join(','));
        }
      }

      if (include.includes('authorizations') && exportData.authorizations.length > 0) {
        csvSections.push('');
        csvSections.push('# A2A AUTHORIZATIONS');
        csvSections.push('id,requester_credential_id,grantor_credential_id,requested_permissions,scope_description,status,response_message,role,created_at,responded_at');
        for (const a of exportData.authorizations) {
          csvSections.push([
            a.id,
            a.requester_credential_id,
            a.grantor_credential_id,
            escapeCsv(JSON.stringify(a.requested_permissions)),
            escapeCsv(a.scope_description || ''),
            a.status,
            escapeCsv(a.response_message || ''),
            a.role,
            a.created_at,
            a.responded_at || '',
          ].join(','));
        }
      }

      if (include.includes('team_activity') && !Array.isArray(exportData.team_activity)) {
        const teamData = exportData.team_activity;

        if (teamData.members && teamData.members.length > 0) {
          csvSections.push('');
          csvSections.push('# TEAM MEMBERS');
          csvSections.push('id,user_id,role,status,joined_at,updated_at');
          for (const m of teamData.members) {
            csvSections.push([
              m.id,
              m.user_id,
              m.role,
              m.status,
              m.joined_at,
              m.updated_at,
            ].join(','));
          }
        }

        if (teamData.invitations && teamData.invitations.length > 0) {
          csvSections.push('');
          csvSections.push('# TEAM INVITATIONS');
          csvSections.push('id,email,role,status,sent_at,expires_at,accepted_at');
          for (const i of teamData.invitations) {
            csvSections.push([
              i.id,
              escapeCsv(i.email),
              i.role,
              i.status,
              i.sent_at,
              i.expires_at,
              i.accepted_at || '',
            ].join(','));
          }
        }
      }

      return new NextResponse(csvSections.join('\n'), {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="compliance-export-${timestamp}.csv"`,
        },
      });
    }

    // JSON format
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="compliance-export-${timestamp}.json"`,
      },
    });
  } catch (error) {
    console.error('Compliance export error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

interface ComplianceExport {
  meta: {
    exported_at: string;
    exported_by: string;
    issuer: {
      id: string;
      name: string;
    };
    date_range: {
      from: string;
      to: string;
    };
    format: string;
  };
  credentials: Array<{
    id: string;
    agent_id: string;
    agent_name: string;
    agent_type: string;
    status: string;
    valid_from: string;
    valid_until: string;
    created_at: string;
    revoked_at: string | null;
    revocation_reason: string | null;
  }>;
  verifications: Array<{
    id: string;
    agent_id: string;
    success: boolean;
    failure_reason: string | null;
    verification_time_ms: number | null;
    verified_at: string;
  }>;
  audit_logs: Array<{
    id: string;
    action: string;
    resource_type: string;
    resource_id: string | null;
    details: Record<string, unknown>;
    ip_address: string | null;
    created_at: string;
  }>;
  policies: Array<{
    id: string;
    name: string;
    description: string | null;
    permissions: unknown;
    conditions: unknown;
    is_default: boolean;
    priority: number;
    created_at: string;
    updated_at: string;
  }>;
  authorizations: Array<{
    id: string;
    requester_credential_id: string;
    grantor_credential_id: string;
    requested_permissions: string[];
    scope_description: string | null;
    status: string;
    response_message: string | null;
    created_at: string;
    responded_at: string | null;
    role: 'requester' | 'grantor';
  }>;
  team_activity: Array<never> | {
    members: Array<{
      id: string;
      user_id: string;
      role: string;
      status: string;
      joined_at: string;
      updated_at: string;
    }>;
    invitations: Array<{
      id: string;
      email: string;
      role: string;
      sent_at: string;
      expires_at: string;
      accepted_at: string | null;
      status: 'pending' | 'accepted' | 'expired';
    }>;
  };
}

function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
