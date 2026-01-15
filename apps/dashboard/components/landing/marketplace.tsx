'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Store,
  ArrowRight,
  Star,
  ExternalLink,
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface App {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  icon_url: string | null;
  pricing_type: string;
  rating_average: number;
  rating_count: number;
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
      className="group relative p-6 rounded-2xl border border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04] transition-all duration-300"
    >
      {/* Hover gradient effect */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 bg-gradient-to-br from-emerald-500/5 to-transparent" />

      <div className="flex items-start gap-4">
        {/* App icon */}
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
          {app.icon_url ? (
            <img
              src={app.icon_url}
              alt={app.name}
              className="w-10 h-10 rounded-lg object-cover"
            />
          ) : (
            <span className="text-xl font-bold text-white/60">
              {app.name.charAt(0)}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-display font-semibold text-white truncate">
              {app.name}
            </h3>
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {app.tagline}
          </p>

          <div className="flex items-center gap-3">
            {app.rating_count > 0 && (
              <div className="flex items-center gap-1 text-sm">
                <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                <span className="text-white/80">{app.rating_average.toFixed(1)}</span>
              </div>
            )}

            {app.categories.length > 0 && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                {ICON_MAP[app.categories[0].icon] || <Grid className="h-3.5 w-3.5" />}
                <span>{app.categories[0].name}</span>
              </div>
            )}

            <span
              className={cn(
                'ml-auto text-xs px-2 py-0.5 rounded-full',
                app.pricing_type === 'free'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : app.pricing_type === 'freemium'
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'bg-purple-500/20 text-purple-400'
              )}
            >
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
      <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
        <Store className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
      <p className="text-muted-foreground max-w-md mx-auto">
        The marketplace is launching soon. Be the first to submit your AI app and get discovered.
      </p>
      <Link href="/apps/new" className="mt-4 inline-block">
        <Button variant="outline" className="gap-2 border-white/20 hover:bg-white/5">
          Submit Your App
          <ArrowRight className="w-4 h-4" />
        </Button>
      </Link>
    </div>
  );
}

export function Marketplace() {
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApps();
  }, []);

  const fetchApps = async () => {
    try {
      const res = await fetch('/api/marketplace?limit=6');
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

  return (
    <section id="marketplace" className="py-24 relative">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/[0.02] to-transparent" />

      <div className="relative max-w-6xl mx-auto px-4">
        {/* Section header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-sm font-medium mb-6">
            <Store className="w-4 h-4 text-emerald-400" />
            Marketplace
          </div>

          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
              Discover verified
            </span>
            <br />
            <span className="bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
              AI applications
            </span>
          </h2>

          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Browse AI apps built by developers like you. All verified with AgentID credentials.
          </p>
        </div>

        {/* Apps grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] animate-pulse"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-white/10" />
                  <div className="flex-1">
                    <div className="h-5 bg-white/10 rounded w-32 mb-2" />
                    <div className="h-4 bg-white/5 rounded w-full mb-1" />
                    <div className="h-4 bg-white/5 rounded w-2/3" />
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
        {apps.length > 0 && (
          <div className="text-center mt-12">
            <Link href="/marketplace">
              <Button
                size="lg"
                className="bg-white text-black hover:bg-white/90 gap-2 font-medium"
              >
                Browse All Apps
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
