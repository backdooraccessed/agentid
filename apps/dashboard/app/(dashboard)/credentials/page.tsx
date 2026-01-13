'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CREDENTIAL_STATUS_LABELS, AGENT_TYPE_LABELS } from '@agentid/shared';
import type { CredentialStatus, AgentType } from '@agentid/shared';

interface Credential {
  id: string;
  agent_id: string;
  agent_name: string;
  agent_type: AgentType;
  status: CredentialStatus;
  valid_until: string;
  created_at: string;
}

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'expired', label: 'Expired' },
  { value: 'revoked', label: 'Revoked' },
  { value: 'expiring', label: 'Expiring Soon' },
];

const TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All Types' },
  { value: 'autonomous', label: 'Autonomous' },
  { value: 'supervised', label: 'Supervised' },
  { value: 'hybrid', label: 'Hybrid' },
];

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: 'created_desc', label: 'Newest First' },
  { value: 'created_asc', label: 'Oldest First' },
  { value: 'name_asc', label: 'Name (A-Z)' },
  { value: 'name_desc', label: 'Name (Z-A)' },
  { value: 'expiry_asc', label: 'Expiring Soon' },
];

export default function CredentialsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasIssuer, setHasIssuer] = useState(true);

  // Filter state from URL params
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || 'all';
  const type = searchParams.get('type') || 'all';
  const sort = searchParams.get('sort') || 'created_desc';

  useEffect(() => {
    async function fetchCredentials() {
      try {
        const response = await fetch('/api/credentials');
        const data = await response.json();

        if (response.status === 404 && data.error?.includes('Issuer')) {
          setHasIssuer(false);
          return;
        }

        if (!response.ok) {
          setError(data.error || 'Failed to fetch credentials');
          return;
        }

        setCredentials(data.credentials || []);
      } catch {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    }

    fetchCredentials();
  }, []);

  // Filter and sort credentials
  const filteredCredentials = useMemo(() => {
    let result = [...credentials];

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.agent_name.toLowerCase().includes(searchLower) ||
          c.agent_id.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (status !== 'all') {
      if (status === 'expiring') {
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
        result = result.filter(
          (c) =>
            c.status === 'active' &&
            new Date(c.valid_until) <= sevenDaysFromNow
        );
      } else {
        result = result.filter((c) => c.status === status);
      }
    }

    // Type filter
    if (type !== 'all') {
      result = result.filter((c) => c.agent_type === type);
    }

    // Sort
    result.sort((a, b) => {
      switch (sort) {
        case 'created_asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'name_asc':
          return a.agent_name.localeCompare(b.agent_name);
        case 'name_desc':
          return b.agent_name.localeCompare(a.agent_name);
        case 'expiry_asc':
          return new Date(a.valid_until).getTime() - new Date(b.valid_until).getTime();
        case 'created_desc':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return result;
  }, [credentials, search, status, type, sort]);

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'all' || value === '' || value === 'created_desc') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`/credentials?${params.toString()}`);
  };

  // Stats
  const totalCredentials = credentials.length;
  const activeCredentials = credentials.filter((c) => c.status === 'active').length;
  const revokedCredentials = credentials.filter((c) => c.status === 'revoked').length;
  const expiredCredentials = credentials.filter((c) => c.status === 'expired').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!hasIssuer) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Complete Your Setup</CardTitle>
            <CardDescription>
              Create your issuer profile to start issuing credentials
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/settings">
              <Button>Create Issuer Profile</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Credentials</h1>
          <p className="text-muted-foreground">
            Manage credentials for your AI agents
          </p>
        </div>
        <Link href="/credentials/new">
          <Button>Issue New Credential</Button>
        </Link>
      </div>

      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card
          className={`cursor-pointer transition-colors ${status === 'all' ? 'ring-2 ring-primary' : 'hover:bg-muted/50'}`}
          onClick={() => updateFilter('status', 'all')}
        >
          <CardHeader className="pb-2">
            <CardDescription>Total</CardDescription>
            <CardTitle className="text-3xl">{totalCredentials}</CardTitle>
          </CardHeader>
        </Card>
        <Card
          className={`cursor-pointer transition-colors ${status === 'active' ? 'ring-2 ring-primary' : 'hover:bg-muted/50'}`}
          onClick={() => updateFilter('status', 'active')}
        >
          <CardHeader className="pb-2">
            <CardDescription>Active</CardDescription>
            <CardTitle className="text-3xl text-green-600">{activeCredentials}</CardTitle>
          </CardHeader>
        </Card>
        <Card
          className={`cursor-pointer transition-colors ${status === 'expired' ? 'ring-2 ring-primary' : 'hover:bg-muted/50'}`}
          onClick={() => updateFilter('status', 'expired')}
        >
          <CardHeader className="pb-2">
            <CardDescription>Expired</CardDescription>
            <CardTitle className="text-3xl text-yellow-600">{expiredCredentials}</CardTitle>
          </CardHeader>
        </Card>
        <Card
          className={`cursor-pointer transition-colors ${status === 'revoked' ? 'ring-2 ring-primary' : 'hover:bg-muted/50'}`}
          onClick={() => updateFilter('status', 'revoked')}
        >
          <CardHeader className="pb-2">
            <CardDescription>Revoked</CardDescription>
            <CardTitle className="text-3xl text-red-600">{revokedCredentials}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search by name or agent ID..."
                value={search}
                onChange={(e) => updateFilter('search', e.target.value)}
              />
            </div>
            <select
              value={status}
              onChange={(e) => updateFilter('status', e.target.value)}
              className="px-3 py-2 border rounded-md bg-background"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <select
              value={type}
              onChange={(e) => updateFilter('type', e.target.value)}
              className="px-3 py-2 border rounded-md bg-background"
            >
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <select
              value={sort}
              onChange={(e) => updateFilter('sort', e.target.value)}
              className="px-3 py-2 border rounded-md bg-background"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredCredentials.length} of {totalCredentials} credentials
        {(search || status !== 'all' || type !== 'all') && (
          <button
            onClick={() => router.push('/credentials')}
            className="ml-2 text-primary hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Credentials List */}
      {filteredCredentials.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {credentials.length === 0
              ? 'No credentials issued yet. Create your first credential to get started.'
              : 'No credentials match your filters.'}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredCredentials.map((credential) => (
            <Link key={credential.id} href={`/credentials/${credential.id}`}>
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{credential.agent_name}</CardTitle>
                      <CardDescription className="font-mono text-xs">
                        {credential.agent_id}
                      </CardDescription>
                    </div>
                    <StatusBadge status={credential.status} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>Type: {AGENT_TYPE_LABELS[credential.agent_type]}</span>
                    <span>
                      Valid until: {new Date(credential.valid_until).toLocaleDateString()}
                    </span>
                    <span>
                      Created: {new Date(credential.created_at).toLocaleDateString()}
                    </span>
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

function StatusBadge({ status }: { status: CredentialStatus }) {
  const colors = {
    active: 'bg-green-100 text-green-800',
    revoked: 'bg-red-100 text-red-800',
    expired: 'bg-yellow-100 text-yellow-800',
    suspended: 'bg-orange-100 text-orange-800',
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status]}`}>
      {CREDENTIAL_STATUS_LABELS[status]}
    </span>
  );
}
