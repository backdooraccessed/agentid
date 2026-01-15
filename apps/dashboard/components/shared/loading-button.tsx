'use client';

import { forwardRef } from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingButtonProps extends ButtonProps {
  loading?: boolean;
  loadingText?: string;
}

const LoadingButton = forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ children, loading, loadingText, disabled, className, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        disabled={disabled || loading}
        className={cn('press-scale relative', className)}
        {...props}
      >
        {loading && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        <span className={cn(loading && !loadingText && 'opacity-0')}>
          {children}
        </span>
        {loading && !loadingText && (
          <span className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin" />
          </span>
        )}
        {loading && loadingText && loadingText}
      </Button>
    );
  }
);

LoadingButton.displayName = 'LoadingButton';

export { LoadingButton };
