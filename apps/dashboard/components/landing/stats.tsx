'use client';

import { useState, useEffect, useRef } from 'react';
import { Shield, Zap, Clock, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatProps {
  icon: typeof Shield;
  value: number;
  suffix: string;
  label: string;
  color: string;
}

function AnimatedStat({ icon: Icon, value, suffix, label, color }: StatProps) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const counted = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !counted.current) {
          counted.current = true;
          let start = 0;
          const duration = 2000;
          const increment = value / (duration / 16);
          const timer = setInterval(() => {
            start += increment;
            if (start >= value) {
              setCount(value);
              clearInterval(timer);
            } else {
              setCount(Math.floor(start));
            }
          }, 16);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value]);

  return (
    <div ref={ref} className="relative group">
      <div className="text-center p-6 rounded-2xl border border-white/10 bg-white/[0.02] hover:border-white/20 transition-all">
        {/* Icon */}
        <div className={cn(
          'w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center transition-transform group-hover:scale-110',
          color
        )}>
          <Icon className="w-6 h-6" />
        </div>

        {/* Value */}
        <div className="font-display text-4xl md:text-5xl font-bold text-white mb-2">
          {count.toLocaleString()}{suffix}
        </div>

        {/* Label */}
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

const stats: StatProps[] = [
  {
    icon: Shield,
    value: 10000,
    suffix: '+',
    label: 'Credentials Issued',
    color: 'bg-emerald-500/20 text-emerald-400',
  },
  {
    icon: Zap,
    value: 50,
    suffix: 'ms',
    label: 'Avg Verification Time',
    color: 'bg-yellow-500/20 text-yellow-400',
  },
  {
    icon: Clock,
    value: 99,
    suffix: '.9%',
    label: 'Uptime SLA',
    color: 'bg-blue-500/20 text-blue-400',
  },
  {
    icon: Building2,
    value: 500,
    suffix: '+',
    label: 'Companies',
    color: 'bg-purple-500/20 text-purple-400',
  },
];

export function Stats() {
  return (
    <section className="py-24 border-y border-white/5 bg-gradient-to-b from-transparent via-white/[0.01] to-transparent">
      <div className="max-w-6xl mx-auto px-4">
        {/* Section header */}
        <div className="text-center mb-12">
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-4">
            <span className="text-white">Trusted by </span>
            <span className="bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
              leading teams
            </span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Join hundreds of companies building trustworthy AI agents with AgentID.
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <AnimatedStat key={index} {...stat} />
          ))}
        </div>

        {/* Company logos placeholder */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-8 opacity-50">
          {['Acme Corp', 'TechStart', 'AI Labs', 'DataFlow', 'CloudAI'].map((company) => (
            <div
              key={company}
              className="px-6 py-3 rounded-lg border border-white/10 bg-white/5 text-sm font-medium text-muted-foreground"
            >
              {company}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
