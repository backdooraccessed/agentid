'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BookOpen,
  Shield,
  PlusCircle,
  FileStack,
  FileKey,
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
  Bell,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Store,
  Package,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
      { href: '/guide', label: 'Getting Started', icon: BookOpen },
    ],
  },
  {
    section: 'Credentials',
    items: [
      { href: '/credentials', label: 'All Credentials', icon: Shield },
      { href: '/credentials/new', label: 'Issue New', icon: PlusCircle, exact: true },
      { href: '/templates', label: 'Templates', icon: FileStack },
      { href: '/policies', label: 'Policies', icon: FileKey },
    ],
  },
  {
    section: 'Agent Connections',
    items: [
      { href: '/conversations', label: 'Conversations', icon: MessageSquare },
      { href: '/authorizations', label: 'Access Requests', icon: ShieldCheck },
    ],
  },
  {
    section: 'Insights',
    items: [
      { href: '/verifications', label: 'Verifications', icon: Activity },
      { href: '/analytics', label: 'Analytics', icon: BarChart3 },
      { href: '/alerts', label: 'Alerts', icon: Bell },
      { href: '/audit-logs', label: 'Audit Logs', icon: ScrollText },
    ],
  },
  {
    section: 'Marketplace',
    items: [
      { href: '/marketplace', label: 'Browse Apps', icon: Store },
      { href: '/apps', label: 'My Apps', icon: Package },
      { href: '/apps/new', label: 'Submit App', icon: PlusCircle },
    ],
  },
  {
    section: 'Discover',
    items: [
      { href: '/directory', label: 'Agent Directory', icon: Globe },
      { href: '/directory/featured', label: 'Featured Agents', icon: Sparkles },
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
    <aside className="w-64 bg-white border-r-4 border-black flex flex-col relative z-10">
      {/* Logo */}
      <div className="p-4 border-b-4 border-black">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 bg-black flex items-center justify-center block-shadow-sm group-hover:animate-block-wiggle">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="font-retro text-lg font-bold uppercase tracking-tight text-black">AgentID</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-6 overflow-y-auto scrollbar-hide">
        {navItems.map((group) => (
          <div key={group.section}>
            <div className="font-retro text-[10px] font-bold text-gray-400 px-3 py-2 uppercase tracking-widest">
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
                      'group relative flex items-center gap-3 px-3 py-2.5 text-sm font-retro transition-all duration-200',
                      active
                        ? 'bg-black text-white font-medium border-l-4 border-black'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-black border-l-4 border-transparent hover:border-gray-300'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-4 w-4 shrink-0 transition-colors',
                        active
                          ? 'text-white'
                          : 'text-gray-500 group-hover:text-black'
                      )}
                    />
                    <span className="flex-1 uppercase text-xs">{item.label}</span>
                    {item.badge && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 bg-black text-white">
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
      <div className="p-3 border-t-4 border-black">
        <form action="/api/auth/signout" method="post">
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-3 py-2 text-sm font-retro text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all border-l-4 border-transparent hover:border-red-500"
          >
            <LogOut className="h-4 w-4" />
            <span className="uppercase text-xs">Sign out</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
