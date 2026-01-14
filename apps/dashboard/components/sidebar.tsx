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
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LogoFull } from '@/components/brand/logo';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  badge?: string;
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
    <aside className="w-64 bg-card border-r flex flex-col shadow-sm">
      {/* Logo */}
      <div className="p-4 border-b bg-muted/30">
        <Link href="/" className="block">
          <LogoFull />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-6 overflow-y-auto">
        {navItems.map((group) => (
          <div key={group.section}>
            <div className="text-[10px] font-semibold text-muted-foreground/60 px-3 py-2 uppercase tracking-widest">
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
                      'group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200',
                      active
                        ? 'bg-indigo-50 text-indigo-700 font-medium dark:bg-indigo-950/50 dark:text-indigo-300'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    {/* Active indicator */}
                    <div
                      className={cn(
                        'absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full transition-all duration-200',
                        active
                          ? 'bg-indigo-600 dark:bg-indigo-400'
                          : 'bg-transparent group-hover:bg-muted-foreground/20'
                      )}
                    />
                    <Icon
                      className={cn(
                        'h-4 w-4 shrink-0 transition-colors',
                        active
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : 'text-muted-foreground group-hover:text-foreground'
                      )}
                    />
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                        {item.badge}
                      </span>
                    )}
                    <ChevronRight
                      className={cn(
                        'h-3.5 w-3.5 opacity-0 -translate-x-1 transition-all',
                        active && 'opacity-100 translate-x-0',
                        !active && 'group-hover:opacity-50 group-hover:translate-x-0'
                      )}
                    />
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t bg-muted/20 space-y-1">
        <Link
          href="/directory"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
        >
          <Globe className="h-4 w-4" />
          <span>Public Directory</span>
        </Link>
        <form action="/api/auth/signout" method="post">
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400 transition-all"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign out</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
