'use client';

import { UserPlus, Key, CheckCircle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StepProps {
  number: number;
  icon: typeof UserPlus;
  title: string;
  description: string;
  code?: string;
  isLast?: boolean;
}

function Step({ number, icon: Icon, title, description, code, isLast }: StepProps) {
  return (
    <div className="relative flex flex-col items-center">
      {/* Connector line */}
      {!isLast && (
        <div className="hidden lg:block absolute top-12 left-1/2 w-full h-0.5 bg-gradient-to-r from-white/20 via-white/10 to-white/20">
          <ArrowRight className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
        </div>
      )}

      {/* Step content */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-xs">
        {/* Number badge */}
        <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-emerald-500 text-black font-bold text-sm flex items-center justify-center">
          {number}
        </div>

        {/* Icon */}
        <div className="w-24 h-24 rounded-2xl border-2 border-white/20 bg-white/5 flex items-center justify-center mb-6 group-hover:border-emerald-400/50 transition-colors">
          <Icon className="w-10 h-10 text-white/80" />
        </div>

        {/* Title */}
        <h3 className="font-display font-semibold text-xl mb-2 text-white">
          {title}
        </h3>

        {/* Description */}
        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
          {description}
        </p>

        {/* Code snippet */}
        {code && (
          <div className="w-full p-3 rounded-lg bg-black/50 border border-white/10">
            <code className="text-xs text-emerald-400 font-mono">{code}</code>
          </div>
        )}
      </div>
    </div>
  );
}

const steps: Omit<StepProps, 'isLast'>[] = [
  {
    number: 1,
    icon: UserPlus,
    title: 'Register as an Issuer',
    description: 'Create your issuer profile in minutes. Verify your domain to build trust with verifiers.',
    code: 'POST /api/issuers/register',
  },
  {
    number: 2,
    icon: Key,
    title: 'Issue Credentials',
    description: 'Create credentials for your AI agents with customizable permissions and expiration.',
    code: 'POST /api/credentials',
  },
  {
    number: 3,
    icon: CheckCircle,
    title: 'Verify Anywhere',
    description: 'Any service can verify your agent credentials instantly using our API or SDK.',
    code: 'POST /api/verify',
  },
];

export function HowItWorks() {
  return (
    <section className="py-24 border-y border-white/5 bg-gradient-to-b from-transparent via-white/[0.01] to-transparent">
      <div className="max-w-6xl mx-auto px-4">
        {/* Section header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-sm font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            How It Works
          </div>

          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            <span className="text-white">Get started in </span>
            <span className="bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
              three simple steps
            </span>
          </h2>

          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            From zero to verified agents in minutes, not weeks.
          </p>
        </div>

        {/* Steps */}
        <div className="grid lg:grid-cols-3 gap-12 lg:gap-8">
          {steps.map((step, index) => (
            <Step key={index} {...step} isLast={index === steps.length - 1} />
          ))}
        </div>

        {/* Timeline visualization for mobile */}
        <div className="lg:hidden mt-8 flex justify-center">
          <div className="flex items-center gap-4">
            {steps.map((_, index) => (
              <div key={index} className="flex items-center">
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center font-bold',
                  index === 0 ? 'bg-emerald-500 text-black' : 'bg-white/10 text-white'
                )}>
                  {index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div className="w-8 h-0.5 bg-white/20" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
