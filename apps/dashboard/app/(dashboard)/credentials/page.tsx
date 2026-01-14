'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CREDENTIAL_STATUS_LABELS, AGENT_TYPE_LABELS } from '@agentid/shared';
import type { CredentialStatus, AgentType } from '@agentid/shared';
import { Plus, Search, Shield, CheckCircle, XCircle, Clock, Bot, ArrowRight } from 'lucide-react';

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
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!hasIssuer) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-white/10 bg-white/[0.02]">
          <CardHeader>
            <CardTitle>Complete Your Setup</CardTitle>
            <CardDescription>
              Create your issuer profile to start issuing credentials
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/settings">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Issuer Profile
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-display text-3xl font-bold">Credentials</h1>
          <p className="text-muted-foreground">
            Manage credentials for your AI agents
          </p>
        </div>
        <Link href="/credentials/new">
          <Button className="gap-2 btn-glow">
            <Plus className="h-4 w-4" />
            Issue Credential
          </Button>
        </Link>
      </div>

      {error && (
        <div className="p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => updateFilter('status', 'all')}
          className={`text-left p-4 rounded-xl border transition-all ${
            status === 'all'
              ? 'border-white/30 bg-white/[0.04]'
              : 'border-white/10 bg-white/[0.02] hover:border-white/20'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
              <Shield className="h-5 w-5 text-white/70" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalCredentials}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </div>
        </button>
        <button
          onClick={() => updateFilter('status', 'active')}
          className={`text-left p-4 rounded-xl border transition-all ${
            status === 'active'
              ? 'border-emerald-500/30 bg-emerald-500/10'
              : 'border-white/10 bg-white/[0.02] hover:border-white/20'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-400">{activeCredentials}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
          </div>
        </button>
        <button
          onClick={() => updateFilter('status', 'expired')}
          className={`text-left p-4 rounded-xl border transition-all ${
            status === 'expired'
              ? 'border-amber-500/30 bg-amber-500/10'
              : 'border-white/10 bg-white/[0.02] hover:border-white/20'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-400">{expiredCredentials}</p>
              <p className="text-xs text-muted-foreground">Expired</p>
            </div>
          </div>
        </button>
        <button
          onClick={() => updateFilter('status', 'revoked')}
          className={`text-left p-4 rounded-xl border transition-all ${
            status === 'revoked'
              ? 'border-red-500/30 bg-red-500/10'
              : 'border-white/10 bg-white/[0.02] hover:border-white/20'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
              <XCircle className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-400">{revokedCredentials}</p>
              <p className="text-xs text-muted-foreground">Revoked</p>
            </div>
          </div>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 p-4 rounded-xl border border-white/10 bg-white/[0.02]">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or agent ID..."
            value={search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="pl-9 bg-white/[0.02] border-white/10"
          />
        </div>
        <select
          value={status}
          onChange={(e) => updateFilter('status', e.target.value)}
          className="px-3 py-2 border border-white/10 rounded-lg bg-white/[0.02] text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-black">
              {opt.label}
            </option>
          ))}
        </select>
        <select
          value={type}
          onChange={(e) => updateFilter('type', e.target.value)}
          className="px-3 py-2 border border-white/10 rounded-lg bg-white/[0.02] text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
        >
          {TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-black">
              {opt.label}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => updateFilter('sort', e.target.value)}
          className="px-3 py-2 border border-white/10 rounded-lg bg-white/[0.02] text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-black">
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredCredentials.length} of {totalCredentials} credentials
        {(search || status !== 'all' || type !== 'all') && (
          <button
            onClick={() => router.push('/credentials')}
            className="ml-2 text-white hover:text-white/80 underline underline-offset-2"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Credentials List */}
      {filteredCredentials.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-xl border border-white/10 bg-white/[0.02]">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
            <Bot className="h-8 w-8 text-muted-foreground/30" />
          </div>
          <p className="text-muted-foreground font-medium">
            {credentials.length === 0
              ? 'No credentials issued yet'
              : 'No credentials match your filters'}
          </p>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            {credentials.length === 0
              ? 'Create your first credential to get started'
              : 'Try adjusting your search or filters'}
          </p>
          {credentials.length === 0 && (
            <Link href="/credentials/new">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Issue First Credential
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCredentials.map((credential) => (
            <Link key={credential.id} href={`/credentials/${credential.id}`} className="block group">
              <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04] transition-all">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                      <Bot className="h-5 w-5 text-white/70" />
                    </div>
                    <div>
                      <h3 className="font-medium">{credential.agent_name}</h3>
                      <p className="font-mono text-xs text-muted-foreground">
                        {credential.agent_id}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={credential.status} />
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground pl-13">
                  <span className="px-2 py-1 rounded bg-white/5">
                    {AGENT_TYPE_LABELS[credential.agent_type]}
                  </span>
                  <span>
                    Valid until {new Date(credential.valid_until).toLocaleDateString()}
                  </span>
                  <span>
                    Created {new Date(credential.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: CredentialStatus }) {
  const styles = {
    active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    revoked: 'bg-red-500/10 text-red-400 border-red-500/20',
    expired: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    suspended: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${styles[status]}`}>
      {CREDENTIAL_STATUS_LABELS[status]}
    </span>
  );
}
