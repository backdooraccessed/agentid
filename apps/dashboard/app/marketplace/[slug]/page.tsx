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
import { cn } from '@/lib/utils';
import { AgentIconSmall } from '@/components/illustrations/agent-verification';

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
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 w-24 mb-8" />
          <div className="flex gap-8">
            <div className="w-24 h-24 bg-gray-200" />
            <div className="flex-1">
              <div className="h-8 bg-gray-200 w-64 mb-4" />
              <div className="h-4 bg-gray-200 w-full mb-2" />
              <div className="h-4 bg-gray-200 w-3/4" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 text-center">
        <div className="border-4 border-black bg-gray-50 p-12 block-shadow">
          <h1 className="font-retro text-2xl font-bold mb-4 uppercase">App Not Found</h1>
          <p className="text-gray-600 font-retro mb-6">The app you're looking for doesn't exist.</p>
          <Link href="/marketplace">
            <button className="px-6 py-3 bg-black text-white font-retro font-bold uppercase text-sm btn-retro">
              Back to Marketplace
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      {/* Back link */}
      <Link
        href="/marketplace"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-black mb-8 transition-colors font-retro uppercase text-sm"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Marketplace
      </Link>

      {/* Header */}
      <div className="border-4 border-black bg-white p-6 md:p-8 mb-8 block-shadow">
        <div className="flex flex-col md:flex-row gap-6 md:gap-8">
          <div className="w-24 h-24 bg-gray-100 border-4 border-black flex items-center justify-center flex-shrink-0">
            {app.icon_url ? (
              <img
                src={app.icon_url}
                alt={app.name}
                className="w-20 h-20 object-cover"
              />
            ) : (
              <AgentIconSmall verified={app.verified} className="w-16 h-20" />
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="font-pixel text-3xl font-bold uppercase">{app.name}</h1>
              {app.verified && (
                <span className="inline-flex items-center gap-1 px-2 py-1 border-2 border-black text-sm font-retro uppercase bg-gray-100">
                  <CheckCircle className="h-4 w-4" />
                  Verified
                </span>
              )}
            </div>

            <p className="text-lg text-gray-600 mb-4 font-retro">{app.tagline}</p>

            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 font-retro">
              {app.issuer && (
                <span className="flex items-center gap-1">
                  by <span className="text-black font-bold">{app.issuer.name}</span>
                  {app.issuer.is_verified && (
                    <Shield className="h-4 w-4" />
                  )}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {app.view_count.toLocaleString()} views
              </span>
              {app.average_rating && (
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-current" />
                  {app.average_rating.toFixed(1)}
                </span>
              )}
              {app.credential?.trust_score && (
                <span className="flex items-center gap-1">
                  <Shield className="h-4 w-4" />
                  Trust: {app.credential.trust_score}
                </span>
              )}
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-3">
            <a href={app.app_url} target="_blank" rel="noopener noreferrer">
              <button className="w-full px-6 py-3 bg-black text-white font-retro font-bold uppercase text-sm btn-retro flex items-center justify-center gap-2">
                <ExternalLink className="h-4 w-4" />
                Visit App
              </button>
            </a>
            {app.demo_url && (
              <a href={app.demo_url} target="_blank" rel="noopener noreferrer">
                <button className="w-full px-6 py-3 border-4 border-black text-black font-retro font-bold uppercase text-sm hover:bg-gray-100 transition-colors flex items-center justify-center gap-2">
                  <Play className="h-4 w-4" />
                  Try Demo
                </button>
              </a>
            )}
            <span className="text-center text-sm px-3 py-1.5 border-2 border-black text-gray-600 font-retro uppercase bg-gray-100">
              {app.pricing_type === 'free' ? 'Free' :
               app.pricing_type === 'freemium' ? 'Freemium' :
               app.pricing_type === 'paid'
                 ? `$${app.pricing_amount}/${app.pricing_currency === 'USD' ? 'mo' : app.pricing_currency}`
                 : 'Contact'}
            </span>
          </div>
        </div>
      </div>

      {/* Categories & Tags */}
      <div className="flex flex-wrap gap-2 mb-8">
        {app.categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/marketplace?category=${cat.slug}`}
            className="px-3 py-1 border-2 border-black hover:bg-gray-100 text-black font-retro text-sm uppercase transition-colors"
          >
            {cat.name}
          </Link>
        ))}
        {app.tags?.map((tag) => (
          <span
            key={tag}
            className="px-3 py-1 bg-gray-100 text-gray-600 font-retro text-sm border border-gray-300"
          >
            #{tag}
          </span>
        ))}
      </div>

      {/* Screenshots */}
      {app.screenshots.length > 0 && (
        <div className="mb-8">
          <h2 className="font-retro text-lg font-bold mb-4 uppercase border-b-2 border-black pb-2">Screenshots</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {app.screenshots.map((screenshot) => (
              <button
                key={screenshot.id}
                onClick={() => setSelectedScreenshot(screenshot.image_url)}
                className="aspect-video bg-gray-100 border-2 border-black overflow-hidden hover:border-gray-600 transition-all block-shadow-sm"
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
        <h2 className="font-retro text-lg font-bold mb-4 uppercase border-b-2 border-black pb-2">About</h2>
        <div className="border-4 border-black bg-gray-50 p-6 block-shadow">
          <p className="text-gray-700 whitespace-pre-wrap font-retro">{app.description}</p>
        </div>
      </div>

      {/* Links */}
      <div className="flex flex-wrap gap-4">
        {app.github_url && (
          <a
            href={app.github_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 border-2 border-black hover:bg-gray-100 text-black font-retro text-sm uppercase transition-colors"
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
            className="inline-flex items-center gap-2 px-4 py-2 border-2 border-black hover:bg-gray-100 text-black font-retro text-sm uppercase transition-colors"
          >
            <BookOpen className="h-4 w-4" />
            Documentation
          </a>
        )}
      </div>

      {/* Screenshot Modal */}
      {selectedScreenshot && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedScreenshot(null)}
        >
          <div className="border-4 border-white p-2 bg-black">
            <img
              src={selectedScreenshot}
              alt="Screenshot"
              className="max-w-full max-h-[80vh]"
            />
          </div>
        </div>
      )}
    </div>
  );
}
