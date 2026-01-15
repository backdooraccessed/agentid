'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  Settings,
  Search,
  Filter,
} from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';

interface AlertEvent {
  id: string;
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'triggered' | 'acknowledged' | 'resolved' | 'dismissed';
  event_data: Record<string, unknown>;
  triggered_at: string;
  acknowledged_at: string | null;
  resolved_at: string | null;
  credential_id: string | null;
  alert_rules: {
    id: string;
    name: string;
    rule_type: string;
  } | null;
  credentials: {
    id: string;
    agent_name: string;
    agent_id: string;
  } | null;
}

interface AlertSummary {
  triggered_count: number;
  acknowledged_count: number;
  critical_count: number;
  high_count: number;
  last_24h_count: number;
}

const severityConfig = {
  critical: { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10' },
  high: { icon: AlertCircle, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  medium: { icon: Bell, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  low: { icon: Bell, color: 'text-blue-500', bg: 'bg-blue-500/10' },
};

const statusConfig = {
  triggered: { label: 'Active', color: 'text-red-500', bg: 'bg-red-500/10' },
  acknowledged: { label: 'Acknowledged', color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  resolved: { label: 'Resolved', color: 'text-green-500', bg: 'bg-green-500/10' },
  dismissed: { label: 'Dismissed', color: 'text-muted-foreground', bg: 'bg-muted' },
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertEvent[]>([]);
  const [summary, setSummary] = useState<AlertSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('triggered');

  // Resolve dialog
  const [showResolve, setShowResolve] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<AlertEvent | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchAlerts();
  }, [statusFilter]);

  async function fetchAlerts() {
    try {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== 'all') {
        params.set('status', statusFilter);
      }

      const response = await fetch(`/api/alerts?${params}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to fetch alerts');
        return;
      }

      setAlerts(data.alerts || []);
      setSummary(data.summary);
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  async function handleAcknowledge(alert: AlertEvent) {
    try {
      const response = await fetch(`/api/alerts/${alert.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'acknowledged' }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to acknowledge alert');
        return;
      }

      fetchAlerts();
    } catch {
      setError('Network error');
    }
  }

  async function handleResolve() {
    if (!selectedAlert) return;

    try {
      setUpdating(true);

      const response = await fetch(`/api/alerts/${selectedAlert.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'resolved',
          resolution_note: resolutionNote || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to resolve alert');
        return;
      }

      setShowResolve(false);
      setSelectedAlert(null);
      setResolutionNote('');
      fetchAlerts();
    } catch {
      setError('Network error');
    } finally {
      setUpdating(false);
    }
  }

  const filteredAlerts = alerts.filter(
    (a) =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.message.toLowerCase().includes(search.toLowerCase()) ||
      a.credentials?.agent_name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-muted rounded" />
            ))}
          </div>
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-semibold">Alerts</h1>
          <p className="text-muted-foreground mt-1">
            Monitor security events and anomalies across your credentials
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/alerts/rules">
            <Settings className="h-4 w-4 mr-2" />
            Alert Rules
          </Link>
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md">
          {error}
          <button className="ml-2 underline" onClick={() => setError(null)}>
            Dismiss
          </button>
        </div>
      )}

      {/* Stats */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Active Alerts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <span className="text-2xl font-bold">{summary.triggered_count}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Critical</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <span className="text-2xl font-bold">{summary.critical_count}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Last 24 Hours</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <span className="text-2xl font-bold">{summary.last_24h_count}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Acknowledged</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-yellow-500" />
                <span className="text-2xl font-bold">{summary.acknowledged_count}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search alerts..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={statusFilter === 'triggered' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('triggered')}
          >
            Active
          </Button>
          <Button
            variant={statusFilter === 'acknowledged' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('acknowledged')}
          >
            Acknowledged
          </Button>
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('all')}
          >
            All
          </Button>
        </div>
      </div>

      {/* Alerts List */}
      {filteredAlerts.length === 0 ? (
        <EmptyState
          title={search ? 'No alerts found' : 'No alerts yet'}
          description={
            search
              ? 'Try a different search term'
              : 'When alerts are triggered, they will appear here'
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => {
            const severity = severityConfig[alert.severity];
            const status = statusConfig[alert.status];
            const SeverityIcon = severity.icon;

            return (
              <Card key={alert.id} className="hover:bg-muted/50 transition-colors">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-full ${severity.bg}`}>
                        <SeverityIcon className={`h-4 w-4 ${severity.color}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{alert.title}</h3>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${status.bg} ${status.color}`}
                          >
                            {status.label}
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${severity.bg} ${severity.color} capitalize`}
                          >
                            {alert.severity}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          {alert.credentials && (
                            <Link
                              href={`/credentials/${alert.credentials.id}`}
                              className="flex items-center gap-1 hover:text-foreground"
                            >
                              <Shield className="h-3 w-3" />
                              {alert.credentials.agent_name}
                            </Link>
                          )}
                          {alert.alert_rules && (
                            <span className="flex items-center gap-1">
                              <Bell className="h-3 w-3" />
                              {alert.alert_rules.name}
                            </span>
                          )}
                          <span>
                            {new Date(alert.triggered_at).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {alert.status === 'triggered' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAcknowledge(alert)}
                          >
                            Acknowledge
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedAlert(alert);
                              setShowResolve(true);
                            }}
                          >
                            Resolve
                          </Button>
                        </>
                      )}
                      {alert.status === 'acknowledged' && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedAlert(alert);
                            setShowResolve(true);
                          }}
                        >
                          Resolve
                        </Button>
                      )}
                      {alert.credential_id && (
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/credentials/${alert.credential_id}`}>
                            View Credential
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Resolve Dialog */}
      <Dialog open={showResolve} onOpenChange={setShowResolve}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Alert</DialogTitle>
            <DialogDescription>
              Mark this alert as resolved. Optionally add a note about how it was addressed.
            </DialogDescription>
          </DialogHeader>
          {selectedAlert && (
            <div className="py-4 space-y-4">
              <div className="p-3 bg-muted rounded-md">
                <p className="font-medium">{selectedAlert.title}</p>
                <p className="text-sm text-muted-foreground mt-1">{selectedAlert.message}</p>
              </div>
              <div className="space-y-2">
                <Label>Resolution Note (optional)</Label>
                <Textarea
                  placeholder="How was this alert addressed?"
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResolve(false)}>
              Cancel
            </Button>
            <Button onClick={handleResolve} disabled={updating}>
              {updating ? 'Resolving...' : 'Resolve Alert'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
