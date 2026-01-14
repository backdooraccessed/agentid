import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/shared/stat-card';
import { VerificationChart } from '@/components/analytics/verification-chart';
import { StatusChart } from '@/components/analytics/status-chart';
import { BarChart3, Shield, CheckCircle, XCircle, TrendingUp, Activity, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check if user has an issuer profile
  const { data: issuer } = await supabase
    .from('issuers')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!issuer) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="overflow-hidden">
          <CardHeader className="bg-white/[0.02] border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-white/70" />
              </div>
              <div>
                <CardTitle>Complete Your Setup</CardTitle>
                <CardDescription>
                  Create your issuer profile to view analytics
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <a
              href="/settings"
              className="inline-flex items-center gap-2 text-white hover:text-white/80 transition-colors"
            >
              Create Issuer Profile
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch analytics for last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: dailyAnalytics } = await supabase
    .from('issuer_analytics')
    .select('*')
    .eq('issuer_id', issuer.id)
    .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
    .order('date', { ascending: true });

  // Calculate totals
  const totals = (dailyAnalytics || []).reduce(
    (acc, day) => ({
      credentials_issued: acc.credentials_issued + (day.credentials_issued || 0),
      credentials_revoked: acc.credentials_revoked + (day.credentials_revoked || 0),
      verifications_total: acc.verifications_total + (day.verifications_total || 0),
      verifications_successful: acc.verifications_successful + (day.verifications_successful || 0),
      verifications_failed: acc.verifications_failed + (day.verifications_failed || 0),
    }),
    {
      credentials_issued: 0,
      credentials_revoked: 0,
      verifications_total: 0,
      verifications_successful: 0,
      verifications_failed: 0,
    }
  );

  // Get current stats
  const { data: currentStats } = await supabase
    .from('credentials')
    .select('status')
    .eq('issuer_id', issuer.id);

  const activeCredentials = (currentStats || []).filter(c => c.status === 'active').length;
  const expiredCredentials = (currentStats || []).filter(c => c.status === 'expired').length;
  const revokedCredentials = (currentStats || []).filter(c => c.status === 'revoked').length;
  const totalCredentials = (currentStats || []).length;

  // Get recent verifications
  const { data: recentVerifications } = await supabase
    .from('verification_events')
    .select('id, agent_id, success, verified_at')
    .eq('issuer_id', issuer.id)
    .order('verified_at', { ascending: false })
    .limit(10);

  const successRate = totals.verifications_total > 0
    ? (totals.verifications_successful / totals.verifications_total * 100).toFixed(1)
    : '100.0';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
          <BarChart3 className="h-7 w-7 text-white/70" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Usage metrics and statistics for the last 30 days
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Credentials"
          value={totalCredentials}
          icon={Shield}
          description="All time"
        />
        <StatCard
          title="Active Credentials"
          value={activeCredentials}
          icon={CheckCircle}
          trend={totals.credentials_issued > 0 ? { value: totals.credentials_issued, isPositive: true } : undefined}
        />
        <StatCard
          title="Total Verifications"
          value={totals.verifications_total}
          icon={Activity}
          description="Last 30 days"
        />
        <StatCard
          title="Success Rate"
          value={`${successRate}%`}
          icon={TrendingUp}
          description="Verification success"
        />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <VerificationChart data={dailyAnalytics || []} />
        </div>
        <StatusChart
          active={activeCredentials}
          expired={expiredCredentials}
          revoked={revokedCredentials}
        />
      </div>

      {/* Period Stats */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="overflow-hidden">
          <CardHeader className="bg-white/[0.02] border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                <Shield className="h-4 w-4 text-white/70" />
              </div>
              <CardTitle className="text-base">Credentials (30 days)</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Issued</span>
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-400">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  +{totals.credentials_issued}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Revoked</span>
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-red-400">
                  <ArrowDownRight className="h-3.5 w-3.5" />
                  -{totals.credentials_revoked}
                </span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-white/5">
                <span className="text-muted-foreground">Net Change</span>
                <span className="font-semibold">
                  {totals.credentials_issued - totals.credentials_revoked >= 0 ? '+' : ''}
                  {totals.credentials_issued - totals.credentials_revoked}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="bg-white/[0.02] border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                <Activity className="h-4 w-4 text-white/70" />
              </div>
              <CardTitle className="text-base">Verifications (30 days)</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Successful</span>
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-400">
                  <CheckCircle className="h-3.5 w-3.5" />
                  {totals.verifications_successful}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Failed</span>
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-red-400">
                  <XCircle className="h-3.5 w-3.5" />
                  {totals.verifications_failed}
                </span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-white/5">
                <span className="text-muted-foreground">Total</span>
                <span className="font-semibold">{totals.verifications_total}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Verifications */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-white/[0.02] border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
              <Activity className="h-4 w-4 text-white/70" />
            </div>
            <div>
              <CardTitle className="text-base">Recent Verifications</CardTitle>
              <CardDescription>Last 10 verification requests</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {(!recentVerifications || recentVerifications.length === 0) ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
                <Activity className="h-6 w-6 text-white/30" />
              </div>
              <p className="text-muted-foreground">No verifications recorded yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Verifications will appear here when your credentials are verified
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentVerifications.map((v) => (
                <div
                  key={v.id}
                  className="flex justify-between items-center py-3 px-4 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      v.success ? 'bg-emerald-500/10' : 'bg-red-500/10'
                    }`}>
                      {v.success ? (
                        <CheckCircle className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-400" />
                      )}
                    </div>
                    <span className="font-mono text-sm">{v.agent_id}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      v.success
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-red-500/10 text-red-400'
                    }`}>
                      {v.success ? 'Valid' : 'Invalid'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(v.verified_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
