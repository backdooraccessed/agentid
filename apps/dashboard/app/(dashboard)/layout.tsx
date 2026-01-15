import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/sidebar';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { LightThemeWrapper } from '@/components/theme-wrapper';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Verify user is authenticated
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <LightThemeWrapper>
      <div className="min-h-screen flex bg-white text-black font-retro">
        {/* Dotted Background Pattern */}
        <div className="fixed inset-0 dot-pattern pointer-events-none" />
        <Sidebar />
        <div className="flex-1 flex flex-col relative">
          <header className="border-b-4 border-black px-8 py-3 bg-white">
            <Breadcrumbs />
          </header>
          <main className="flex-1 p-8 bg-white">{children}</main>
        </div>
      </div>
    </LightThemeWrapper>
  );
}
