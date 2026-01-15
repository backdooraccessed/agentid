'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  ExternalLink,
  Github,
  BookOpen,
  Star,
  Eye,
  Shield,
  CheckCircle,
  Play,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AppDetails {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  icon_url: string | null;
  app_url: string;
  demo_url: string | null;
  github_url: string | null;
  docs_url: string | null;
  demo_video_url: string | null;
  pricing_type: string;
  pricing_amount: number | null;
  pricing_currency: string;
  view_count: number;
  average_rating: number | null;
  verified: boolean;
  categories: { id: string; name: string; slug: string }[];
  screenshots: { id: string; image_url: string; caption: string | null }[];
  issuer?: { name: string; is_verified: boolean };
  credential?: { agent_name: string; trust_score: number | null } | null;
  tags: string[] | null;
}

export default function AppDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [app, setApp] = useState<AppDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      fetchApp();
    }
  }, [slug]);

  const fetchApp = async () => {
    try {
      const res = await fetch(`/api/marketplace/${slug}`);
      if (res.ok) {
        const data = await res.json();
        setApp(data.app);
      }
    } catch (error) {
      console.error('Error fetching app:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse">
          <div className="h-8 bg-white/10 rounded w-24 mb-8" />
          <div className="flex gap-8">
            <div className="w-24 h-24 bg-white/10 rounded-2xl" />
            <div className="flex-1">
              <div className="h-8 bg-white/10 rounded w-64 mb-4" />
              <div className="h-4 bg-white/10 rounded w-full mb-2" />
              <div className="h-4 bg-white/10 rounded w-3/4" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h1 className="text-2xl font-bold text-white mb-4">App Not Found</h1>
        <p className="text-white/60 mb-6">The app you're looking for doesn't exist.</p>
        <Link href="/marketplace">
          <Button>Back to Marketplace</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Back link */}
      <Link
        href="/marketplace"
        className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-8 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Marketplace
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row gap-6 md:gap-8 mb-8">
        <div className="w-24 h-24 bg-gradient-to-br from-emerald-500/20 to-blue-500/20 rounded-2xl flex items-center justify-center flex-shrink-0">
          {app.icon_url ? (
            <img
              src={app.icon_url}
              alt={app.name}
              className="w-20 h-20 rounded-xl object-cover"
            />
          ) : (
            <span className="text-4xl font-bold text-white/60">
              {app.name.charAt(0)}
            </span>
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-white">{app.name}</h1>
            {app.verified && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/20 text-emerald-400 text-sm rounded-full">
                <CheckCircle className="h-4 w-4" />
                Verified
              </span>
            )}
          </div>

          <p className="text-lg text-white/70 mb-4">{app.tagline}</p>

          <div className="flex flex-wrap items-center gap-4 text-sm text-white/60">
            {app.issuer && (
              <span className="flex items-center gap-1">
                by <span className="text-white">{app.issuer.name}</span>
                {app.issuer.is_verified && (
                  <Shield className="h-4 w-4 text-emerald-400" />
                )}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {app.view_count.toLocaleString()} views
            </span>
            {app.average_rating && (
              <span className="flex items-center gap-1 text-amber-400">
                <Star className="h-4 w-4 fill-current" />
                {app.average_rating.toFixed(1)}
              </span>
            )}
            {app.credential?.trust_score && (
              <span className="flex items-center gap-1 text-emerald-400">
                <Shield className="h-4 w-4" />
                Trust Score: {app.credential.trust_score}
              </span>
            )}
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col gap-3">
          <a href={app.app_url} target="_blank" rel="noopener noreferrer">
            <Button className="w-full bg-emerald-500 hover:bg-emerald-600 gap-2">
              <ExternalLink className="h-4 w-4" />
              Visit App
            </Button>
          </a>
          {app.demo_url && (
            <a href={app.demo_url} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10 gap-2">
                <Play className="h-4 w-4" />
                Try Demo
              </Button>
            </a>
          )}
          <span className={cn(
            'text-center text-sm px-3 py-1.5 rounded-lg',
            app.pricing_type === 'free'
              ? 'bg-emerald-500/20 text-emerald-400'
              : app.pricing_type === 'freemium'
              ? 'bg-blue-500/20 text-blue-400'
              : 'bg-amber-500/20 text-amber-400'
          )}>
            {app.pricing_type === 'free' ? 'Free' :
             app.pricing_type === 'freemium' ? 'Freemium' :
             app.pricing_type === 'paid'
               ? `$${app.pricing_amount}/${app.pricing_currency === 'USD' ? 'mo' : app.pricing_currency}`
               : 'Contact for Pricing'}
          </span>
        </div>
      </div>

      {/* Categories & Tags */}
      <div className="flex flex-wrap gap-2 mb-8">
        {app.categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/marketplace?category=${cat.slug}`}
            className="px-3 py-1 bg-white/5 hover:bg-white/10 text-white/70 rounded-full text-sm transition-colors"
          >
            {cat.name}
          </Link>
        ))}
        {app.tags?.map((tag) => (
          <span
            key={tag}
            className="px-3 py-1 bg-white/5 text-white/50 rounded-full text-sm"
          >
            #{tag}
          </span>
        ))}
      </div>

      {/* Screenshots */}
      {app.screenshots.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Screenshots</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {app.screenshots.map((screenshot) => (
              <button
                key={screenshot.id}
                onClick={() => setSelectedScreenshot(screenshot.image_url)}
                className="aspect-video bg-white/5 rounded-lg overflow-hidden hover:ring-2 hover:ring-emerald-500 transition-all"
              >
                <img
                  src={screenshot.image_url}
                  alt={screenshot.caption || 'Screenshot'}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">About</h2>
        <div className="prose prose-invert max-w-none">
          <p className="text-white/70 whitespace-pre-wrap">{app.description}</p>
        </div>
      </div>

      {/* Links */}
      <div className="flex flex-wrap gap-4">
        {app.github_url && (
          <a
            href={app.github_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white/70 rounded-lg transition-colors"
          >
            <Github className="h-4 w-4" />
            View Source
          </a>
        )}
        {app.docs_url && (
          <a
            href={app.docs_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white/70 rounded-lg transition-colors"
          >
            <BookOpen className="h-4 w-4" />
            Documentation
          </a>
        )}
      </div>

      {/* Screenshot Modal */}
      {selectedScreenshot && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedScreenshot(null)}
        >
          <img
            src={selectedScreenshot}
            alt="Screenshot"
            className="max-w-full max-h-full rounded-lg"
          />
        </div>
      )}
    </div>
  );
}
