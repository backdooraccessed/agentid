import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/shared/stat-card';
import { VerificationChart } from '@/components/analytics/verification-chart';
import { StatusChart } from '@/components/analytics/status-chart';
import { Shield, CheckCircle, XCircle, TrendingUp } from 'lucide-react';

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
        <Card>
          <CardHeader>
            <CardTitle>Complete Your Setup</CardTitle>
            <CardDescription>
              Create your issuer profile to view analytics
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
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">
          Usage metrics and statistics for the last 30 days
        </p>
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
          icon={TrendingUp}
          description="Last 30 days"
        />
        <StatCard
          title="Success Rate"
          value={`${successRate}%`}
          icon={CheckCircle}
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
        <Card>
          <CardHeader>
            <CardTitle>Credentials (30 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Issued</span>
                <Badge variant="success">+{totals.credentials_issued}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Revoked</span>
                <Badge variant="destructive">-{totals.credentials_revoked}</Badge>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-muted-foreground">Net Change</span>
                <span className="font-semibold">
                  {totals.credentials_issued - totals.credentials_revoked >= 0 ? '+' : ''}
                  {totals.credentials_issued - totals.credentials_revoked}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Verifications (30 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Successful</span>
                <Badge variant="success">{totals.verifications_successful}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Failed</span>
                <Badge variant="destructive">{totals.verifications_failed}</Badge>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-muted-foreground">Total</span>
                <span className="font-semibold">{totals.verifications_total}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Verifications */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Verifications</CardTitle>
          <CardDescription>Last 10 verification requests</CardDescription>
        </CardHeader>
        <CardContent>
          {(!recentVerifications || recentVerifications.length === 0) ? (
            <div className="text-center py-8">
              <XCircle className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
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
                  className="flex justify-between items-center py-3 px-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {v.success ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className="font-mono text-sm">{v.agent_id}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant={v.success ? 'success' : 'destructive'}>
                      {v.success ? 'Valid' : 'Invalid'}
                    </Badge>
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
