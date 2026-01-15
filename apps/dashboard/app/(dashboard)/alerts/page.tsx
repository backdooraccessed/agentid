'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  critical: { icon: AlertTriangle, color: 'text-red-700', bg: 'bg-red-100', border: 'border-red-300' },
  high: { icon: AlertCircle, color: 'text-orange-700', bg: 'bg-orange-100', border: 'border-orange-300' },
  medium: { icon: Bell, color: 'text-yellow-700', bg: 'bg-yellow-100', border: 'border-yellow-300' },
  low: { icon: Bell, color: 'text-blue-700', bg: 'bg-blue-100', border: 'border-blue-300' },
};

const statusConfig = {
  triggered: { label: 'Active', color: 'text-red-700', bg: 'bg-red-100', border: 'border-red-300' },
  acknowledged: { label: 'Acknowledged', color: 'text-yellow-700', bg: 'bg-yellow-100', border: 'border-yellow-300' },
  resolved: { label: 'Resolved', color: 'text-green-700', bg: 'bg-green-100', border: 'border-green-300' },
  dismissed: { label: 'Dismissed', color: 'text-gray-600', bg: 'bg-gray-100', border: 'border-gray-300' },
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
          <div className="h-8 bg-gray-100 w-48 border-4 border-black" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-100 border-4 border-black" />
            ))}
          </div>
          <div className="h-64 bg-gray-100 border-4 border-black" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-white min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="font-pixel text-3xl text-black uppercase">Alerts</h1>
          <p className="font-retro text-gray-600 mt-1">
            Monitor security events and anomalies across your credentials
          </p>
        </div>
        <Button asChild className="bg-black text-white hover:bg-gray-800 font-retro uppercase border-4 border-black">
          <Link href="/alerts/rules">
            <Settings className="h-4 w-4 mr-2" />
            Alert Rules
          </Link>
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 border-4 border-black font-retro">
          {error}
          <button className="ml-2 underline font-retro" onClick={() => setError(null)}>
            Dismiss
          </button>
        </div>
      )}

      {/* Stats */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="border-4 border-black bg-white p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <p className="font-retro text-gray-600 text-sm uppercase">Active Alerts</p>
            <div className="flex items-center gap-2 mt-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span className="font-pixel text-2xl text-black">{summary.triggered_count}</span>
            </div>
          </div>
          <div className="border-4 border-black bg-white p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <p className="font-retro text-gray-600 text-sm uppercase">Critical</p>
            <div className="flex items-center gap-2 mt-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="font-pixel text-2xl text-black">{summary.critical_count}</span>
            </div>
          </div>
          <div className="border-4 border-black bg-white p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <p className="font-retro text-gray-600 text-sm uppercase">Last 24 Hours</p>
            <div className="flex items-center gap-2 mt-2">
              <Clock className="h-5 w-5 text-gray-600" />
              <span className="font-pixel text-2xl text-black">{summary.last_24h_count}</span>
            </div>
          </div>
          <div className="border-4 border-black bg-white p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <p className="font-retro text-gray-600 text-sm uppercase">Acknowledged</p>
            <div className="flex items-center gap-2 mt-2">
              <CheckCircle className="h-5 w-5 text-yellow-600" />
              <span className="font-pixel text-2xl text-black">{summary.acknowledged_count}</span>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-600" />
          <Input
            placeholder="Search alerts..."
            className="pl-10 border-4 border-black font-retro"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button
            className={`px-4 py-2 font-retro uppercase text-sm border-4 border-black ${
              statusFilter === 'triggered'
                ? 'bg-black text-white'
                : 'bg-white text-black hover:bg-gray-100'
            }`}
            onClick={() => setStatusFilter('triggered')}
          >
            Active
          </button>
          <button
            className={`px-4 py-2 font-retro uppercase text-sm border-4 border-black ${
              statusFilter === 'acknowledged'
                ? 'bg-black text-white'
                : 'bg-white text-black hover:bg-gray-100'
            }`}
            onClick={() => setStatusFilter('acknowledged')}
          >
            Acknowledged
          </button>
          <button
            className={`px-4 py-2 font-retro uppercase text-sm border-4 border-black ${
              statusFilter === 'all'
                ? 'bg-black text-white'
                : 'bg-white text-black hover:bg-gray-100'
            }`}
            onClick={() => setStatusFilter('all')}
          >
            All
          </button>
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
              <div key={alert.id} className="border-4 border-black bg-white p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 border-2 ${severity.border} ${severity.bg}`}>
                      <SeverityIcon className={`h-4 w-4 ${severity.color}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-retro font-medium text-black">{alert.title}</h3>
                        <span
                          className={`text-xs px-2 py-0.5 border-2 ${status.border} ${status.bg} ${status.color} font-retro uppercase`}
                        >
                          {status.label}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 border-2 ${severity.border} ${severity.bg} ${severity.color} font-retro uppercase`}
                        >
                          {alert.severity}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1 font-retro">{alert.message}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-600 font-retro">
                        {alert.credentials && (
                          <Link
                            href={`/credentials/${alert.credentials.id}`}
                            className="flex items-center gap-1 hover:text-black"
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
                        <button
                          className="px-3 py-1.5 font-retro uppercase text-xs border-4 border-black bg-white text-black hover:bg-gray-100"
                          onClick={() => handleAcknowledge(alert)}
                        >
                          Acknowledge
                        </button>
                        <button
                          className="px-3 py-1.5 font-retro uppercase text-xs border-4 border-black bg-black text-white hover:bg-gray-800"
                          onClick={() => {
                            setSelectedAlert(alert);
                            setShowResolve(true);
                          }}
                        >
                          Resolve
                        </button>
                      </>
                    )}
                    {alert.status === 'acknowledged' && (
                      <button
                        className="px-3 py-1.5 font-retro uppercase text-xs border-4 border-black bg-black text-white hover:bg-gray-800"
                        onClick={() => {
                          setSelectedAlert(alert);
                          setShowResolve(true);
                        }}
                      >
                        Resolve
                      </button>
                    )}
                    {alert.credential_id && (
                      <Link
                        href={`/credentials/${alert.credential_id}`}
                        className="px-3 py-1.5 font-retro uppercase text-xs border-4 border-black bg-white text-black hover:bg-gray-100"
                      >
                        View Credential
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Resolve Dialog */}
      <Dialog open={showResolve} onOpenChange={setShowResolve}>
        <DialogContent className="border-4 border-black bg-white">
          <DialogHeader>
            <DialogTitle className="font-pixel text-xl text-black uppercase">Resolve Alert</DialogTitle>
            <DialogDescription className="font-retro text-gray-600">
              Mark this alert as resolved. Optionally add a note about how it was addressed.
            </DialogDescription>
          </DialogHeader>
          {selectedAlert && (
            <div className="py-4 space-y-4">
              <div className="p-3 bg-gray-50 border-4 border-black">
                <p className="font-retro font-medium text-black">{selectedAlert.title}</p>
                <p className="text-sm text-gray-600 mt-1 font-retro">{selectedAlert.message}</p>
              </div>
              <div className="space-y-2">
                <Label className="font-retro text-black uppercase text-sm">Resolution Note (optional)</Label>
                <Textarea
                  placeholder="How was this alert addressed?"
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  className="border-4 border-black font-retro"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <button
              className="px-4 py-2 font-retro uppercase text-sm border-4 border-black bg-white text-black hover:bg-gray-100"
              onClick={() => setShowResolve(false)}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 font-retro uppercase text-sm border-4 border-black bg-black text-white hover:bg-gray-800 disabled:opacity-50"
              onClick={handleResolve}
              disabled={updating}
            >
              {updating ? 'Resolving...' : 'Resolve Alert'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
