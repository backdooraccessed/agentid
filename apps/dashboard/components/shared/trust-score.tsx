'use client';

import { cn } from '@/lib/utils';

interface TrustScoreProps {
  score: number; // 0-100
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function TrustScore({ score, size = 'md', showLabel = true, className }: TrustScoreProps) {
  const normalizedScore = Math.max(0, Math.min(100, score));

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
  };

  const strokeWidths = {
    sm: 4,
    md: 5,
    lg: 6,
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-xl',
  };

  // Calculate stroke properties
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;

  // Determine color based on score
  const getScoreColor = (score: number) => {
    if (score >= 80) return { stroke: '#10B981', bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400' };
    if (score >= 60) return { stroke: '#6366F1', bg: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-600 dark:text-indigo-400' };
    if (score >= 40) return { stroke: '#F59E0B', bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400' };
    return { stroke: '#EF4444', bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-600 dark:text-red-400' };
  };

  const colors = getScoreColor(normalizedScore);

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Low';
  };

  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      <div className={cn('relative', sizeClasses[size])}>
        {/* Background circle */}
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidths[size]}
            className="text-muted/20"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={colors.stroke}
            strokeWidth={strokeWidths[size]}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        {/* Score text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn('font-bold', textSizes[size], colors.text)}>
            {normalizedScore}
          </span>
        </div>
      </div>
      {showLabel && (
        <span className={cn('text-xs font-medium', colors.text)}>
          {getScoreLabel(normalizedScore)}
        </span>
      )}
    </div>
  );
}

// Compact inline version
export function TrustScoreInline({ score, className }: { score: number; className?: string }) {
  const normalizedScore = Math.max(0, Math.min(100, score));

  const getColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 60) return 'text-indigo-600 dark:text-indigo-400';
    if (score >= 40) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <span className={cn('inline-flex items-center gap-1 font-medium', getColor(normalizedScore), className)}>
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
      </svg>
      {normalizedScore}
    </span>
  );
}
