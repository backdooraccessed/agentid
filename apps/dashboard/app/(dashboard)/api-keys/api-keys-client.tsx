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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Key, Copy, Check, Shield, Clock, Hash, Activity, Trash2, XCircle, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/shared/empty-state';

interface ApiKey {
  id: string;
  name: string;
  description: string | null;
  key_prefix: string;
  scopes: string[];
  is_active: boolean;
  last_used_at: string | null;
  usage_count: number;
  expires_at: string | null;
  created_at: string;
}

const AVAILABLE_SCOPES = [
  { value: 'credentials:read', label: 'Read Credentials', description: 'View credentials' },
  { value: 'credentials:write', label: 'Write Credentials', description: 'Create & modify' },
  { value: 'webhooks:read', label: 'Read Webhooks', description: 'View webhooks' },
  { value: 'webhooks:write', label: 'Write Webhooks', description: 'Manage webhooks' },
  { value: 'reputation:read', label: 'Read Reputation', description: 'View scores' },
];

export function ApiKeysClient({ initialKeys }: { initialKeys: ApiKey[] }) {
  const router = useRouter();
  const [keys, setKeys] = useState(initialKeys);
  const [isCreating, setIsCreating] = useState(false);
  const [newKeyData, setNewKeyData] = useState<{ id: string; key: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [scopes, setScopes] = useState<string[]>(['credentials:read']);
  const [expiresInDays, setExpiresInDays] = useState<string>('');

  const handleCreate = async () => {
    setError(null);
    setIsCreating(true);

    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description: description || undefined,
          scopes,
          expires_in_days: expiresInDays ? parseInt(expiresInDays) : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create API key');
        return;
      }

      setNewKeyData({ id: data.id, key: data.key });
      router.refresh();
    } catch {
      setError('Failed to create API key');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopy = async () => {
    if (newKeyData?.key) {
      await navigator.clipboard.writeText(newKeyData.key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRevoke = async (keyId: string) => {
    try {
      const res = await fetch(`/api/keys/${keyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: false }),
      });

      if (res.ok) {
        setKeys(keys.map(k => k.id === keyId ? { ...k, is_active: false } : k));
      }
    } catch {
      // Ignore
    }
  };

  const handleDelete = async (keyId: string) => {
    try {
      const res = await fetch(`/api/keys/${keyId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setKeys(keys.filter(k => k.id !== keyId));
      }
    } catch {
      // Ignore
    }
  };

  const toggleScope = (scope: string) => {
    if (scopes.includes(scope)) {
      setScopes(scopes.filter(s => s !== scope));
    } else {
      setScopes([...scopes, scope]);
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setScopes(['credentials:read']);
    setExpiresInDays('');
    setNewKeyData(null);
    setError(null);
  };

  return (
    <>
      {/* Create Key Dialog */}
      <Dialog onOpenChange={(open) => !open && resetForm()}>
        <DialogTrigger asChild>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create API Key
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md bg-black border-white/10">
          {newKeyData ? (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <DialogTitle>API Key Created</DialogTitle>
                    <DialogDescription>
                      Copy your API key now. It will not be shown again.
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <div className="space-y-4">
                <div className="p-4 bg-white/[0.02] border border-white/10 rounded-xl font-mono text-sm break-all">
                  {newKeyData.key}
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
                      Copy to Clipboard
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
                    <Key className="h-5 w-5 text-white/70" />
                  </div>
                  <div>
                    <DialogTitle>Create API Key</DialogTitle>
                    <DialogDescription>
                      Create a new API key for programmatic access
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="My API Key"
                    className="bg-white/[0.02] border-white/10 focus:border-white/30"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium">Description (optional)</Label>
                  <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Used for production integration"
                    className="bg-white/[0.02] border-white/10 focus:border-white/30"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Scopes</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {AVAILABLE_SCOPES.map((scope) => (
                      <label
                        key={scope.value}
                        className={cn(
                          'flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-all',
                          scopes.includes(scope.value)
                            ? 'bg-white/[0.04] border-white/20'
                            : 'bg-white/[0.02] border-white/10 hover:border-white/15'
                        )}
                      >
                        <div className={cn(
                          'w-4 h-4 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0',
                          scopes.includes(scope.value)
                            ? 'bg-white border-white'
                            : 'border-white/30'
                        )}>
                          {scopes.includes(scope.value) && (
                            <Check className="h-2.5 w-2.5 text-black" />
                          )}
                        </div>
                        <input
                          type="checkbox"
                          checked={scopes.includes(scope.value)}
                          onChange={() => toggleScope(scope.value)}
                          className="sr-only"
                        />
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{scope.label}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Expiration</Label>
                  <Select value={expiresInDays} onValueChange={setExpiresInDays}>
                    <SelectTrigger className="bg-white/[0.02] border-white/10">
                      <SelectValue placeholder="Never expires" />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-white/10">
                      <SelectItem value="">Never expires</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                      <SelectItem value="180">180 days</SelectItem>
                      <SelectItem value="365">1 year</SelectItem>
                    </SelectContent>
                  </Select>
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
                  disabled={isCreating || !name || scopes.length === 0}
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
                      Create Key
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Keys List */}
      <div className="space-y-4 mt-6">
        {keys.length === 0 ? (
          <Card className="overflow-hidden">
            <EmptyState
              illustration="api-keys"
              title="No API keys yet"
              description="Create your first key to get started"
            />
          </Card>
        ) : (
          keys.map((key) => (
            <Card
              key={key.id}
              className={cn(
                'overflow-hidden transition-opacity',
                !key.is_active && 'opacity-60'
              )}
            >
              <CardHeader className="bg-white/[0.02] border-b border-white/5 pb-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                        key.is_active ? 'bg-white/5' : 'bg-red-500/10'
                      )}>
                        {key.is_active ? (
                          <Key className="h-4 w-4 text-white/70" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-400" />
                        )}
                      </div>
                      <CardTitle className="text-base flex items-center gap-2">
                        {key.name}
                        {!key.is_active && (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-500/10 text-red-400">
                            Revoked
                          </span>
                        )}
                      </CardTitle>
                    </div>
                    <CardDescription className="font-mono text-xs ml-11">
                      agid_{key.key_prefix}_••••••••
                    </CardDescription>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {key.is_active && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRevoke(key.id)}
                        className="gap-1.5 border-white/10 hover:bg-white/[0.04]"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Revoke
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(key.id)}
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
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Shield className="h-3.5 w-3.5" />
                    <span>Scopes: {key.scopes.join(', ')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Hash className="h-3.5 w-3.5" />
                    <span>Used {key.usage_count} times</span>
                  </div>
                  {key.last_used_at && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Activity className="h-3.5 w-3.5" />
                      <span>Last used: {new Date(key.last_used_at).toLocaleDateString()}</span>
                    </div>
                  )}
                  {key.expires_at && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Expires: {new Date(key.expires_at).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
                {key.description && (
                  <p className="text-sm text-muted-foreground mt-3">{key.description}</p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </>
  );
}
