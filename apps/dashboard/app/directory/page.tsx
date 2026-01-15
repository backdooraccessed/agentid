'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

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

export default function DirectoryPage() {
  const [issuers, setIssuers] = useState<Issuer[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(true);

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

  useEffect(() => {
    fetchDirectory(0);
  }, [verifiedOnly]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDirectory(0);
  };

  const loadMore = () => {
    if (pagination?.has_more) {
      fetchDirectory(pagination.offset + pagination.limit, true);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold flex items-center gap-3">
            <span className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-black text-sm font-bold">
              A
            </span>
            <span className="text-white">AgentID Directory</span>
          </Link>
          <Link href="/login">
            <Button variant="outline" className="border-white/10 hover:bg-white/[0.04]">
              Sign In
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12 space-y-10">
        {/* Hero */}
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <Shield className="h-8 w-8 text-white/70" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Issuer Directory</h1>
          <p className="text-xl text-white/60 max-w-2xl mx-auto">
            Discover verified organizations that issue credentials to AI agents.
            Find trusted issuers for your verification needs.
          </p>
        </div>

        {/* Search & Filters */}
        <Card className="overflow-hidden">
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <Input
                  placeholder="Search issuers by name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 bg-white/[0.02] border-white/10 focus:border-white/30"
                />
              </div>
              <Button type="submit" className="gap-2">
                <Search className="h-4 w-4" />
                Search
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setVerifiedOnly(!verifiedOnly)}
                className={cn(
                  'gap-2 transition-all',
                  verifiedOnly
                    ? 'bg-white text-black border-white hover:bg-white/90'
                    : 'border-white/10 hover:bg-white/[0.04]'
                )}
              >
                <CheckCircle className="h-4 w-4" />
                {verifiedOnly ? 'Verified Only' : 'Show All'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Stats */}
        {pagination && (
          <div className="text-sm text-white/50">
            {pagination.total} issuer{pagination.total !== 1 ? 's' : ''} found
          </div>
        )}

        {/* Results */}
        {loading && issuers.length === 0 ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-white/30 mx-auto mb-4" />
            <p className="text-white/50">Loading directory...</p>
          </div>
        ) : issuers.length === 0 ? (
          <Card className="overflow-hidden">
            <CardContent className="py-12 text-center">
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
                <Building2 className="h-6 w-6 text-white/30" />
              </div>
              <p className="text-white/50">No issuers found matching your criteria.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {issuers.map((issuer) => (
              <Card
                key={issuer.id}
                className="overflow-hidden hover:bg-white/[0.02] transition-colors"
              >
                <CardHeader className="bg-white/[0.02] border-b border-white/5 pb-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                        issuer.verified ? 'bg-emerald-500/10' : 'bg-white/5'
                      )}>
                        {issuer.verified ? (
                          <CheckCircle className="h-5 w-5 text-emerald-400" />
                        ) : (
                          ISSUER_TYPE_ICONS[issuer.type] || <Building2 className="h-5 w-5 text-white/70" />
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          {issuer.name}
                          {issuer.verified && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Verified
                            </span>
                          )}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1.5 mt-1">
                          {ISSUER_TYPE_ICONS[issuer.type]}
                          {ISSUER_TYPE_LABELS[issuer.type] || issuer.type}
                          {issuer.domain && (
                            <>
                              <span className="text-white/20">·</span>
                              <Globe className="h-3.5 w-3.5" />
                              {issuer.domain}
                            </>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                    {issuer.stats && (
                      <div className="text-right flex-shrink-0">
                        <div className="flex items-center gap-1 text-2xl font-bold">
                          <Star className="h-5 w-5 text-amber-400" />
                          {issuer.stats.trust_score}
                        </div>
                        <div className="text-xs text-white/50">
                          Trust Score
                        </div>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  {issuer.description && (
                    <p className="text-sm text-white/60 mb-4 line-clamp-2">
                      {issuer.description}
                    </p>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-1.5 text-white/50">
                      <Calendar className="h-3.5 w-3.5" />
                      Joined {new Date(issuer.joined).toLocaleDateString()}
                    </span>
                    {issuer.stats && (
                      <span className="flex items-center gap-1.5 text-white/50">
                        <Shield className="h-3.5 w-3.5" />
                        {issuer.stats.active_credentials} active credential{issuer.stats.active_credentials !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Load More */}
        {pagination?.has_more && (
          <div className="text-center">
            <Button
              variant="outline"
              onClick={loadMore}
              disabled={loading}
              className="gap-2 border-white/10 hover:bg-white/[0.04]"
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
            </Button>
          </div>
        )}

        {/* CTA */}
        <Card className="overflow-hidden bg-white/[0.02]">
          <CardContent className="py-10 text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-14 h-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                <Sparkles className="h-7 w-7 text-white/70" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Become a Verified Issuer</h2>
              <p className="text-white/60 max-w-xl mx-auto">
                Issue credentials to your AI agents and build trust with verification services.
                Get started for free.
              </p>
            </div>
            <Link href="/register">
              <Button size="lg" className="gap-2">
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-12">
        <div className="max-w-6xl mx-auto px-4 py-8 text-center text-sm text-white/40">
          <p>AgentID - Credential Infrastructure for AI Agents</p>
        </div>
      </footer>
    </div>
  );
}
