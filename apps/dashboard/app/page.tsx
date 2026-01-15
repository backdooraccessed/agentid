'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Shield, Zap, Lock, Eye, RefreshCw, Code2, ArrowRight, Github, Check, Terminal, Box, Store, Bot, Cpu, Network, FileCheck } from 'lucide-react';
import { AgentVerificationIllustration, AgentIconSmall, VerificationGatewayIcon, CredentialCardIcon, TrustScoreMeter } from '@/components/illustrations/agent-verification';
import { LightThemeWrapper } from '@/components/theme-wrapper';

// Retro Terminal Window
function TerminalWindow({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <div className="bg-white border-4 border-black block-shadow-lg">
      <div className="bg-black text-white px-4 py-2 font-retro text-sm flex items-center gap-2">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 bg-white" />
          <div className="w-3 h-3 bg-gray-500" />
          <div className="w-3 h-3 bg-gray-700" />
        </div>
        <span className="ml-2">{title}</span>
      </div>
      <div className="p-4 font-mono text-sm">
        {children}
      </div>
    </div>
  );
}

// Feature Card with Retro Robot Icon
function FeatureCard({ icon: Icon, title, description, delay, showAgent = false }: {
  icon: React.ElementType;
  title: string;
  description: string;
  delay: string;
  showAgent?: boolean;
}) {
  return (
    <div
      className={`bg-white border-4 border-black p-6 block-shadow block-hover opacity-0 animate-slide-up ${delay}`}
    >
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 bg-black text-white flex items-center justify-center block-shadow-sm flex-shrink-0">
          <Icon className="w-6 h-6" />
        </div>
        {showAgent && <AgentIconSmall verified className="flex-shrink-0" />}
      </div>
      <h3 className="font-retro font-bold text-lg mb-2 uppercase">{title}</h3>
      <p className="font-retro text-gray-600 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

// Step Component with Robot
function Step({ number, title, description, delay, IconComponent }: {
  number: number;
  title: string;
  description: string;
  delay: string;
  IconComponent?: React.ReactNode;
}) {
  return (
    <div className={`flex gap-6 opacity-0 animate-slide-up ${delay}`}>
      <div className="w-16 h-16 bg-black text-white flex items-center justify-center font-pixel text-4xl block-shadow flex-shrink-0">
        {number}
      </div>
      <div className="flex-1">
        <h3 className="font-retro font-bold text-xl mb-2 uppercase">{title}</h3>
        <p className="font-retro text-gray-600">{description}</p>
      </div>
      {IconComponent && (
        <div className="flex-shrink-0 hidden md:block">
          {IconComponent}
        </div>
      )}
    </div>
  );
}

// Stats Block
function StatBlock({ value, label, delay }: { value: string; label: string; delay: string }) {
  return (
    <div className={`text-center p-4 bg-white border-4 border-black block-shadow opacity-0 animate-pop-in ${delay}`}>
      <div className="font-pixel text-4xl md:text-5xl mb-2">{value}</div>
      <div className="font-retro text-xs uppercase tracking-wider text-gray-600">{label}</div>
    </div>
  );
}

// Marketplace Preview Card
function MarketplaceCard({ index, delay }: { index: number; delay: string }) {
  return (
    <div className={`bg-white border-4 border-black p-6 block-shadow block-hover opacity-0 animate-slide-up ${delay}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-black border-2 border-black flex items-center justify-center">
          <AgentIconSmall verified className="w-8 h-10" />
        </div>
        <div>
          <div className="h-4 bg-gray-800 w-24 mb-1" />
          <div className="h-3 bg-gray-300 w-16" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 w-full" />
        <div className="h-3 bg-gray-200 w-3/4" />
      </div>
      <div className="mt-4 pt-4 border-t-2 border-black flex items-center justify-between">
        <span className="font-pixel text-sm">VERIFIED</span>
        <span className="font-retro text-xs bg-black text-white px-2 py-1">★ 4.{8 + index}</span>
      </div>
    </div>
  );
}

// Floating decorative element
function FloatingRobot({ className, delay = '0' }: { className?: string; delay?: string }) {
  return (
    <div
      className={`absolute animate-block-float ${className}`}
      style={{ animationDelay: `${delay}s` }}
    >
      <AgentIconSmall verified={false} className="opacity-20" />
    </div>
  );
}

export default function RetroLandingPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <LightThemeWrapper>
    <div className="min-h-screen bg-white text-black font-retro">
      {/* Dotted Background Pattern */}
      <div className="fixed inset-0 dot-pattern pointer-events-none" />

      {/* Floating Robots */}
      <FloatingRobot className="top-20 left-[10%] hidden md:block" delay="0" />
      <FloatingRobot className="top-40 right-[15%] hidden md:block" delay="0.5" />
      <FloatingRobot className="bottom-40 right-[10%] hidden md:block" delay="1.5" />

      {/* Header */}
      <header className="relative z-50 border-b-4 border-black bg-white">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-black flex items-center justify-center block-shadow-sm group-hover:animate-block-wiggle">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="font-retro font-bold text-xl uppercase tracking-tight">AgentID</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 font-retro text-sm uppercase tracking-wider">
            <Link href="#features" className="hover:underline underline-offset-4 decoration-2">Features</Link>
            <Link href="/marketplace" className="hover:underline underline-offset-4 decoration-2">Marketplace</Link>
            <Link href="/docs" className="hover:underline underline-offset-4 decoration-2">Docs</Link>
            <Link href="/pricing" className="hover:underline underline-offset-4 decoration-2">Pricing</Link>
            <Link href="https://github.com/agentid" className="hover:underline underline-offset-4 decoration-2">
              <Github className="w-5 h-5" />
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <button className="font-retro font-bold text-sm uppercase px-4 py-2 hover:bg-gray-100 border-2 border-black">
                Sign In
              </button>
            </Link>
            <Link href="/register">
              <button className="font-retro font-bold text-sm uppercase px-4 py-2 bg-black text-white btn-retro">
                Get Started
              </button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative py-16 md:py-24 overflow-hidden">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                {/* Beta Badge */}
                <div className={`inline-flex items-center gap-2 px-4 py-2 border-2 border-black bg-white block-shadow-sm mb-8 ${mounted ? 'animate-pop-in' : 'opacity-0'}`}>
                  <span className="w-2 h-2 bg-black animate-pulse" />
                  <span className="font-retro text-sm uppercase tracking-wider">Now in Public Beta</span>
                </div>

                {/* Headline */}
                <h1 className={`font-pixel text-5xl md:text-7xl lg:text-8xl leading-none mb-6 ${mounted ? 'animate-slide-up' : 'opacity-0'}`}>
                  IDENTITY
                  <br />
                  <span className="inline-block border-b-8 border-black">FOR AI</span>
                  <br />
                  AGENTS
                </h1>

                {/* Subheadline */}
                <p className={`font-retro text-lg md:text-xl text-gray-600 mb-8 max-w-md ${mounted ? 'animate-slide-up delay-200' : 'opacity-0'}`}>
                  Issue verifiable credentials. Verify instantly. Build trust at machine speed.
                </p>

                {/* CTA Buttons */}
                <div className={`flex flex-col sm:flex-row gap-4 ${mounted ? 'animate-slide-up delay-300' : 'opacity-0'}`}>
                  <Link href="/register">
                    <button className="flex items-center justify-center gap-2 px-8 py-4 bg-black text-white font-retro font-bold uppercase btn-retro">
                      <Bot className="w-5 h-5" />
                      Start Building
                    </button>
                  </Link>
                  <Link href="/docs">
                    <button className="flex items-center justify-center gap-2 px-8 py-4 border-4 border-black font-retro font-bold uppercase block-hover bg-white">
                      <Terminal className="w-5 h-5" />
                      Read Docs
                    </button>
                  </Link>
                </div>
              </div>

              {/* AI Agent Verification Illustration */}
              <div className={`${mounted ? 'animate-fade-in' : 'opacity-0'}`}>
                <AgentVerificationIllustration />
              </div>
            </div>
          </div>
        </section>

        {/* Terminal Demo */}
        <section className="py-16 border-y-4 border-black bg-gray-50">
          <div className="max-w-4xl mx-auto px-4">
            <TerminalWindow title="verification.ts">
              <div className="space-y-2">
                <div className="text-gray-500">// Verify AI agent credential</div>
                <div>
                  <span className="text-gray-600">const</span> agent = <span className="text-gray-600">await</span> agentid.<span className="font-bold">verify</span>(credential);
                </div>
                <div className="h-4" />
                <div className="flex items-center gap-2 text-green-700">
                  <Check className="w-4 h-4" />
                  <span>Agent Verified in 47ms</span>
                </div>
                <div className="pl-6 text-gray-600 font-mono">
                  {'{'}<br />
                  &nbsp;&nbsp;valid: <span className="font-bold">true</span>,<br />
                  &nbsp;&nbsp;agent_id: <span className="font-bold">"agent_x7k9m2..."</span>,<br />
                  &nbsp;&nbsp;trust_score: <span className="font-bold">98</span>,<br />
                  &nbsp;&nbsp;permissions: [<span className="font-bold">"read"</span>, <span className="font-bold">"write"</span>]<br />
                  {'}'}
                </div>
              </div>
            </TerminalWindow>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="py-20 md:py-32">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 border-2 border-black bg-white block-shadow-sm mb-6">
                <Cpu className="w-4 h-4" />
                <span className="font-retro text-sm uppercase tracking-wider">Features</span>
              </div>
              <h2 className="font-pixel text-4xl md:text-5xl uppercase mb-4">
                Everything You Need
              </h2>
              <p className="font-retro text-gray-600 max-w-xl mx-auto">
                Complete infrastructure for AI agent identity and verification
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FeatureCard
                icon={Shield}
                title="Issue Credentials"
                description="Create verifiable credentials with cryptographic signatures. Each agent gets a unique, tamper-proof identity."
                delay="delay-0"
                showAgent
              />
              <FeatureCard
                icon={Zap}
                title="Instant Verify"
                description="Verify any agent credential in under 50ms. No network calls for cached credentials."
                delay="delay-100"
              />
              <FeatureCard
                icon={Lock}
                title="Permission Scopes"
                description="Define granular permissions. Control exactly what your AI agents can access and do."
                delay="delay-200"
              />
              <FeatureCard
                icon={RefreshCw}
                title="Instant Revoke"
                description="Revoke compromised credentials instantly. Changes propagate globally in real-time."
                delay="delay-300"
              />
              <FeatureCard
                icon={Eye}
                title="Audit Logs"
                description="Complete trail of every verification. Meet compliance requirements with full transparency."
                delay="delay-400"
              />
              <FeatureCard
                icon={Code2}
                title="SDK Support"
                description="Python and TypeScript SDKs with FastAPI, LangChain, and Express integrations."
                delay="delay-500"
              />
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 md:py-32 border-y-4 border-black bg-gray-50">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 border-2 border-black bg-white block-shadow-sm mb-6">
                <Network className="w-4 h-4" />
                <span className="font-retro text-sm uppercase tracking-wider">How It Works</span>
              </div>
              <h2 className="font-pixel text-4xl md:text-5xl uppercase">
                Three Simple Steps
              </h2>
            </div>

            <div className="space-y-12">
              <Step
                number={1}
                title="Register Your Agent"
                description="Create an issuer account and register your AI agent. Get cryptographic signing keys in seconds."
                delay="delay-0"
                IconComponent={<AgentIconSmall verified={false} className="opacity-60" />}
              />
              <Step
                number={2}
                title="Issue Credentials"
                description="Generate cryptographically signed credentials with custom permissions and expiration policies."
                delay="delay-200"
                IconComponent={<CredentialCardIcon className="opacity-60" />}
              />
              <Step
                number={3}
                title="Verify Anywhere"
                description="Any service can verify your agent's identity, permissions, and trust score with a single API call."
                delay="delay-400"
                IconComponent={<AgentIconSmall verified className="opacity-60" />}
              />
            </div>
          </div>
        </section>

        {/* Marketplace Preview */}
        <section className="py-20 md:py-32">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 border-2 border-black bg-white block-shadow-sm mb-6">
                <Store className="w-4 h-4" />
                <span className="font-retro text-sm uppercase tracking-wider">Marketplace</span>
              </div>
              <h2 className="font-pixel text-4xl md:text-5xl uppercase mb-4">
                Discover Verified AI Agents
              </h2>
              <p className="font-retro text-gray-600 max-w-xl mx-auto">
                Browse verified AI applications and agents built by developers worldwide.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <MarketplaceCard index={1} delay="delay-0" />
              <MarketplaceCard index={2} delay="delay-100" />
              <MarketplaceCard index={3} delay="delay-200" />
            </div>

            <div className="text-center">
              <Link href="/marketplace">
                <button className="inline-flex items-center gap-2 px-8 py-4 bg-black text-white font-retro font-bold uppercase btn-retro">
                  Browse Marketplace
                  <ArrowRight className="w-5 h-5" />
                </button>
              </Link>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-20 md:py-32 border-y-4 border-black bg-gray-50">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              <StatBlock value="10K+" label="Credentials" delay="delay-0" />
              <StatBlock value="<50ms" label="Verify Time" delay="delay-100" />
              <StatBlock value="99.9%" label="Uptime" delay="delay-200" />
              <StatBlock value="500+" label="Companies" delay="delay-300" />
            </div>
          </div>
        </section>

        {/* Trust Score Section */}
        <section className="py-20 md:py-32">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 border-2 border-black bg-white block-shadow-sm mb-6">
                  <FileCheck className="w-4 h-4" />
                  <span className="font-retro text-sm uppercase tracking-wider">Trust Scores</span>
                </div>
                <h2 className="font-pixel text-4xl md:text-5xl uppercase mb-6">
                  Build Agent Reputation
                </h2>
                <p className="font-retro text-gray-600 mb-8">
                  Every verification builds your agent's reputation. Track trust scores, verification history, and compliance metrics in real-time.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-white border-4 border-black block-shadow">
                    <div className="w-12 h-12 bg-black text-white flex items-center justify-center font-pixel text-xl">98</div>
                    <div>
                      <div className="font-retro font-bold uppercase">Trust Score</div>
                      <div className="font-retro text-sm text-gray-600">Based on verification history</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-white border-4 border-black block-shadow">
                    <div className="w-12 h-12 bg-black text-white flex items-center justify-center font-pixel text-lg">1.2K</div>
                    <div>
                      <div className="font-retro font-bold uppercase">Verifications</div>
                      <div className="font-retro text-sm text-gray-600">Successful identity checks</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-64 h-64 bg-white border-4 border-black block-shadow-lg p-6 flex flex-col items-center justify-center">
                    <div className="font-retro text-sm uppercase tracking-wider mb-2">Agent Trust</div>
                    <div className="font-pixel text-8xl">98</div>
                    <div className="font-retro text-sm text-gray-600 mt-2">/ 100</div>
                    <div className="mt-4 w-full bg-gray-200 h-3 border border-black">
                      <div className="bg-black h-full" style={{ width: '98%' }} />
                    </div>
                  </div>
                  <div className="absolute -top-4 -right-4 bg-white border-2 border-black p-2 block-shadow-sm">
                    <Check className="w-6 h-6" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 md:py-32 border-t-4 border-black bg-black text-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="font-pixel text-4xl md:text-6xl uppercase mb-6">
              Ready to Build?
            </h2>
            <p className="font-retro text-lg text-gray-400 mb-8 max-w-xl mx-auto">
              Start issuing verifiable credentials for your AI agents today. Free tier includes 1,000 verifications per month.
            </p>
            <Link href="/register">
              <button className="inline-flex items-center gap-2 px-10 py-5 bg-white text-black font-retro font-bold text-lg uppercase border-4 border-white hover:bg-gray-100 transition-colors">
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t-4 border-black py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-black flex items-center justify-center">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <span className="font-retro font-bold uppercase">AgentID</span>
              </div>
              <p className="font-retro text-sm text-gray-600">
                Trust infrastructure for autonomous AI agents.
              </p>
            </div>

            <div>
              <h4 className="font-retro font-bold uppercase mb-4">Product</h4>
              <ul className="space-y-2 font-retro text-sm text-gray-600">
                <li><Link href="/docs" className="hover:underline">Documentation</Link></li>
                <li><Link href="/pricing" className="hover:underline">Pricing</Link></li>
                <li><Link href="/marketplace" className="hover:underline">Marketplace</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-retro font-bold uppercase mb-4">Company</h4>
              <ul className="space-y-2 font-retro text-sm text-gray-600">
                <li><Link href="/terms" className="hover:underline">Terms</Link></li>
                <li><Link href="/privacy" className="hover:underline">Privacy</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-retro font-bold uppercase mb-4">Connect</h4>
              <ul className="space-y-2 font-retro text-sm text-gray-600">
                <li><a href="https://github.com/agentid" className="hover:underline">GitHub</a></li>
                <li><a href="https://twitter.com/agentid" className="hover:underline">Twitter</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t-2 border-black text-center font-retro text-sm text-gray-600">
            <span className="font-pixel">&copy; 2024 AgentID</span> — Identity for autonomous AI agents
          </div>
        </div>
      </footer>
    </div>
    </LightThemeWrapper>
  );
}
