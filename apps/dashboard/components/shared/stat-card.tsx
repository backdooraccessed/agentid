import { Card, CardContent } from '@/components/ui/card';
import { type LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  variant?: 'default' | 'indigo' | 'emerald' | 'amber';
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
  variant = 'default',
}: StatCardProps) {
  const variantStyles = {
    default: {
      icon: 'bg-indigo-100 dark:bg-indigo-900/30',
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      glow: '',
    },
    indigo: {
      icon: 'bg-indigo-100 dark:bg-indigo-900/30',
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      glow: 'hover:shadow-indigo-500/10',
    },
    emerald: {
      icon: 'bg-emerald-100 dark:bg-emerald-900/30',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      glow: 'hover:shadow-emerald-500/10',
    },
    amber: {
      icon: 'bg-amber-100 dark:bg-amber-900/30',
      iconColor: 'text-amber-600 dark:text-amber-400',
      glow: 'hover:shadow-amber-500/10',
    },
  };

  const styles = variantStyles[variant];

  return (
    <Card
      className={cn(
        'relative overflow-hidden transition-all duration-300',
        'hover:shadow-lg hover:-translate-y-0.5',
        styles.glow,
        className
      )}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold tracking-tight">{value}</p>
              {trend && (
                <span
                  className={cn(
                    'inline-flex items-center text-xs font-medium px-1.5 py-0.5 rounded',
                    trend.isPositive
                      ? 'text-emerald-700 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30'
                      : 'text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/30'
                  )}
                >
                  {trend.isPositive ? (
                    <TrendingUp className="h-3 w-3 mr-0.5" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-0.5" />
                  )}
                  {trend.value}%
                </span>
              )}
            </div>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          {Icon && (
            <div className={cn('rounded-xl p-3', styles.icon)}>
              <Icon className={cn('h-5 w-5', styles.iconColor)} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
