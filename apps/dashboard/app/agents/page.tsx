'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Shield,
  Bot,
  Globe,
  CheckCircle,
  Star,
  Loader2,
  ArrowRight,
  Sparkles,
  ExternalLink,
  Zap,
  Filter,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Agent {
  id: string;
  credential_id: string;
  display_name: string;
  short_description: string | null;
  description: string | null;
  categories: string[];
  capabilities: string[];
  tags: string[];
  endpoint_url: string | null;
  documentation_url: string | null;
  trust_score: number;
  is_verified: boolean;
  is_featured: boolean;
  issuer_name: string;
  issuer_verified: boolean;
  monthly_verifications: number;
  created_at: string;
}

interface Category {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  agent_count: number;
}

export default function AgentRegistryPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [minTrustScore, setMinTrustScore] = useState<number | undefined>();
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch agents when filters change
  useEffect(() => {
    fetchAgents();
  }, [selectedCategories, minTrustScore, verifiedOnly]);

  async function fetchCategories() {
    try {
      const response = await fetch('/api/registry/categories');
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  }

  async function fetchAgents() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('query', search);
      if (selectedCategories.length > 0) params.set('categories', selectedCategories.join(','));
      if (minTrustScore) params.set('min_trust_score', minTrustScore.toString());
      if (verifiedOnly) params.set('issuer_verified', 'true');

      const response = await fetch(`/api/registry?${params}`);
      const data = await response.json();
      setAgents(data.agents || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Failed to fetch agents:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAgents();
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((c) => c !== categoryId) : [...prev, categoryId]
    );
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setMinTrustScore(undefined);
    setVerifiedOnly(false);
    setSearch('');
  };

  const hasFilters = selectedCategories.length > 0 || minTrustScore || verifiedOnly || search;

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold flex items-center gap-3">
            <span className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-black text-sm font-bold">
              A
            </span>
            <span className="text-white">Agent Registry</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/directory">
              <Button variant="ghost" size="sm" className="text-white/60 hover:text-white">
                Issuer Directory
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" className="border-white/10 hover:bg-white/[0.04]">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12 space-y-10">
        {/* Hero */}
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <Bot className="h-8 w-8 text-white/70" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Discover AI Agents</h1>
          <p className="text-xl text-white/60 max-w-2xl mx-auto">
            Find verified AI agents with the capabilities you need. Every agent is backed by
            cryptographic credentials and a trust score.
          </p>
        </div>

        {/* Search */}
        <Card className="overflow-hidden">
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <Input
                  placeholder="Search agents by name, description, or tags..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 bg-white/[0.02] border-white/10 focus:border-white/30"
                />
              </div>
              <Button type="submit" className="gap-2">
                <Search className="h-4 w-4" />
                Search
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Categories */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Filter className="h-4 w-4 text-white/50" />
              Categories
            </h2>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-white/50">
                <X className="h-3 w-3 mr-1" />
                Clear filters
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.slice(0, 10).map((category) => (
              <Button
                key={category.id}
                variant="outline"
                size="sm"
                onClick={() => toggleCategory(category.id)}
                className={cn(
                  'gap-2 transition-all',
                  selectedCategories.includes(category.id)
                    ? 'bg-white text-black border-white hover:bg-white/90'
                    : 'border-white/10 hover:bg-white/[0.04]'
                )}
              >
                {category.name}
                <span className="text-xs opacity-60">({category.agent_count})</span>
              </Button>
            ))}
          </div>

          {/* Quick filters */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setVerifiedOnly(!verifiedOnly)}
              className={cn(
                'gap-2 transition-all',
                verifiedOnly
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : 'border-white/10 hover:bg-white/[0.04]'
              )}
            >
              <CheckCircle className="h-3 w-3" />
              Verified Issuers
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMinTrustScore(minTrustScore ? undefined : 80)}
              className={cn(
                'gap-2 transition-all',
                minTrustScore
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                  : 'border-white/10 hover:bg-white/[0.04]'
              )}
            >
              <Star className="h-3 w-3" />
              High Trust (80+)
            </Button>
          </div>
        </div>

        {/* Results count */}
        <div className="text-sm text-white/50">
          {total} agent{total !== 1 ? 's' : ''} found
        </div>

        {/* Results */}
        {loading && agents.length === 0 ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-white/30 mx-auto mb-4" />
            <p className="text-white/50">Discovering agents...</p>
          </div>
        ) : agents.length === 0 ? (
          <Card className="overflow-hidden">
            <CardContent className="py-12 text-center">
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
                <Bot className="h-6 w-6 text-white/30" />
              </div>
              <p className="text-white/50 mb-4">No agents found matching your criteria.</p>
              {hasFilters && (
                <Button variant="outline" onClick={clearFilters}>
                  Clear filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {agents.map((agent) => (
              <Card
                key={agent.id}
                className="overflow-hidden hover:bg-white/[0.02] transition-colors group"
              >
                <CardHeader className="bg-white/[0.02] border-b border-white/5 pb-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div
                        className={cn(
                          'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                          agent.is_verified ? 'bg-emerald-500/10' : 'bg-white/5'
                        )}
                      >
                        {agent.is_verified ? (
                          <CheckCircle className="h-5 w-5 text-emerald-400" />
                        ) : (
                          <Bot className="h-5 w-5 text-white/70" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                          <span className="truncate">{agent.display_name}</span>
                          {agent.is_featured && (
                            <Badge variant="secondary" className="bg-amber-500/10 text-amber-400 border-amber-500/20">
                              Featured
                            </Badge>
                          )}
                          {agent.is_verified && (
                            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                              Verified
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1.5 mt-1">
                          <Shield className="h-3.5 w-3.5" />
                          {agent.issuer_name}
                          {agent.issuer_verified && (
                            <CheckCircle className="h-3 w-3 text-emerald-400" />
                          )}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <div className="flex items-center gap-1 text-2xl font-bold">
                        <Star className="h-5 w-5 text-amber-400" />
                        {agent.trust_score}
                      </div>
                      <div className="text-xs text-white/50">Trust Score</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  {agent.short_description && (
                    <p className="text-sm text-white/60 line-clamp-2">{agent.short_description}</p>
                  )}

                  {/* Categories & Capabilities */}
                  <div className="flex flex-wrap gap-1.5">
                    {agent.categories.slice(0, 2).map((cat) => (
                      <Badge key={cat} variant="outline" className="text-xs border-white/10">
                        {cat.replace('-', ' ')}
                      </Badge>
                    ))}
                    {agent.capabilities.slice(0, 2).map((cap) => (
                      <Badge
                        key={cap}
                        variant="outline"
                        className="text-xs border-white/10 bg-white/5"
                      >
                        <Zap className="h-2.5 w-2.5 mr-1" />
                        {cap.replace('-', ' ')}
                      </Badge>
                    ))}
                    {agent.categories.length + agent.capabilities.length > 4 && (
                      <Badge variant="outline" className="text-xs border-white/10 text-white/40">
                        +{agent.categories.length + agent.capabilities.length - 4} more
                      </Badge>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-xs text-white/40">
                      {agent.monthly_verifications.toLocaleString()} verifications/mo
                    </span>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {agent.documentation_url && (
                        <a
                          href={agent.documentation_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-white/50 hover:text-white"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                      <Link href={`/agents/${agent.credential_id}`}>
                        <Button size="sm" variant="ghost" className="h-7 px-2">
                          View <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
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
              <h2 className="text-2xl font-bold">List Your Agent</h2>
              <p className="text-white/60 max-w-xl mx-auto">
                Register your AI agent in the public directory. Get discovered by potential users
                and build trust through verified credentials.
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
        <div className="max-w-6xl mx-auto px-4 py-8 flex justify-between items-center text-sm text-white/40">
          <p>AgentID - Credential Infrastructure for AI Agents</p>
          <div className="flex gap-4">
            <Link href="/directory" className="hover:text-white/60">
              Issuer Directory
            </Link>
            <Link href="/docs" className="hover:text-white/60">
              Documentation
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
