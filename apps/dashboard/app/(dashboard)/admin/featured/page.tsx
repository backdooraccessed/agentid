'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
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
        <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-pixel text-3xl text-black uppercase">Featured Agents</h1>
          <p className="font-retro text-gray-600 mt-1">
            Manage which agents appear in the featured section of the directory
          </p>
        </div>
        <Button
          onClick={fetchData}
          className="bg-black text-white hover:bg-gray-800 font-retro uppercase border-4 border-black"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="border-4 border-red-600 bg-red-50 p-4">
          <p className="font-retro text-red-600">{error}</p>
        </div>
      )}

      {/* Currently Featured */}
      <div className="border-4 border-black bg-white p-6" style={{ boxShadow: '4px 4px 0px 0px #000' }}>
        <div className="mb-4">
          <h2 className="font-pixel text-xl text-black uppercase flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Currently Featured ({featuredAgents.length})
          </h2>
          <p className="font-retro text-gray-600 mt-1">
            Agents currently shown in the featured section
          </p>
        </div>
        <div>
          {featuredAgents.length === 0 ? (
            <p className="font-retro text-gray-600 text-center py-8">No agents currently featured</p>
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
        </div>
      </div>

      {/* Candidates */}
      <div className="border-4 border-black bg-white p-6" style={{ boxShadow: '4px 4px 0px 0px #000' }}>
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-pixel text-xl text-black uppercase flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
                Featured Candidates ({candidates.length})
              </h2>
              <p className="font-retro text-gray-600 mt-1">
                Top agents eligible for featuring based on trust score and verifications
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-end gap-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="minTrust" className="font-retro text-sm text-black">Min Trust Score</Label>
              <Input
                id="minTrust"
                type="number"
                value={minTrustScore}
                onChange={(e) => setMinTrustScore(e.target.value)}
                className="w-24 border-2 border-black font-retro"
                min={0}
                max={100}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minVerif" className="font-retro text-sm text-black">Min Verifications</Label>
              <Input
                id="minVerif"
                type="number"
                value={minVerifications}
                onChange={(e) => setMinVerifications(e.target.value)}
                className="w-24 border-2 border-black font-retro"
                min={0}
              />
            </div>
            <Button
              onClick={fetchData}
              className="bg-gray-100 text-black hover:bg-gray-200 font-retro uppercase border-2 border-black"
            >
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </div>
        <div>
          {candidates.length === 0 ? (
            <p className="font-retro text-gray-600 text-center py-8">
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
        </div>
      </div>
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
    <div className="flex items-center justify-between p-4 bg-gray-50 border-2 border-black">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-gray-100 border-2 border-black flex items-center justify-center">
          <Users className="h-5 w-5 text-gray-600" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-retro font-medium text-black">{agent.display_name}</span>
            {agent.is_verified && (
              <Badge className="text-xs bg-black text-white font-retro uppercase border-0">
                <Shield className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            )}
            {agent.category && (
              <Badge className="text-xs bg-gray-100 text-black font-retro uppercase border-2 border-black">{agent.category}</Badge>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm font-retro text-gray-600 mt-1">
            <span>Trust: {agent.reputation?.trust_score || 0}</span>
            <span>Verifications: {agent.reputation?.verification_count || 0}</span>
            {showScore && agent.composite_score && (
              <span className="text-emerald-600 font-medium">Score: {agent.composite_score}</span>
            )}
          </div>
        </div>
      </div>
      <Button
        size="sm"
        onClick={onAction}
        disabled={loading}
        className={
          actionLabel === 'Feature'
            ? 'bg-black text-white hover:bg-gray-800 font-retro uppercase border-2 border-black'
            : 'bg-white text-black hover:bg-gray-100 font-retro uppercase border-2 border-black'
        }
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
