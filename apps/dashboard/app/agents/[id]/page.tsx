'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
// Card components replaced with retro-styled divs
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="min-h-screen bg-white text-black">
        <header className="border-b-4 border-black">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <Link href="/agents" className="text-gray-600 hover:text-black flex items-center gap-2 font-retro">
              <ArrowLeft className="h-4 w-4" />
              Back to Registry
            </Link>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-12">
          <div className="border-4 border-black bg-white">
            <div className="p-4 py-12 text-center">
              <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-retro">{error || 'Agent not found'}</p>
              <Link href="/agents">
                <Button variant="outline" className="mt-4 border-2 border-black font-retro">
                  Browse Agents
                </Button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Header */}
      <header className="border-b-4 border-black">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/agents" className="text-gray-600 hover:text-black flex items-center gap-2 font-retro">
            <ArrowLeft className="h-4 w-4" />
            Back to Registry
          </Link>
          <Link href="/login">
            <Button variant="outline" size="sm" className="border-2 border-black font-retro">
              Sign In
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12 space-y-8">
        {/* Profile Header */}
        <div className="border-4 border-black bg-white overflow-hidden">
          <div className="p-4 pt-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Avatar */}
              <div
                className={cn(
                  'w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0',
                  agent.is_verified ? 'bg-emerald-100' : 'bg-gray-50'
                )}
              >
                {agent.logo_url ? (
                  <img
                    src={agent.logo_url}
                    alt={agent.display_name}
                    className="w-full h-full rounded-2xl object-cover"
                  />
                ) : agent.is_verified ? (
                  <CheckCircle className="h-10 w-10 text-emerald-600" />
                ) : (
                  <Bot className="h-10 w-10 text-gray-700" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h1 className="text-2xl font-pixel">{agent.display_name}</h1>
                  {agent.is_featured && (
                    <Badge className="bg-amber-100 text-amber-600 border-amber-300">
                      Featured
                    </Badge>
                  )}
                  {agent.is_verified && (
                    <Badge className="bg-emerald-100 text-emerald-600 border-emerald-300">
                      Verified
                    </Badge>
                  )}
                </div>

                <p className="text-gray-600 mb-4 font-retro">
                  {agent.short_description || agent.description?.slice(0, 160)}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-sm font-retro">
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <Building2 className="h-4 w-4" />
                    <span>{agent.issuer_name}</span>
                    {agent.issuer_verified && (
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Star className="h-4 w-4 text-amber-600" />
                    <span className="font-semibold">{agent.trust_score}</span>
                    <span className="text-gray-600">Trust Score</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <Activity className="h-4 w-4" />
                    <span>{agent.verification_count.toLocaleString()} verifications</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Credential ID */}
        <div className="border-4 border-black bg-white">
          <div className="bg-gray-50 border-b-4 border-black p-4">
            <h2 className="font-retro font-bold text-base">Credential ID</h2>
            <p className="font-retro text-gray-600 text-sm">Use this ID to verify this agent</p>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-2 p-3 bg-gray-100 rounded-lg font-mono text-sm">
              <code className="flex-1 truncate">{agent.credential_id}</code>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyCredentialId}
                className="flex-shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Description */}
        {agent.description && (
          <div className="border-4 border-black bg-white">
            <div className="bg-gray-50 border-b-4 border-black p-4">
              <h2 className="font-retro font-bold text-base">About</h2>
            </div>
            <div className="p-4">
              <p className="text-gray-700 whitespace-pre-wrap font-retro">{agent.description}</p>
            </div>
          </div>
        )}

        {/* Categories & Capabilities */}
        <div className="grid md:grid-cols-2 gap-4">
          {agent.categories.length > 0 && (
            <div className="border-4 border-black bg-white">
              <div className="bg-gray-50 border-b-4 border-black p-4">
                <h2 className="font-retro font-bold text-base">Categories</h2>
              </div>
              <div className="p-4">
                <div className="flex flex-wrap gap-2">
                  {agent.categories.map((cat) => (
                    <Badge key={cat} variant="outline" className="border-gray-300 font-retro">
                      {cat.replace('-', ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {agent.capabilities.length > 0 && (
            <div className="border-4 border-black bg-white">
              <div className="bg-gray-50 border-b-4 border-black p-4">
                <h2 className="font-retro font-bold text-base">Capabilities</h2>
              </div>
              <div className="p-4">
                <div className="flex flex-wrap gap-2">
                  {agent.capabilities.map((cap) => (
                    <Badge
                      key={cap}
                      variant="outline"
                      className="border-gray-300 bg-gray-50 font-retro"
                    >
                      <Zap className="h-3 w-3 mr-1" />
                      {cap.replace('-', ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tags */}
        {agent.tags.length > 0 && (
          <div className="border-4 border-black bg-white">
            <div className="bg-gray-50 border-b-4 border-black p-4">
              <h2 className="font-retro font-bold text-base">Tags</h2>
            </div>
            <div className="p-4">
              <div className="flex flex-wrap gap-2">
                {agent.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="bg-gray-50 font-retro">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Links & Contact */}
        <div className="border-4 border-black bg-white">
          <div className="bg-gray-50 border-b-4 border-black p-4">
            <h2 className="font-retro font-bold text-base">Links & Contact</h2>
          </div>
          <div className="p-4">
            <div className="grid sm:grid-cols-2 gap-4">
              {agent.endpoint_url && (
                <a
                  href={agent.endpoint_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <Globe className="h-5 w-5 text-gray-600" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium font-retro">API Endpoint</p>
                    <p className="text-xs text-gray-600 truncate font-retro">{agent.endpoint_url}</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-gray-400" />
                </a>
              )}

              {agent.documentation_url && (
                <a
                  href={agent.documentation_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <FileText className="h-5 w-5 text-gray-600" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium font-retro">Documentation</p>
                    <p className="text-xs text-gray-600 truncate font-retro">{agent.documentation_url}</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-gray-400" />
                </a>
              )}

              {agent.api_spec_url && (
                <a
                  href={agent.api_spec_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <Shield className="h-5 w-5 text-gray-600" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium font-retro">API Spec (OpenAPI)</p>
                    <p className="text-xs text-gray-600 truncate font-retro">{agent.api_spec_url}</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-gray-400" />
                </a>
              )}

              {agent.support_email && (
                <a
                  href={`mailto:${agent.support_email}`}
                  className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <Mail className="h-5 w-5 text-gray-600" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium font-retro">Support Email</p>
                    <p className="text-xs text-gray-600 truncate font-retro">{agent.support_email}</p>
                  </div>
                </a>
              )}

              {agent.support_url && (
                <a
                  href={agent.support_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <Globe className="h-5 w-5 text-gray-600" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium font-retro">Support Page</p>
                    <p className="text-xs text-gray-600 truncate font-retro">{agent.support_url}</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-gray-400" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Verification Example */}
        <div className="border-4 border-black bg-white">
          <div className="bg-gray-50 border-b-4 border-black p-4">
            <h2 className="font-retro font-bold text-base">Verify This Agent</h2>
            <p className="font-retro text-gray-600 text-sm">Use the AgentID API to verify this agent</p>
          </div>
          <div className="p-4">
            <pre className="p-4 bg-gray-100 rounded-lg overflow-x-auto text-sm">
              <code className="text-emerald-600">
{`curl -X POST https://agentid.dev/api/verify \\
  -H "Content-Type: application/json" \\
  -d '{"credential_id": "${agent.credential_id}"}'`}
              </code>
            </pre>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t-4 border-black mt-12">
        <div className="max-w-4xl mx-auto px-4 py-8 text-center text-sm text-gray-500 font-retro">
          <p>AgentID - Credential Infrastructure for AI Agents</p>
        </div>
      </footer>
    </div>
  );
}
