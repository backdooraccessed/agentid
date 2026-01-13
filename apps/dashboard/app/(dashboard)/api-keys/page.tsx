import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ApiKeysClient } from './api-keys-client';

export const dynamic = 'force-dynamic';

export default async function ApiKeysPage() {
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
              Create your issuer profile to manage API keys
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

  // Fetch API keys
  const { data: keys } = await supabase
    .from('api_keys')
    .select('id, name, description, key_prefix, scopes, is_active, last_used_at, usage_count, expires_at, created_at')
    .eq('issuer_id', issuer.id)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">API Keys</h1>
        <p className="text-muted-foreground">
          Manage API keys for programmatic access to the AgentID API
        </p>
      </div>

      <ApiKeysClient initialKeys={keys || []} />
    </div>
  );
}
