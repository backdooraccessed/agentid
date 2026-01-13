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

interface Webhook {
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
  { value: 'credential.revoked', label: 'Credential Revoked' },
  { value: 'credential.expired', label: 'Credential Expired' },
];

export function WebhooksClient({ initialWebhooks }: { initialWebhooks: Webhook[] }) {
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
          <Button>Add Webhook</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          {newWebhookData ? (
            <>
              <DialogHeader>
                <DialogTitle>Webhook Created</DialogTitle>
                <DialogDescription>
                  Copy your webhook secret now. It will not be shown again.
                  Use this to verify webhook signatures.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="p-3 bg-muted rounded-md font-mono text-sm break-all">
                  {newWebhookData.secret}
                </div>
                <Button onClick={handleCopy} className="w-full">
                  {copied ? 'Copied!' : 'Copy Secret'}
                </Button>
              </div>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Add Webhook</DialogTitle>
                <DialogDescription>
                  Add a webhook URL to receive event notifications
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="url">Endpoint URL</Label>
                  <Input
                    id="url"
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com/webhooks/agentid"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description (optional)</Label>
                  <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Production webhook"
                  />
                </div>
                <div>
                  <Label>Events</Label>
                  <div className="space-y-2 mt-2">
                    {AVAILABLE_EVENTS.map((event) => (
                      <label
                        key={event.value}
                        className="flex items-center gap-2 text-sm cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={events.includes(event.value)}
                          onChange={() => toggleEvent(event.value)}
                          className="rounded"
                        />
                        {event.label}
                      </label>
                    ))}
                  </div>
                </div>
                {error && (
                  <p className="text-sm text-red-500">{error}</p>
                )}
              </div>
              <DialogFooter>
                <Button
                  onClick={handleCreate}
                  disabled={isCreating || !url || events.length === 0}
                >
                  {isCreating ? 'Creating...' : 'Create Webhook'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Webhooks List */}
      <div className="space-y-4 mt-6">
        {webhooks.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No webhooks configured. Add a webhook to receive event notifications.
            </CardContent>
          </Card>
        ) : (
          webhooks.map((webhook) => (
            <Card key={webhook.id} className={!webhook.is_active ? 'opacity-60' : ''}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <span className="truncate">{webhook.url}</span>
                      {!webhook.is_active && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded flex-shrink-0">
                          Disabled
                        </span>
                      )}
                      {webhook.consecutive_failures >= 5 && (
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded flex-shrink-0">
                          Auto-disabled
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription>
                      Events: {webhook.events.join(', ')}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTest(webhook.id)}
                      disabled={isTesting === webhook.id}
                    >
                      {isTesting === webhook.id ? 'Testing...' : 'Test'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActive(webhook.id, webhook.is_active)}
                    >
                      {webhook.is_active ? 'Disable' : 'Enable'}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(webhook.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {webhook.last_success_at && (
                    <span className="text-green-600">
                      Last success: {new Date(webhook.last_success_at).toLocaleString()}
                    </span>
                  )}
                  {webhook.last_failure_at && (
                    <span className="text-red-600">
                      Last failure: {new Date(webhook.last_failure_at).toLocaleString()}
                    </span>
                  )}
                  {webhook.consecutive_failures > 0 && (
                    <span className="text-orange-600">
                      Failures: {webhook.consecutive_failures}
                    </span>
                  )}
                </div>
                {webhook.last_failure_reason && (
                  <p className="text-sm text-red-600 mt-2">
                    Error: {webhook.last_failure_reason}
                  </p>
                )}
                {webhook.description && (
                  <p className="text-sm mt-2">{webhook.description}</p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </>
  );
}
