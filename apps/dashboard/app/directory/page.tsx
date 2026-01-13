'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold flex items-center gap-2">
            <span className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground text-sm font-bold">
              A
            </span>
            AgentID Directory
          </Link>
          <Link href="/login">
            <Button variant="outline">Sign In</Button>
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Hero */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Issuer Directory</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover verified organizations that issue credentials to AI agents.
            Find trusted issuers for your verification needs.
          </p>
        </div>

        {/* Search & Filters */}
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search issuers by name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button type="submit">Search</Button>
              <Button
                type="button"
                variant={verifiedOnly ? 'default' : 'outline'}
                onClick={() => setVerifiedOnly(!verifiedOnly)}
              >
                {verifiedOnly ? 'Verified Only' : 'Show All'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Stats */}
        {pagination && (
          <div className="text-sm text-muted-foreground">
            {pagination.total} issuer{pagination.total !== 1 ? 's' : ''} found
          </div>
        )}

        {/* Results */}
        {loading && issuers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            Loading directory...
          </div>
        ) : issuers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No issuers found matching your criteria.
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {issuers.map((issuer) => (
              <Card key={issuer.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {issuer.name}
                        {issuer.verified && (
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded">
                            Verified
                          </span>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {ISSUER_TYPE_LABELS[issuer.type] || issuer.type}
                        {issuer.domain && ` · ${issuer.domain}`}
                      </CardDescription>
                    </div>
                    {issuer.stats && (
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">
                          {issuer.stats.trust_score}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Trust Score
                        </div>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {issuer.description && (
                    <p className="text-sm text-muted-foreground mb-4">
                      {issuer.description}
                    </p>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Joined {new Date(issuer.joined).toLocaleDateString()}
                    </span>
                    {issuer.stats && (
                      <span className="text-muted-foreground">
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
            <Button variant="outline" onClick={loadMore} disabled={loading}>
              {loading ? 'Loading...' : 'Load More'}
            </Button>
          </div>
        )}

        {/* CTA */}
        <Card className="bg-muted/50">
          <CardContent className="py-8 text-center space-y-4">
            <h2 className="text-2xl font-bold">Become a Verified Issuer</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Issue credentials to your AI agents and build trust with verification services.
              Get started for free.
            </p>
            <Link href="/register">
              <Button size="lg">Get Started</Button>
            </Link>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t mt-12">
        <div className="max-w-6xl mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>AgentID - Credential Infrastructure for AI Agents</p>
        </div>
      </footer>
    </div>
  );
}
