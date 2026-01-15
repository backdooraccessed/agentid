'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Store,
  ArrowRight,
  Star,
  Code,
  PenTool,
  Search,
  Zap,
  BarChart2,
  Headphones,
  Palette,
  CheckSquare,
  Terminal,
  Grid,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  rating_average: number;
  rating_count: number;
  view_count: number;
  verified: boolean;
  categories: { name: string; slug: string; icon: string }[];
}

const ICON_MAP: Record<string, React.ReactNode> = {
  'code': <Code className="h-4 w-4" />,
  'pen-tool': <PenTool className="h-4 w-4" />,
  'search': <Search className="h-4 w-4" />,
  'zap': <Zap className="h-4 w-4" />,
  'bar-chart-2': <BarChart2 className="h-4 w-4" />,
  'headphones': <Headphones className="h-4 w-4" />,
  'palette': <Palette className="h-4 w-4" />,
  'check-square': <CheckSquare className="h-4 w-4" />,
  'terminal': <Terminal className="h-4 w-4" />,
  'grid': <Grid className="h-4 w-4" />,
};

function AppCard({ app }: { app: App }) {
  return (
    <Link
      href={`/marketplace/${app.slug}`}
      className="group relative p-5 rounded-xl border border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04] transition-all duration-300"
    >
      <div className="flex items-start gap-4">
        {/* App icon */}
        <div className="w-12 h-12 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 group-hover:bg-white/10 transition-colors">
          {app.icon_url ? (
            <img
              src={app.icon_url}
              alt={app.name}
              className="w-8 h-8 rounded object-cover"
            />
          ) : (
            <span className="text-lg font-bold text-white/40">
              {app.name.charAt(0)}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-white truncate text-sm">
              {app.name}
            </h3>
            {app.verified && (
              <Shield className="w-3.5 h-3.5 text-white/50" />
            )}
          </div>

          <p className="text-xs text-white/50 line-clamp-2">
            {app.tagline}
          </p>

          <div className="flex items-center gap-3 mt-2">
            {app.rating_count > 0 && (
              <div className="flex items-center gap-1 text-xs text-white/50">
                <Star className="w-3 h-3 fill-current" />
                <span>{app.rating_average?.toFixed(1)}</span>
              </div>
            )}

            <span className="text-xs text-white/40">
              {app.view_count?.toLocaleString() || 0} views
            </span>

            <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/60">
              {app.pricing_type === 'free' ? 'Free' : app.pricing_type === 'freemium' ? 'Freemium' : 'Paid'}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="col-span-full text-center py-12">
      <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
        <Store className="w-6 h-6 text-white/40" />
      </div>
      <h3 className="text-base font-medium text-white mb-2">Coming Soon</h3>
      <p className="text-sm text-white/50 max-w-md mx-auto">
        The marketplace is launching soon. Be the first to submit your AI app.
      </p>
      <Link href="/register" className="mt-4 inline-block">
        <Button variant="outline" size="sm" className="gap-2 border-white/20 hover:bg-white/5 text-white">
          Get Started
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </Link>
    </div>
  );
}

export function Marketplace() {
  const [apps, setApps] = useState<App[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchApps();
  }, [selectedCategory]);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/marketplace/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchApps = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '6' });
      if (selectedCategory) {
        params.set('category', selectedCategory);
      }
      const res = await fetch(`/api/marketplace?${params}`);
      if (res.ok) {
        const data = await res.json();
        setApps(data.apps || []);
      }
    } catch (error) {
      console.error('Error fetching marketplace apps:', error);
    } finally {
      setLoading(false);
    }
  };

  // Show only first 6 categories for tabs
  const displayCategories = categories.slice(0, 6);

  return (
    <section id="marketplace" className="py-24 relative">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.01] to-transparent" />

      <div className="relative max-w-6xl mx-auto px-4">
        {/* Section header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-sm font-medium mb-6">
            <Store className="w-4 h-4 text-white/70" />
            Marketplace
          </div>

          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            <span className="text-white">
              Discover verified AI apps
            </span>
          </h2>

          <p className="text-white/50 max-w-2xl mx-auto text-lg">
            Browse AI applications built by developers worldwide. All verified with AgentID.
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          <button
            onClick={() => setSelectedCategory(null)}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium transition-all duration-200',
              !selectedCategory
                ? 'bg-white text-black'
                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80'
            )}
          >
            All Apps
          </button>
          {displayCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.slug)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2',
                selectedCategory === cat.slug
                  ? 'bg-white text-black'
                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80'
              )}
            >
              {ICON_MAP[cat.icon] || <Grid className="h-3.5 w-3.5" />}
              {cat.name}
            </button>
          ))}
        </div>

        {/* Apps grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="p-5 rounded-xl border border-white/10 bg-white/[0.02] animate-pulse"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-white/10" />
                  <div className="flex-1">
                    <div className="h-4 bg-white/10 rounded w-24 mb-2" />
                    <div className="h-3 bg-white/5 rounded w-full mb-1" />
                    <div className="h-3 bg-white/5 rounded w-2/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : apps.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {apps.map((app) => (
              <AppCard key={app.id} app={app} />
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="text-center mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/marketplace">
            <Button
              size="lg"
              className="bg-white text-black hover:bg-white/90 gap-2 font-medium"
            >
              Browse All Apps
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/register">
            <Button
              size="lg"
              variant="outline"
              className="gap-2 font-medium border-white/20 hover:bg-white/5 text-white"
            >
              Submit Your App
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
