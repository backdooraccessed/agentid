'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Loader2,
  Star,
  StarOff,
  Shield,
  TrendingUp,
  Users,
  RefreshCw,
  Search,
} from 'lucide-react';

interface AgentReputation {
  trust_score: number;
  verification_score: number;
  longevity_score?: number;
  activity_score?: number;
  verification_count: number;
}

interface FeaturedAgent {
  id: string;
  credential_id: string;
  display_name: string;
  description: string | null;
  category: string | null;
  is_featured: boolean;
  is_verified: boolean;
  featured_at?: string;
  created_at: string;
  credential?: {
    agent_name: string;
    agent_type: string;
    status: string;
  };
  reputation?: AgentReputation;
  composite_score?: number;
}

export default function FeaturedAgentsPage() {
  const [loading, setLoading] = useState(true);
  const [featuredAgents, setFeaturedAgents] = useState<FeaturedAgent[]>([]);
  const [candidates, setCandidates] = useState<FeaturedAgent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Filter criteria
  const [minTrustScore, setMinTrustScore] = useState('70');
  const [minVerifications, setMinVerifications] = useState('10');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    setError(null);

    try {
      const [featuredRes, candidatesRes] = await Promise.all([
        fetch('/api/admin/registry/featured'),
        fetch(`/api/admin/registry/featured/candidates?min_trust_score=${minTrustScore}&min_verifications=${minVerifications}`),
      ]);

      if (featuredRes.ok) {
        const data = await featuredRes.json();
        setFeaturedAgents(data.featured || []);
      }

      if (candidatesRes.ok) {
        const data = await candidatesRes.json();
        setCandidates(data.candidates || []);
      }

      if (!featuredRes.ok && !candidatesRes.ok) {
        setError('Failed to load data. You may not have admin access.');
      }
    } catch {
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }

  async function toggleFeatured(registryId: string, featured: boolean) {
    setActionLoading(registryId);
    try {
      const res = await fetch('/api/admin/registry/featured', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registry_id: registryId, featured }),
      });

      if (res.ok) {
        // Refresh data
        await fetchData();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to update');
      }
    } catch {
      setError('Failed to update featured status');
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-white/50" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Featured Agents</h1>
          <p className="text-white/60 mt-1">
            Manage which agents appear in the featured section of the directory
          </p>
        </div>
        <Button variant="outline" onClick={fetchData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Currently Featured */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-400" />
            Currently Featured ({featuredAgents.length})
          </CardTitle>
          <CardDescription>
            Agents currently shown in the featured section
          </CardDescription>
        </CardHeader>
        <CardContent>
          {featuredAgents.length === 0 ? (
            <p className="text-white/50 text-center py-8">No agents currently featured</p>
          ) : (
            <div className="space-y-3">
              {featuredAgents.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  onAction={() => toggleFeatured(agent.id, false)}
                  actionLabel="Unfeature"
                  actionIcon={<StarOff className="h-4 w-4" />}
                  loading={actionLoading === agent.id}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Candidates */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-400" />
                Featured Candidates ({candidates.length})
              </CardTitle>
              <CardDescription>
                Top agents eligible for featuring based on trust score and verifications
              </CardDescription>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-end gap-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="minTrust" className="text-sm">Min Trust Score</Label>
              <Input
                id="minTrust"
                type="number"
                value={minTrustScore}
                onChange={(e) => setMinTrustScore(e.target.value)}
                className="w-24"
                min={0}
                max={100}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minVerif" className="text-sm">Min Verifications</Label>
              <Input
                id="minVerif"
                type="number"
                value={minVerifications}
                onChange={(e) => setMinVerifications(e.target.value)}
                className="w-24"
                min={0}
              />
            </div>
            <Button variant="secondary" onClick={fetchData}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {candidates.length === 0 ? (
            <p className="text-white/50 text-center py-8">
              No candidates match the criteria
            </p>
          ) : (
            <div className="space-y-3">
              {candidates.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  onAction={() => toggleFeatured(agent.id, true)}
                  actionLabel="Feature"
                  actionIcon={<Star className="h-4 w-4" />}
                  loading={actionLoading === agent.id}
                  showScore
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AgentCard({
  agent,
  onAction,
  actionLabel,
  actionIcon,
  loading,
  showScore,
}: {
  agent: FeaturedAgent;
  onAction: () => void;
  actionLabel: string;
  actionIcon: React.ReactNode;
  loading: boolean;
  showScore?: boolean;
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
          <Users className="h-5 w-5 text-white/60" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-white">{agent.display_name}</span>
            {agent.is_verified && (
              <Badge variant="secondary" className="text-xs">
                <Shield className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            )}
            {agent.category && (
              <Badge variant="outline" className="text-xs">{agent.category}</Badge>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm text-white/50 mt-1">
            <span>Trust: {agent.reputation?.trust_score || 0}</span>
            <span>Verifications: {agent.reputation?.verification_count || 0}</span>
            {showScore && agent.composite_score && (
              <span className="text-emerald-400">Score: {agent.composite_score}</span>
            )}
          </div>
        </div>
      </div>
      <Button
        variant={actionLabel === 'Feature' ? 'default' : 'outline'}
        size="sm"
        onClick={onAction}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            {actionIcon}
            <span className="ml-2">{actionLabel}</span>
          </>
        )}
      </Button>
    </div>
  );
}
