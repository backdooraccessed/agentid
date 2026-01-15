'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Plus,
  Search,
  FileKey,
  CheckCircle,
  XCircle,
  ArrowRight,
  Users,
  History,
} from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';

interface Policy {
  id: string;
  name: string;
  description: string | null;
  permissions: unknown[];
  version: number;
  is_active: boolean;
  credential_count: number;
  active_credential_count: number;
  created_at: string;
  updated_at: string;
}

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  // Create form state
  const [newPolicy, setNewPolicy] = useState({
    name: '',
    description: '',
    permissions: '["read", "write"]',
  });

  useEffect(() => {
    fetchPolicies();
  }, []);

  async function fetchPolicies() {
    try {
      const response = await fetch('/api/policies');
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to fetch policies');
        return;
      }

      setPolicies(data.policies || []);
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    try {
      setCreating(true);

      let permissions;
      try {
        permissions = JSON.parse(newPolicy.permissions);
      } catch {
        setError('Invalid permissions JSON');
        return;
      }

      const response = await fetch('/api/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newPolicy.name,
          description: newPolicy.description || undefined,
          permissions,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create policy');
        return;
      }

      setShowCreate(false);
      setNewPolicy({ name: '', description: '', permissions: '["read", "write"]' });
      fetchPolicies();
    } catch {
      setError('Network error');
    } finally {
      setCreating(false);
    }
  }

  const filteredPolicies = policies.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: policies.length,
    active: policies.filter((p) => p.is_active).length,
    credentialsUsing: policies.reduce((sum, p) => sum + (p.active_credential_count || 0), 0),
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-muted rounded" />
            ))}
          </div>
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-semibold">Permission Policies</h1>
          <p className="text-muted-foreground mt-1">
            Create reusable permission sets that update instantly across all assigned credentials
          </p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Policy
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Permission Policy</DialogTitle>
              <DialogDescription>
                Define a reusable set of permissions. Changes to this policy will instantly apply
                to all credentials using it.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Policy Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., read-only, admin-access"
                  value={newPolicy.name}
                  onChange={(e) => setNewPolicy({ ...newPolicy, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Input
                  id="description"
                  placeholder="What this policy allows"
                  value={newPolicy.description}
                  onChange={(e) => setNewPolicy({ ...newPolicy, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="permissions">Permissions (JSON)</Label>
                <Textarea
                  id="permissions"
                  placeholder='["read", "write"]'
                  className="font-mono text-sm"
                  rows={6}
                  value={newPolicy.permissions}
                  onChange={(e) => setNewPolicy({ ...newPolicy, permissions: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Simple strings or structured permissions with resources, actions, and conditions
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={!newPolicy.name || creating}>
                {creating ? 'Creating...' : 'Create Policy'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md">
          {error}
          <button className="ml-2 underline" onClick={() => setError(null)}>
            Dismiss
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Policies</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FileKey className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold">{stats.total}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Policies</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">{stats.active}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Credentials Using Policies</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold">{stats.credentialsUsing}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search policies..."
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Policies List */}
      {filteredPolicies.length === 0 ? (
        <EmptyState
          title={search ? 'No policies found' : 'No permission policies yet'}
          description={
            search
              ? 'Try a different search term'
              : 'Create your first policy to enable live permission updates'
          }
          actionLabel={search ? undefined : 'Create Policy'}
          onAction={search ? undefined : () => setShowCreate(true)}
        />
      ) : (
        <div className="space-y-3">
          {filteredPolicies.map((policy) => (
            <Link key={policy.id} href={`/policies/${policy.id}`}>
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileKey className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          {policy.name}
                          {policy.is_active ? (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-600">
                              Active
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                              Inactive
                            </span>
                          )}
                        </CardTitle>
                        <CardDescription className="text-sm">
                          {policy.description || 'No description'}
                        </CardDescription>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <History className="h-4 w-4" />
                      <span>v{policy.version}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>
                        {policy.active_credential_count || 0} credential
                        {(policy.active_credential_count || 0) !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div>
                      {Array.isArray(policy.permissions) ? policy.permissions.length : 0} permission
                      {Array.isArray(policy.permissions) && policy.permissions.length !== 1
                        ? 's'
                        : ''}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
