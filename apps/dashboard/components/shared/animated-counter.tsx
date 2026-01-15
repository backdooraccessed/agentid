'use client';

import { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

export function AnimatedCounter({
  value,
  duration = 1000,
  className,
  prefix = '',
  suffix = '',
  decimals = 0,
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const startTime = useRef<number | null>(null);
  const startValue = useRef(0);
  const animationFrame = useRef<number | undefined>(undefined);

  useEffect(() => {
    startValue.current = displayValue;
    startTime.current = null;

    const animate = (timestamp: number) => {
      if (!startTime.current) {
        startTime.current = timestamp;
      }

      const progress = Math.min((timestamp - startTime.current) / duration, 1);

      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);

      const currentValue = startValue.current + (value - startValue.current) * easeOut;
      setDisplayValue(currentValue);

      if (progress < 1) {
        animationFrame.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
      }
    };

    animationFrame.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [value, duration]);

  const formattedValue = decimals > 0
    ? displayValue.toFixed(decimals)
    : Math.round(displayValue).toLocaleString();

  return (
    <span className={cn('tabular-nums', className)}>
      {prefix}{formattedValue}{suffix}
    </span>
  );
}

// Compact number formatter (e.g., 1.2K, 3.4M)
interface CompactCounterProps extends Omit<AnimatedCounterProps, 'decimals'> {
  compact?: boolean;
}

export function CompactCounter({
  value,
  duration = 1000,
  className,
  prefix = '',
  suffix = '',
  compact = true,
}: CompactCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const startTime = useRef<number | null>(null);
  const startValue = useRef(0);
  const animationFrame = useRef<number | undefined>(undefined);

  useEffect(() => {
    startValue.current = displayValue;
    startTime.current = null;

    const animate = (timestamp: number) => {
      if (!startTime.current) {
        startTime.current = timestamp;
      }

      const progress = Math.min((timestamp - startTime.current) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue.current + (value - startValue.current) * easeOut;
      setDisplayValue(currentValue);

      if (progress < 1) {
        animationFrame.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
      }
    };

    animationFrame.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [value, duration]);

  const formatCompact = (num: number): string => {
    if (!compact) return Math.round(num).toLocaleString();

    if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return Math.round(num).toString();
  };

  return (
    <span className={cn('tabular-nums', className)}>
      {prefix}{formatCompact(displayValue)}{suffix}
    </span>
  );
}
