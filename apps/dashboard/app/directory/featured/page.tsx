'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

  function getTrustScoreColor(score: number) {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  }

  function getTrustScoreBg(score: number) {
    if (score >= 80) return 'bg-emerald-500/10 border-emerald-500/20';
    if (score >= 60) return 'bg-yellow-500/10 border-yellow-500/20';
    return 'bg-red-500/10 border-red-500/20';
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold flex items-center gap-3">
            <span className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-black text-sm font-bold">
              A
            </span>
            <span className="text-white">AgentID</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/directory">
              <Button variant="ghost" className="text-white/60 hover:text-white">
                All Issuers
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
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-amber-400" />
            </div>
          </div>
          <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20">
            Featured Collection
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Featured AI Agents
          </h1>
          <p className="text-xl text-white/60 max-w-2xl mx-auto">
            Discover top-rated, verified AI agents with the highest trust scores.
            These agents have been recognized for their reliability and security.
          </p>
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-white/30 mx-auto mb-4" />
            <p className="text-white/50">Loading featured agents...</p>
          </div>
        ) : agents.length === 0 ? (
          <Card className="overflow-hidden">
            <CardContent className="py-12 text-center">
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
                <Bot className="h-6 w-6 text-white/30" />
              </div>
              <p className="text-white/50 mb-4">No featured agents yet.</p>
              <Link href="/directory">
                <Button variant="outline" size="sm" className="border-white/10 hover:bg-white/[0.04]">
                  Browse All Issuers
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((agent, index) => (
              <Card
                key={agent.id}
                className={cn(
                  'overflow-hidden hover:bg-white/[0.02] transition-colors relative',
                  index === 0 && 'md:col-span-2 lg:col-span-1'
                )}
              >
                {/* Featured Badge */}
                <div className="absolute top-3 right-3">
                  <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 gap-1">
                    <Sparkles className="h-3 w-3" />
                    Featured
                  </Badge>
                </div>

                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                      getTrustScoreBg(agent.trust_score)
                    )}>
                      {AGENT_TYPE_ICONS[agent.agent_type] || <Bot className="h-6 w-6 text-white/70" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{agent.agent_name}</CardTitle>
                      <CardDescription className="flex items-center gap-1.5 mt-1">
                        {AGENT_TYPE_ICONS[agent.agent_type]}
                        {AGENT_TYPE_LABELS[agent.agent_type] || agent.agent_type}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {agent.agent_description && (
                    <p className="text-sm text-white/60 line-clamp-2">
                      {agent.agent_description}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/5 rounded-lg p-3 text-center">
                      <div className={cn('text-2xl font-bold flex items-center justify-center gap-1', getTrustScoreColor(agent.trust_score))}>
                        <Star className="h-5 w-5" />
                        {agent.trust_score}
                      </div>
                      <div className="text-xs text-white/50 mt-1">Trust Score</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-white">
                        {agent.verification_count.toLocaleString()}
                      </div>
                      <div className="text-xs text-white/50 mt-1">Verifications</div>
                    </div>
                  </div>

                  {/* Issuer */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <div className="flex items-center gap-2 text-sm text-white/50">
                      <Building2 className="h-4 w-4" />
                      <span className="truncate">{agent.issuer.name}</span>
                      {agent.issuer.verified && (
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-white/40">
                      <Calendar className="h-3 w-3" />
                      {new Date(agent.featured_at).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* CTA */}
        <Card className="overflow-hidden bg-gradient-to-r from-white/[0.03] to-white/[0.01]">
          <CardContent className="py-10 text-center space-y-6">
            <div className="flex justify-center gap-3">
              <div className="w-14 h-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                <Shield className="h-7 w-7 text-white/70" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Get Your Agent Featured</h2>
              <p className="text-white/60 max-w-xl mx-auto">
                Issue verified credentials to your AI agents and build trust.
                High-performing agents with strong trust scores may be featured.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3">
              <Link href="/register">
                <Button size="lg" className="gap-2">
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/directory">
                <Button size="lg" variant="outline" className="gap-2 border-white/10 hover:bg-white/[0.04]">
                  View All Issuers
                </Button>
              </Link>
            </div>
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
