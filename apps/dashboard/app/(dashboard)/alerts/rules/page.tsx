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
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Plus,
  ArrowLeft,
  Bell,
  AlertTriangle,
  MapPin,
  TrendingUp,
  ShieldOff,
  Clock,
  ArrowDown,
  Trash2,
} from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';

interface AlertRule {
  id: string;
  name: string;
  description: string | null;
  rule_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  config: Record<string, unknown>;
  notify_webhook: string | null;
  notify_email: string | null;
  notify_in_dashboard: boolean;
  cooldown_minutes: number;
  is_active: boolean;
  last_triggered_at: string | null;
  created_at: string;
  credential_id: string | null;
  credentials: {
    id: string;
    agent_name: string;
    agent_id: string;
  } | null;
}

const ruleTypeConfig = {
  verification_failed: {
    label: 'Verification Failures',
    icon: AlertTriangle,
    description: 'Alert when verifications fail repeatedly',
    defaultConfig: { threshold: 3, window_minutes: 60 },
  },
  geo_anomaly: {
    label: 'Geographic Anomaly',
    icon: MapPin,
    description: 'Alert when used from unexpected locations',
    defaultConfig: { expected_regions: [], alert_on_new: true },
  },
  usage_spike: {
    label: 'Usage Spike',
    icon: TrendingUp,
    description: 'Alert when usage increases dramatically',
    defaultConfig: { threshold_multiplier: 5, baseline_window_hours: 24 },
  },
  permission_denied: {
    label: 'Permission Denied',
    icon: ShieldOff,
    description: 'Alert when permission violations occur',
    defaultConfig: { threshold: 1 },
  },
  credential_expiring: {
    label: 'Credential Expiring',
    icon: Clock,
    description: 'Alert before credentials expire',
    defaultConfig: { days_before: 7 },
  },
  trust_score_drop: {
    label: 'Trust Score Drop',
    icon: ArrowDown,
    description: 'Alert when trust score decreases significantly',
    defaultConfig: { threshold_points: 10 },
  },
};

export default function AlertRulesPage() {
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  type Severity = 'low' | 'medium' | 'high' | 'critical';

  // Create form state
  const [newRule, setNewRule] = useState<{
    name: string;
    description: string;
    rule_type: string;
    severity: Severity;
    notify_webhook: string;
    notify_email: string;
    notify_in_dashboard: boolean;
    cooldown_minutes: number;
  }>({
    name: '',
    description: '',
    rule_type: 'verification_failed',
    severity: 'medium',
    notify_webhook: '',
    notify_email: '',
    notify_in_dashboard: true,
    cooldown_minutes: 60,
  });

  useEffect(() => {
    fetchRules();
  }, []);

  async function fetchRules() {
    try {
      const response = await fetch('/api/alerts/rules');
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to fetch alert rules');
        return;
      }

      setRules(data.rules || []);
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    try {
      setCreating(true);

      const ruleConfig = ruleTypeConfig[newRule.rule_type as keyof typeof ruleTypeConfig];

      const response = await fetch('/api/alerts/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newRule.name,
          description: newRule.description || undefined,
          rule_type: newRule.rule_type,
          severity: newRule.severity,
          config: ruleConfig.defaultConfig,
          notify_webhook: newRule.notify_webhook || undefined,
          notify_email: newRule.notify_email || undefined,
          notify_in_dashboard: newRule.notify_in_dashboard,
          cooldown_minutes: newRule.cooldown_minutes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create alert rule');
        return;
      }

      setShowCreate(false);
      setNewRule({
        name: '',
        description: '',
        rule_type: 'verification_failed',
        severity: 'medium',
        notify_webhook: '',
        notify_email: '',
        notify_in_dashboard: true,
        cooldown_minutes: 60,
      });
      fetchRules();
    } catch {
      setError('Network error');
    } finally {
      setCreating(false);
    }
  }

  async function handleToggleActive(rule: AlertRule) {
    try {
      const response = await fetch(`/api/alerts/rules/${rule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !rule.is_active }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to update rule');
        return;
      }

      fetchRules();
    } catch {
      setError('Network error');
    }
  }

  async function handleDelete(ruleId: string) {
    if (!confirm('Are you sure you want to delete this alert rule?')) return;

    try {
      const response = await fetch(`/api/alerts/rules/${ruleId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to delete rule');
        return;
      }

      fetchRules();
    } catch {
      setError('Network error');
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-100 w-48" />
          <div className="h-64 bg-gray-100" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-white min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/alerts"
          className="p-2 border-4 border-black bg-white hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 text-black" />
        </Link>
        <div className="flex-1">
          <h1 className="font-pixel text-3xl text-black uppercase">Alert Rules</h1>
          <p className="font-retro text-gray-600 mt-1">
            Configure when and how to be notified about security events
          </p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button className="bg-black text-white hover:bg-gray-800 font-retro uppercase border-4 border-black">
              <Plus className="h-4 w-4 mr-2" />
              New Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg border-4 border-black bg-white">
            <DialogHeader>
              <DialogTitle className="font-pixel text-xl text-black uppercase">Create Alert Rule</DialogTitle>
              <DialogDescription className="font-retro text-gray-600">
                Configure a new alert rule to monitor credential activity
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="font-retro text-black uppercase">Rule Name</Label>
                <Input
                  placeholder="e.g., High failure rate alert"
                  value={newRule.name}
                  onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                  className="border-2 border-gray-300 bg-white font-retro"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-retro text-black uppercase">Rule Type</Label>
                <Select
                  value={newRule.rule_type}
                  onValueChange={(value) => setNewRule({ ...newRule, rule_type: value })}
                >
                  <SelectTrigger className="border-2 border-gray-300 bg-white font-retro">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-2 border-black bg-white">
                    {Object.entries(ruleTypeConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key} className="font-retro">
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs font-retro text-gray-600">
                  {ruleTypeConfig[newRule.rule_type as keyof typeof ruleTypeConfig]?.description}
                </p>
              </div>
              <div className="space-y-2">
                <Label className="font-retro text-black uppercase">Severity</Label>
                <Select
                  value={newRule.severity}
                  onValueChange={(value) =>
                    setNewRule({ ...newRule, severity: value as Severity })
                  }
                >
                  <SelectTrigger className="border-2 border-gray-300 bg-white font-retro">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-2 border-black bg-white">
                    <SelectItem value="low" className="font-retro">Low</SelectItem>
                    <SelectItem value="medium" className="font-retro">Medium</SelectItem>
                    <SelectItem value="high" className="font-retro">High</SelectItem>
                    <SelectItem value="critical" className="font-retro">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-retro text-black uppercase">Webhook URL (optional)</Label>
                <Input
                  placeholder="https://example.com/webhook"
                  value={newRule.notify_webhook}
                  onChange={(e) => setNewRule({ ...newRule, notify_webhook: e.target.value })}
                  className="border-2 border-gray-300 bg-white font-retro"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-retro text-black uppercase">Email (optional)</Label>
                <Input
                  type="email"
                  placeholder="alerts@example.com"
                  value={newRule.notify_email}
                  onChange={(e) => setNewRule({ ...newRule, notify_email: e.target.value })}
                  className="border-2 border-gray-300 bg-white font-retro"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="font-retro text-black uppercase">Show in Dashboard</Label>
                <Switch
                  checked={newRule.notify_in_dashboard}
                  onCheckedChange={(checked) =>
                    setNewRule({ ...newRule, notify_in_dashboard: checked })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowCreate(false)}
                className="border-2 border-black bg-white font-retro uppercase hover:bg-gray-100"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!newRule.name || creating}
                className="bg-black text-white hover:bg-gray-800 font-retro uppercase border-4 border-black"
              >
                {creating ? 'Creating...' : 'Create Rule'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="border-4 border-red-600 bg-red-50 text-red-600 px-4 py-3 font-retro">
          {error}
          <button className="ml-2 underline font-retro" onClick={() => setError(null)}>
            Dismiss
          </button>
        </div>
      )}

      {/* Rules List */}
      {rules.length === 0 ? (
        <EmptyState
          title="No alert rules yet"
          description="Create your first alert rule to start monitoring credential activity"
          actionLabel="Create Rule"
          onAction={() => setShowCreate(true)}
        />
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => {
            const config = ruleTypeConfig[rule.rule_type as keyof typeof ruleTypeConfig];
            const Icon = config?.icon || Bell;

            return (
              <div key={rule.id} className="border-4 border-black bg-white p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center justify-between pb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 border-2 border-black">
                      <Icon className="h-4 w-4 text-black" />
                    </div>
                    <div>
                      <h3 className="font-pixel text-base text-black flex items-center gap-2">
                        {rule.name}
                        <span
                          className={`text-xs font-retro px-2 py-0.5 border-2 uppercase ${
                            rule.severity === 'critical'
                              ? 'border-red-500 bg-red-50 text-red-500'
                              : rule.severity === 'high'
                              ? 'border-orange-500 bg-orange-50 text-orange-500'
                              : rule.severity === 'medium'
                              ? 'border-yellow-500 bg-yellow-50 text-yellow-600'
                              : 'border-blue-500 bg-blue-50 text-blue-500'
                          }`}
                        >
                          {rule.severity}
                        </span>
                      </h3>
                      <p className="font-retro text-sm text-gray-600">
                        {config?.label || rule.rule_type}
                        {rule.credentials && ` - ${rule.credentials.agent_name}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={rule.is_active}
                      onCheckedChange={() => handleToggleActive(rule)}
                    />
                    <button
                      className="p-2 border-2 border-black bg-white hover:bg-gray-100 transition-colors"
                      onClick={() => handleDelete(rule.id)}
                    >
                      <Trash2 className="h-4 w-4 text-gray-600" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm font-retro text-gray-600 pt-2 border-t-2 border-gray-200">
                  {rule.notify_webhook && (
                    <span className="flex items-center gap-1">
                      <Bell className="h-3 w-3" />
                      Webhook
                    </span>
                  )}
                  {rule.notify_email && (
                    <span className="flex items-center gap-1">
                      <Bell className="h-3 w-3" />
                      Email
                    </span>
                  )}
                  <span>Cooldown: {rule.cooldown_minutes}m</span>
                  {rule.last_triggered_at && (
                    <span>
                      Last triggered: {new Date(rule.last_triggered_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
