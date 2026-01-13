import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CREDENTIAL_STATUS_LABELS, AGENT_TYPE_LABELS } from '@agentid/shared';
import type { Credential, CredentialStatus, AgentType } from '@agentid/shared';

export default async function CredentialsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check if user has an issuer profile
  const { data: issuer } = await supabase
    .from('issuers')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!issuer) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Complete Your Setup</CardTitle>
            <CardDescription>
              Create your issuer profile to start issuing credentials
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/settings">
              <Button>Create Issuer Profile</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch credentials
  const { data: credentials } = await supabase
    .from('credentials')
    .select('*')
    .eq('issuer_id', issuer.id)
    .order('created_at', { ascending: false });

  const typedCredentials = (credentials || []) as Credential[];

  // Stats
  const totalCredentials = typedCredentials.length;
  const activeCredentials = typedCredentials.filter(c => c.status === 'active').length;
  const revokedCredentials = typedCredentials.filter(c => c.status === 'revoked').length;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Credentials</h1>
          <p className="text-muted-foreground">
            Manage credentials for your AI agents
          </p>
        </div>
        <Link href="/credentials/new">
          <Button>Issue New Credential</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total</CardDescription>
            <CardTitle className="text-3xl">{totalCredentials}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active</CardDescription>
            <CardTitle className="text-3xl text-green-600">{activeCredentials}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Revoked</CardDescription>
            <CardTitle className="text-3xl text-red-600">{revokedCredentials}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Credentials List */}
      {typedCredentials.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No credentials issued yet. Create your first credential to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {typedCredentials.map((credential) => (
            <Link key={credential.id} href={`/credentials/${credential.id}`}>
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{credential.agent_name}</CardTitle>
                      <CardDescription className="font-mono text-xs">
                        {credential.agent_id}
                      </CardDescription>
                    </div>
                    <StatusBadge status={credential.status as CredentialStatus} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>Type: {AGENT_TYPE_LABELS[credential.agent_type as AgentType]}</span>
                    <span>
                      Valid until: {new Date(credential.valid_until).toLocaleDateString()}
                    </span>
                    <span>
                      Created: {new Date(credential.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: CredentialStatus }) {
  const colors = {
    active: 'bg-green-100 text-green-800',
    revoked: 'bg-red-100 text-red-800',
    expired: 'bg-yellow-100 text-yellow-800',
    suspended: 'bg-orange-100 text-orange-800',
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status]}`}>
      {CREDENTIAL_STATUS_LABELS[status]}
    </span>
  );
}
