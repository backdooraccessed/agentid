'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  {
    section: 'Overview',
    items: [
      { href: '/', label: 'Dashboard', exact: true },
    ],
  },
  {
    section: 'Credentials',
    items: [
      { href: '/credentials', label: 'All Credentials' },
      { href: '/credentials/new', label: 'Issue New', exact: true },
      { href: '/templates', label: 'Templates' },
    ],
  },
  {
    section: 'Developer',
    items: [
      { href: '/api-keys', label: 'API Keys' },
      { href: '/webhooks', label: 'Webhooks' },
      { href: '/analytics', label: 'Analytics' },
      { href: '/audit-logs', label: 'Audit Logs' },
    ],
  },
  {
    section: 'Organization',
    items: [
      { href: '/team', label: 'Team' },
      { href: '/settings', label: 'Settings' },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) => {
    if (exact) {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <aside className="w-64 bg-muted/50 border-r p-4 flex flex-col">
      <div className="mb-6">
        <Link href="/" className="text-xl font-bold flex items-center gap-2">
          <span className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground text-sm font-bold">
            A
          </span>
          AgentID
        </Link>
      </div>

      <nav className="space-y-1 flex-1">
        {navItems.map((group) => (
          <div key={group.section}>
            <div className="text-xs font-semibold text-muted-foreground px-3 py-2 pt-4 uppercase tracking-wider first:pt-0">
              {group.section}
            </div>
            {group.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-3 py-2 rounded-md transition-colors ${
                  isActive(item.href, item.exact)
                    ? 'bg-accent text-accent-foreground font-medium'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      <div className="pt-4 border-t space-y-2">
        <Link
          href="/directory"
          className="block px-3 py-2 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors text-sm"
        >
          Public Directory
        </Link>
        <form action="/api/auth/signout" method="post">
          <button
            type="submit"
            className="w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors text-muted-foreground text-sm"
          >
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
