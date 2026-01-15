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
          <Button className="gap-2 bg-black text-white hover:bg-gray-800 font-retro uppercase block-shadow-sm">
            <Plus className="h-4 w-4" />
            Create API Key
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md border-4 border-black bg-white">
          {newKeyData ? (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-emerald-100 border-2 border-emerald-300 flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <DialogTitle className="font-pixel text-xl uppercase">API Key Created</DialogTitle>
                    <DialogDescription className="font-retro text-gray-600">
                      Copy your API key now. It will not be shown again.
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 border-2 border-gray-300 font-mono text-sm break-all text-black">
                  {newKeyData.key}
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
                  <div className="w-10 h-10 bg-gray-100 border-2 border-gray-300 flex items-center justify-center">
                    <Key className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <DialogTitle className="font-pixel text-xl uppercase">Create API Key</DialogTitle>
                    <DialogDescription className="font-retro text-gray-600">
                      Create a new API key for programmatic access
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-retro font-bold uppercase">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="My API Key"
                    className="bg-white border-2 border-gray-300 font-retro"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-retro font-bold uppercase">Description (optional)</Label>
                  <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Used for production integration"
                    className="bg-white border-2 border-gray-300 font-retro"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-retro font-bold uppercase">Scopes</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {AVAILABLE_SCOPES.map((scope) => (
                      <label
                        key={scope.value}
                        className={cn(
                          'flex items-center gap-3 p-2.5 border-2 cursor-pointer transition-all',
                          scopes.includes(scope.value)
                            ? 'bg-gray-50 border-black'
                            : 'bg-white border-gray-200 hover:border-gray-400'
                        )}
                      >
                        <div className={cn(
                          'w-4 h-4 border-2 flex items-center justify-center transition-colors flex-shrink-0',
                          scopes.includes(scope.value)
                            ? 'bg-black border-black'
                            : 'border-gray-300'
                        )}>
                          {scopes.includes(scope.value) && (
                            <Check className="h-2.5 w-2.5 text-white" />
                          )}
                        </div>
                        <input
                          type="checkbox"
                          checked={scopes.includes(scope.value)}
                          onChange={() => toggleScope(scope.value)}
                          className="sr-only"
                        />
                        <div className="min-w-0">
                          <div className="text-sm font-retro font-bold text-black truncate">{scope.label}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-retro font-bold uppercase">Expiration</Label>
                  <Select value={expiresInDays} onValueChange={setExpiresInDays}>
                    <SelectTrigger className="bg-white border-2 border-gray-300 font-retro">
                      <SelectValue placeholder="Never expires" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-2 border-gray-300">
                      <SelectItem value="">Never expires</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                      <SelectItem value="180">180 days</SelectItem>
                      <SelectItem value="365">1 year</SelectItem>
                    </SelectContent>
                  </Select>
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
                  disabled={isCreating || !name || scopes.length === 0}
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
          <div className="border-4 border-black bg-white">
            <EmptyState
              illustration="api-keys"
              title="No API keys yet"
              description="Create your first key to get started"
            />
          </div>
        ) : (
          keys.map((key) => (
            <div
              key={key.id}
              className={cn(
                'border-4 border-black bg-white transition-opacity',
                !key.is_active && 'opacity-60'
              )}
            >
              <div className="bg-gray-50 border-b-4 border-black p-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={cn(
                        'w-8 h-8 border-2 flex items-center justify-center flex-shrink-0',
                        key.is_active ? 'bg-gray-100 border-gray-300' : 'bg-red-100 border-red-300'
                      )}>
                        {key.is_active ? (
                          <Key className="h-4 w-4 text-gray-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-retro font-bold text-black">{key.name}</h3>
                        {!key.is_active && (
                          <span className="text-xs font-retro font-bold uppercase px-2 py-0.5 bg-red-100 text-red-700 border-2 border-red-300">
                            Revoked
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="font-mono text-xs text-gray-500 ml-11">
                      agid_{key.key_prefix}_••••••••
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {key.is_active && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRevoke(key.id)}
                        className="gap-1.5 border-2 border-gray-300 hover:bg-gray-50 font-retro uppercase"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Revoke
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(key.id)}
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
                  <div className="flex items-center gap-2 font-retro text-gray-600">
                    <Shield className="h-3.5 w-3.5" />
                    <span>Scopes: {key.scopes.join(', ')}</span>
                  </div>
                  <div className="flex items-center gap-2 font-retro text-gray-600">
                    <Hash className="h-3.5 w-3.5" />
                    <span>Used {key.usage_count} times</span>
                  </div>
                  {key.last_used_at && (
                    <div className="flex items-center gap-2 font-retro text-gray-600">
                      <Activity className="h-3.5 w-3.5" />
                      <span>Last used: {new Date(key.last_used_at).toLocaleDateString()}</span>
                    </div>
                  )}
                  {key.expires_at && (
                    <div className="flex items-center gap-2 font-retro text-gray-600">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Expires: {new Date(key.expires_at).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
                {key.description && (
                  <p className="text-sm font-retro text-gray-500 mt-3">{key.description}</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
