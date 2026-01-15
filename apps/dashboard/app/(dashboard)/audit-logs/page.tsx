'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Download, FileJson, FileSpreadsheet, Calendar, ScrollText, Shield, Key, Webhook, FileText, Users, Settings, AlertCircle, Loader2, ChevronDown, Plus, Trash2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AuditLog {
  id: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  details: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
}

interface Pagination {
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

const ACTION_LABELS: Record<string, string> = {
  'credential.issued': 'Credential Issued',
  'credential.revoked': 'Credential Revoked',
  'credential.renewed': 'Credential Renewed',
  'api_key.created': 'API Key Created',
  'api_key.deleted': 'API Key Deleted',
  'webhook.created': 'Webhook Created',
  'webhook.deleted': 'Webhook Deleted',
  'template.created': 'Template Created',
  'template.deleted': 'Template Deleted',
  'team.member_added': 'Team Member Added',
  'team.member_removed': 'Team Member Removed',
  'settings.updated': 'Settings Updated',
};

const ACTION_ICONS: Record<string, React.ReactNode> = {
  'credential.issued': <Plus className="h-3.5 w-3.5" />,
  'credential.revoked': <Trash2 className="h-3.5 w-3.5" />,
  'credential.renewed': <RefreshCw className="h-3.5 w-3.5" />,
  'api_key.created': <Key className="h-3.5 w-3.5" />,
  'api_key.deleted': <Key className="h-3.5 w-3.5" />,
  'webhook.created': <Webhook className="h-3.5 w-3.5" />,
  'webhook.deleted': <Webhook className="h-3.5 w-3.5" />,
  'template.created': <FileText className="h-3.5 w-3.5" />,
  'template.deleted': <FileText className="h-3.5 w-3.5" />,
  'team.member_added': <Users className="h-3.5 w-3.5" />,
  'team.member_removed': <Users className="h-3.5 w-3.5" />,
  'settings.updated': <Settings className="h-3.5 w-3.5" />,
};

const getActionStyle = (action: string) => {
  if (action.includes('deleted') || action.includes('revoked') || action.includes('removed')) {
    return 'bg-red-500/10 text-red-400 border-red-500/20';
  }
  if (action.includes('created') || action.includes('issued') || action.includes('added')) {
    return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  }
  if (action.includes('renewed') || action.includes('updated')) {
    return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  }
  return 'bg-white/5 text-white/70 border-white/10';
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('');
  const [exporting, setExporting] = useState(false);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  const fetchLogs = async (offset = 0, action?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: '50',
        offset: offset.toString(),
      });
      if (action) {
        params.set('action', action);
      }

      const response = await fetch(`/api/audit-logs?${params}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to fetch logs');
        return;
      }

      if (offset === 0) {
        setLogs(data.logs);
      } else {
        setLogs(prev => [...prev, ...data.logs]);
      }
      setPagination(data.pagination);
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(0, filter || undefined);
  }, [filter]);

  const loadMore = () => {
    if (pagination?.has_more) {
      fetchLogs(pagination.offset + pagination.limit, filter || undefined);
    }
  };

  const getDateRangeParams = () => {
    const to = new Date().toISOString();
    const from = new Date();

    switch (dateRange) {
      case '7d':
        from.setDate(from.getDate() - 7);
        break;
      case '30d':
        from.setDate(from.getDate() - 30);
        break;
      case '90d':
        from.setDate(from.getDate() - 90);
        break;
      case '1y':
        from.setFullYear(from.getFullYear() - 1);
        break;
    }

    return { from: from.toISOString(), to };
  };

  const handleExport = async (format: 'json' | 'csv') => {
    setExporting(true);
    try {
      const { from, to } = getDateRangeParams();
      const params = new URLSearchParams({
        format,
        from,
        to,
        include: 'credentials,verifications,audit_logs',
      });

      const response = await fetch(`/api/compliance/export?${params}`);

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || 'Export failed');
        return;
      }

      // Trigger download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `compliance-export-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`Compliance report exported as ${format.toUpperCase()}`);
    } catch {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const formatDetails = (details: Record<string, unknown>): string => {
    const parts: string[] = [];
    if (details.agent_id) parts.push(`Agent: ${details.agent_id}`);
    if (details.agent_name) parts.push(`Name: ${details.agent_name}`);
    if (details.reason) parts.push(`Reason: ${details.reason}`);
    if (details.extend_days) parts.push(`Extended: ${details.extend_days} days`);
    if (details.name) parts.push(`Name: ${details.name}`);
    if (details.email) parts.push(`Email: ${details.email}`);
    return parts.join(' | ') || '-';
  };

  if (loading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading audit logs...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
          <ScrollText className="h-7 w-7 text-white/70" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground">
            Track all actions and changes in your organization
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Compliance Export */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-white/[0.02] border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
              <Download className="h-4 w-4 text-white/70" />
            </div>
            <div>
              <CardTitle className="text-base">Compliance Export</CardTitle>
              <CardDescription>
                Export audit data for compliance and reporting
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* Date Range Selector */}
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div className="flex gap-1">
                {(['7d', '30d', '90d', '1y'] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setDateRange(range)}
                    className={cn(
                      'px-3 py-1.5 text-xs font-medium rounded-lg transition-all',
                      dateRange === range
                        ? 'bg-white text-black'
                        : 'bg-white/5 text-white/70 hover:bg-white/10'
                    )}
                  >
                    {range === '7d' && '7 days'}
                    {range === '30d' && '30 days'}
                    {range === '90d' && '90 days'}
                    {range === '1y' && '1 year'}
                  </button>
                ))}
              </div>
            </div>

            {/* Export Buttons */}
            <div className="flex gap-2 ml-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('json')}
                disabled={exporting}
                className="gap-2 border-white/10 hover:bg-white/[0.04]"
              >
                <FileJson className="h-4 w-4" />
                Export JSON
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('csv')}
                disabled={exporting}
                className="gap-2 border-white/10 hover:bg-white/[0.04]"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Includes credentials, verification events, and audit logs for the selected period.
          </p>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-white/[0.02] border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
              <Shield className="h-4 w-4 text-white/70" />
            </div>
            <CardTitle className="text-base">Filter by Action</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('')}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-lg transition-all',
                filter === ''
                  ? 'bg-white text-black'
                  : 'bg-white/5 text-white/70 hover:bg-white/10'
              )}
            >
              All
            </button>
            {Object.entries(ACTION_LABELS).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-lg transition-all',
                  filter === key
                    ? 'bg-white text-black'
                    : 'bg-white/5 text-white/70 hover:bg-white/10'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Logs List */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-white/[0.02] border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
              <ScrollText className="h-4 w-4 text-white/70" />
            </div>
            <div>
              <CardTitle className="text-base">Activity Log</CardTitle>
              <CardDescription>
                {pagination?.total || 0} total events
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {logs.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
                <ScrollText className="h-6 w-6 text-white/30" />
              </div>
              <p className="text-muted-foreground">No audit logs recorded yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Actions will appear here as you use the platform
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border',
                          getActionStyle(log.action)
                        )}
                      >
                        {ACTION_ICONS[log.action] || <Shield className="h-3.5 w-3.5" />}
                        {ACTION_LABELS[log.action] || log.action}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {log.resource_type}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDetails(log.details)}
                    </div>
                    {log.resource_id && (
                      <div className="text-xs font-mono text-white/40">
                        ID: {log.resource_id.slice(0, 8)}...
                      </div>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm">
                      {new Date(log.created_at).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {pagination?.has_more && (
            <div className="mt-6 text-center">
              <Button
                variant="outline"
                onClick={loadMore}
                disabled={loading}
                className="gap-2 border-white/10 hover:bg-white/[0.04]"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Load More
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
