'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Star, Code, PenTool, Zap, BarChart2, Headphones, Palette, CheckSquare, Terminal, Grid, Filter, Shield, Bot, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { AgentIconSmall } from '@/components/illustrations/agent-verification';

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  app_count: number;
}

interface App {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  icon_url: string | null;
  pricing_type: string;
  view_count: number;
  average_rating: number | null;
  categories: { name: string; slug: string }[];
  issuer?: { name: string; is_verified: boolean };
  verified: boolean;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  'code': <Code className="h-5 w-5" />,
  'pen-tool': <PenTool className="h-5 w-5" />,
  'search': <Search className="h-5 w-5" />,
  'zap': <Zap className="h-5 w-5" />,
  'bar-chart-2': <BarChart2 className="h-5 w-5" />,
  'headphones': <Headphones className="h-5 w-5" />,
  'palette': <Palette className="h-5 w-5" />,
  'check-square': <CheckSquare className="h-5 w-5" />,
  'terminal': <Terminal className="h-5 w-5" />,
  'grid': <Grid className="h-5 w-5" />,
};

export default function MarketplacePage() {
  const [apps, setApps] = useState<App[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sort, setSort] = useState('newest');

  useEffect(() => {
    fetchCategories();
    fetchApps();
  }, []);

  useEffect(() => {
    fetchApps();
  }, [selectedCategory, sort]);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/marketplace/categories');
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchApps = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.set('category', selectedCategory);
      if (sort) params.set('sort', sort);
      if (search) params.set('search', search);

      const res = await fetch(`/api/marketplace?${params}`);
      const data = await res.json();
      setApps(data.apps || []);
    } catch (error) {
      console.error('Error fetching apps:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchApps();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero - Retro Style */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 border-2 border-white/20 bg-white/5 mb-6">
          <Bot className="w-4 h-4 text-white/70" />
          <span className="font-mono text-sm uppercase tracking-wider text-white/70">AI Marketplace</span>
        </div>
        <h1 className="font-mono text-4xl md:text-5xl font-bold text-white mb-4 uppercase tracking-tight">
          Discover Verified<br />AI Agents
        </h1>
        <p className="font-mono text-lg text-white/60 max-w-2xl mx-auto">
          Find verified AI applications built by developers worldwide.
          Every app is backed by AgentID credentials.
        </p>
      </div>

      {/* Search - Retro Style */}
      <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-12">
        <div className="relative border-4 border-white/20 bg-white/5">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
          <input
            type="text"
            placeholder="Search apps..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-28 h-14 bg-transparent text-white placeholder:text-white/40 font-mono text-lg focus:outline-none"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-white text-black font-mono font-bold uppercase text-sm hover:bg-white/90 transition-colors"
          >
            Search
          </button>
        </div>
      </form>

      {/* Categories - Retro Pills */}
      <div className="flex flex-wrap gap-2 justify-center mb-8">
        <button
          onClick={() => setSelectedCategory(null)}
          className={cn(
            'px-4 py-2 font-mono text-sm font-bold uppercase transition-all border-2',
            !selectedCategory
              ? 'bg-white text-black border-white'
              : 'bg-transparent text-white/70 border-white/20 hover:border-white/40'
          )}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.slug)}
            className={cn(
              'px-4 py-2 font-mono text-sm font-bold uppercase transition-all border-2 flex items-center gap-2',
              selectedCategory === cat.slug
                ? 'bg-white text-black border-white'
                : 'bg-transparent text-white/70 border-white/20 hover:border-white/40'
            )}
          >
            {ICON_MAP[cat.icon] || <Grid className="h-4 w-4" />}
            {cat.name}
            <span className="text-xs opacity-60">({cat.app_count})</span>
          </button>
        ))}
      </div>

      {/* Sort */}
      <div className="flex items-center justify-between mb-6 border-b-2 border-white/10 pb-4">
        <p className="text-white/60 font-mono">
          {apps.length} app{apps.length !== 1 ? 's' : ''} found
        </p>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-white/40" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="bg-white/5 border-2 border-white/20 px-3 py-1.5 text-sm text-white font-mono uppercase focus:outline-none focus:border-white/40"
          >
            <option value="newest">Newest</option>
            <option value="popular">Most Popular</option>
            <option value="rating">Highest Rated</option>
          </select>
        </div>
      </div>

      {/* Apps Grid - Retro Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="border-4 border-white/10 bg-white/5 p-6 animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-white/10" />
                <div className="flex-1">
                  <div className="h-5 bg-white/10 w-32 mb-2" />
                  <div className="h-4 bg-white/10 w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : apps.length === 0 ? (
        <div className="text-center py-16 border-4 border-white/10 bg-white/5">
          <div className="w-16 h-16 bg-white/10 mx-auto mb-4 flex items-center justify-center">
            <Grid className="h-8 w-8 text-white/40" />
          </div>
          <h3 className="font-mono text-xl font-bold text-white mb-2 uppercase">No Apps Found</h3>
          <p className="text-white/60 font-mono">
            {search ? 'Try a different search term' : 'Be the first to submit an app!'}
          </p>
          <Link href="/apps/new">
            <button className="mt-6 px-6 py-3 bg-white text-black font-mono font-bold uppercase text-sm hover:bg-white/90 transition-colors">
              Submit Your App
            </button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {apps.map((app) => (
            <Link
              key={app.id}
              href={`/marketplace/${app.slug}`}
              className="group border-4 border-white/10 hover:border-white/30 bg-white/[0.02] hover:bg-white/[0.05] p-6 transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-white/5 border-2 border-white/10 flex items-center justify-center flex-shrink-0 group-hover:bg-white/10 transition-colors">
                  {app.icon_url ? (
                    <img
                      src={app.icon_url}
                      alt={app.name}
                      className="w-12 h-12 object-cover"
                    />
                  ) : (
                    <AgentIconSmall verified={app.verified} className="w-10 h-12" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-mono font-bold text-white truncate group-hover:text-white/90 transition-colors uppercase">
                      {app.name}
                    </h3>
                    {app.verified && (
                      <div className="w-5 h-5 bg-white/20 flex items-center justify-center">
                        <Shield className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-white/50 line-clamp-2 mt-1 font-mono">
                    {app.tagline}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t-2 border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {app.average_rating && (
                    <div className="flex items-center gap-1 text-white/60">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="text-sm font-mono">{app.average_rating.toFixed(1)}</span>
                    </div>
                  )}
                  <span className="text-xs text-white/40 font-mono">
                    {app.view_count.toLocaleString()} views
                  </span>
                </div>
                <span className="text-xs px-2 py-1 border border-white/20 text-white/70 font-mono uppercase">
                  {app.pricing_type === 'free' ? 'Free' :
                   app.pricing_type === 'freemium' ? 'Freemium' :
                   app.pricing_type === 'paid' ? 'Paid' : 'Contact'}
                </span>
              </div>

              {app.categories.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {app.categories.slice(0, 2).map((cat) => (
                    <span
                      key={cat.slug}
                      className="text-xs px-2 py-0.5 bg-white/5 text-white/50 font-mono uppercase"
                    >
                      {cat.name}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-4 flex items-center gap-2 text-white/50 group-hover:text-white/70 transition-colors">
                <span className="text-xs font-mono uppercase">View Details</span>
                <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
