'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Copy, Check, Webhook, ExternalLink, Play, Power, Trash2, AlertCircle, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WebhookType {
  id: string;
  url: string;
  events: string[];
  description: string | null;
  is_active: boolean;
  consecutive_failures: number;
  last_triggered_at: string | null;
  last_success_at: string | null;
  last_failure_at: string | null;
  last_failure_reason: string | null;
  created_at: string;
}

const AVAILABLE_EVENTS = [
  { value: 'credential.revoked', label: 'Credential Revoked', description: 'When a credential is revoked' },
  { value: 'credential.expired', label: 'Credential Expired', description: 'When a credential expires' },
];

export function WebhooksClient({ initialWebhooks }: { initialWebhooks: WebhookType[] }) {
  const router = useRouter();
  const [webhooks, setWebhooks] = useState(initialWebhooks);
  const [isCreating, setIsCreating] = useState(false);
  const [newWebhookData, setNewWebhookData] = useState<{ id: string; secret: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState<string | null>(null);

  // Form state
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [events, setEvents] = useState<string[]>(['credential.revoked']);

  const handleCreate = async () => {
    setError(null);
    setIsCreating(true);

    try {
      const res = await fetch('/api/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          description: description || undefined,
          events,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create webhook');
        return;
      }

      setNewWebhookData({ id: data.webhook.id, secret: data.webhook.secret });
      router.refresh();
    } catch {
      setError('Failed to create webhook');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopy = async () => {
    if (newWebhookData?.secret) {
      await navigator.clipboard.writeText(newWebhookData.secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleToggleActive = async (webhookId: string, currentActive: boolean) => {
    try {
      const res = await fetch(`/api/webhooks/${webhookId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentActive }),
      });

      if (res.ok) {
        setWebhooks(webhooks.map(w =>
          w.id === webhookId ? { ...w, is_active: !currentActive, consecutive_failures: 0 } : w
        ));
      }
    } catch {
      // Ignore
    }
  };

  const handleDelete = async (webhookId: string) => {
    try {
      const res = await fetch(`/api/webhooks/${webhookId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setWebhooks(webhooks.filter(w => w.id !== webhookId));
      }
    } catch {
      // Ignore
    }
  };

  const handleTest = async (webhookId: string) => {
    setIsTesting(webhookId);
    try {
      await fetch(`/api/webhooks/${webhookId}/test`, {
        method: 'POST',
      });
      router.refresh();
    } catch {
      // Ignore
    } finally {
      setIsTesting(null);
    }
  };

  const toggleEvent = (event: string) => {
    if (events.includes(event)) {
      setEvents(events.filter(e => e !== event));
    } else {
      setEvents([...events, event]);
    }
  };

  const resetForm = () => {
    setUrl('');
    setDescription('');
    setEvents(['credential.revoked']);
    setNewWebhookData(null);
    setError(null);
  };

  return (
    <>
      {/* Create Webhook Dialog */}
      <Dialog onOpenChange={(open) => !open && resetForm()}>
        <DialogTrigger asChild>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Webhook
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md bg-black border-white/10">
          {newWebhookData ? (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <DialogTitle>Webhook Created</DialogTitle>
                    <DialogDescription>
                      Copy your webhook secret now. It will not be shown again.
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <div className="space-y-4">
                <div className="p-4 bg-white/[0.02] border border-white/10 rounded-xl font-mono text-sm break-all">
                  {newWebhookData.secret}
                </div>
                <Button onClick={handleCopy} className="w-full gap-2">
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy Secret
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                    <Webhook className="h-5 w-5 text-white/70" />
                  </div>
                  <div>
                    <DialogTitle>Add Webhook</DialogTitle>
                    <DialogDescription>
                      Add a webhook URL to receive event notifications
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="url" className="text-sm font-medium">Endpoint URL</Label>
                  <Input
                    id="url"
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com/webhooks/agentid"
                    className="bg-white/[0.02] border-white/10 focus:border-white/30"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium">Description (optional)</Label>
                  <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Production webhook"
                    className="bg-white/[0.02] border-white/10 focus:border-white/30"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Events</Label>
                  <div className="space-y-2 mt-2">
                    {AVAILABLE_EVENTS.map((event) => (
                      <label
                        key={event.value}
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                          events.includes(event.value)
                            ? 'bg-white/[0.04] border-white/20'
                            : 'bg-white/[0.02] border-white/10 hover:border-white/15'
                        )}
                      >
                        <div className={cn(
                          'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
                          events.includes(event.value)
                            ? 'bg-white border-white'
                            : 'border-white/30'
                        )}>
                          {events.includes(event.value) && (
                            <Check className="h-3 w-3 text-black" />
                          )}
                        </div>
                        <input
                          type="checkbox"
                          checked={events.includes(event.value)}
                          onChange={() => toggleEvent(event.value)}
                          className="sr-only"
                        />
                        <div>
                          <div className="text-sm font-medium">{event.label}</div>
                          <div className="text-xs text-muted-foreground">{event.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <AlertCircle className="h-4 w-4 text-red-400" />
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  onClick={handleCreate}
                  disabled={isCreating || !url || events.length === 0}
                  className="w-full gap-2"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Create Webhook
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Webhooks List */}
      <div className="space-y-4 mt-6">
        {webhooks.length === 0 ? (
          <Card className="overflow-hidden">
            <CardContent className="py-12 text-center">
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
                <Webhook className="h-6 w-6 text-white/30" />
              </div>
              <p className="text-muted-foreground">No webhooks configured</p>
              <p className="text-sm text-muted-foreground mt-1">
                Add a webhook to receive event notifications
              </p>
            </CardContent>
          </Card>
        ) : (
          webhooks.map((webhook) => (
            <Card
              key={webhook.id}
              className={cn(
                'overflow-hidden transition-opacity',
                !webhook.is_active && 'opacity-60'
              )}
            >
              <CardHeader className="bg-white/[0.02] border-b border-white/5 pb-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                        webhook.consecutive_failures >= 5
                          ? 'bg-red-500/10'
                          : webhook.is_active
                            ? 'bg-white/5'
                            : 'bg-amber-500/10'
                      )}>
                        {webhook.consecutive_failures >= 5 ? (
                          <XCircle className="h-4 w-4 text-red-400" />
                        ) : webhook.is_active ? (
                          <Webhook className="h-4 w-4 text-white/70" />
                        ) : (
                          <Power className="h-4 w-4 text-amber-400" />
                        )}
                      </div>
                      <CardTitle className="text-base truncate flex items-center gap-2">
                        <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="truncate">{webhook.url}</span>
                      </CardTitle>
                    </div>
                    <div className="flex items-center gap-2 ml-11">
                      {!webhook.is_active && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400">
                          Disabled
                        </span>
                      )}
                      {webhook.consecutive_failures >= 5 && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-500/10 text-red-400">
                          Auto-disabled
                        </span>
                      )}
                      <CardDescription className="text-xs">
                        {webhook.events.map(e => e.replace('credential.', '')).join(', ')}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTest(webhook.id)}
                      disabled={isTesting === webhook.id}
                      className="gap-1.5 border-white/10 hover:bg-white/[0.04]"
                    >
                      {isTesting === webhook.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Play className="h-3.5 w-3.5" />
                      )}
                      Test
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActive(webhook.id, webhook.is_active)}
                      className="gap-1.5 border-white/10 hover:bg-white/[0.04]"
                    >
                      <Power className="h-3.5 w-3.5" />
                      {webhook.is_active ? 'Disable' : 'Enable'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(webhook.id)}
                      className="gap-1.5 border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="flex flex-wrap gap-4 text-sm">
                  {webhook.last_success_at && (
                    <div className="flex items-center gap-2 text-emerald-400">
                      <CheckCircle className="h-3.5 w-3.5" />
                      <span>Last success: {new Date(webhook.last_success_at).toLocaleString()}</span>
                    </div>
                  )}
                  {webhook.last_failure_at && (
                    <div className="flex items-center gap-2 text-red-400">
                      <XCircle className="h-3.5 w-3.5" />
                      <span>Last failure: {new Date(webhook.last_failure_at).toLocaleString()}</span>
                    </div>
                  )}
                  {webhook.consecutive_failures > 0 && (
                    <div className="flex items-center gap-2 text-amber-400">
                      <AlertCircle className="h-3.5 w-3.5" />
                      <span>Failures: {webhook.consecutive_failures}</span>
                    </div>
                  )}
                </div>
                {webhook.last_failure_reason && (
                  <div className="mt-3 p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                    <p className="text-sm text-red-400">
                      <span className="font-medium">Error:</span> {webhook.last_failure_reason}
                    </p>
                  </div>
                )}
                {webhook.description && (
                  <p className="text-sm text-muted-foreground mt-3">{webhook.description}</p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </>
  );
}
