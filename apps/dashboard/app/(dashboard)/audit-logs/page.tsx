'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

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

const ACTION_COLORS: Record<string, string> = {
  'credential.issued': 'bg-green-100 text-green-800',
  'credential.revoked': 'bg-red-100 text-red-800',
  'credential.renewed': 'bg-blue-100 text-blue-800',
  'api_key.created': 'bg-purple-100 text-purple-800',
  'api_key.deleted': 'bg-orange-100 text-orange-800',
  'webhook.created': 'bg-cyan-100 text-cyan-800',
  'webhook.deleted': 'bg-orange-100 text-orange-800',
  'template.created': 'bg-indigo-100 text-indigo-800',
  'template.deleted': 'bg-orange-100 text-orange-800',
  'team.member_added': 'bg-teal-100 text-teal-800',
  'team.member_removed': 'bg-orange-100 text-orange-800',
  'settings.updated': 'bg-gray-100 text-gray-800',
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('');

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
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Audit Logs</h1>
        <p className="text-muted-foreground">
          Track all actions and changes in your organization
        </p>
      </div>

      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
          {error}
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filter by Action</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filter === '' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('')}
            >
              All
            </Button>
            {Object.entries(ACTION_LABELS).map(([key, label]) => (
              <Button
                key={key}
                variant={filter === key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(key)}
              >
                {label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Logs List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Activity Log</CardTitle>
          <CardDescription>
            {pagination?.total || 0} total events
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No audit logs recorded yet. Actions will appear here as you use the platform.
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start justify-between py-3 border-b last:border-0"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-800'
                        }`}
                      >
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
                      <div className="text-xs font-mono text-muted-foreground">
                        ID: {log.resource_id.slice(0, 8)}...
                      </div>
                    )}
                  </div>
                  <div className="text-right">
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
            <div className="mt-4 text-center">
              <Button
                variant="outline"
                onClick={loadMore}
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Load More'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
