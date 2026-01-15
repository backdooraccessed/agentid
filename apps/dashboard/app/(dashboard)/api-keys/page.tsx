import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ApiKeysClient } from './api-keys-client';
import { Key, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

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
        <div className="border-4 border-black bg-white">
          <div className="bg-gray-50 border-b-4 border-black px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 border-2 border-gray-300 flex items-center justify-center">
                <Key className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <h2 className="font-retro font-bold uppercase">Complete Your Setup</h2>
                <p className="text-xs font-retro text-gray-500">
                  Create your issuer profile to manage API keys
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

  // Fetch API keys
  const { data: keys } = await supabase
    .from('api_keys')
    .select('id, name, description, key_prefix, scopes, is_active, last_used_at, usage_count, expires_at, created_at')
    .eq('issuer_id', issuer.id)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 bg-gray-100 border-4 border-black flex items-center justify-center">
          <Key className="h-7 w-7 text-gray-600" />
        </div>
        <div>
          <h1 className="font-pixel text-3xl uppercase">API Keys</h1>
          <p className="font-retro text-gray-600">
            Manage API keys for programmatic access to the AgentID API
          </p>
        </div>
      </div>

      <ApiKeysClient initialKeys={keys || []} />
    </div>
  );
}
