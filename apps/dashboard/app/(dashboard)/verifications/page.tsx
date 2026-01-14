import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
        <Card>
          <CardHeader>
            <CardTitle>Complete Your Setup</CardTitle>
            <CardDescription>
              Create your issuer profile to view verification insights
            </CardDescription>
          </CardHeader>
          <CardContent>
            <a href="/settings" className="text-primary hover:underline">
              Create Issuer Profile
            </a>
          </CardContent>
        </Card>
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
      <div>
        <h1 className="text-3xl font-bold">Verification Insights</h1>
        <p className="text-muted-foreground">
          Track where and how your agents are being verified
        </p>
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Most Verified Agents
            </CardTitle>
            <CardDescription>Agents with highest verification volume</CardDescription>
          </CardHeader>
          <CardContent>
            {topAgents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No verifications yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topAgents.map(([agentId, count], index) => {
                  const credential = credentials.find(c => c.agent_id === agentId);
                  return (
                    <div
                      key={agentId}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                          {index + 1}
                        </span>
                        <div>
                          <div className="font-medium text-sm">
                            {credential?.agent_name || agentId}
                          </div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {agentId}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{count}</div>
                        <div className="text-xs text-muted-foreground">verifications</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Failure Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Failed Verifications
            </CardTitle>
            <CardDescription>Recent verification failures</CardDescription>
          </CardHeader>
          <CardContent>
            {failedVerifications === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">No failures in period</p>
                <p className="text-sm text-muted-foreground mt-1">All verifications successful</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentVerifications
                  .filter(v => !v.success)
                  .slice(0, 5)
                  .map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-950/20"
                    >
                      <div className="flex items-center gap-3">
                        <XCircle className="h-4 w-4 text-red-600" />
                        <div>
                          <div className="font-medium text-sm">{v.agent_id}</div>
                          <div className="text-xs text-muted-foreground">
                            {v.failure_reason || 'Unknown reason'}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(v.verified_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Verification Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Real-Time Verification Feed
          </CardTitle>
          <CardDescription>Live stream of verification requests</CardDescription>
        </CardHeader>
        <CardContent>
          {recentVerifications.length === 0 ? (
            <div className="text-center py-12">
              <Globe className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">No verifications recorded yet</p>
              <p className="text-sm text-muted-foreground mt-1">
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
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {v.success ? (
                        <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                          <XCircle className="h-4 w-4 text-red-600" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-sm">
                          {credential?.agent_name || v.agent_id}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {v.agent_id}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant={v.success ? 'success' : 'destructive'}>
                        {v.success ? 'Valid' : 'Failed'}
                      </Badge>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">
                          {new Date(v.verified_at).toLocaleString()}
                        </div>
                        {v.verification_time_ms && (
                          <div className="text-xs text-muted-foreground">
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
        </CardContent>
      </Card>

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
          <CardDescription>Key insights from your verification data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="text-sm text-muted-foreground">Avg. Response Time</div>
              <div className="text-2xl font-bold mt-1">
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
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="text-sm text-muted-foreground">This Week vs Last</div>
              <div className="text-2xl font-bold mt-1">
                {weekOverWeekChange > 0 ? '+' : ''}{weekOverWeekChange}%
              </div>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="text-sm text-muted-foreground">Active Credentials</div>
              <div className="text-2xl font-bold mt-1">
                {credentials.filter(c => c.status === 'active').length}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
