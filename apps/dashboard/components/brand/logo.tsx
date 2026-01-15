import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-10 h-10',
  xl: 'w-12 h-12',
};

const textSizeClasses = {
  sm: 'text-base',
  md: 'text-lg',
  lg: 'text-xl',
  xl: 'text-2xl',
};

export function Logo({ size = 'md', showText = true, className }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <LogoIcon size={size} />
      {showText && (
        <span className={cn('font-bold tracking-tight', textSizeClasses[size])}>
          Agent<span className="text-white">ID</span>
        </span>
      )}
    </div>
  );
}

export function LogoIcon({ size = 'md', className }: { size?: 'sm' | 'md' | 'lg' | 'xl'; className?: string }) {
  return (
    <div
      className={cn(
        'relative flex items-center justify-center rounded-xl bg-white/10 border border-white/20',
        sizeClasses[size],
        className
      )}
    >
      {/* ID Badge shape */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="w-[60%] h-[60%]"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Badge outline */}
        <rect
          x="4"
          y="3"
          width="16"
          height="18"
          rx="2"
          stroke="white"
          strokeWidth="1.5"
          fill="none"
        />
        {/* Photo area */}
        <rect
          x="7"
          y="6"
          width="5"
          height="5"
          rx="1"
          fill="white"
          opacity="0.9"
        />
        {/* Text lines */}
        <line x1="7" y1="14" x2="17" y2="14" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
        <line x1="7" y1="17" x2="14" y2="17" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
        {/* Checkmark badge */}
        <circle cx="17" cy="7" r="3.5" fill="#10B981" stroke="white" strokeWidth="1" />
        <path
          d="M15.5 7L16.5 8L18.5 6"
          stroke="white"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

// Animated version for hero sections
export function LogoAnimated({ size = 'lg' }: { size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  return (
    <div className="relative">
      {/* Glow effect */}
      <div className="absolute inset-0 bg-white/20 rounded-xl blur-xl opacity-30 animate-pulse-slow" />
      <LogoIcon size={size} className="relative animate-float" />
    </div>
  );
}

// Wordmark only (for footer, etc.)
export function LogoWordmark({ className }: { className?: string }) {
  return (
    <span className={cn('font-bold text-xl tracking-tight', className)}>
      Agent<span className="text-white">ID</span>
    </span>
  );
}

// Full horizontal logo for headers
export function LogoFull({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <LogoIcon size="md" />
      <div className="flex flex-col">
        <span className="font-bold text-lg tracking-tight leading-none">
          Agent<span className="text-white">ID</span>
        </span>
        <span className="text-[10px] text-muted-foreground tracking-wide uppercase">
          Trust Infrastructure
        </span>
      </div>
    </div>
  );
}
