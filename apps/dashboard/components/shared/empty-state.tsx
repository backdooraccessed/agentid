'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LucideIcon, Plus } from 'lucide-react';
import Link from 'next/link';

type IllustrationType =
  | 'credentials'
  | 'webhooks'
  | 'templates'
  | 'team'
  | 'api-keys'
  | 'audit-logs'
  | 'activity'
  | 'search'
  | 'conversations'
  | 'policies'
  | 'verifications'
  | 'generic';

interface EmptyStateProps {
  illustration?: IllustrationType;
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

// Inline SVG illustrations for empty states
function CredentialsIllustration() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="20" y="30" width="80" height="50" rx="8" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2" />
      <rect x="28" y="38" width="24" height="4" rx="2" fill="currentColor" fillOpacity="0.15" />
      <rect x="28" y="46" width="40" height="3" rx="1.5" fill="currentColor" fillOpacity="0.1" />
      <rect x="28" y="53" width="32" height="3" rx="1.5" fill="currentColor" fillOpacity="0.1" />
      <circle cx="84" cy="55" r="12" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2" />
      <path d="M80 55L83 58L88 52" stroke="currentColor" strokeWidth="2" strokeOpacity="0.3" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="30" y="65" width="20" height="6" rx="3" fill="currentColor" fillOpacity="0.1" />
      <rect x="54" y="65" width="16" height="6" rx="3" fill="currentColor" fillOpacity="0.1" />
      <path d="M60 90L60 100M50 95H70" stroke="currentColor" strokeWidth="2" strokeOpacity="0.15" strokeLinecap="round" />
    </svg>
  );
}

function WebhooksIllustration() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="35" cy="60" r="15" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2" />
      <circle cx="35" cy="60" r="6" fill="currentColor" fillOpacity="0.15" />
      <circle cx="85" cy="40" r="12" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2" />
      <circle cx="85" cy="40" r="4" fill="currentColor" fillOpacity="0.15" />
      <circle cx="85" cy="80" r="12" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2" />
      <circle cx="85" cy="80" r="4" fill="currentColor" fillOpacity="0.15" />
      <path d="M50 55L70 42" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2" strokeLinecap="round" />
      <path d="M50 65L70 78" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2" strokeLinecap="round" />
      <path d="M65 42L73 40L71 48" stroke="currentColor" strokeWidth="2" strokeOpacity="0.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M65 78L73 80L71 72" stroke="currentColor" strokeWidth="2" strokeOpacity="0.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TemplatesIllustration() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="25" y="25" width="50" height="65" rx="6" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2" />
      <rect x="33" y="35" width="20" height="4" rx="2" fill="currentColor" fillOpacity="0.15" />
      <rect x="33" y="43" width="34" height="3" rx="1.5" fill="currentColor" fillOpacity="0.1" />
      <rect x="33" y="50" width="28" height="3" rx="1.5" fill="currentColor" fillOpacity="0.1" />
      <rect x="33" y="57" width="32" height="3" rx="1.5" fill="currentColor" fillOpacity="0.1" />
      <rect x="33" y="68" width="14" height="6" rx="3" fill="currentColor" fillOpacity="0.1" />
      <rect x="51" y="68" width="14" height="6" rx="3" fill="currentColor" fillOpacity="0.1" />
      <rect x="45" y="35" width="50" height="65" rx="6" stroke="currentColor" strokeWidth="2" strokeOpacity="0.15" fill="currentColor" fillOpacity="0.02" />
      <rect x="53" y="45" width="20" height="4" rx="2" fill="currentColor" fillOpacity="0.1" />
      <rect x="53" y="53" width="34" height="3" rx="1.5" fill="currentColor" fillOpacity="0.07" />
      <rect x="53" y="60" width="28" height="3" rx="1.5" fill="currentColor" fillOpacity="0.07" />
    </svg>
  );
}

function TeamIllustration() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="45" r="15" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2" />
      <circle cx="60" cy="42" r="6" fill="currentColor" fillOpacity="0.15" />
      <path d="M60 51C56 51 53 54 53 58" stroke="currentColor" strokeWidth="2" strokeOpacity="0.15" strokeLinecap="round" />
      <path d="M60 51C64 51 67 54 67 58" stroke="currentColor" strokeWidth="2" strokeOpacity="0.15" strokeLinecap="round" />
      <path d="M40 85C40 72 49 65 60 65C71 65 80 72 80 85" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2" strokeLinecap="round" />
      <circle cx="30" cy="55" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.15" />
      <circle cx="30" cy="53" r="4" fill="currentColor" fillOpacity="0.1" />
      <circle cx="90" cy="55" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.15" />
      <circle cx="90" cy="53" r="4" fill="currentColor" fillOpacity="0.1" />
      <path d="M25 80C25 72 27 68 30 68C33 68 35 72 35 80" stroke="currentColor" strokeWidth="2" strokeOpacity="0.15" strokeLinecap="round" />
      <path d="M85 80C85 72 87 68 90 68C93 68 95 72 95 80" stroke="currentColor" strokeWidth="2" strokeOpacity="0.15" strokeLinecap="round" />
    </svg>
  );
}

function ApiKeysIllustration() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="45" cy="60" r="20" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2" />
      <circle cx="45" cy="60" r="8" stroke="currentColor" strokeWidth="2" strokeOpacity="0.15" />
      <circle cx="45" cy="60" r="3" fill="currentColor" fillOpacity="0.2" />
      <path d="M62 60H95" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2" strokeLinecap="round" />
      <path d="M75 60V70" stroke="currentColor" strokeWidth="2" strokeOpacity="0.15" strokeLinecap="round" />
      <path d="M85 60V66" stroke="currentColor" strokeWidth="2" strokeOpacity="0.15" strokeLinecap="round" />
      <rect x="90" y="55" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2" />
    </svg>
  );
}

function AuditLogsIllustration() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="30" y="25" width="60" height="70" rx="6" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2" />
      <rect x="38" y="35" width="44" height="8" rx="4" fill="currentColor" fillOpacity="0.1" />
      <circle cx="43" cy="39" r="2" fill="currentColor" fillOpacity="0.2" />
      <rect x="50" y="37" width="28" height="4" rx="2" fill="currentColor" fillOpacity="0.15" />
      <rect x="38" y="49" width="44" height="8" rx="4" fill="currentColor" fillOpacity="0.08" />
      <circle cx="43" cy="53" r="2" fill="currentColor" fillOpacity="0.15" />
      <rect x="50" y="51" width="24" height="4" rx="2" fill="currentColor" fillOpacity="0.1" />
      <rect x="38" y="63" width="44" height="8" rx="4" fill="currentColor" fillOpacity="0.06" />
      <circle cx="43" cy="67" r="2" fill="currentColor" fillOpacity="0.1" />
      <rect x="50" y="65" width="20" height="4" rx="2" fill="currentColor" fillOpacity="0.08" />
      <rect x="38" y="77" width="44" height="8" rx="4" fill="currentColor" fillOpacity="0.04" />
      <circle cx="43" cy="81" r="2" fill="currentColor" fillOpacity="0.08" />
      <rect x="50" y="79" width="26" height="4" rx="2" fill="currentColor" fillOpacity="0.06" />
    </svg>
  );
}

function ActivityIllustration() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 75L35 60L50 70L65 45L80 55L100 35" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="35" cy="60" r="4" fill="currentColor" fillOpacity="0.15" />
      <circle cx="50" cy="70" r="4" fill="currentColor" fillOpacity="0.15" />
      <circle cx="65" cy="45" r="4" fill="currentColor" fillOpacity="0.15" />
      <circle cx="80" cy="55" r="4" fill="currentColor" fillOpacity="0.15" />
      <circle cx="100" cy="35" r="4" fill="currentColor" fillOpacity="0.2" />
      <path d="M20 90H100" stroke="currentColor" strokeWidth="2" strokeOpacity="0.1" strokeLinecap="round" />
      <path d="M20 30V90" stroke="currentColor" strokeWidth="2" strokeOpacity="0.1" strokeLinecap="round" />
    </svg>
  );
}

function SearchIllustration() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="55" cy="55" r="25" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2" />
      <circle cx="55" cy="55" r="15" stroke="currentColor" strokeWidth="2" strokeOpacity="0.1" />
      <path d="M75 75L90 90" stroke="currentColor" strokeWidth="3" strokeOpacity="0.2" strokeLinecap="round" />
      <path d="M45 50L50 55L45 60" stroke="currentColor" strokeWidth="2" strokeOpacity="0.15" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M65 50L60 55L65 60" stroke="currentColor" strokeWidth="2" strokeOpacity="0.15" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function GenericIllustration() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="30" y="35" width="60" height="50" rx="8" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2" />
      <path d="M30 55H90" stroke="currentColor" strokeWidth="2" strokeOpacity="0.1" />
      <rect x="40" y="43" width="20" height="4" rx="2" fill="currentColor" fillOpacity="0.15" />
      <rect x="40" y="65" width="40" height="4" rx="2" fill="currentColor" fillOpacity="0.1" />
      <rect x="40" y="73" width="30" height="4" rx="2" fill="currentColor" fillOpacity="0.08" />
      <circle cx="60" cy="95" r="3" fill="currentColor" fillOpacity="0.1" />
      <circle cx="50" cy="95" r="2" fill="currentColor" fillOpacity="0.08" />
      <circle cx="70" cy="95" r="2" fill="currentColor" fillOpacity="0.08" />
    </svg>
  );
}

function ConversationsIllustration() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="20" y="30" width="50" height="35" rx="8" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2" />
      <rect x="28" y="40" width="30" height="4" rx="2" fill="currentColor" fillOpacity="0.15" />
      <rect x="28" y="48" width="24" height="3" rx="1.5" fill="currentColor" fillOpacity="0.1" />
      <path d="M25 65L35 70L25 75" fill="currentColor" fillOpacity="0.1" />
      <rect x="50" y="55" width="50" height="35" rx="8" stroke="currentColor" strokeWidth="2" strokeOpacity="0.15" />
      <rect x="58" y="65" width="30" height="4" rx="2" fill="currentColor" fillOpacity="0.1" />
      <rect x="58" y="73" width="20" height="3" rx="1.5" fill="currentColor" fillOpacity="0.08" />
      <path d="M95 90L85 85L95 80" fill="currentColor" fillOpacity="0.08" />
    </svg>
  );
}

function PoliciesIllustration() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M60 25L90 40V60C90 80 75 95 60 100C45 95 30 80 30 60V40L60 25Z" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2" />
      <path d="M60 35L80 45V60C80 75 70 85 60 88C50 85 40 75 40 60V45L60 35Z" stroke="currentColor" strokeWidth="2" strokeOpacity="0.1" />
      <path d="M50 60L57 67L72 52" stroke="currentColor" strokeWidth="3" strokeOpacity="0.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function VerificationsIllustration() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="30" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2" />
      <circle cx="60" cy="60" r="20" stroke="currentColor" strokeWidth="2" strokeOpacity="0.1" />
      <path d="M50 60L57 67L72 52" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M60 25V35" stroke="currentColor" strokeWidth="2" strokeOpacity="0.15" strokeLinecap="round" />
      <path d="M60 85V95" stroke="currentColor" strokeWidth="2" strokeOpacity="0.15" strokeLinecap="round" />
      <path d="M25 60H35" stroke="currentColor" strokeWidth="2" strokeOpacity="0.15" strokeLinecap="round" />
      <path d="M85 60H95" stroke="currentColor" strokeWidth="2" strokeOpacity="0.15" strokeLinecap="round" />
    </svg>
  );
}

const illustrations: Record<IllustrationType, React.FC> = {
  credentials: CredentialsIllustration,
  webhooks: WebhooksIllustration,
  templates: TemplatesIllustration,
  team: TeamIllustration,
  'api-keys': ApiKeysIllustration,
  'audit-logs': AuditLogsIllustration,
  activity: ActivityIllustration,
  search: SearchIllustration,
  conversations: ConversationsIllustration,
  policies: PoliciesIllustration,
  verifications: VerificationsIllustration,
  generic: GenericIllustration,
};

export function EmptyState({
  illustration = 'generic',
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className,
}: EmptyStateProps) {
  const Illustration = illustrations[illustration];

  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-4 animate-fade-in', className)}>
      <div className="text-white/40 mb-6 animate-scale-in">
        <Illustration />
      </div>

      {Icon && (
        <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 animate-bounce-in">
          <Icon className="h-6 w-6 text-white/30" />
        </div>
      )}

      <h3 className="text-lg font-medium text-white mb-2 animate-slide-in-up">{title}</h3>

      {description && (
        <p className="text-sm text-white/50 text-center max-w-sm mb-6 animate-slide-in-up delay-100">{description}</p>
      )}

      {(actionLabel && (actionHref || onAction)) && (
        <div className="animate-slide-in-up delay-200">
          {actionHref ? (
            <Link href={actionHref}>
              <Button className="gap-2 press-scale">
                <Plus className="h-4 w-4" />
                {actionLabel}
              </Button>
            </Link>
          ) : (
            <Button onClick={onAction} className="gap-2 press-scale">
              <Plus className="h-4 w-4" />
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
