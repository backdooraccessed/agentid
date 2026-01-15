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
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        'border-4 border-black bg-white p-6 transition-all hover:-translate-y-0.5 block-shadow',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs font-retro font-bold text-gray-500 uppercase">{title}</p>
          <div className="flex items-baseline gap-2">
            <p className="font-pixel text-3xl text-black">{value}</p>
            {trend && (
              <span
                className={cn(
                  'inline-flex items-center text-xs font-retro font-bold px-1.5 py-0.5 border-2',
                  trend.isPositive
                    ? 'text-emerald-700 bg-emerald-100 border-emerald-300'
                    : 'text-red-700 bg-red-100 border-red-300'
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
            <p className="text-xs font-retro text-gray-500">{description}</p>
          )}
        </div>
        {Icon && (
          <div className="w-12 h-12 bg-gray-100 border-2 border-gray-300 flex items-center justify-center">
            <Icon className="h-5 w-5 text-gray-600" />
          </div>
        )}
      </div>
    </div>
  );
}
