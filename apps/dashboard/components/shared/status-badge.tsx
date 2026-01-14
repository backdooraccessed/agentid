import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type CredentialStatus = 'active' | 'expired' | 'revoked' | 'pending';

interface StatusBadgeProps {
  status: CredentialStatus;
  showIcon?: boolean;
  className?: string;
}

const statusConfig: Record<CredentialStatus, {
  label: string;
  variant: 'success' | 'warning' | 'destructive' | 'secondary';
  icon: typeof CheckCircle;
}> = {
  active: {
    label: 'Active',
    variant: 'success',
    icon: CheckCircle,
  },
  expired: {
    label: 'Expired',
    variant: 'warning',
    icon: Clock,
  },
  revoked: {
    label: 'Revoked',
    variant: 'destructive',
    icon: XCircle,
  },
  pending: {
    label: 'Pending',
    variant: 'secondary',
    icon: AlertCircle,
  },
};

export function StatusBadge({ status, showIcon = true, className }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={cn('gap-1', className)}>
      {showIcon && <Icon className="h-3 w-3" />}
      {config.label}
    </Badge>
  );
}
