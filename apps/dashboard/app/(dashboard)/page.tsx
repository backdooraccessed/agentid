import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

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
        <div>
          <h1 className="text-3xl font-bold">Welcome to AgentID</h1>
          <p className="text-muted-foreground">
            Get started by creating your issuer profile
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create Your Issuer Profile</CardTitle>
            <CardDescription>
              Before you can issue credentials to AI agents, you need to set up your issuer profile.
              This establishes your identity and generates your cryptographic signing keys.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/settings">
              <Button>Create Issuer Profile</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>What is AgentID?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              AgentID enables organizations to issue verifiable credentials to their AI agents,
              allowing services to verify agent identity, permissions, and trustworthiness.
            </p>
            <div className="grid md:grid-cols-3 gap-4 pt-2">
              <div className="space-y-1">
                <div className="font-medium text-foreground">Issue Credentials</div>
                <p>Create cryptographically signed credentials for your AI agents</p>
              </div>
              <div className="space-y-1">
                <div className="font-medium text-foreground">Verify Identity</div>
                <p>Allow services to verify your agents via simple API</p>
              </div>
              <div className="space-y-1">
                <div className="font-medium text-foreground">Build Trust</div>
                <p>Establish reputation through verification history</p>
              </div>
            </div>
          </CardContent>
        </Card>
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
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {issuer.name}
            {issuer.is_verified && (
              <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                Verified
              </span>
            )}
          </p>
        </div>
        <Link href="/credentials/new">
          <Button>Issue Credential</Button>
        </Link>
      </div>

      {/* Alert for expiring credentials */}
      {expiringCredentials > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <span className="text-yellow-600 font-medium">
              {expiringCredentials} credential{expiringCredentials > 1 ? 's' : ''} expiring soon
            </span>
            <Link href="/credentials?status=expiring" className="text-yellow-700 underline text-sm">
              View
            </Link>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Credentials</CardDescription>
            <CardTitle className="text-3xl">{activeCredentials}</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/credentials" className="text-xs text-primary hover:underline">
              View all
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Verifications (30d)</CardDescription>
            <CardTitle className="text-3xl">{verifications.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-xs text-muted-foreground">
              {verificationRate}% success rate
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Webhooks</CardDescription>
            <CardTitle className="text-3xl">
              {webhooks.filter(w => w.is_active).length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/webhooks" className="text-xs text-primary hover:underline">
              Manage
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>API Keys</CardDescription>
            <CardTitle className="text-3xl">
              {apiKeys.filter(k => k.is_active).length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/api-keys" className="text-xs text-primary hover:underline">
              Manage
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/credentials/new" className="block">
              <div className="p-3 rounded-md border hover:bg-accent transition-colors">
                <div className="font-medium text-sm">Issue New Credential</div>
                <p className="text-xs text-muted-foreground">
                  Create a credential for an AI agent
                </p>
              </div>
            </Link>
            <Link href="/templates" className="block">
              <div className="p-3 rounded-md border hover:bg-accent transition-colors">
                <div className="font-medium text-sm">Manage Templates</div>
                <p className="text-xs text-muted-foreground">
                  Create reusable credential templates
                </p>
              </div>
            </Link>
            <Link href="/api-keys" className="block">
              <div className="p-3 rounded-md border hover:bg-accent transition-colors">
                <div className="font-medium text-sm">Create API Key</div>
                <p className="text-xs text-muted-foreground">
                  Generate keys for programmatic access
                </p>
              </div>
            </Link>
            <Link href="/analytics" className="block">
              <div className="p-3 rounded-md border hover:bg-accent transition-colors">
                <div className="font-medium text-sm">View Analytics</div>
                <p className="text-xs text-muted-foreground">
                  Detailed usage metrics and statistics
                </p>
              </div>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity (7 days)</CardTitle>
          </CardHeader>
          <CardContent>
            {recentAnalytics.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">
                No activity recorded yet
              </p>
            ) : (
              <div className="space-y-3">
                {recentAnalytics.slice(0, 5).map((day) => (
                  <div key={day.date} className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">
                      {new Date(day.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                    <div className="flex gap-3 text-xs">
                      {day.verifications_total > 0 && (
                        <span className="text-blue-600">
                          {day.verifications_total} verifications
                        </span>
                      )}
                      {day.credentials_issued > 0 && (
                        <span className="text-green-600">
                          +{day.credentials_issued} issued
                        </span>
                      )}
                      {day.credentials_revoked > 0 && (
                        <span className="text-red-600">
                          -{day.credentials_revoked} revoked
                        </span>
                      )}
                      {day.verifications_total === 0 && day.credentials_issued === 0 && day.credentials_revoked === 0 && (
                        <span className="text-muted-foreground">No activity</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Getting Started Guide for new issuers */}
      {credentials.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Getting Started</CardTitle>
            <CardDescription>
              Complete these steps to start using AgentID
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">
                  1
                </div>
                <span className="line-through text-muted-foreground">Create issuer profile</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">
                  2
                </div>
                <Link href="/credentials/new" className="hover:underline">
                  Issue your first credential
                </Link>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs">
                  3
                </div>
                <span className="text-muted-foreground">Set up webhooks for notifications</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs">
                  4
                </div>
                <span className="text-muted-foreground">Create API keys for integration</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
