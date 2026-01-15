'use client';

import {
  Shield,
  Zap,
  Eye,
  RefreshCw,
  Key,
  Webhook,
  Lock,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  gradient?: string;
}

function FeatureCard({ icon: Icon, title, description, gradient }: FeatureCardProps) {
  return (
    <div className="group relative p-6 rounded-2xl border border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04] transition-all duration-300">
      {/* Hover gradient effect */}
      <div className={cn(
        'absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10',
        gradient || 'bg-gradient-to-br from-emerald-500/5 to-transparent'
      )} />

      <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 group-hover:bg-white/10 group-hover:scale-110 transition-all duration-300">
        <Icon className="w-6 h-6 text-white/80 group-hover:text-white transition-colors" />
      </div>

      <h3 className="font-display font-semibold text-lg mb-2 text-white">
        {title}
      </h3>

      <p className="text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  );
}

const features: FeatureCardProps[] = [
  {
    icon: Shield,
    title: 'Issue Credentials',
    description: 'Create verifiable credentials for your AI agents with cryptographic signatures and customizable permissions.',
    gradient: 'bg-gradient-to-br from-blue-500/10 to-transparent',
  },
  {
    icon: Zap,
    title: 'Verify Instantly',
    description: 'Verify any agent credential in under 50ms. No network calls required for cached credentials.',
    gradient: 'bg-gradient-to-br from-yellow-500/10 to-transparent',
  },
  {
    icon: TrendingUp,
    title: 'Track Reputation',
    description: 'Build trust scores over time based on successful verifications and agent behavior.',
    gradient: 'bg-gradient-to-br from-emerald-500/10 to-transparent',
  },
  {
    icon: Key,
    title: 'Permission Scopes',
    description: 'Define granular permissions for each credential. Control exactly what your agents can access.',
    gradient: 'bg-gradient-to-br from-purple-500/10 to-transparent',
  },
  {
    icon: RefreshCw,
    title: 'Instant Revocation',
    description: 'Revoke compromised credentials instantly. Changes propagate globally in under 100ms.',
    gradient: 'bg-gradient-to-br from-red-500/10 to-transparent',
  },
  {
    icon: Webhook,
    title: 'Webhooks & Events',
    description: 'Get real-time notifications for verifications, revocations, and trust score changes.',
    gradient: 'bg-gradient-to-br from-cyan-500/10 to-transparent',
  },
  {
    icon: Eye,
    title: 'Audit Logs',
    description: 'Complete audit trail of every verification. Meet compliance requirements effortlessly.',
    gradient: 'bg-gradient-to-br from-orange-500/10 to-transparent',
  },
  {
    icon: Lock,
    title: 'Enterprise Security',
    description: 'SOC 2 compliant. End-to-end encryption. Your credentials are cryptographically secure.',
    gradient: 'bg-gradient-to-br from-indigo-500/10 to-transparent',
  },
];

export function Features() {
  return (
    <section className="py-24 relative">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent" />

      <div className="relative max-w-6xl mx-auto px-4">
        {/* Section header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-sm font-medium mb-6">
            <Shield className="w-4 h-4 text-emerald-400" />
            Features
          </div>

          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
              Everything you need to build
            </span>
            <br />
            <span className="bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
              trustworthy AI agents
            </span>
          </h2>

          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            A complete platform for agent identity, from credential issuance to real-time verification.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
}
