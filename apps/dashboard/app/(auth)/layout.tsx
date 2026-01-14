import Link from 'next/link';
import { Logo, LogoIcon } from '@/components/brand/logo';
import { Shield, CheckCircle, Zap } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-black relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:48px_48px]" />

        {/* Subtle glow effects */}
        <div className="absolute -left-32 -bottom-32 w-[500px] h-[500px] rounded-full bg-white/[0.02] blur-3xl" />
        <div className="absolute -right-32 -top-32 w-[500px] h-[500px] rounded-full bg-white/[0.02] blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <LogoIcon size="lg" className="group-hover:scale-105 transition-transform" />
            <span className="text-2xl font-bold tracking-tight font-display">
              Agent<span className="text-white/60">ID</span>
            </span>
          </Link>

          {/* Main content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="font-display text-4xl xl:text-5xl font-bold leading-tight">
                Trust Infrastructure
                <br />
                <span className="text-white/60">for AI Agents</span>
              </h1>
              <p className="text-lg text-white/50 max-w-md leading-relaxed">
                Issue verifiable credentials to your AI agents. Enable any service to verify agent identity, permissions, and trustworthiness.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-white/80">
                <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-medium">Cryptographic Security</div>
                  <div className="text-sm text-white/40">Ed25519 signatures you can trust</div>
                </div>
              </div>
              <div className="flex items-center gap-3 text-white/80">
                <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-medium">Instant Verification</div>
                  <div className="text-sm text-white/40">Sub-50ms response times</div>
                </div>
              </div>
              <div className="flex items-center gap-3 text-white/80">
                <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-medium">Trust Scores</div>
                  <div className="text-sm text-white/40">Build reputation over time</div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-8 pt-4">
              <div className="text-center">
                <div className="text-3xl font-bold">10K+</div>
                <div className="text-sm text-white/40">Credentials</div>
              </div>
              <div className="w-px h-12 bg-white/10" />
              <div className="text-center">
                <div className="text-3xl font-bold">&lt;50ms</div>
                <div className="text-sm text-white/40">Verification</div>
              </div>
              <div className="w-px h-12 bg-white/10" />
              <div className="text-center">
                <div className="text-3xl font-bold">99.9%</div>
                <div className="text-sm text-white/40">Uptime</div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="text-sm text-white/30">
            &copy; {new Date().getFullYear()} AgentID. Open source under MIT license.
          </p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 flex justify-center">
            <Link href="/">
              <Logo size="lg" />
            </Link>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
