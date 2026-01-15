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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Plus,
  Search,
  FileKey,
  CheckCircle,
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
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gray-100 border-4 border-black flex items-center justify-center">
            <FileKey className="h-7 w-7 text-gray-600" />
          </div>
          <div>
            <h1 className="font-pixel text-3xl uppercase">Permission Policies</h1>
            <p className="font-retro text-gray-600">
              Create reusable permission sets that update instantly across all assigned credentials
            </p>
          </div>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-black text-white hover:bg-gray-800 font-retro uppercase block-shadow-sm">
              <Plus className="h-4 w-4" />
              New Policy
            </Button>
          </DialogTrigger>
          <DialogContent className="border-4 border-black bg-white">
            <DialogHeader>
              <DialogTitle className="font-pixel text-xl uppercase">Create Permission Policy</DialogTitle>
              <DialogDescription className="font-retro text-gray-600">
                Define a reusable set of permissions. Changes to this policy will instantly apply
                to all credentials using it.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="font-retro font-bold uppercase">Policy Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., read-only, admin-access"
                  value={newPolicy.name}
                  onChange={(e) => setNewPolicy({ ...newPolicy, name: e.target.value })}
                  className="border-2 border-gray-300 font-retro"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="font-retro font-bold uppercase">Description (optional)</Label>
                <Input
                  id="description"
                  placeholder="What this policy allows"
                  value={newPolicy.description}
                  onChange={(e) => setNewPolicy({ ...newPolicy, description: e.target.value })}
                  className="border-2 border-gray-300 font-retro"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="permissions" className="font-retro font-bold uppercase">Permissions (JSON)</Label>
                <Textarea
                  id="permissions"
                  placeholder='["read", "write"]'
                  className="font-mono text-sm border-2 border-gray-300"
                  rows={6}
                  value={newPolicy.permissions}
                  onChange={(e) => setNewPolicy({ ...newPolicy, permissions: e.target.value })}
                />
                <p className="text-xs font-retro text-gray-500">
                  Simple strings or structured permissions with resources, actions, and conditions
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreate(false)} className="border-2 border-gray-300 font-retro uppercase">
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={!newPolicy.name || creating} className="bg-black text-white hover:bg-gray-800 font-retro uppercase">
                {creating ? 'Creating...' : 'Create Policy'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-3 text-sm text-red-700 bg-red-50 border-4 border-red-500 font-retro">
          {error}
          <button className="ml-2 underline" onClick={() => setError(null)}>
            Dismiss
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border-4 border-black bg-white p-4">
          <p className="text-xs font-retro text-gray-500 uppercase">Total Policies</p>
          <div className="flex items-center gap-2 mt-2">
            <FileKey className="h-5 w-5 text-gray-600" />
            <span className="font-pixel text-2xl">{stats.total}</span>
          </div>
        </div>
        <div className="border-4 border-black bg-white p-4">
          <p className="text-xs font-retro text-gray-500 uppercase">Active Policies</p>
          <div className="flex items-center gap-2 mt-2">
            <CheckCircle className="h-5 w-5 text-emerald-600" />
            <span className="font-pixel text-2xl text-emerald-600">{stats.active}</span>
          </div>
        </div>
        <div className="border-4 border-black bg-white p-4">
          <p className="text-xs font-retro text-gray-500 uppercase">Credentials Using Policies</p>
          <div className="flex items-center gap-2 mt-2">
            <Users className="h-5 w-5 text-gray-600" />
            <span className="font-pixel text-2xl">{stats.credentialsUsing}</span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
        <Input
          placeholder="Search policies..."
          className="pl-10 border-2 border-gray-300 font-retro"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Policies List */}
      {filteredPolicies.length === 0 ? (
        <div className="border-4 border-black bg-white">
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
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPolicies.map((policy) => (
            <Link key={policy.id} href={`/policies/${policy.id}`} className="block group">
              <div className="border-4 border-gray-200 bg-white p-4 hover:border-black hover:bg-gray-50 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 border-2 border-gray-300 flex items-center justify-center">
                      <FileKey className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-retro font-bold text-black">{policy.name}</h3>
                        {policy.is_active ? (
                          <span className="text-xs font-retro font-bold uppercase px-2 py-0.5 bg-emerald-100 text-emerald-700 border-2 border-emerald-300">
                            Active
                          </span>
                        ) : (
                          <span className="text-xs font-retro font-bold uppercase px-2 py-0.5 bg-gray-100 text-gray-500 border-2 border-gray-300">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-retro text-gray-500">
                        {policy.description || 'No description'}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-black group-hover:translate-x-1 transition-all" />
                </div>
                <div className="flex items-center gap-6 text-xs font-retro text-gray-500 mt-3 pl-13">
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
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
