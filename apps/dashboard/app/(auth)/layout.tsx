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
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-800 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:40px_40px]" />

        {/* Animated gradient orbs */}
        <div className="absolute -left-32 -bottom-32 w-[500px] h-[500px] rounded-full bg-indigo-500/30 blur-3xl animate-pulse-slow" />
        <div className="absolute -right-32 -top-32 w-[500px] h-[500px] rounded-full bg-purple-500/20 blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-indigo-400/20 blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <LogoIcon size="lg" className="shadow-xl shadow-indigo-900/50 group-hover:scale-105 transition-transform" />
            <span className="text-2xl font-bold tracking-tight">
              Agent<span className="text-indigo-200">ID</span>
            </span>
          </Link>

          {/* Main content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl xl:text-5xl font-bold leading-tight">
                Trust Infrastructure
                <br />
                <span className="text-indigo-200">for AI Agents</span>
              </h1>
              <p className="text-lg text-indigo-100/80 max-w-md leading-relaxed">
                Issue verifiable credentials to your AI agents. Enable any service to verify agent identity, permissions, and trustworthiness.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-indigo-100/90">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center backdrop-blur-sm">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-medium">Cryptographic Security</div>
                  <div className="text-sm text-indigo-200/70">Ed25519 signatures you can trust</div>
                </div>
              </div>
              <div className="flex items-center gap-3 text-indigo-100/90">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center backdrop-blur-sm">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-medium">Instant Verification</div>
                  <div className="text-sm text-indigo-200/70">Sub-50ms response times</div>
                </div>
              </div>
              <div className="flex items-center gap-3 text-indigo-100/90">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center backdrop-blur-sm">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-medium">Trust Scores</div>
                  <div className="text-sm text-indigo-200/70">Build reputation over time</div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-8 pt-4">
              <div className="text-center">
                <div className="text-3xl font-bold">10K+</div>
                <div className="text-sm text-indigo-200/70">Credentials</div>
              </div>
              <div className="w-px h-12 bg-indigo-400/30" />
              <div className="text-center">
                <div className="text-3xl font-bold">&lt;50ms</div>
                <div className="text-sm text-indigo-200/70">Verification</div>
              </div>
              <div className="w-px h-12 bg-indigo-400/30" />
              <div className="text-center">
                <div className="text-3xl font-bold">99.9%</div>
                <div className="text-sm text-indigo-200/70">Uptime</div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="text-sm text-indigo-200/50">
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
