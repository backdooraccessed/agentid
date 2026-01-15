import Link from 'next/link';
import { Shield, CheckCircle, Zap, Bot } from 'lucide-react';
import { LightThemeWrapper } from '@/components/theme-wrapper';

export const dynamic = 'force-dynamic';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LightThemeWrapper>
    <div className="min-h-screen flex bg-white">
      {/* Dotted Background Pattern */}
      <div className="fixed inset-0 dot-pattern pointer-events-none" />

      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-black relative overflow-hidden">
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px]" />

        {/* Corner brackets */}
        <div className="absolute top-8 left-8 w-12 h-12 border-l-4 border-t-4 border-white/20" />
        <div className="absolute top-8 right-8 w-12 h-12 border-r-4 border-t-4 border-white/20" />
        <div className="absolute bottom-8 left-8 w-12 h-12 border-l-4 border-b-4 border-white/20" />
        <div className="absolute bottom-8 right-8 w-12 h-12 border-r-4 border-b-4 border-white/20" />

        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 bg-white flex items-center justify-center block-shadow-sm group-hover:animate-block-wiggle">
              <Shield className="w-6 h-6 text-black" />
            </div>
            <span className="font-retro text-2xl font-bold tracking-tight uppercase">
              AgentID
            </span>
          </Link>

          {/* Main content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="font-pixel text-4xl xl:text-5xl leading-tight uppercase tracking-tight">
                Trust Infrastructure
                <br />
                <span className="text-white/60">for AI Agents</span>
              </h1>
              <p className="font-retro text-lg text-white/50 max-w-md leading-relaxed">
                Issue verifiable credentials to your AI agents. Enable any service to verify agent identity and permissions.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-white/80">
                <div className="w-12 h-12 bg-white/10 border-2 border-white/20 flex items-center justify-center">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-retro font-bold uppercase">Cryptographic Security</div>
                  <div className="font-retro text-sm text-white/40">Ed25519 signatures you can trust</div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-white/80">
                <div className="w-12 h-12 bg-white/10 border-2 border-white/20 flex items-center justify-center">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-retro font-bold uppercase">Instant Verification</div>
                  <div className="font-retro text-sm text-white/40">Sub-50ms response times</div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-white/80">
                <div className="w-12 h-12 bg-white/10 border-2 border-white/20 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-retro font-bold uppercase">Trust Scores</div>
                  <div className="font-retro text-sm text-white/40">Build reputation over time</div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 pt-4">
              <div className="text-center p-4 border-2 border-white/20 bg-white/5">
                <div className="font-pixel text-2xl">10K+</div>
                <div className="font-retro text-xs text-white/40 uppercase">Credentials</div>
              </div>
              <div className="text-center p-4 border-2 border-white/20 bg-white/5">
                <div className="font-pixel text-2xl">&lt;50ms</div>
                <div className="font-retro text-xs text-white/40 uppercase">Verify</div>
              </div>
              <div className="text-center p-4 border-2 border-white/20 bg-white/5">
                <div className="font-pixel text-2xl">99.9%</div>
                <div className="font-retro text-xs text-white/40 uppercase">Uptime</div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="font-retro text-xs text-white/30 uppercase">
            &copy; {new Date().getFullYear()} AgentID — Open source under MIT
          </p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white relative">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 flex justify-center">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-black flex items-center justify-center block-shadow-sm">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="font-retro text-xl font-bold uppercase text-black">AgentID</span>
            </Link>
          </div>
          {children}
        </div>
      </div>
    </div>
    </LightThemeWrapper>
  );
}
