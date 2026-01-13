import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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
    : '0.0';

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
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Credentials</CardDescription>
            <CardTitle className="text-3xl">{totalCredentials}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Credentials</CardDescription>
            <CardTitle className="text-3xl text-green-600">{activeCredentials}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Verifications</CardDescription>
            <CardTitle className="text-3xl">{totals.verifications_total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Success Rate</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{successRate}%</CardTitle>
          </CardHeader>
        </Card>
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
                <span className="font-semibold text-green-600">+{totals.credentials_issued}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Revoked</span>
                <span className="font-semibold text-red-600">-{totals.credentials_revoked}</span>
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
                <span className="font-semibold text-green-600">{totals.verifications_successful}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Failed</span>
                <span className="font-semibold text-red-600">{totals.verifications_failed}</span>
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
            <p className="text-muted-foreground text-center py-4">
              No verifications recorded yet
            </p>
          ) : (
            <div className="space-y-2">
              {recentVerifications.map((v) => (
                <div
                  key={v.id}
                  className="flex justify-between items-center py-2 border-b last:border-0"
                >
                  <div>
                    <span className="font-mono text-sm">{v.agent_id}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        v.success
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
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

      {/* Daily Breakdown */}
      {dailyAnalytics && dailyAnalytics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Daily Activity</CardTitle>
            <CardDescription>Verification activity by day</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {[...dailyAnalytics].reverse().map((day) => (
                <div
                  key={day.date}
                  className="flex justify-between items-center py-2 border-b last:border-0"
                >
                  <span className="text-sm">{new Date(day.date).toLocaleDateString()}</span>
                  <div className="flex gap-4 text-sm">
                    <span className="text-green-600">
                      {day.verifications_successful} verified
                    </span>
                    {day.verifications_failed > 0 && (
                      <span className="text-red-600">
                        {day.verifications_failed} failed
                      </span>
                    )}
                    {day.credentials_issued > 0 && (
                      <span className="text-blue-600">
                        +{day.credentials_issued} issued
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
