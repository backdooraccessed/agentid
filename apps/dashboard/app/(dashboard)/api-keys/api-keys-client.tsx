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
  { value: 'credentials:read', label: 'Read Credentials' },
  { value: 'credentials:write', label: 'Write Credentials' },
  { value: 'webhooks:read', label: 'Read Webhooks' },
  { value: 'webhooks:write', label: 'Write Webhooks' },
  { value: 'reputation:read', label: 'Read Reputation' },
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
          <Button>Create API Key</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          {newKeyData ? (
            <>
              <DialogHeader>
                <DialogTitle>API Key Created</DialogTitle>
                <DialogDescription>
                  Copy your API key now. It will not be shown again.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="p-3 bg-muted rounded-md font-mono text-sm break-all">
                  {newKeyData.key}
                </div>
                <Button onClick={handleCopy} className="w-full">
                  {copied ? 'Copied!' : 'Copy to Clipboard'}
                </Button>
              </div>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Create API Key</DialogTitle>
                <DialogDescription>
                  Create a new API key for programmatic access
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="My API Key"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description (optional)</Label>
                  <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Used for production integration"
                  />
                </div>
                <div>
                  <Label>Scopes</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {AVAILABLE_SCOPES.map((scope) => (
                      <label
                        key={scope.value}
                        className="flex items-center gap-2 text-sm cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={scopes.includes(scope.value)}
                          onChange={() => toggleScope(scope.value)}
                          className="rounded"
                        />
                        {scope.label}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <Label htmlFor="expires">Expires In (days, optional)</Label>
                  <Select value={expiresInDays} onValueChange={setExpiresInDays}>
                    <SelectTrigger>
                      <SelectValue placeholder="Never expires" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Never expires</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                      <SelectItem value="180">180 days</SelectItem>
                      <SelectItem value="365">1 year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {error && (
                  <p className="text-sm text-red-500">{error}</p>
                )}
              </div>
              <DialogFooter>
                <Button
                  onClick={handleCreate}
                  disabled={isCreating || !name || scopes.length === 0}
                >
                  {isCreating ? 'Creating...' : 'Create Key'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Keys List */}
      <div className="space-y-4 mt-6">
        {keys.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No API keys yet. Create your first key to get started.
            </CardContent>
          </Card>
        ) : (
          keys.map((key) => (
            <Card key={key.id} className={!key.is_active ? 'opacity-60' : ''}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {key.name}
                      {!key.is_active && (
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded">
                          Revoked
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription className="font-mono text-xs">
                      agid_{key.key_prefix}_••••••••
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {key.is_active && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRevoke(key.id)}
                      >
                        Revoke
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(key.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span>Scopes: {key.scopes.join(', ')}</span>
                  <span>Used: {key.usage_count} times</span>
                  {key.last_used_at && (
                    <span>Last used: {new Date(key.last_used_at).toLocaleDateString()}</span>
                  )}
                  {key.expires_at && (
                    <span>Expires: {new Date(key.expires_at).toLocaleDateString()}</span>
                  )}
                </div>
                {key.description && (
                  <p className="text-sm mt-2">{key.description}</p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </>
  );
}
