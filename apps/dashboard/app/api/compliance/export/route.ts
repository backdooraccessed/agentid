import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/compliance/export - Comprehensive compliance export
 * Exports all audit-relevant data: credentials, verifications, audit logs
 * Query params:
 *   - format: json | csv (default: json)
 *   - from: Start date (ISO format, default: 30 days ago)
 *   - to: End date (ISO format, default: now)
 *   - include: Comma-separated list of data types (credentials,verifications,audit_logs)
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

    const includeParam = searchParams.get('include') || 'credentials,verifications,audit_logs';
    const include = includeParam.split(',');

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
}

function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
