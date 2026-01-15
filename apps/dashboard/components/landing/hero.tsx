'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Code2, Briefcase, Bot, Shield, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

// Animated grid background
function GridBackground() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.15)_0%,transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(16,185,129,0.1)_0%,transparent_50%)]" />

      {/* Animated grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

      {/* Floating orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
    </div>
  );
}

// Animated Verification Flow
function VerificationFlow() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((s) => (s + 1) % 4);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full max-w-lg mx-auto">
      {/* Flow diagram */}
      <div className="flex items-center justify-between gap-2">
        {/* Agent */}
        <div className={cn(
          'flex flex-col items-center gap-2 transition-all duration-500',
          step >= 0 ? 'opacity-100' : 'opacity-30'
        )}>
          <div className={cn(
            'w-16 h-16 rounded-2xl border-2 flex items-center justify-center transition-all',
            step === 0 ? 'border-white bg-white/10 scale-110' : 'border-white/20 bg-white/5'
          )}>
            <Bot className="w-7 h-7" />
          </div>
          <span className="text-xs text-muted-foreground">Your Agent</span>
        </div>

        {/* Arrow 1 */}
        <div className={cn(
          'flex-1 h-0.5 transition-all duration-500 relative',
          step >= 1 ? 'bg-white' : 'bg-white/20'
        )}>
          <div className={cn(
            'absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rotate-45 border-t-2 border-r-2 transition-all',
            step >= 1 ? 'border-white' : 'border-white/20'
          )} />
          {step === 1 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="px-2 py-0.5 bg-black text-[10px] text-emerald-400 font-mono animate-pulse">
                credential
              </span>
            </div>
          )}
        </div>

        {/* AgentID */}
        <div className={cn(
          'flex flex-col items-center gap-2 transition-all duration-500',
          step >= 1 ? 'opacity-100' : 'opacity-30'
        )}>
          <div className={cn(
            'w-16 h-16 rounded-2xl border-2 flex items-center justify-center transition-all',
            step === 1 || step === 2 ? 'border-emerald-400 bg-emerald-400/10 scale-110' : 'border-white/20 bg-white/5'
          )}>
            <Shield className="w-7 h-7" />
          </div>
          <span className="text-xs text-muted-foreground">AgentID</span>
        </div>

        {/* Arrow 2 */}
        <div className={cn(
          'flex-1 h-0.5 transition-all duration-500 relative',
          step >= 2 ? 'bg-emerald-400' : 'bg-white/20'
        )}>
          <div className={cn(
            'absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rotate-45 border-t-2 border-r-2 transition-all',
            step >= 2 ? 'border-emerald-400' : 'border-white/20'
          )} />
          {step === 2 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="px-2 py-0.5 bg-black text-[10px] text-emerald-400 font-mono animate-pulse">
                verified
              </span>
            </div>
          )}
        </div>

        {/* Service */}
        <div className={cn(
          'flex flex-col items-center gap-2 transition-all duration-500',
          step >= 3 ? 'opacity-100' : 'opacity-30'
        )}>
          <div className={cn(
            'w-16 h-16 rounded-2xl border-2 flex items-center justify-center transition-all',
            step === 3 ? 'border-emerald-400 bg-emerald-400/10 scale-110' : 'border-white/20 bg-white/5'
          )}>
            <Globe className="w-7 h-7" />
          </div>
          <span className="text-xs text-muted-foreground">Any Service</span>
        </div>
      </div>

      {/* Status text */}
      <div className="mt-6 text-center">
        <p className={cn(
          'text-sm font-medium transition-all duration-300',
          step === 3 ? 'text-emerald-400' : 'text-muted-foreground'
        )}>
          {step === 0 && 'Agent requests access...'}
          {step === 1 && 'Presenting credential...'}
          {step === 2 && 'Cryptographically verified in <50ms'}
          {step === 3 && 'Access granted. Trust established.'}
        </p>
      </div>
    </div>
  );
}

// Trust indicators
function TrustIndicators() {
  return (
    <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>10,000+ credentials issued</span>
      </div>
      <div className="hidden sm:flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>99.9% uptime</span>
      </div>
      <div className="hidden md:flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>500+ companies</span>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative pt-28 pb-20 overflow-hidden">
      <GridBackground />

      <div className="max-w-6xl mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-sm font-medium mb-8 animate-fade-in">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            Now in public beta
          </div>

          {/* Headline with gradient */}
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-6 animate-fade-in-up">
            <span className="bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent">
              Identity infrastructure for
            </span>
            <br />
            <span className="bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              autonomous AI agents
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed animate-fade-in-up delay-100">
            Issue verifiable credentials to your AI agents. Let any service verify them instantly.
            Build trust at machine speed.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8 animate-fade-in-up delay-200">
            <Link href="/register">
              <Button size="lg" className="bg-white text-black hover:bg-white/90 gap-2 text-base px-8 h-14 font-medium min-w-[200px] shadow-lg shadow-white/10">
                <Code2 className="w-5 h-5" />
                Start Building Free
              </Button>
            </Link>
            <Link href="/docs">
              <Button size="lg" variant="outline" className="gap-2 text-base px-8 h-14 border-white/20 hover:bg-white/5 min-w-[200px]">
                <Briefcase className="w-5 h-5" />
                View Documentation
              </Button>
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="animate-fade-in-up delay-300">
            <TrustIndicators />
          </div>
        </div>

        {/* Animated verification flow */}
        <div className="mt-16 p-8 rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-sm animate-fade-in-up delay-400">
          <p className="text-center text-sm text-muted-foreground mb-8">
            See how verification works in real-time
          </p>
          <VerificationFlow />
        </div>
      </div>
    </section>
  );
}
