import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TemplatesClient } from './templates-client';

export const dynamic = 'force-dynamic';

export default async function TemplatesPage() {
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
              Create your issuer profile to manage templates
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

  // Fetch templates
  const { data: templates } = await supabase
    .from('credential_templates')
    .select('*')
    .eq('issuer_id', issuer.id)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Templates</h1>
        <p className="text-muted-foreground">
          Create reusable templates for issuing credentials faster
        </p>
      </div>

      <TemplatesClient initialTemplates={templates || []} />
    </div>
  );
}
