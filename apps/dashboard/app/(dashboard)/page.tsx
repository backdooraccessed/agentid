import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/shared/stat-card';
import { LogoIcon } from '@/components/brand/logo';
import {
  Shield,
  CheckCircle,
  Webhook,
  Key,
  Plus,
  FileText,
  BarChart3,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Zap,
  Activity,
  ShieldCheck,
  BookOpen,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check if user has an issuer profile
  const { data: issuer } = await supabase
    .from('issuers')
    .select('id, name, is_verified')
    .eq('user_id', user.id)
    .single();

  if (!issuer) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Welcome Header */}
        <div className="text-center space-y-4 py-8">
          <div className="flex justify-center">
            <LogoIcon size="xl" className="animate-float" />
          </div>
          <h1 className="font-pixel text-3xl uppercase">
            Welcome to AgentID
          </h1>
          <p className="font-retro text-gray-600 max-w-md mx-auto">
            Get started by creating your issuer profile to begin issuing verifiable credentials to your AI agents.
          </p>
        </div>

        <div className="border-4 border-black bg-white p-6 block-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-black flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <h2 className="font-retro font-bold uppercase">Create Your Issuer Profile</h2>
          </div>
          <p className="font-retro text-gray-600 text-sm mb-4">
            Before you can issue credentials to AI agents, you need to set up your issuer profile.
            This establishes your identity and generates your cryptographic signing keys.
          </p>
          <Link href="/settings">
            <button className="px-6 py-3 bg-black text-white font-retro font-bold uppercase text-sm btn-retro flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Issuer Profile
            </button>
          </Link>
        </div>

        <div className="border-4 border-black bg-white p-6 block-shadow">
          <h2 className="font-retro font-bold uppercase mb-4">What is AgentID?</h2>
          <p className="font-retro text-gray-600 text-sm mb-4">
            AgentID enables organizations to issue verifiable credentials to their AI agents,
            allowing services to verify agent identity, permissions, and trustworthiness.
          </p>
          <div className="grid md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 border-2 border-black space-y-2">
              <div className="w-10 h-10 bg-black flex items-center justify-center">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div className="font-retro font-bold text-black uppercase text-sm">Issue Credentials</div>
              <p className="font-retro text-xs text-gray-600">Create cryptographically signed credentials for your AI agents</p>
            </div>
            <div className="p-4 border-2 border-black space-y-2">
              <div className="w-10 h-10 bg-black flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <div className="font-retro font-bold text-black uppercase text-sm">Verify Identity</div>
              <p className="font-retro text-xs text-gray-600">Allow services to verify your agents via simple API</p>
            </div>
            <div className="p-4 border-2 border-black space-y-2">
              <div className="w-10 h-10 bg-black flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div className="font-retro font-bold text-black uppercase text-sm">Build Trust</div>
              <p className="font-retro text-xs text-gray-600">Establish reputation through verification history</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fetch stats for authenticated issuer
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [credentialsResult, verificationsResult, analyticsResult, webhooksResult, apiKeysResult] = await Promise.all([
    supabase
      .from('credentials')
      .select('id, status, valid_until')
      .eq('issuer_id', issuer.id),
    supabase
      .from('verification_events')
      .select('id, success')
      .eq('issuer_id', issuer.id)
      .gte('verified_at', thirtyDaysAgo.toISOString()),
    supabase
      .from('issuer_analytics')
      .select('*')
      .eq('issuer_id', issuer.id)
      .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
      .order('date', { ascending: false })
      .limit(7),
    supabase
      .from('webhook_subscriptions')
      .select('id, is_active')
      .eq('issuer_id', issuer.id),
    supabase
      .from('api_keys')
      .select('id, is_active')
      .eq('issuer_id', issuer.id),
  ]);

  const credentials = credentialsResult.data || [];
  const verifications = verificationsResult.data || [];
  const recentAnalytics = analyticsResult.data || [];
  const webhooks = webhooksResult.data || [];
  const apiKeys = apiKeysResult.data || [];

  const activeCredentials = credentials.filter(c => c.status === 'active').length;
  const expiringCredentials = credentials.filter(c => {
    if (c.status !== 'active') return false;
    const expiresAt = new Date(c.valid_until);
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    return expiresAt <= sevenDaysFromNow;
  }).length;

  const successfulVerifications = verifications.filter(v => v.success).length;
  const verificationRate = verifications.length > 0
    ? Math.round((successfulVerifications / verifications.length) * 100)
    : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h1 className="font-pixel text-3xl uppercase">Dashboard</h1>
          <div className="flex items-center gap-2 font-retro text-gray-600">
            <span>Welcome back, {issuer.name}</span>
            {issuer.is_verified && (
              <span className="px-2 py-1 bg-black text-white text-xs font-retro uppercase flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" />
                Verified
              </span>
            )}
          </div>
        </div>
        <Link href="/credentials/new">
          <button className="px-6 py-3 bg-black text-white font-retro font-bold uppercase text-sm btn-retro flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Issue Credential
          </button>
        </Link>
      </div>

      {/* Alert for expiring credentials */}
      {expiringCredentials > 0 && (
        <div className="border-4 border-black bg-yellow-50 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <span className="font-retro text-yellow-800">
              {expiringCredentials} credential{expiringCredentials > 1 ? 's' : ''} expiring within 7 days
            </span>
          </div>
          <Link href="/credentials?status=expiring" className="font-retro text-sm uppercase font-bold text-yellow-800 hover:underline flex items-center gap-1">
            Review now
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/credentials" className="block">
          <div className="border-4 border-black bg-white p-4 block-shadow block-hover">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-black" />
              <span className="font-retro text-xs uppercase text-gray-500">Active Credentials</span>
            </div>
            <div className="font-pixel text-3xl text-black">{activeCredentials}</div>
            <div className="font-retro text-xs text-gray-500">{credentials.length} total</div>
          </div>
        </Link>
        <Link href="/analytics" className="block">
          <div className="border-4 border-black bg-white p-4 block-shadow block-hover">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-black" />
              <span className="font-retro text-xs uppercase text-gray-500">Verifications (30d)</span>
            </div>
            <div className="font-pixel text-3xl text-black">{verifications.length}</div>
            <div className="font-retro text-xs text-gray-500">{verificationRate}% success rate</div>
          </div>
        </Link>
        <Link href="/webhooks" className="block">
          <div className="border-4 border-black bg-white p-4 block-shadow block-hover">
            <div className="flex items-center gap-2 mb-2">
              <Webhook className="h-4 w-4 text-black" />
              <span className="font-retro text-xs uppercase text-gray-500">Active Webhooks</span>
            </div>
            <div className="font-pixel text-3xl text-black">{webhooks.filter(w => w.is_active).length}</div>
            <div className="font-retro text-xs text-gray-500">{webhooks.length} configured</div>
          </div>
        </Link>
        <Link href="/api-keys" className="block">
          <div className="border-4 border-black bg-white p-4 block-shadow block-hover">
            <div className="flex items-center gap-2 mb-2">
              <Key className="h-4 w-4 text-black" />
              <span className="font-retro text-xs uppercase text-gray-500">API Keys</span>
            </div>
            <div className="font-pixel text-3xl text-black">{apiKeys.filter(k => k.is_active).length}</div>
            <div className="font-retro text-xs text-gray-500">{apiKeys.length} total</div>
          </div>
        </Link>
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="border-4 border-black bg-white block-shadow">
          <div className="border-b-4 border-black p-4 bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-black flex items-center justify-center">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <h2 className="font-retro font-bold uppercase">Quick Actions</h2>
            </div>
          </div>
          <div className="p-4 space-y-2">
            <Link href="/credentials/new" className="block group">
              <div className="p-3 border-2 border-black hover:bg-gray-50 transition-all flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 border-2 border-black flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                  <Plus className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="font-retro font-bold text-sm uppercase text-black">Issue New Credential</div>
                  <p className="font-retro text-xs text-gray-500">Create a credential for an AI agent</p>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-black group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
            <Link href="/templates" className="block group">
              <div className="p-3 border-2 border-black hover:bg-gray-50 transition-all flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 border-2 border-black flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="font-retro font-bold text-sm uppercase text-black">Manage Templates</div>
                  <p className="font-retro text-xs text-gray-500">Create reusable credential templates</p>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-black group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
            <Link href="/api-keys" className="block group">
              <div className="p-3 border-2 border-black hover:bg-gray-50 transition-all flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 border-2 border-black flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                  <Key className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="font-retro font-bold text-sm uppercase text-black">Create API Key</div>
                  <p className="font-retro text-xs text-gray-500">Generate keys for programmatic access</p>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-black group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
            <Link href="/analytics" className="block group">
              <div className="p-3 border-2 border-black hover:bg-gray-50 transition-all flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 border-2 border-black flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="font-retro font-bold text-sm uppercase text-black">View Analytics</div>
                  <p className="font-retro text-xs text-gray-500">Detailed usage metrics and statistics</p>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-black group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
            <Link href="/guide" className="block group">
              <div className="p-3 border-2 border-black hover:bg-gray-50 transition-all flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 border-2 border-black flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="font-retro font-bold text-sm uppercase text-black">Getting Started Guide</div>
                  <p className="font-retro text-xs text-gray-500">Learn how to use AgentID</p>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-black group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="border-4 border-black bg-white block-shadow">
          <div className="border-b-4 border-black p-4 bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-black flex items-center justify-center">
                <Activity className="h-4 w-4 text-white" />
              </div>
              <div>
                <h2 className="font-retro font-bold uppercase">Recent Activity</h2>
                <p className="font-retro text-xs text-gray-500">Last 7 days of activity</p>
              </div>
            </div>
          </div>
          <div className="p-4">
            {recentAnalytics.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 border-2 border-black flex items-center justify-center mx-auto mb-4">
                  <Activity className="h-8 w-8 text-gray-400" />
                </div>
                <p className="font-retro text-sm text-black font-bold uppercase">No activity recorded yet</p>
                <p className="font-retro text-xs text-gray-500 mt-1">
                  Activity will appear here as you use AgentID
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentAnalytics.slice(0, 5).map((day) => (
                  <div key={day.date} className="flex justify-between items-center p-3 border-2 border-black hover:bg-gray-50 transition-colors">
                    <span className="font-retro text-sm font-bold text-black">
                      {new Date(day.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                    <div className="flex gap-2">
                      {day.verifications_total > 0 && (
                        <span className="px-2 py-1 text-xs font-retro bg-gray-100 text-black border border-black">
                          {day.verifications_total} verifications
                        </span>
                      )}
                      {day.credentials_issued > 0 && (
                        <span className="px-2 py-1 text-xs font-retro bg-green-100 text-green-800 border border-green-800">
                          +{day.credentials_issued} issued
                        </span>
                      )}
                      {day.credentials_revoked > 0 && (
                        <span className="px-2 py-1 text-xs font-retro bg-red-100 text-red-800 border border-red-800">
                          -{day.credentials_revoked} revoked
                        </span>
                      )}
                      {day.verifications_total === 0 && day.credentials_issued === 0 && day.credentials_revoked === 0 && (
                        <span className="px-2 py-1 text-xs font-retro bg-gray-100 text-gray-500">No activity</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Getting Started Guide for new issuers */}
      {credentials.length === 0 && (
        <div className="border-4 border-black bg-white block-shadow">
          <div className="border-b-4 border-black p-4 bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-black flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <h2 className="font-retro font-bold uppercase">Getting Started</h2>
                <p className="font-retro text-xs text-gray-500">Complete these steps to start using AgentID</p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-green-100 border-2 border-green-800 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-800" />
              </div>
              <div className="flex-1">
                <span className="line-through text-gray-400 font-retro">Create issuer profile</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-black text-white flex items-center justify-center font-pixel text-lg">
                2
              </div>
              <div className="flex-1">
                <Link href="/credentials/new" className="font-retro font-bold uppercase text-black hover:underline flex items-center gap-2">
                  Issue your first credential
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <p className="font-retro text-xs text-gray-500 mt-0.5">Create a credential for an AI agent</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-gray-100 border-2 border-black text-gray-500 flex items-center justify-center font-pixel text-lg">
                3
              </div>
              <div className="flex-1">
                <span className="font-retro text-gray-500">Set up webhooks for notifications</span>
                <p className="font-retro text-xs text-gray-400 mt-0.5">Get notified when credentials are verified</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-gray-100 border-2 border-black text-gray-500 flex items-center justify-center font-pixel text-lg">
                4
              </div>
              <div className="flex-1">
                <span className="font-retro text-gray-500">Create API keys for integration</span>
                <p className="font-retro text-xs text-gray-400 mt-0.5">Programmatically manage credentials</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
