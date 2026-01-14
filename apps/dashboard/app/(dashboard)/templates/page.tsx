import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TemplatesClient } from './templates-client';
import { FileText, ArrowUpRight } from 'lucide-react';

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
        <Card className="overflow-hidden">
          <CardHeader className="bg-white/[0.02] border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-white/70" />
              </div>
              <div>
                <CardTitle>Complete Your Setup</CardTitle>
                <CardDescription>
                  Create your issuer profile to manage templates
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

  // Fetch templates
  const { data: templates } = await supabase
    .from('credential_templates')
    .select('*')
    .eq('issuer_id', issuer.id)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
          <FileText className="h-7 w-7 text-white/70" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Templates</h1>
          <p className="text-muted-foreground">
            Create reusable templates for issuing credentials faster
          </p>
        </div>
      </div>

      <TemplatesClient initialTemplates={templates || []} />
    </div>
  );
}
