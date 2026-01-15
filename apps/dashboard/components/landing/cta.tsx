'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Shield, ArrowRight, Sparkles } from 'lucide-react';

export function CTA() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.15)_0%,transparent_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(59,130,246,0.1)_0%,transparent_50%)]" />

      <div className="relative max-w-4xl mx-auto px-4 text-center">
        {/* Logo */}
        <div className="w-20 h-20 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-emerald-500/10">
          <Shield className="w-10 h-10 text-white" />
        </div>

        {/* Headline */}
        <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
          <span className="text-white">Ready to build </span>
          <span className="bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
            trustworthy agents?
          </span>
        </h2>

        {/* Subheadline */}
        <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
          Join the teams building the future of AI. Get started in 5 minutes with our free tier.
          No credit card required.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <Link href="/register">
            <Button
              size="lg"
              className="bg-white text-black hover:bg-white/90 gap-2 text-base px-8 h-14 font-medium min-w-[220px] shadow-lg shadow-white/20"
            >
              <Sparkles className="w-5 h-5" />
              Start Building Free
            </Button>
          </Link>
          <Link href="/docs">
            <Button
              size="lg"
              variant="outline"
              className="gap-2 text-base px-8 h-14 border-white/20 hover:bg-white/5 min-w-[220px]"
            >
              Read the Docs
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>

        {/* Trust indicators */}
        <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>Free tier available</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>No credit card</span>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>Setup in 5 min</span>
          </div>
        </div>
      </div>
    </section>
  );
}
