'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const routeLabels: Record<string, string> = {
  '': 'Dashboard',
  'credentials': 'Credentials',
  'new': 'Issue New',
  'templates': 'Templates',
  'api-keys': 'API Keys',
  'webhooks': 'Webhooks',
  'analytics': 'Analytics',
  'audit-logs': 'Audit Logs',
  'settings': 'Settings',
  'team': 'Team',
  'directory': 'Directory',
};

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  // Don't show breadcrumbs on dashboard home
  if (segments.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        Home
      </div>
    );
  }

  const breadcrumbs = segments.map((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/');
    const isLast = index === segments.length - 1;

    // Check if this is a UUID (credential ID, etc.)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment);
    const label = isUuid
      ? segment.slice(0, 8) + '...'
      : routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);

    return {
      href,
      label,
      isLast,
    };
  });

  return (
    <nav className="text-sm flex items-center gap-2">
      <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
        Home
      </Link>
      {breadcrumbs.map((crumb, index) => (
        <span key={crumb.href} className="flex items-center gap-2">
          <span className="text-muted-foreground">/</span>
          {crumb.isLast ? (
            <span className="text-foreground font-medium">{crumb.label}</span>
          ) : (
            <Link
              href={crumb.href}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
