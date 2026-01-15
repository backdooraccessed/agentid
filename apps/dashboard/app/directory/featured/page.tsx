'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Shield,
  Building2,
  User,
  Globe,
  CheckCircle,
  Star,
  Sparkles,
  Loader2,
  ArrowRight,
  Bot,
  TrendingUp,
  Calendar,
  Github,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeaturedAgent {
  id: string;
  agent_id: string;
  agent_name: string;
  agent_type: string;
  agent_description: string | null;
  trust_score: number;
  verification_count: number;
  issuer: {
    id: string;
    name: string;
    verified: boolean;
  };
  featured_at: string;
}

const AGENT_TYPE_LABELS: Record<string, string> = {
  llm: 'AI Assistant',
  autonomous: 'Autonomous Agent',
  assistant: 'Assistant',
  bot: 'Bot',
  service: 'Service',
};

const AGENT_TYPE_ICONS: Record<string, React.ReactNode> = {
  llm: <Bot className="h-4 w-4" />,
  autonomous: <TrendingUp className="h-4 w-4" />,
  assistant: <User className="h-4 w-4" />,
  bot: <Bot className="h-4 w-4" />,
  service: <Globe className="h-4 w-4" />,
};

export default function FeaturedAgentsPage() {
  const [agents, setAgents] = useState<FeaturedAgent[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    fetchFeaturedAgents();
  }, []);

  async function fetchFeaturedAgents() {
    try {
      const response = await fetch('/api/registry?featured=true&limit=20');
      const data = await response.json();
      setAgents(data.agents || []);
    } catch (error) {
      console.error('Failed to fetch featured agents:', error);
    } finally {
      setLoading(false);
    }
  }

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
            <Link href="/directory" className="hover:underline underline-offset-4 decoration-2">Directory</Link>
            <Link href="/directory/featured" className="underline underline-offset-4 decoration-2">Featured</Link>
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
            <Sparkles className="w-4 h-4" />
            <span className="font-retro text-sm uppercase tracking-wider">Featured Collection</span>
          </div>
          <h1 className="font-pixel text-5xl md:text-6xl uppercase">
            Featured Agents
          </h1>
          <p className="font-retro text-lg text-gray-600 max-w-2xl mx-auto">
            Discover top-rated, verified AI agents with the highest trust scores.
            These agents have been recognized for their reliability and security.
          </p>
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center py-12 border-4 border-black bg-gray-50 block-shadow">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
            <p className="font-retro text-gray-600">Loading featured agents...</p>
          </div>
        ) : agents.length === 0 ? (
          <div className="text-center py-12 border-4 border-black bg-gray-50 block-shadow">
            <div className="w-16 h-16 bg-gray-200 border-2 border-black flex items-center justify-center mx-auto mb-4">
              <Bot className="h-8 w-8 text-gray-400" />
            </div>
            <p className="font-retro text-gray-600 mb-4">No featured agents yet.</p>
            <Link href="/directory">
              <button className="px-6 py-3 font-retro font-bold uppercase text-sm border-4 border-black hover:bg-gray-100 transition-colors">
                Browse All Issuers
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent, index) => (
              <div
                key={agent.id}
                className={cn(
                  'border-4 border-black bg-white block-shadow block-hover transition-all relative',
                  index === 0 && 'md:col-span-2 lg:col-span-1'
                )}
              >
                {/* Featured Badge */}
                <div className="absolute top-3 right-3">
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white text-xs font-retro uppercase">
                    <Sparkles className="h-3 w-3" />
                    Featured
                  </span>
                </div>

                {/* Header */}
                <div className="p-4 border-b-2 border-black bg-gray-50">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 border-2 border-black bg-white flex items-center justify-center flex-shrink-0">
                      {AGENT_TYPE_ICONS[agent.agent_type] || <Bot className="h-6 w-6" />}
                    </div>
                    <div className="flex-1 min-w-0 pr-16">
                      <h3 className="font-retro font-bold uppercase truncate">{agent.agent_name}</h3>
                      <p className="font-retro text-sm text-gray-600 flex items-center gap-1.5 mt-1">
                        {AGENT_TYPE_ICONS[agent.agent_type]}
                        {AGENT_TYPE_LABELS[agent.agent_type] || agent.agent_type}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">
                  {agent.agent_description && (
                    <p className="font-retro text-sm text-gray-600 line-clamp-2">
                      {agent.agent_description}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="border-2 border-black p-3 text-center">
                      <div className="flex items-center justify-center gap-1 font-pixel text-2xl">
                        <Star className="h-5 w-5 fill-current" />
                        {agent.trust_score}
                      </div>
                      <div className="font-retro text-xs text-gray-600 uppercase mt-1">Trust Score</div>
                    </div>
                    <div className="border-2 border-black p-3 text-center">
                      <div className="font-pixel text-2xl">
                        {agent.verification_count.toLocaleString()}
                      </div>
                      <div className="font-retro text-xs text-gray-600 uppercase mt-1">Verifications</div>
                    </div>
                  </div>

                  {/* Issuer */}
                  <div className="flex items-center justify-between pt-3 border-t-2 border-black">
                    <div className="flex items-center gap-2 font-retro text-sm text-gray-600">
                      <Building2 className="h-4 w-4" />
                      <span className="truncate">{agent.issuer.name}</span>
                      {agent.issuer.verified && (
                        <span className="px-1.5 py-0.5 bg-black text-white text-xs">
                          <CheckCircle className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 font-retro text-xs text-gray-500">
                      <Calendar className="h-3 w-3" />
                      {new Date(agent.featured_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="border-4 border-black bg-gray-50 p-12 block-shadow text-center space-y-6">
          <div className="w-16 h-16 bg-black text-white flex items-center justify-center mx-auto">
            <Shield className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h2 className="font-pixel text-3xl uppercase">Get Your Agent Featured</h2>
            <p className="font-retro text-gray-600 max-w-xl mx-auto">
              Issue verified credentials to your AI agents and build trust.
              High-performing agents with strong trust scores may be featured.
            </p>
          </div>
          <div className="flex items-center justify-center gap-4">
            <Link href="/register">
              <button className="inline-flex items-center gap-2 px-8 py-4 bg-black text-white font-retro font-bold uppercase btn-retro">
                Get Started
                <ArrowRight className="h-5 w-5" />
              </button>
            </Link>
            <Link href="/directory">
              <button className="px-8 py-4 font-retro font-bold uppercase border-4 border-black hover:bg-gray-100 transition-colors">
                View All Issuers
              </button>
            </Link>
          </div>
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
