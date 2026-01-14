import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { StatCard } from '@/components/shared/stat-card';
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
  Activity
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
        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              {expiringCredentials} credential{expiringCredentials > 1 ? 's' : ''} expiring within 7 days
            </span>
            <Link href="/credentials?status=expiring" className="text-yellow-700 hover:underline font-medium">
              Review now
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/credentials">
          <StatCard
            title="Active Credentials"
            value={activeCredentials}
            icon={Shield}
            description={`${credentials.length} total`}
          />
        </Link>
        <Link href="/analytics">
          <StatCard
            title="Verifications (30d)"
            value={verifications.length}
            icon={Activity}
            description={`${verificationRate}% success rate`}
            trend={verifications.length > 0 ? { value: verificationRate, isPositive: verificationRate >= 90 } : undefined}
          />
        </Link>
        <Link href="/webhooks">
          <StatCard
            title="Active Webhooks"
            value={webhooks.filter(w => w.is_active).length}
            icon={Webhook}
            description={`${webhooks.length} configured`}
          />
        </Link>
        <Link href="/api-keys">
          <StatCard
            title="API Keys"
            value={apiKeys.filter(k => k.is_active).length}
            icon={Key}
            description={`${apiKeys.length} total`}
          />
        </Link>
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/credentials/new" className="block group">
              <div className="p-3 rounded-lg border hover:border-primary hover:bg-primary/5 transition-all flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Plus className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm">Issue New Credential</div>
                  <p className="text-xs text-muted-foreground">
                    Create a credential for an AI agent
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
            <Link href="/templates" className="block group">
              <div className="p-3 rounded-lg border hover:border-primary hover:bg-primary/5 transition-all flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm">Manage Templates</div>
                  <p className="text-xs text-muted-foreground">
                    Create reusable credential templates
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
            <Link href="/api-keys" className="block group">
              <div className="p-3 rounded-lg border hover:border-primary hover:bg-primary/5 transition-all flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Key className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm">Create API Key</div>
                  <p className="text-xs text-muted-foreground">
                    Generate keys for programmatic access
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
            <Link href="/analytics" className="block group">
              <div className="p-3 rounded-lg border hover:border-primary hover:bg-primary/5 transition-all flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm">View Analytics</div>
                  <p className="text-xs text-muted-foreground">
                    Detailed usage metrics and statistics
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Recent Activity
            </CardTitle>
            <CardDescription>Last 7 days of activity</CardDescription>
          </CardHeader>
          <CardContent>
            {recentAnalytics.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">No activity recorded yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Activity will appear here as you use AgentID
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentAnalytics.slice(0, 5).map((day) => (
                  <div key={day.date} className="flex justify-between items-center p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <span className="text-sm font-medium">
                      {new Date(day.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                    <div className="flex gap-2">
                      {day.verifications_total > 0 && (
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                          {day.verifications_total} verifications
                        </span>
                      )}
                      {day.credentials_issued > 0 && (
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          +{day.credentials_issued} issued
                        </span>
                      )}
                      {day.credentials_revoked > 0 && (
                        <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                          -{day.credentials_revoked} revoked
                        </span>
                      )}
                      {day.verifications_total === 0 && day.credentials_issued === 0 && day.credentials_revoked === 0 && (
                        <span className="px-2 py-1 text-xs rounded-full bg-muted text-muted-foreground">No activity</span>
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
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Getting Started
            </CardTitle>
            <CardDescription>
              Complete these steps to start using AgentID
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <span className="line-through text-muted-foreground">Create issuer profile</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm">
                  2
                </div>
                <div className="flex-1">
                  <Link href="/credentials/new" className="font-medium hover:text-primary transition-colors flex items-center gap-2">
                    Issue your first credential
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <p className="text-xs text-muted-foreground mt-0.5">Create a credential for an AI agent</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center font-semibold text-sm">
                  3
                </div>
                <div className="flex-1">
                  <span className="text-muted-foreground">Set up webhooks for notifications</span>
                  <p className="text-xs text-muted-foreground mt-0.5">Get notified when credentials are verified</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center font-semibold text-sm">
                  4
                </div>
                <div className="flex-1">
                  <span className="text-muted-foreground">Create API keys for integration</span>
                  <p className="text-xs text-muted-foreground mt-0.5">Programmatically manage credentials</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
