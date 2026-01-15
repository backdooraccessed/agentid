'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Shield,
  Bot,
  Globe,
  CheckCircle,
  Star,
  Loader2,
  ExternalLink,
  Zap,
  Mail,
  FileText,
  Copy,
  Check,
  Activity,
  Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AgentProfile {
  id: string;
  credential_id: string;
  display_name: string;
  short_description: string | null;
  description: string | null;
  logo_url: string | null;
  categories: string[];
  capabilities: string[];
  tags: string[];
  endpoint_url: string | null;
  documentation_url: string | null;
  api_spec_url: string | null;
  support_email: string | null;
  support_url: string | null;
  trust_score: number;
  is_verified: boolean;
  is_featured: boolean;
  verification_count: number;
  monthly_verifications: number;
  issuer_name: string;
  issuer_verified: boolean;
  created_at: string;
}

export default function AgentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [agent, setAgent] = useState<AgentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchAgent();
  }, [id]);

  async function fetchAgent() {
    try {
      const response = await fetch(`/api/registry/${id}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Agent not found');
        return;
      }

      setAgent(data.agent);
    } catch {
      setError('Failed to load agent');
    } finally {
      setLoading(false);
    }
  }

  async function copyCredentialId() {
    if (!agent) return;
    await navigator.clipboard.writeText(agent.credential_id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white/30" />
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="min-h-screen bg-black">
        <header className="border-b border-white/10">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <Link href="/agents" className="text-white/60 hover:text-white flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Registry
            </Link>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-12">
          <Card>
            <CardContent className="py-12 text-center">
              <Bot className="h-12 w-12 text-white/30 mx-auto mb-4" />
              <p className="text-white/50">{error || 'Agent not found'}</p>
              <Link href="/agents">
                <Button variant="outline" className="mt-4">
                  Browse Agents
                </Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/agents" className="text-white/60 hover:text-white flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Registry
          </Link>
          <Link href="/login">
            <Button variant="outline" size="sm" className="border-white/10">
              Sign In
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12 space-y-8">
        {/* Profile Header */}
        <Card className="overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Avatar */}
              <div
                className={cn(
                  'w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0',
                  agent.is_verified ? 'bg-emerald-500/10' : 'bg-white/5'
                )}
              >
                {agent.logo_url ? (
                  <img
                    src={agent.logo_url}
                    alt={agent.display_name}
                    className="w-full h-full rounded-2xl object-cover"
                  />
                ) : agent.is_verified ? (
                  <CheckCircle className="h-10 w-10 text-emerald-400" />
                ) : (
                  <Bot className="h-10 w-10 text-white/70" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h1 className="text-2xl font-bold">{agent.display_name}</h1>
                  {agent.is_featured && (
                    <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20">
                      Featured
                    </Badge>
                  )}
                  {agent.is_verified && (
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                      Verified
                    </Badge>
                  )}
                </div>

                <p className="text-white/60 mb-4">
                  {agent.short_description || agent.description?.slice(0, 160)}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5 text-white/50">
                    <Building2 className="h-4 w-4" />
                    <span>{agent.issuer_name}</span>
                    {agent.issuer_verified && (
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Star className="h-4 w-4 text-amber-400" />
                    <span className="font-semibold">{agent.trust_score}</span>
                    <span className="text-white/50">Trust Score</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-white/50">
                    <Activity className="h-4 w-4" />
                    <span>{agent.verification_count.toLocaleString()} verifications</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Credential ID */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Credential ID</CardTitle>
            <CardDescription>Use this ID to verify this agent</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 p-3 bg-white/5 rounded-lg font-mono text-sm">
              <code className="flex-1 truncate">{agent.credential_id}</code>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyCredentialId}
                className="flex-shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-emerald-400" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Description */}
        {agent.description && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">About</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white/70 whitespace-pre-wrap">{agent.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Categories & Capabilities */}
        <div className="grid md:grid-cols-2 gap-4">
          {agent.categories.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {agent.categories.map((cat) => (
                    <Badge key={cat} variant="outline" className="border-white/10">
                      {cat.replace('-', ' ')}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {agent.capabilities.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Capabilities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {agent.capabilities.map((cap) => (
                    <Badge
                      key={cap}
                      variant="outline"
                      className="border-white/10 bg-white/5"
                    >
                      <Zap className="h-3 w-3 mr-1" />
                      {cap.replace('-', ' ')}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Tags */}
        {agent.tags.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {agent.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="bg-white/5">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Links & Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Links & Contact</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-4">
              {agent.endpoint_url && (
                <a
                  href={agent.endpoint_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <Globe className="h-5 w-5 text-white/50" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">API Endpoint</p>
                    <p className="text-xs text-white/50 truncate">{agent.endpoint_url}</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-white/30" />
                </a>
              )}

              {agent.documentation_url && (
                <a
                  href={agent.documentation_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <FileText className="h-5 w-5 text-white/50" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Documentation</p>
                    <p className="text-xs text-white/50 truncate">{agent.documentation_url}</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-white/30" />
                </a>
              )}

              {agent.api_spec_url && (
                <a
                  href={agent.api_spec_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <Shield className="h-5 w-5 text-white/50" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">API Spec (OpenAPI)</p>
                    <p className="text-xs text-white/50 truncate">{agent.api_spec_url}</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-white/30" />
                </a>
              )}

              {agent.support_email && (
                <a
                  href={`mailto:${agent.support_email}`}
                  className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <Mail className="h-5 w-5 text-white/50" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Support Email</p>
                    <p className="text-xs text-white/50 truncate">{agent.support_email}</p>
                  </div>
                </a>
              )}

              {agent.support_url && (
                <a
                  href={agent.support_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <Globe className="h-5 w-5 text-white/50" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Support Page</p>
                    <p className="text-xs text-white/50 truncate">{agent.support_url}</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-white/30" />
                </a>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Verification Example */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Verify This Agent</CardTitle>
            <CardDescription>Use the AgentID API to verify this agent</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="p-4 bg-white/5 rounded-lg overflow-x-auto text-sm">
              <code className="text-emerald-400">
{`curl -X POST https://agentid.dev/api/verify \\
  -H "Content-Type: application/json" \\
  -d '{"credential_id": "${agent.credential_id}"}'`}
              </code>
            </pre>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-12">
        <div className="max-w-4xl mx-auto px-4 py-8 text-center text-sm text-white/40">
          <p>AgentID - Credential Infrastructure for AI Agents</p>
        </div>
      </footer>
    </div>
  );
}
