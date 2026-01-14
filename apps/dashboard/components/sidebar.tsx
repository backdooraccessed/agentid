'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BookOpen,
  Shield,
  PlusCircle,
  FileStack,
  Key,
  Webhook,
  BarChart3,
  ScrollText,
  Users,
  Settings,
  Globe,
  LogOut,
  Activity,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

interface NavGroup {
  section: string;
  items: NavItem[];
}

const navItems: NavGroup[] = [
  {
    section: 'Overview',
    items: [
      { href: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
      { href: '/guide', label: 'User Guide', icon: BookOpen },
    ],
  },
  {
    section: 'Credentials',
    items: [
      { href: '/credentials', label: 'All Credentials', icon: Shield },
      { href: '/credentials/new', label: 'Issue New', icon: PlusCircle, exact: true },
      { href: '/templates', label: 'Templates', icon: FileStack },
    ],
  },
  {
    section: 'Insights',
    items: [
      { href: '/verifications', label: 'Verifications', icon: Activity },
      { href: '/analytics', label: 'Analytics', icon: BarChart3 },
      { href: '/audit-logs', label: 'Audit Logs', icon: ScrollText },
    ],
  },
  {
    section: 'Developer',
    items: [
      { href: '/api-keys', label: 'API Keys', icon: Key },
      { href: '/webhooks', label: 'Webhooks', icon: Webhook },
    ],
  },
  {
    section: 'Organization',
    items: [
      { href: '/team', label: 'Team', icon: Users },
      { href: '/settings', label: 'Settings', icon: Settings },
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
    <aside className="w-64 bg-muted/30 border-r flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b">
        <Link href="/" className="text-xl font-bold flex items-center gap-3">
          <span className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center text-primary-foreground text-sm font-bold shadow-sm">
            A
          </span>
          <span>AgentID</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-6 overflow-y-auto">
        {navItems.map((group) => (
          <div key={group.section}>
            <div className="text-xs font-semibold text-muted-foreground px-3 py-2 uppercase tracking-wider">
              {group.section}
            </div>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href, item.exact);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all',
                      active
                        ? 'bg-primary text-primary-foreground font-medium shadow-sm'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t space-y-1">
        <Link
          href="/directory"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <Globe className="h-4 w-4" />
          <span>Public Directory</span>
        </Link>
        <form action="/api/auth/signout" method="post">
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign out</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
