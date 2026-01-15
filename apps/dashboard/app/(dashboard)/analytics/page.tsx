import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { StatCard } from '@/components/shared/stat-card';
import { VerificationChart } from '@/components/analytics/verification-chart';
import { StatusChart } from '@/components/analytics/status-chart';
import { BarChart3, Shield, CheckCircle, XCircle, TrendingUp, Activity, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import Link from 'next/link';

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
        <div className="border-4 border-black bg-white">
          <div className="bg-gray-50 border-b-4 border-black px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 border-2 border-gray-300 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <h2 className="font-retro font-bold uppercase">Complete Your Setup</h2>
                <p className="text-xs font-retro text-gray-500">
                  Create your issuer profile to view analytics
                </p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <Link
              href="/settings"
              className="inline-flex items-center gap-2 font-retro text-black hover:text-gray-600 transition-colors underline underline-offset-2"
            >
              Create Issuer Profile
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
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
        <div className="w-14 h-14 bg-gray-100 border-4 border-black flex items-center justify-center">
          <BarChart3 className="h-7 w-7 text-gray-600" />
        </div>
        <div>
          <h1 className="font-pixel text-3xl uppercase">Analytics</h1>
          <p className="font-retro text-gray-600">
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
        <div className="border-4 border-black bg-white">
          <div className="bg-gray-50 border-b-4 border-black px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-100 border-2 border-gray-300 flex items-center justify-center">
                <Shield className="h-4 w-4 text-gray-600" />
              </div>
              <h2 className="font-retro font-bold uppercase">Credentials (30 days)</h2>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-retro text-gray-600">Issued</span>
                <span className="inline-flex items-center gap-1.5 text-sm font-retro font-bold text-emerald-600">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  +{totals.credentials_issued}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-retro text-gray-600">Revoked</span>
                <span className="inline-flex items-center gap-1.5 text-sm font-retro font-bold text-red-600">
                  <ArrowDownRight className="h-3.5 w-3.5" />
                  -{totals.credentials_revoked}
                </span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t-2 border-gray-200">
                <span className="font-retro text-gray-600">Net Change</span>
                <span className="font-retro font-bold text-black">
                  {totals.credentials_issued - totals.credentials_revoked >= 0 ? '+' : ''}
                  {totals.credentials_issued - totals.credentials_revoked}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-4 border-black bg-white">
          <div className="bg-gray-50 border-b-4 border-black px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-100 border-2 border-gray-300 flex items-center justify-center">
                <Activity className="h-4 w-4 text-gray-600" />
              </div>
              <h2 className="font-retro font-bold uppercase">Verifications (30 days)</h2>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-retro text-gray-600">Successful</span>
                <span className="inline-flex items-center gap-1.5 text-sm font-retro font-bold text-emerald-600">
                  <CheckCircle className="h-3.5 w-3.5" />
                  {totals.verifications_successful}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-retro text-gray-600">Failed</span>
                <span className="inline-flex items-center gap-1.5 text-sm font-retro font-bold text-red-600">
                  <XCircle className="h-3.5 w-3.5" />
                  {totals.verifications_failed}
                </span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t-2 border-gray-200">
                <span className="font-retro text-gray-600">Total</span>
                <span className="font-retro font-bold text-black">{totals.verifications_total}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Verifications */}
      <div className="border-4 border-black bg-white">
        <div className="bg-gray-50 border-b-4 border-black px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-100 border-2 border-gray-300 flex items-center justify-center">
              <Activity className="h-4 w-4 text-gray-600" />
            </div>
            <div>
              <h2 className="font-retro font-bold uppercase">Recent Verifications</h2>
              <p className="text-xs font-retro text-gray-500">Last 10 verification requests</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          {(!recentVerifications || recentVerifications.length === 0) ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-gray-100 border-4 border-gray-200 flex items-center justify-center mx-auto mb-4">
                <Activity className="h-6 w-6 text-gray-400" />
              </div>
              <p className="font-retro text-gray-600">No verifications recorded yet</p>
              <p className="text-sm font-retro text-gray-500 mt-1">
                Verifications will appear here when your credentials are verified
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentVerifications.map((v) => (
                <div
                  key={v.id}
                  className="flex justify-between items-center py-3 px-4 bg-gray-50 border-2 border-gray-200 hover:border-gray-400 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 border-2 flex items-center justify-center ${
                      v.success ? 'bg-emerald-100 border-emerald-300' : 'bg-red-100 border-red-300'
                    }`}>
                      {v.success ? (
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <span className="font-mono text-sm text-black">{v.agent_id}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-xs font-retro font-bold uppercase px-2 py-1 border-2 ${
                      v.success
                        ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                        : 'bg-red-100 text-red-700 border-red-300'
                    }`}>
                      {v.success ? 'Valid' : 'Invalid'}
                    </span>
                    <span className="text-xs font-retro text-gray-500">
                      {new Date(v.verified_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
