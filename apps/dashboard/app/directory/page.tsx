'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  Shield,
  Building2,
  User,
  Globe,
  CheckCircle,
  Star,
  Calendar,
  ChevronDown,
  Loader2,
  ArrowRight,
  Sparkles,
  Filter,
  Github,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Debounce hook for search
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

interface Issuer {
  id: string;
  name: string;
  type: string;
  domain: string | null;
  description: string | null;
  verified: boolean;
  joined: string;
  stats: {
    trust_score: number;
    total_credentials: number;
    active_credentials: number;
  } | null;
}

interface Pagination {
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

const ISSUER_TYPE_LABELS: Record<string, string> = {
  individual: 'Individual',
  organization: 'Organization',
  platform: 'Platform',
};

const ISSUER_TYPE_ICONS: Record<string, React.ReactNode> = {
  individual: <User className="h-4 w-4" />,
  organization: <Building2 className="h-4 w-4" />,
  platform: <Globe className="h-4 w-4" />,
};

type SortOption = 'trust_score' | 'joined' | 'credentials';
type IssuerType = 'all' | 'individual' | 'organization' | 'platform';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'trust_score', label: 'Trust Score' },
  { value: 'joined', label: 'Recently Joined' },
  { value: 'credentials', label: 'Most Credentials' },
];

export default function DirectoryPage() {
  const [issuers, setIssuers] = useState<Issuer[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(true);
  const [typeFilter, setTypeFilter] = useState<IssuerType>('all');
  const [sortBy, setSortBy] = useState<SortOption>('trust_score');
  const [showFilters, setShowFilters] = useState(false);

  // Switch to light theme
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
    document.body.classList.add('light-theme');
    document.body.style.setProperty('background-color', '#ffffff', 'important');
    document.body.style.setProperty('background', '#ffffff', 'important');
    document.body.style.setProperty('color', '#000000', 'important');

    return () => {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
      document.body.classList.remove('light-theme');
      document.body.style.removeProperty('background-color');
      document.body.style.removeProperty('background');
      document.body.style.removeProperty('color');
    };
  }, []);

  // Debounce search input
  const debouncedSearch = useDebounce(search, 300);

  const fetchDirectory = async (offset = 0, append = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: '20',
        offset: offset.toString(),
        verified_only: verifiedOnly.toString(),
      });
      if (search) {
        params.set('search', search);
      }

      const response = await fetch(`/api/directory?${params}`);
      const data = await response.json();

      if (append) {
        setIssuers(prev => [...prev, ...data.issuers]);
      } else {
        setIssuers(data.issuers);
      }
      setPagination(data.pagination);
    } catch (error) {
      console.error('Failed to fetch directory:', error);
    } finally {
      setLoading(false);
    }
  };

  // Refetch when filters change (with debounced search)
  useEffect(() => {
    fetchDirectory(0);
  }, [verifiedOnly, typeFilter, sortBy, debouncedSearch]);

  // Sort issuers client-side for immediate feedback
  const sortedIssuers = useMemo(() => {
    const sorted = [...issuers];
    switch (sortBy) {
      case 'trust_score':
        return sorted.sort((a, b) => (b.stats?.trust_score ?? 0) - (a.stats?.trust_score ?? 0));
      case 'joined':
        return sorted.sort((a, b) => new Date(b.joined).getTime() - new Date(a.joined).getTime());
      case 'credentials':
        return sorted.sort((a, b) => (b.stats?.active_credentials ?? 0) - (a.stats?.active_credentials ?? 0));
      default:
        return sorted;
    }
  }, [issuers, sortBy]);

  // Filter by type client-side for immediate feedback
  const filteredIssuers = useMemo(() => {
    if (typeFilter === 'all') return sortedIssuers;
    return sortedIssuers.filter(issuer => issuer.type === typeFilter);
  }, [sortedIssuers, typeFilter]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (verifiedOnly) count++;
    if (typeFilter !== 'all') count++;
    return count;
  }, [verifiedOnly, typeFilter]);

  const loadMore = () => {
    if (pagination?.has_more) {
      fetchDirectory(pagination.offset + pagination.limit, true);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black font-retro">
      {/* Dotted Background Pattern */}
      <div className="fixed inset-0 dot-pattern pointer-events-none" />

      {/* Header */}
      <header className="relative z-50 border-b-4 border-black bg-white">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-black flex items-center justify-center block-shadow-sm group-hover:animate-block-wiggle">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="font-retro font-bold text-xl uppercase tracking-tight">AgentID</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 font-retro text-sm uppercase tracking-wider">
            <Link href="/#features" className="hover:underline underline-offset-4 decoration-2">Features</Link>
            <Link href="/marketplace" className="hover:underline underline-offset-4 decoration-2">Marketplace</Link>
            <Link href="/directory" className="underline underline-offset-4 decoration-2">Directory</Link>
            <Link href="/docs" className="hover:underline underline-offset-4 decoration-2">Docs</Link>
            <Link href="https://github.com/agentid" className="hover:underline underline-offset-4 decoration-2">
              <Github className="w-5 h-5" />
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <button className="font-retro font-bold text-sm uppercase px-4 py-2 hover:bg-gray-100 border-2 border-black">
                Sign In
              </button>
            </Link>
            <Link href="/register">
              <button className="font-retro font-bold text-sm uppercase px-4 py-2 bg-black text-white btn-retro">
                Get Started
              </button>
            </Link>
          </div>
        </div>
      </header>

      <main className="relative max-w-6xl mx-auto px-4 py-12 space-y-10">
        {/* Hero */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 border-2 border-black bg-white block-shadow-sm mb-6">
            <Shield className="w-4 h-4" />
            <span className="font-retro text-sm uppercase tracking-wider">Issuer Directory</span>
          </div>
          <h1 className="font-pixel text-5xl md:text-6xl uppercase">
            Trusted Issuers
          </h1>
          <p className="font-retro text-lg text-gray-600 max-w-2xl mx-auto">
            Discover verified organizations that issue credentials to AI agents.
            Find trusted issuers for your verification needs.
          </p>
        </div>

        {/* Search & Filters */}
        <div className="border-4 border-black bg-white p-6 block-shadow">
          {/* Search Row */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative border-4 border-black">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search issuers by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 h-12 bg-transparent text-black placeholder:text-gray-400 font-retro focus:outline-none"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black text-xl"
                >
                  &times;
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'px-6 py-3 font-retro font-bold uppercase text-sm flex items-center gap-2 border-4 border-black transition-colors',
                showFilters || activeFilterCount > 0
                  ? 'bg-black text-white'
                  : 'bg-white text-black hover:bg-gray-100'
              )}
            >
              <Filter className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-1 px-2 py-0.5 bg-white text-black text-xs font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Expandable Filters */}
          {showFilters && (
            <div className="flex flex-wrap gap-3 pt-6 mt-6 border-t-2 border-black">
              {/* Verified Filter */}
              <button
                type="button"
                onClick={() => setVerifiedOnly(!verifiedOnly)}
                className={cn(
                  'px-4 py-2 font-retro text-sm uppercase flex items-center gap-2 border-2 border-black transition-colors',
                  verifiedOnly
                    ? 'bg-black text-white'
                    : 'bg-white text-black hover:bg-gray-100'
                )}
              >
                <CheckCircle className="h-4 w-4" />
                Verified Only
              </button>

              {/* Type Filter */}
              <div className="flex items-center gap-2">
                <span className="font-retro text-sm text-gray-600 uppercase">Type:</span>
                {(['all', 'individual', 'organization', 'platform'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setTypeFilter(type)}
                    className={cn(
                      'px-3 py-2 font-retro text-sm uppercase flex items-center gap-1.5 border-2 border-black transition-colors',
                      typeFilter === type
                        ? 'bg-black text-white'
                        : 'bg-white text-black hover:bg-gray-100'
                    )}
                  >
                    {type !== 'all' && ISSUER_TYPE_ICONS[type]}
                    {type === 'all' ? 'All' : ISSUER_TYPE_LABELS[type]}
                  </button>
                ))}
              </div>

              {/* Sort */}
              <div className="flex items-center gap-2 ml-auto">
                <span className="font-retro text-sm text-gray-600 uppercase">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="px-4 py-2 font-retro text-sm uppercase border-2 border-black bg-white focus:outline-none"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        {pagination && (
          <div className="flex items-center justify-between font-retro text-sm text-gray-600">
            <span>
              {filteredIssuers.length} of {pagination.total} issuer{pagination.total !== 1 ? 's' : ''}
              {typeFilter !== 'all' && ` (${ISSUER_TYPE_LABELS[typeFilter]})`}
            </span>
            {(search || typeFilter !== 'all' || verifiedOnly) && (
              <button
                onClick={() => {
                  setSearch('');
                  setTypeFilter('all');
                  setVerifiedOnly(false);
                }}
                className="text-gray-600 hover:text-black transition-colors uppercase"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Results */}
        {loading && filteredIssuers.length === 0 ? (
          <div className="text-center py-12 border-4 border-black bg-gray-50 block-shadow">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
            <p className="font-retro text-gray-600">Loading directory...</p>
          </div>
        ) : filteredIssuers.length === 0 ? (
          <div className="text-center py-12 border-4 border-black bg-gray-50 block-shadow">
            <div className="w-16 h-16 bg-gray-200 border-2 border-black flex items-center justify-center mx-auto mb-4">
              <Building2 className="h-8 w-8 text-gray-400" />
            </div>
            <p className="font-retro text-gray-600 mb-4">No issuers found matching your criteria.</p>
            {(search || typeFilter !== 'all' || verifiedOnly) && (
              <button
                onClick={() => {
                  setSearch('');
                  setTypeFilter('all');
                  setVerifiedOnly(false);
                }}
                className="px-6 py-3 font-retro font-bold uppercase text-sm border-4 border-black hover:bg-gray-100 transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {filteredIssuers.map((issuer) => (
              <div
                key={issuer.id}
                className="border-4 border-black bg-white block-shadow block-hover transition-all"
              >
                {/* Header */}
                <div className="p-4 border-b-2 border-black bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        'w-12 h-12 border-2 border-black flex items-center justify-center flex-shrink-0',
                        issuer.verified ? 'bg-black text-white' : 'bg-gray-100'
                      )}>
                        {issuer.verified ? (
                          <CheckCircle className="h-6 w-6" />
                        ) : (
                          ISSUER_TYPE_ICONS[issuer.type] || <Building2 className="h-6 w-6" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-retro font-bold uppercase flex items-center gap-2">
                          {issuer.name}
                          {issuer.verified && (
                            <span className="px-2 py-0.5 text-xs font-bold bg-black text-white">
                              VERIFIED
                            </span>
                          )}
                        </h3>
                        <p className="font-retro text-sm text-gray-600 flex items-center gap-1.5 mt-1">
                          {ISSUER_TYPE_ICONS[issuer.type]}
                          {ISSUER_TYPE_LABELS[issuer.type] || issuer.type}
                          {issuer.domain && (
                            <>
                              <span className="text-gray-400">·</span>
                              <Globe className="h-3.5 w-3.5" />
                              {issuer.domain}
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                    {issuer.stats && (
                      <div className="text-right flex-shrink-0">
                        <div className="flex items-center gap-1 font-pixel text-3xl">
                          <Star className="h-6 w-6 fill-current" />
                          {issuer.stats.trust_score}
                        </div>
                        <div className="font-retro text-xs text-gray-600 uppercase">
                          Trust Score
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  {issuer.description && (
                    <p className="font-retro text-sm text-gray-600 mb-4 line-clamp-2">
                      {issuer.description}
                    </p>
                  )}
                  <div className="flex justify-between font-retro text-xs text-gray-600 uppercase">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      Joined {new Date(issuer.joined).toLocaleDateString()}
                    </span>
                    {issuer.stats && (
                      <span className="flex items-center gap-1.5">
                        <Shield className="h-3.5 w-3.5" />
                        {issuer.stats.active_credentials} credential{issuer.stats.active_credentials !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load More */}
        {pagination?.has_more && (
          <div className="text-center">
            <button
              onClick={loadMore}
              disabled={loading}
              className="px-8 py-4 font-retro font-bold uppercase text-sm border-4 border-black hover:bg-gray-100 transition-colors flex items-center gap-2 mx-auto disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Load More
                </>
              )}
            </button>
          </div>
        )}

        {/* CTA */}
        <div className="border-4 border-black bg-gray-50 p-12 block-shadow text-center space-y-6">
          <div className="w-16 h-16 bg-black text-white flex items-center justify-center mx-auto">
            <Sparkles className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h2 className="font-pixel text-3xl uppercase">Become a Verified Issuer</h2>
            <p className="font-retro text-gray-600 max-w-xl mx-auto">
              Issue credentials to your AI agents and build trust with verification services.
              Get started for free.
            </p>
          </div>
          <Link href="/register">
            <button className="inline-flex items-center gap-2 px-8 py-4 bg-black text-white font-retro font-bold uppercase btn-retro">
              Get Started
              <ArrowRight className="h-5 w-5" />
            </button>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative border-t-4 border-black py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-black flex items-center justify-center">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <span className="font-retro font-bold uppercase">AgentID</span>
              </div>
              <p className="font-retro text-sm text-gray-600">
                Trust infrastructure for autonomous AI agents.
              </p>
            </div>

            <div>
              <h4 className="font-retro font-bold uppercase mb-4">Product</h4>
              <ul className="space-y-2 font-retro text-sm text-gray-600">
                <li><Link href="/docs" className="hover:underline">Documentation</Link></li>
                <li><Link href="/pricing" className="hover:underline">Pricing</Link></li>
                <li><Link href="/marketplace" className="hover:underline">Marketplace</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-retro font-bold uppercase mb-4">Company</h4>
              <ul className="space-y-2 font-retro text-sm text-gray-600">
                <li><Link href="/terms" className="hover:underline">Terms</Link></li>
                <li><Link href="/privacy" className="hover:underline">Privacy</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-retro font-bold uppercase mb-4">Connect</h4>
              <ul className="space-y-2 font-retro text-sm text-gray-600">
                <li><a href="https://github.com/agentid" className="hover:underline">GitHub</a></li>
                <li><a href="https://twitter.com/agentid" className="hover:underline">Twitter</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t-2 border-black text-center font-retro text-sm text-gray-600">
            <span className="font-pixel">&copy; 2024 AgentID</span> — Identity for autonomous AI agents
          </div>
        </div>
      </footer>
    </div>
  );
}
