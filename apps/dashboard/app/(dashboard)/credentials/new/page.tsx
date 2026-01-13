'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
      setLoading(false);
      return;
    }

    if (formData.domains.length === 0) {
      setError('Please select at least one permission domain');
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
        setLoading(false);
        return;
      }

      router.push('/credentials');
      router.refresh();
    } catch {
      setError('Network error. Please try again.');
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Issue New Credential</h1>
        <p className="text-muted-foreground">
          Create a verifiable credential for your AI agent
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
            {error}
          </div>
        )}

        {/* Agent Identity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Agent Identity</CardTitle>
            <CardDescription>Basic information about your agent</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="agent_id">Agent ID</Label>
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
              />
              <p className="text-xs text-muted-foreground">
                Unique identifier (alphanumeric, underscores, hyphens)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="agent_name">Agent Name</Label>
              <Input
                id="agent_name"
                placeholder="Trading Agent v1"
                value={formData.agent_name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, agent_name: e.target.value }))
                }
                required
              />
              <p className="text-xs text-muted-foreground">
                Human-readable name for display
              </p>
            </div>

            <div className="space-y-2">
              <Label>Agent Type</Label>
              <div className="grid grid-cols-3 gap-2">
                {AGENT_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, agent_type: type }))}
                    className={`p-3 rounded-md border text-left transition-colors ${
                      formData.agent_type === type
                        ? 'border-primary bg-primary/5'
                        : 'border-input hover:bg-accent'
                    }`}
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
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Permissions</CardTitle>
            <CardDescription>What actions can this agent perform?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Allowed Actions</Label>
              <div className="flex flex-wrap gap-2">
                {PERMISSION_ACTIONS.map((action) => (
                  <button
                    key={action}
                    type="button"
                    onClick={() => toggleAction(action)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                      formData.actions.includes(action)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                    {PERMISSION_ACTION_LABELS[action]}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Allowed Domains</Label>
              <div className="flex flex-wrap gap-2">
                {PERMISSION_DOMAINS.map((domain) => (
                  <button
                    key={domain}
                    type="button"
                    onClick={() => toggleDomain(domain)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                      formData.domains.includes(domain)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                    {PERMISSION_DOMAIN_LABELS[domain]}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resource Limits */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resource Limits</CardTitle>
            <CardDescription>Optional limits on agent transactions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="max_transaction_value">Max Transaction Value</Label>
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
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Input
                  id="currency"
                  placeholder="USD"
                  value={formData.currency}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, currency: e.target.value }))
                  }
                  maxLength={3}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="daily_limit">Daily Limit</Label>
              <Input
                id="daily_limit"
                type="number"
                placeholder="5000"
                value={formData.daily_limit}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, daily_limit: e.target.value }))
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Validity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Validity Period</CardTitle>
            <CardDescription>How long should this credential be valid?</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="valid_days">Valid for (days)</Label>
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
          <Button type="submit" disabled={loading}>
            {loading ? 'Issuing...' : 'Issue Credential'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
