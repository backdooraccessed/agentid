import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { StatCard } from '@/components/shared/stat-card';
import {
  CheckCircle,
  XCircle,
  Activity,
  TrendingUp,
  Clock,
  Globe,
  Shield,
  AlertTriangle,
  ArrowUpRight,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function VerificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get issuer
  const { data: issuer } = await supabase
    .from('issuers')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!issuer) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="border-4 border-black bg-white">
          <div className="bg-gray-50 border-b-4 border-black px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 border-2 border-gray-300 flex items-center justify-center">
                <Activity className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <h2 className="font-retro font-bold uppercase">Complete Your Setup</h2>
                <p className="text-xs font-retro text-gray-500">
                  Create your issuer profile to view verification insights
                </p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <a
              href="/settings"
              className="inline-flex items-center gap-2 font-retro text-black hover:text-gray-600 transition-colors underline underline-offset-2"
            >
              Create Issuer Profile
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Fetch verification data
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [
    recentVerificationsResult,
    verificationStatsResult,
    credentialStatsResult,
    dailyStatsResult,
  ] = await Promise.all([
    // Recent verifications
    supabase
      .from('verification_events')
      .select('*')
      .eq('issuer_id', issuer.id)
      .order('verified_at', { ascending: false })
      .limit(50),

    // Verification stats (30 days)
    supabase
      .from('verification_events')
      .select('success, agent_id')
      .eq('issuer_id', issuer.id)
      .gte('verified_at', thirtyDaysAgo.toISOString()),

    // Credentials with verification counts
    supabase
      .from('credentials')
      .select('id, agent_id, agent_name, status')
      .eq('issuer_id', issuer.id),

    // Daily analytics
    supabase
      .from('issuer_analytics')
      .select('*')
      .eq('issuer_id', issuer.id)
      .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
      .order('date', { ascending: true }),
  ]);

  const recentVerifications = recentVerificationsResult.data || [];
  const verificationStats = verificationStatsResult.data || [];
  const credentials = credentialStatsResult.data || [];
  const dailyStats = dailyStatsResult.data || [];

  // Calculate metrics
  const totalVerifications = verificationStats.length;
  const successfulVerifications = verificationStats.filter(v => v.success).length;
  const failedVerifications = totalVerifications - successfulVerifications;
  const successRate = totalVerifications > 0
    ? ((successfulVerifications / totalVerifications) * 100).toFixed(1)
    : '100.0';

  // Get unique agents verified
  const uniqueAgents = new Set(verificationStats.map(v => v.agent_id)).size;

  // Get verifications by agent
  const verificationsByAgent = verificationStats.reduce((acc, v) => {
    acc[v.agent_id] = (acc[v.agent_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Sort agents by verification count
  const topAgents = Object.entries(verificationsByAgent)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  // Calculate 7-day trend
  const last7DaysStats = dailyStats.filter(d => new Date(d.date) >= sevenDaysAgo);
  const previous7DaysStats = dailyStats.filter(d => {
    const date = new Date(d.date);
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    return date >= fourteenDaysAgo && date < sevenDaysAgo;
  });

  const thisWeekVerifications = last7DaysStats.reduce((sum, d) => sum + (d.verifications_total || 0), 0);
  const lastWeekVerifications = previous7DaysStats.reduce((sum, d) => sum + (d.verifications_total || 0), 0);
  const weekOverWeekChange = lastWeekVerifications > 0
    ? Math.round(((thisWeekVerifications - lastWeekVerifications) / lastWeekVerifications) * 100)
    : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 bg-gray-100 border-4 border-black flex items-center justify-center">
          <Activity className="h-7 w-7 text-gray-600" />
        </div>
        <div>
          <h1 className="font-pixel text-3xl uppercase">Verification Insights</h1>
          <p className="font-retro text-gray-600">
            Track where and how your agents are being verified
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Verifications"
          value={totalVerifications}
          icon={Activity}
          description="Last 30 days"
          trend={weekOverWeekChange !== 0 ? { value: Math.abs(weekOverWeekChange), isPositive: weekOverWeekChange > 0 } : undefined}
        />
        <StatCard
          title="Success Rate"
          value={`${successRate}%`}
          icon={CheckCircle}
          description={`${successfulVerifications} successful`}
        />
        <StatCard
          title="Failed Verifications"
          value={failedVerifications}
          icon={XCircle}
          description="Requires attention"
        />
        <StatCard
          title="Unique Agents"
          value={uniqueAgents}
          icon={Shield}
          description="Verified in period"
        />
      </div>

      {/* Top Verified Agents & Failure Analysis */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Top Verified Agents */}
        <div className="border-4 border-black bg-white">
          <div className="bg-gray-50 border-b-4 border-black p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-100 border-2 border-gray-300 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-gray-600" />
              </div>
              <div>
                <h3 className="font-retro font-bold text-black uppercase">Most Verified Agents</h3>
                <p className="font-retro text-xs text-gray-500">Agents with highest verification volume</p>
              </div>
            </div>
          </div>
          <div className="p-4">
            {topAgents.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-gray-100 border-2 border-gray-300 flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-6 w-6 text-gray-400" />
                </div>
                <p className="font-retro text-gray-500">No verifications yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {topAgents.map(([agentId, count], index) => {
                  const credential = credentials.find(c => c.agent_id === agentId);
                  return (
                    <div
                      key={agentId}
                      className="flex items-center justify-between p-3 border-2 border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 bg-black text-white flex items-center justify-center text-xs font-pixel">
                          {index + 1}
                        </span>
                        <div>
                          <div className="font-retro font-bold text-sm text-black">
                            {credential?.agent_name || agentId}
                          </div>
                          <div className="text-xs font-mono text-gray-500">
                            {agentId}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-pixel text-lg text-black">{count}</div>
                        <div className="text-xs font-retro text-gray-500">verifications</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Failure Analysis */}
        <div className="border-4 border-black bg-white">
          <div className="bg-gray-50 border-b-4 border-black p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-amber-100 border-2 border-amber-300 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <h3 className="font-retro font-bold text-black uppercase">Failed Verifications</h3>
                <p className="font-retro text-xs text-gray-500">Recent verification failures</p>
              </div>
            </div>
          </div>
          <div className="p-4">
            {failedVerifications === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-emerald-100 border-2 border-emerald-300 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-6 w-6 text-emerald-600" />
                </div>
                <p className="font-retro text-gray-500">No failures in period</p>
                <p className="text-sm font-retro text-gray-400 mt-1">All verifications successful</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentVerifications
                  .filter(v => !v.success)
                  .slice(0, 5)
                  .map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center justify-between p-3 border-2 border-red-300 bg-red-50"
                    >
                      <div className="flex items-center gap-3">
                        <XCircle className="h-4 w-4 text-red-600" />
                        <div>
                          <div className="font-retro font-bold text-sm text-black">{v.agent_id}</div>
                          <div className="text-xs font-retro text-gray-600">
                            {v.failure_reason || 'Unknown reason'}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs font-retro text-gray-500">
                        {new Date(v.verified_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Verification Feed */}
      <div className="border-4 border-black bg-white">
        <div className="bg-gray-50 border-b-4 border-black p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-100 border-2 border-gray-300 flex items-center justify-center">
              <Clock className="h-4 w-4 text-gray-600" />
            </div>
            <div>
              <h3 className="font-retro font-bold text-black uppercase">Real-Time Verification Feed</h3>
              <p className="font-retro text-xs text-gray-500">Live stream of verification requests</p>
            </div>
          </div>
        </div>
        <div className="p-4">
          {recentVerifications.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-gray-100 border-2 border-gray-300 flex items-center justify-center mx-auto mb-4">
                <Globe className="h-6 w-6 text-gray-400" />
              </div>
              <p className="font-retro text-gray-500">No verifications recorded yet</p>
              <p className="text-sm font-retro text-gray-400 mt-1">
                Verifications will appear here when services verify your credentials
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {recentVerifications.map((v) => {
                const credential = credentials.find(c => c.agent_id === v.agent_id);
                return (
                  <div
                    key={v.id}
                    className="flex items-center justify-between p-3 border-2 border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {v.success ? (
                        <div className="w-8 h-8 bg-emerald-100 border-2 border-emerald-300 flex items-center justify-center">
                          <CheckCircle className="h-4 w-4 text-emerald-600" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 bg-red-100 border-2 border-red-300 flex items-center justify-center">
                          <XCircle className="h-4 w-4 text-red-600" />
                        </div>
                      )}
                      <div>
                        <div className="font-retro font-bold text-sm text-black">
                          {credential?.agent_name || v.agent_id}
                        </div>
                        <div className="text-xs font-mono text-gray-500">
                          {v.agent_id}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`inline-flex items-center px-2 py-0.5 text-xs font-retro font-bold uppercase border-2 ${
                        v.success
                          ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                          : 'bg-red-100 text-red-700 border-red-300'
                      }`}>
                        {v.success ? 'Valid' : 'Failed'}
                      </span>
                      <div className="text-right">
                        <div className="text-xs font-retro text-gray-500">
                          {new Date(v.verified_at).toLocaleString()}
                        </div>
                        {v.verification_time_ms && (
                          <div className="text-xs font-retro text-gray-400">
                            {v.verification_time_ms}ms
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Performance Insights */}
      <div className="border-4 border-black bg-white">
        <div className="bg-gray-50 border-b-4 border-black p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-100 border-2 border-gray-300 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-gray-600" />
            </div>
            <div>
              <h3 className="font-retro font-bold text-black uppercase">Performance Summary</h3>
              <p className="font-retro text-xs text-gray-500">Key insights from your verification data</p>
            </div>
          </div>
        </div>
        <div className="p-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 border-2 border-gray-200 bg-gray-50">
              <div className="text-sm font-retro text-gray-500 uppercase">Avg. Response Time</div>
              <div className="font-pixel text-2xl text-black mt-1">
                {recentVerifications.length > 0
                  ? `${Math.round(
                      recentVerifications
                        .filter(v => v.verification_time_ms)
                        .reduce((sum, v) => sum + (v.verification_time_ms || 0), 0) /
                        recentVerifications.filter(v => v.verification_time_ms).length || 1
                    )}ms`
                  : '-'}
              </div>
            </div>
            <div className="p-4 border-2 border-gray-200 bg-gray-50">
              <div className="text-sm font-retro text-gray-500 uppercase">This Week vs Last</div>
              <div className="font-pixel text-2xl text-black mt-1">
                {weekOverWeekChange > 0 ? '+' : ''}{weekOverWeekChange}%
              </div>
            </div>
            <div className="p-4 border-2 border-gray-200 bg-gray-50">
              <div className="text-sm font-retro text-gray-500 uppercase">Active Credentials</div>
              <div className="font-pixel text-2xl text-black mt-1">
                {credentials.filter(c => c.status === 'active').length}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
