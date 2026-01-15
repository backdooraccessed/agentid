'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CREDENTIAL_STATUS_LABELS, AGENT_TYPE_LABELS } from '@agentid/shared';
import type { CredentialStatus, AgentType } from '@agentid/shared';
import { Plus, Search, Shield, CheckCircle, XCircle, Clock, Bot, ArrowRight } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';

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
        <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  if (!hasIssuer) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="border-4 border-black bg-white p-6 block-shadow">
          <h2 className="font-pixel text-xl uppercase mb-2">Complete Your Setup</h2>
          <p className="font-retro text-gray-600 mb-4">
            Create your issuer profile to start issuing credentials
          </p>
          <Link href="/settings">
            <Button className="gap-2 bg-black text-white hover:bg-gray-800 font-retro uppercase">
              <Plus className="h-4 w-4" />
              Create Issuer Profile
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-pixel text-3xl uppercase">Credentials</h1>
          <p className="font-retro text-gray-600">
            Manage credentials for your AI agents
          </p>
        </div>
        <Link href="/credentials/new">
          <Button className="gap-2 bg-black text-white hover:bg-gray-800 font-retro uppercase block-shadow-sm">
            <Plus className="h-4 w-4" />
            Issue Credential
          </Button>
        </Link>
      </div>

      {error && (
        <div className="p-3 text-sm text-red-700 bg-red-50 border-4 border-red-500 font-retro">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => updateFilter('status', 'all')}
          className={`text-left p-4 border-4 transition-all ${
            status === 'all'
              ? 'border-black bg-gray-50 block-shadow'
              : 'border-gray-200 bg-white hover:border-gray-400'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 border-2 border-gray-300 flex items-center justify-center">
              <Shield className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="font-pixel text-2xl">{totalCredentials}</p>
              <p className="font-retro text-xs text-gray-500 uppercase">Total</p>
            </div>
          </div>
        </button>
        <button
          onClick={() => updateFilter('status', 'active')}
          className={`text-left p-4 border-4 transition-all ${
            status === 'active'
              ? 'border-emerald-500 bg-emerald-50 block-shadow'
              : 'border-gray-200 bg-white hover:border-gray-400'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 border-2 border-emerald-300 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="font-pixel text-2xl text-emerald-600">{activeCredentials}</p>
              <p className="font-retro text-xs text-gray-500 uppercase">Active</p>
            </div>
          </div>
        </button>
        <button
          onClick={() => updateFilter('status', 'expired')}
          className={`text-left p-4 border-4 transition-all ${
            status === 'expired'
              ? 'border-amber-500 bg-amber-50 block-shadow'
              : 'border-gray-200 bg-white hover:border-gray-400'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 border-2 border-amber-300 flex items-center justify-center">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="font-pixel text-2xl text-amber-600">{expiredCredentials}</p>
              <p className="font-retro text-xs text-gray-500 uppercase">Expired</p>
            </div>
          </div>
        </button>
        <button
          onClick={() => updateFilter('status', 'revoked')}
          className={`text-left p-4 border-4 transition-all ${
            status === 'revoked'
              ? 'border-red-500 bg-red-50 block-shadow'
              : 'border-gray-200 bg-white hover:border-gray-400'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 border-2 border-red-300 flex items-center justify-center">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="font-pixel text-2xl text-red-600">{revokedCredentials}</p>
              <p className="font-retro text-xs text-gray-500 uppercase">Revoked</p>
            </div>
          </div>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 p-4 border-4 border-black bg-gray-50">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search by name or agent ID..."
            value={search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="pl-9 bg-white border-2 border-gray-300 font-retro"
          />
        </div>
        <select
          value={status}
          onChange={(e) => updateFilter('status', e.target.value)}
          className="px-3 py-2 border-2 border-gray-300 bg-white text-sm font-retro focus:outline-none focus:ring-2 focus:ring-black"
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
          className="px-3 py-2 border-2 border-gray-300 bg-white text-sm font-retro focus:outline-none focus:ring-2 focus:ring-black"
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
          className="px-3 py-2 border-2 border-gray-300 bg-white text-sm font-retro focus:outline-none focus:ring-2 focus:ring-black"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Results count */}
      <div className="text-sm font-retro text-gray-600">
        Showing {filteredCredentials.length} of {totalCredentials} credentials
        {(search || status !== 'all' || type !== 'all') && (
          <button
            onClick={() => router.push('/credentials')}
            className="ml-2 text-black hover:text-gray-600 underline underline-offset-2"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Credentials List */}
      {filteredCredentials.length === 0 ? (
        <div className="border-4 border-black bg-white">
          {credentials.length === 0 ? (
            <EmptyState
              illustration="credentials"
              title="No credentials issued yet"
              description="Create your first credential to get started"
              actionLabel="Issue First Credential"
              actionHref="/credentials/new"
            />
          ) : (
            <EmptyState
              illustration="search"
              title="No credentials match your filters"
              description="Try adjusting your search or filters"
            />
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCredentials.map((credential) => (
            <Link key={credential.id} href={`/credentials/${credential.id}`} className="block group">
              <div className="p-4 border-4 border-gray-200 bg-white hover:border-black hover:bg-gray-50 transition-all">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 border-2 border-gray-300 flex items-center justify-center">
                      <Bot className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-retro font-bold text-black">{credential.agent_name}</h3>
                      <p className="font-mono text-xs text-gray-500">
                        {credential.agent_id}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={credential.status} />
                    <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-black group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
                <div className="flex gap-4 text-xs font-retro text-gray-500 pl-13">
                  <span className="px-2 py-1 bg-gray-100 border border-gray-200">
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
    active: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    revoked: 'bg-red-100 text-red-700 border-red-300',
    expired: 'bg-amber-100 text-amber-700 border-amber-300',
    suspended: 'bg-orange-100 text-orange-700 border-orange-300',
  };

  return (
    <span className={`px-2 py-1 text-xs font-retro font-bold uppercase border-2 ${styles[status]}`}>
      {CREDENTIAL_STATUS_LABELS[status]}
    </span>
  );
}
