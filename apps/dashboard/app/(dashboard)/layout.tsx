import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

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
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-muted/50 border-r p-4 flex flex-col">
        <div className="mb-8">
          <Link href="/credentials" className="text-xl font-bold">
            AgentID
          </Link>
        </div>

        <nav className="space-y-1 flex-1">
          <div className="text-xs font-semibold text-muted-foreground px-3 py-2 uppercase tracking-wider">
            Credentials
          </div>
          <Link
            href="/credentials"
            className="block px-3 py-2 rounded-md hover:bg-accent transition-colors"
          >
            All Credentials
          </Link>
          <Link
            href="/credentials/new"
            className="block px-3 py-2 rounded-md hover:bg-accent transition-colors"
          >
            Issue New
          </Link>
          <Link
            href="/templates"
            className="block px-3 py-2 rounded-md hover:bg-accent transition-colors"
          >
            Templates
          </Link>

          <div className="text-xs font-semibold text-muted-foreground px-3 py-2 pt-4 uppercase tracking-wider">
            Developer
          </div>
          <Link
            href="/api-keys"
            className="block px-3 py-2 rounded-md hover:bg-accent transition-colors"
          >
            API Keys
          </Link>
          <Link
            href="/webhooks"
            className="block px-3 py-2 rounded-md hover:bg-accent transition-colors"
          >
            Webhooks
          </Link>
          <Link
            href="/analytics"
            className="block px-3 py-2 rounded-md hover:bg-accent transition-colors"
          >
            Analytics
          </Link>

          <div className="text-xs font-semibold text-muted-foreground px-3 py-2 pt-4 uppercase tracking-wider">
            Account
          </div>
          <Link
            href="/settings"
            className="block px-3 py-2 rounded-md hover:bg-accent transition-colors"
          >
            Settings
          </Link>
        </nav>

        <div className="pt-4 border-t">
          <form action="/api/auth/signout" method="post">
            <button
              type="submit"
              className="w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors text-muted-foreground"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
