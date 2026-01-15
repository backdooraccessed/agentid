'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Star, Code, PenTool, Zap, BarChart2, Headphones, Palette, CheckSquare, Terminal, Grid, Filter, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

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
      {/* Hero */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Discover AI Apps
        </h1>
        <p className="text-xl text-white/60 max-w-2xl mx-auto">
          Find verified AI applications built by developers worldwide.
          Every app is backed by AgentID credentials.
        </p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-12">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
          <Input
            type="text"
            placeholder="Search apps..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-12 h-14 bg-white/5 border-white/10 text-white placeholder:text-white/40 text-lg"
          />
          <Button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white text-black hover:bg-white/90"
          >
            Search
          </Button>
        </div>
      </form>

      {/* Categories */}
      <div className="flex flex-wrap gap-2 justify-center mb-8">
        <button
          onClick={() => setSelectedCategory(null)}
          className={cn(
            'px-4 py-2 rounded-full text-sm font-medium transition-colors',
            !selectedCategory
              ? 'bg-white text-black'
              : 'bg-white/5 text-white/70 hover:bg-white/10'
          )}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.slug)}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2',
              selectedCategory === cat.slug
                ? 'bg-white text-black'
                : 'bg-white/5 text-white/70 hover:bg-white/10'
            )}
          >
            {ICON_MAP[cat.icon] || <Grid className="h-4 w-4" />}
            {cat.name}
            <span className="text-xs opacity-60">({cat.app_count})</span>
          </button>
        ))}
      </div>

      {/* Sort */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-white/60">
          {apps.length} app{apps.length !== 1 ? 's' : ''} found
        </p>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-white/40" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white"
          >
            <option value="newest">Newest</option>
            <option value="popular">Most Popular</option>
            <option value="rating">Highest Rated</option>
          </select>
        </div>
      </div>

      {/* Apps Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-6 animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-white/10 rounded-xl" />
                <div className="flex-1">
                  <div className="h-5 bg-white/10 rounded w-32 mb-2" />
                  <div className="h-4 bg-white/10 rounded w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : apps.length === 0 ? (
        <div className="text-center py-16">
          <Grid className="h-12 w-12 text-white/20 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No apps found</h3>
          <p className="text-white/60">
            {search ? 'Try a different search term' : 'Be the first to submit an app!'}
          </p>
          <Link href="/apps/new">
            <Button className="mt-4 bg-white text-black hover:bg-white/90">
              Submit Your App
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {apps.map((app) => (
            <Link
              key={app.id}
              href={`/marketplace/${app.slug}`}
              className="group bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 hover:border-white/20 rounded-xl p-6 transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-white/10 transition-colors">
                  {app.icon_url ? (
                    <img
                      src={app.icon_url}
                      alt={app.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-bold text-white/40">
                      {app.name.charAt(0)}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-white truncate group-hover:text-white/90 transition-colors">
                      {app.name}
                    </h3>
                    {app.verified && (
                      <Shield className="h-4 w-4 text-white/60" />
                    )}
                  </div>
                  <p className="text-sm text-white/50 line-clamp-2 mt-1">
                    {app.tagline}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {app.average_rating && (
                    <div className="flex items-center gap-1 text-white/60">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="text-sm">{app.average_rating.toFixed(1)}</span>
                    </div>
                  )}
                  <span className="text-xs text-white/40">
                    {app.view_count.toLocaleString()} views
                  </span>
                </div>
                <span className={cn(
                  'text-xs px-2 py-1 rounded-full',
                  app.pricing_type === 'free'
                    ? 'bg-white/10 text-white/70'
                    : app.pricing_type === 'freemium'
                    ? 'bg-white/10 text-white/70'
                    : 'bg-white/10 text-white/70'
                )}>
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
                      className="text-xs px-2 py-0.5 bg-white/5 text-white/50 rounded"
                    >
                      {cat.name}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
