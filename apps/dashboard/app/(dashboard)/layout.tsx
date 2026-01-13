import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Auth check bypassed for demo mode
  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-muted/50 border-r p-4 flex flex-col">
        <div className="mb-8">
          <Link href="/credentials" className="text-xl font-bold">
            AgentID
          </Link>
        </div>

        <nav className="space-y-2 flex-1">
          <Link
            href="/credentials"
            className="block px-3 py-2 rounded-md hover:bg-accent transition-colors"
          >
            Credentials
          </Link>
          <Link
            href="/credentials/new"
            className="block px-3 py-2 rounded-md hover:bg-accent transition-colors"
          >
            Issue New
          </Link>
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
