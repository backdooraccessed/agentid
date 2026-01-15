'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Bot, Shield, Wallet, Clock, AlertCircle, Loader2, ArrowLeft, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AGENT_TYPES,
  AGENT_TYPE_LABELS,
  AGENT_TYPE_DESCRIPTIONS,
  PERMISSION_ACTIONS,
  PERMISSION_ACTION_LABELS,
  PERMISSION_DOMAINS,
  PERMISSION_DOMAIN_LABELS,
} from '@agentid/shared';

export default function NewCredentialPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    agent_id: '',
    agent_name: '',
    agent_type: 'autonomous' as (typeof AGENT_TYPES)[number],
    actions: [] as string[],
    domains: [] as string[],
    max_transaction_value: '',
    currency: 'USD',
    daily_limit: '',
    valid_days: '30',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (formData.actions.length === 0) {
      setError('Please select at least one permission action');
      toast.error('Validation error', { description: 'Please select at least one permission action' });
      setLoading(false);
      return;
    }

    if (formData.domains.length === 0) {
      setError('Please select at least one permission domain');
      toast.error('Validation error', { description: 'Please select at least one permission domain' });
      setLoading(false);
      return;
    }

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + parseInt(formData.valid_days));

    const payload = {
      agent_id: formData.agent_id,
      agent_name: formData.agent_name,
      agent_type: formData.agent_type,
      permissions: {
        actions: formData.actions,
        domains: formData.domains,
        resource_limits: {
          ...(formData.max_transaction_value && {
            max_transaction_value: parseFloat(formData.max_transaction_value),
          }),
          ...(formData.currency && { currency: formData.currency }),
          ...(formData.daily_limit && {
            daily_limit: parseFloat(formData.daily_limit),
          }),
        },
      },
      valid_until: validUntil.toISOString(),
    };

    try {
      const response = await fetch('/api/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to issue credential');
        toast.error('Failed to issue credential', { description: data.error || 'Please try again' });
        setLoading(false);
        return;
      }

      toast.success('Credential issued!', { description: `Created credential for ${formData.agent_name}` });
      router.push('/credentials');
      router.refresh();
    } catch {
      setError('Network error. Please try again.');
      toast.error('Network error', { description: 'Please check your connection and try again' });
      setLoading(false);
    }
  };

  const toggleAction = (action: string) => {
    setFormData((prev) => ({
      ...prev,
      actions: prev.actions.includes(action)
        ? prev.actions.filter((a) => a !== action)
        : [...prev.actions, action],
    }));
  };

  const toggleDomain = (domain: string) => {
    setFormData((prev) => ({
      ...prev,
      domains: prev.domains.includes(domain)
        ? prev.domains.filter((d) => d !== domain)
        : [...prev.domains, domain],
    }));
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
          <Plus className="h-7 w-7 text-white/70" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Issue New Credential</h1>
          <p className="text-muted-foreground">
            Create a verifiable credential for your AI agent
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Agent Identity */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-white/[0.02] border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                <Bot className="h-4 w-4 text-white/70" />
              </div>
              <div>
                <CardTitle className="text-base">Agent Identity</CardTitle>
                <CardDescription>Basic information about your agent</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="agent_id" className="text-sm font-medium">Agent ID</Label>
              <Input
                id="agent_id"
                placeholder="my-trading-agent-v1"
                value={formData.agent_id}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, agent_id: e.target.value }))
                }
                required
                pattern="^[a-zA-Z0-9_-]+$"
                title="Only letters, numbers, underscores, and hyphens"
                className="bg-white/[0.02] border-white/10 focus:border-white/30"
              />
              <p className="text-xs text-muted-foreground">
                Unique identifier (alphanumeric, underscores, hyphens)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="agent_name" className="text-sm font-medium">Agent Name</Label>
              <Input
                id="agent_name"
                placeholder="Trading Agent v1"
                value={formData.agent_name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, agent_name: e.target.value }))
                }
                required
                className="bg-white/[0.02] border-white/10 focus:border-white/30"
              />
              <p className="text-xs text-muted-foreground">
                Human-readable name for display
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Agent Type</Label>
              <div className="grid grid-cols-3 gap-2">
                {AGENT_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, agent_type: type }))}
                    className={cn(
                      'p-3 rounded-lg border text-left transition-all',
                      formData.agent_type === type
                        ? 'border-white/30 bg-white/[0.04]'
                        : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                    )}
                  >
                    <div className="font-medium text-sm">{AGENT_TYPE_LABELS[type]}</div>
                    <div className="text-xs text-muted-foreground">
                      {AGENT_TYPE_DESCRIPTIONS[type]}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Permissions */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-white/[0.02] border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                <Shield className="h-4 w-4 text-white/70" />
              </div>
              <div>
                <CardTitle className="text-base">Permissions</CardTitle>
                <CardDescription>What actions can this agent perform?</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Allowed Actions</Label>
              <div className="flex flex-wrap gap-2">
                {PERMISSION_ACTIONS.map((action) => (
                  <button
                    key={action}
                    type="button"
                    onClick={() => toggleAction(action)}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                      formData.actions.includes(action)
                        ? 'bg-white text-black'
                        : 'bg-white/5 text-white/70 hover:bg-white/10'
                    )}
                  >
                    {formData.actions.includes(action) && (
                      <Check className="h-3.5 w-3.5" />
                    )}
                    {PERMISSION_ACTION_LABELS[action]}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Allowed Domains</Label>
              <div className="flex flex-wrap gap-2">
                {PERMISSION_DOMAINS.map((domain) => (
                  <button
                    key={domain}
                    type="button"
                    onClick={() => toggleDomain(domain)}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                      formData.domains.includes(domain)
                        ? 'bg-white text-black'
                        : 'bg-white/5 text-white/70 hover:bg-white/10'
                    )}
                  >
                    {formData.domains.includes(domain) && (
                      <Check className="h-3.5 w-3.5" />
                    )}
                    {PERMISSION_DOMAIN_LABELS[domain]}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resource Limits */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-white/[0.02] border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                <Wallet className="h-4 w-4 text-white/70" />
              </div>
              <div>
                <CardTitle className="text-base">Resource Limits</CardTitle>
                <CardDescription>Optional limits on agent transactions</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="max_transaction_value" className="text-sm font-medium">Max Transaction Value</Label>
                <Input
                  id="max_transaction_value"
                  type="number"
                  placeholder="1000"
                  value={formData.max_transaction_value}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      max_transaction_value: e.target.value,
                    }))
                  }
                  className="bg-white/[0.02] border-white/10 focus:border-white/30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency" className="text-sm font-medium">Currency</Label>
                <Input
                  id="currency"
                  placeholder="USD"
                  value={formData.currency}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, currency: e.target.value }))
                  }
                  maxLength={3}
                  className="bg-white/[0.02] border-white/10 focus:border-white/30"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="daily_limit" className="text-sm font-medium">Daily Limit</Label>
              <Input
                id="daily_limit"
                type="number"
                placeholder="5000"
                value={formData.daily_limit}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, daily_limit: e.target.value }))
                }
                className="bg-white/[0.02] border-white/10 focus:border-white/30"
              />
            </div>
          </CardContent>
        </Card>

        {/* Validity */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-white/[0.02] border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                <Clock className="h-4 w-4 text-white/70" />
              </div>
              <div>
                <CardTitle className="text-base">Validity Period</CardTitle>
                <CardDescription>How long should this credential be valid?</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Label htmlFor="valid_days" className="text-sm font-medium">Valid for (days)</Label>
              <Input
                id="valid_days"
                type="number"
                min="1"
                max="365"
                value={formData.valid_days}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, valid_days: e.target.value }))
                }
                required
                className="bg-white/[0.02] border-white/10 focus:border-white/30"
              />
              <p className="text-xs text-muted-foreground">
                Maximum 365 days. Credential expires on{' '}
                {new Date(
                  Date.now() + parseInt(formData.valid_days || '30') * 24 * 60 * 60 * 1000
                ).toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={loading} className="gap-2">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Issuing...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Issue Credential
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="gap-2 border-white/10 hover:bg-white/[0.04]"
          >
            <ArrowLeft className="h-4 w-4" />
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
