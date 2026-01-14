'use client';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { LogoIcon } from '@/components/brand/logo';
import { TrustScoreInline } from '@/components/shared/trust-score';
import {
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  Bot,
  Eye,
  Sparkles,
} from 'lucide-react';
import type { CredentialStatus, AgentType } from '@agentid/shared';

interface CredentialCardProps {
  credential: {
    id: string;
    agent_id: string;
    agent_name: string;
    agent_type: AgentType;
    status: CredentialStatus;
    valid_from: string;
    valid_until: string;
    issuer_name: string;
    issuer_verified?: boolean;
    trust_score?: number;
  };
  onClick?: () => void;
  className?: string;
}

const agentTypeIcons: Record<AgentType, typeof Bot> = {
  autonomous: Bot,
  supervised: Eye,
  hybrid: Sparkles,
};

const statusConfig: Record<CredentialStatus, { variant: 'active' | 'revoked' | 'expired' | 'warning'; icon: typeof CheckCircle; label: string }> = {
  active: { variant: 'active', icon: CheckCircle, label: 'Active' },
  revoked: { variant: 'revoked', icon: XCircle, label: 'Revoked' },
  expired: { variant: 'expired', icon: Clock, label: 'Expired' },
  suspended: { variant: 'warning', icon: Clock, label: 'Suspended' },
};

export function CredentialCard({ credential, onClick, className }: CredentialCardProps) {
  const status = statusConfig[credential.status];
  const AgentIcon = agentTypeIcons[credential.agent_type] || Bot;
  const StatusIcon = status.icon;

  const isExpiringSoon = () => {
    const validUntil = new Date(credential.valid_until);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative overflow-hidden rounded-xl border bg-card transition-all duration-300',
        'hover:shadow-lg hover:shadow-indigo-500/10 hover:border-indigo-200 dark:hover:border-indigo-800',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {/* Top accent bar */}
      <div
        className={cn(
          'absolute top-0 left-0 right-0 h-1',
          credential.status === 'active' && 'bg-gradient-to-r from-emerald-500 to-emerald-400',
          credential.status === 'revoked' && 'bg-gradient-to-r from-red-500 to-red-400',
          credential.status === 'expired' && 'bg-gradient-to-r from-amber-500 to-amber-400',
          credential.status === 'suspended' && 'bg-gradient-to-r from-amber-500 to-amber-400'
        )}
      />

      <div className="p-5 pt-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <AgentIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {credential.agent_name}
              </h3>
              <p className="text-xs text-muted-foreground font-mono">
                {credential.agent_id.slice(0, 12)}...
              </p>
            </div>
          </div>
          <Badge variant={status.variant} className="gap-1">
            <StatusIcon className="w-3 h-3" />
            {status.label}
          </Badge>
        </div>

        {/* Details */}
        <div className="space-y-3">
          {/* Issuer */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Issuer</span>
            <div className="flex items-center gap-1.5">
              <span className="font-medium">{credential.issuer_name}</span>
              {credential.issuer_verified && (
                <Shield className="w-3.5 h-3.5 text-indigo-500" />
              )}
            </div>
          </div>

          {/* Trust Score */}
          {credential.trust_score !== undefined && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Trust Score</span>
              <TrustScoreInline score={credential.trust_score} />
            </div>
          )}

          {/* Validity */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Valid Until</span>
            <div className="flex items-center gap-1.5">
              <span className={cn(
                'font-medium',
                isExpiringSoon() && credential.status === 'active' && 'text-amber-600 dark:text-amber-400'
              )}>
                {new Date(credential.valid_until).toLocaleDateString()}
              </span>
              {isExpiringSoon() && credential.status === 'active' && (
                <Clock className="w-3.5 h-3.5 text-amber-500" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 bg-muted/30 border-t flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LogoIcon size="sm" className="w-5 h-5" />
          <span className="text-xs text-muted-foreground">AgentID Credential</span>
        </div>
        <span className="text-xs text-muted-foreground">
          ID: {credential.id.slice(0, 8)}
        </span>
      </div>
    </div>
  );
}

// Compact list item version
export function CredentialListItem({ credential, onClick, className }: CredentialCardProps) {
  const status = statusConfig[credential.status];
  const StatusIcon = status.icon;

  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-center justify-between p-4 rounded-lg border bg-card transition-all',
        'hover:bg-muted/50 hover:border-indigo-200 dark:hover:border-indigo-800',
        onClick && 'cursor-pointer',
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'w-2 h-2 rounded-full',
            credential.status === 'active' && 'bg-emerald-500',
            credential.status === 'revoked' && 'bg-red-500',
            credential.status === 'expired' && 'bg-amber-500',
            credential.status === 'suspended' && 'bg-amber-500'
          )}
        />
        <div>
          <div className="font-medium">{credential.agent_name}</div>
          <div className="text-xs text-muted-foreground font-mono">{credential.agent_id}</div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {credential.trust_score !== undefined && (
          <TrustScoreInline score={credential.trust_score} className="text-sm" />
        )}
        <Badge variant={status.variant} className="gap-1">
          <StatusIcon className="w-3 h-3" />
          {status.label}
        </Badge>
      </div>
    </div>
  );
}
