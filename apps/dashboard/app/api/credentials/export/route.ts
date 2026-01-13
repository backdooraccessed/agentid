import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { authenticateRequest, checkScope } from '@/lib/auth';
import { ApiKeyScopes } from '@/lib/api-keys';

/**
 * GET /api/credentials/export - Export credentials as JSON or CSV
 * Query params:
 *   - format: json | csv (default: json)
 *   - status: Filter by status (active, revoked, expired, all)
 *   - include_payload: Include full credential payload (default: false)
 */
export async function GET(request: NextRequest) {
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
    if (auth.apiKeyInfo && !checkScope(auth, ApiKeyScopes.CREDENTIALS_READ)) {
      return NextResponse.json(
        { error: 'API key lacks credentials:read scope' },
        { status: 403 }
      );
    }

    const supabase = auth.apiKeyInfo
      ? createServiceClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
      : await createClient();

    // Parse query params
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';
    const status = searchParams.get('status') || 'all';
    const includePayload = searchParams.get('include_payload') === 'true';

    // Build query - always fetch all to avoid TypeScript issues
    let query = supabase
      .from('credentials')
      .select('*')
      .eq('issuer_id', auth.issuerId)
      .order('created_at', { ascending: false });

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    interface CredentialExport {
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
      credential_payload?: unknown;
    }

    const credentials = data as CredentialExport[] | null;

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch credentials' },
        { status: 500 }
      );
    }

    // Log export action (fire and forget)
    void supabase.from('audit_logs').insert({
      issuer_id: auth.issuerId,
      action: 'credentials.exported',
      resource_type: 'credential',
      details: { format, status, count: credentials?.length || 0, include_payload: includePayload },
    });

    if (format === 'csv') {
      // Generate CSV
      const csvRows: string[] = [];

      // Header row
      const headers = [
        'id',
        'agent_id',
        'agent_name',
        'agent_type',
        'status',
        'valid_from',
        'valid_until',
        'created_at',
        'revoked_at',
        'revocation_reason',
      ];
      csvRows.push(headers.join(','));

      // Data rows
      for (const cred of credentials || []) {
        const row = [
          cred.id,
          escapeCsvField(cred.agent_id),
          escapeCsvField(cred.agent_name),
          cred.agent_type,
          cred.status,
          cred.valid_from,
          cred.valid_until,
          cred.created_at,
          cred.revoked_at || '',
          escapeCsvField(cred.revocation_reason || ''),
        ];
        csvRows.push(row.join(','));
      }

      const csv = csvRows.join('\n');
      const timestamp = new Date().toISOString().split('T')[0];

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="credentials-${timestamp}.csv"`,
        },
      });
    }

    // JSON format (default)
    const timestamp = new Date().toISOString().split('T')[0];

    // Filter out credential_payload if not requested
    const exportData = includePayload
      ? credentials
      : credentials?.map(({ credential_payload, ...rest }) => rest);

    return new NextResponse(JSON.stringify({
      exported_at: new Date().toISOString(),
      count: exportData?.length || 0,
      credentials: exportData || [],
    }, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="credentials-${timestamp}.json"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function escapeCsvField(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}
