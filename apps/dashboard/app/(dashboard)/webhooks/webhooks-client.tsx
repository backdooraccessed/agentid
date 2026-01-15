'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
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
import { EmptyState } from '@/components/shared/empty-state';

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
          <Button className="gap-2 bg-black text-white hover:bg-gray-800 font-retro uppercase block-shadow-sm">
            <Plus className="h-4 w-4" />
            Add Webhook
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md border-4 border-black bg-white">
          {newWebhookData ? (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-emerald-100 border-2 border-emerald-300 flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <DialogTitle className="font-pixel text-xl uppercase">Webhook Created</DialogTitle>
                    <DialogDescription className="font-retro text-gray-600">
                      Copy your webhook secret now. It will not be shown again.
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 border-2 border-gray-300 font-mono text-sm break-all text-black">
                  {newWebhookData.secret}
                </div>
                <Button onClick={handleCopy} className="w-full gap-2 bg-black text-white hover:bg-gray-800 font-retro uppercase">
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
                  <div className="w-10 h-10 bg-gray-100 border-2 border-gray-300 flex items-center justify-center">
                    <Webhook className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <DialogTitle className="font-pixel text-xl uppercase">Add Webhook</DialogTitle>
                    <DialogDescription className="font-retro text-gray-600">
                      Add a webhook URL to receive event notifications
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="url" className="text-sm font-retro font-bold uppercase">Endpoint URL</Label>
                  <Input
                    id="url"
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com/webhooks/agentid"
                    className="bg-white border-2 border-gray-300 font-retro"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-retro font-bold uppercase">Description (optional)</Label>
                  <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Production webhook"
                    className="bg-white border-2 border-gray-300 font-retro"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-retro font-bold uppercase">Events</Label>
                  <div className="space-y-2 mt-2">
                    {AVAILABLE_EVENTS.map((event) => (
                      <label
                        key={event.value}
                        className={cn(
                          'flex items-center gap-3 p-3 border-2 cursor-pointer transition-all',
                          events.includes(event.value)
                            ? 'bg-gray-50 border-black'
                            : 'bg-white border-gray-200 hover:border-gray-400'
                        )}
                      >
                        <div className={cn(
                          'w-5 h-5 border-2 flex items-center justify-center transition-colors',
                          events.includes(event.value)
                            ? 'bg-black border-black'
                            : 'border-gray-300'
                        )}>
                          {events.includes(event.value) && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                        </div>
                        <input
                          type="checkbox"
                          checked={events.includes(event.value)}
                          onChange={() => toggleEvent(event.value)}
                          className="sr-only"
                        />
                        <div>
                          <div className="text-sm font-retro font-bold text-black">{event.label}</div>
                          <div className="text-xs font-retro text-gray-500">{event.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                {error && (
                  <div className="flex items-center gap-2 p-3 border-4 border-red-500 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <p className="text-sm font-retro text-red-700">{error}</p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  onClick={handleCreate}
                  disabled={isCreating || !url || events.length === 0}
                  className="w-full gap-2 bg-black text-white hover:bg-gray-800 font-retro uppercase"
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
          <div className="border-4 border-black bg-white">
            <EmptyState
              illustration="webhooks"
              title="No webhooks configured"
              description="Add a webhook to receive event notifications"
            />
          </div>
        ) : (
          webhooks.map((webhook) => (
            <div
              key={webhook.id}
              className={cn(
                'border-4 border-black bg-white transition-opacity',
                !webhook.is_active && 'opacity-60'
              )}
            >
              <div className="bg-gray-50 border-b-4 border-black p-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={cn(
                        'w-8 h-8 border-2 flex items-center justify-center flex-shrink-0',
                        webhook.consecutive_failures >= 5
                          ? 'bg-red-100 border-red-300'
                          : webhook.is_active
                            ? 'bg-gray-100 border-gray-300'
                            : 'bg-amber-100 border-amber-300'
                      )}>
                        {webhook.consecutive_failures >= 5 ? (
                          <XCircle className="h-4 w-4 text-red-600" />
                        ) : webhook.is_active ? (
                          <Webhook className="h-4 w-4 text-gray-600" />
                        ) : (
                          <Power className="h-4 w-4 text-amber-600" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 min-w-0">
                        <ExternalLink className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <span className="font-retro font-bold text-black truncate">{webhook.url}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-11">
                      {!webhook.is_active && (
                        <span className="text-xs font-retro font-bold uppercase px-2 py-0.5 bg-amber-100 text-amber-700 border-2 border-amber-300">
                          Disabled
                        </span>
                      )}
                      {webhook.consecutive_failures >= 5 && (
                        <span className="text-xs font-retro font-bold uppercase px-2 py-0.5 bg-red-100 text-red-700 border-2 border-red-300">
                          Auto-disabled
                        </span>
                      )}
                      <span className="text-xs font-retro text-gray-500">
                        {webhook.events.map(e => e.replace('credential.', '')).join(', ')}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTest(webhook.id)}
                      disabled={isTesting === webhook.id}
                      className="gap-1.5 border-2 border-gray-300 hover:bg-gray-50 font-retro uppercase"
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
                      className="gap-1.5 border-2 border-gray-300 hover:bg-gray-50 font-retro uppercase"
                    >
                      <Power className="h-3.5 w-3.5" />
                      {webhook.is_active ? 'Disable' : 'Enable'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(webhook.id)}
                      className="gap-1.5 border-2 border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 font-retro uppercase"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <div className="flex flex-wrap gap-4 text-sm">
                  {webhook.last_success_at && (
                    <div className="flex items-center gap-2 font-retro text-emerald-700">
                      <CheckCircle className="h-3.5 w-3.5" />
                      <span>Last success: {new Date(webhook.last_success_at).toLocaleString()}</span>
                    </div>
                  )}
                  {webhook.last_failure_at && (
                    <div className="flex items-center gap-2 font-retro text-red-700">
                      <XCircle className="h-3.5 w-3.5" />
                      <span>Last failure: {new Date(webhook.last_failure_at).toLocaleString()}</span>
                    </div>
                  )}
                  {webhook.consecutive_failures > 0 && (
                    <div className="flex items-center gap-2 font-retro text-amber-700">
                      <AlertCircle className="h-3.5 w-3.5" />
                      <span>Failures: {webhook.consecutive_failures}</span>
                    </div>
                  )}
                </div>
                {webhook.last_failure_reason && (
                  <div className="mt-3 p-3 bg-red-50 border-2 border-red-300">
                    <p className="text-sm font-retro text-red-700">
                      <span className="font-bold">Error:</span> {webhook.last_failure_reason}
                    </p>
                  </div>
                )}
                {webhook.description && (
                  <p className="text-sm font-retro text-gray-500 mt-3">{webhook.description}</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
