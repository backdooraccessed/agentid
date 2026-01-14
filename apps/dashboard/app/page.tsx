'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import {
  Shield,
  CheckCircle,
  Zap,
  ArrowRight,
  Github,
  Key,
  RefreshCw,
  Globe,
  Copy,
  Check,
  Lock,
  Bell,
  TrendingUp,
  Users,
  ChevronRight,
  ExternalLink,
  Bot,
  ShoppingCart,
  HeadphonesIcon,
  Database,
  Building2,
  CreditCard,
  Fingerprint,
  Cable,
  Terminal,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Simple Logo Mark
function LogoMark({ className }: { className?: string }) {
  return (
    <div className={cn('w-8 h-8 rounded-lg bg-white flex items-center justify-center', className)}>
      <Shield className="w-4 h-4 text-black" />
    </div>
  );
}

// Trust Score Ring - Monochrome
function TrustRing({ score, size = 64 }: { score: number; size?: number }) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const circumference = 2 * Math.PI * 26;
  const offset = circumference - (animatedScore / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 100);
    return () => clearTimeout(timer);
  }, [score]);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
        <circle
          cx="32"
          cy="32"
          r="26"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          className="text-white/10"
        />
        <circle
          cx="32"
          cy="32"
          r="26"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-white transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-display text-sm font-bold">{animatedScore}</span>
      </div>
    </div>
  );
}

// Animated Counter
function AnimatedCounter({ value, suffix = '' }: { value: string; suffix?: string }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={cn('transition-all duration-700', isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4')}>
      <span className="font-display text-4xl font-bold text-white">{value}</span>
      <span className="text-muted-foreground">{suffix}</span>
    </div>
  );
}

export default function Home() {
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(`const { valid, agent } = await fetch(
  'https://api.agentid.dev/verify',
  { method: 'POST', body: JSON.stringify({ credential }) }
).then(r => r.json());`);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-black/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <LogoMark className="group-hover:scale-105 transition-transform" />
            <span className="font-display text-xl font-bold">
              AgentID
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm">
            <Link href="/docs" className="text-muted-foreground hover:text-white transition-colors">
              Docs
            </Link>
            <Link href="/directory" className="text-muted-foreground hover:text-white transition-colors">
              Directory
            </Link>
            <Link href="/pricing" className="text-muted-foreground hover:text-white transition-colors">
              Pricing
            </Link>
            <Link href="https://github.com/agentid" className="text-muted-foreground hover:text-white transition-colors flex items-center gap-1">
              <Github className="w-4 h-4" />
              GitHub
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-white">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="bg-white text-black hover:bg-white/90 font-medium">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-grid" />
          <div className="absolute inset-0 bg-glow" />
        </div>

        <div className="max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8 stagger">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-sm">
                <Sparkles className="w-4 h-4" />
                Trust Infrastructure for AI Agents
              </div>

              <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
                Verify AI
                <br />
                <span className="text-muted-foreground">agents instantly</span>
              </h1>

              <p className="text-xl text-muted-foreground max-w-lg leading-relaxed">
                Issue verifiable credentials. Verify identity in milliseconds.
                Build reputation over time.
              </p>

              <div className="flex flex-col sm:flex-row items-start gap-4 pt-4">
                <Link href="/register">
                  <Button size="lg" className="bg-white text-black hover:bg-white/90 gap-2 text-base px-8 h-14 font-medium btn-glow">
                    Start Issuing Free
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
                <Link href="/docs">
                  <Button size="lg" variant="outline" className="gap-2 text-base px-8 h-14 border-white/10 hover:bg-white/5">
                    <Terminal className="w-5 h-5" />
                    View API Docs
                  </Button>
                </Link>
              </div>

              <p className="text-sm text-muted-foreground flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  Free tier available
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  No credit card
                </span>
              </p>
            </div>

            {/* Hero visual */}
            <div className="relative hidden lg:block">
              <div className="relative">
                {/* Main card */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                        <Bot className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium">Claude Assistant</p>
                        <p className="text-xs text-muted-foreground">cred_abc123...</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-xs font-medium text-emerald-400">Verified</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                      <p className="text-xs text-muted-foreground mb-1">Trust Score</p>
                      <div className="flex items-center gap-3">
                        <TrustRing score={94} size={48} />
                        <span className="font-display text-2xl font-bold">94</span>
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                      <p className="text-xs text-muted-foreground mb-1">Verifications</p>
                      <p className="font-display text-2xl font-bold">12.4K</p>
                    </div>
                  </div>
                </div>

                {/* Floating cards */}
                <div className="absolute -left-8 top-8 animate-float">
                  <div className="px-4 py-3 rounded-xl border border-white/10 bg-black/80 backdrop-blur-sm shadow-2xl">
                    <div className="flex items-center gap-3">
                      <TrustRing score={87} size={36} />
                      <div>
                        <p className="font-medium text-sm">GPT Agent</p>
                        <p className="text-xs text-emerald-400">Verified</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute -right-4 bottom-8 animate-float" style={{ animationDelay: '2s' }}>
                  <div className="px-4 py-3 rounded-xl border border-white/10 bg-black/80 backdrop-blur-sm shadow-2xl">
                    <div className="flex items-center gap-3">
                      <TrustRing score={91} size={36} />
                      <div>
                        <p className="font-medium text-sm">Data Agent</p>
                        <p className="text-xs text-emerald-400">Verified</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 border-y border-white/5">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <AnimatedCounter value="10K+" />
              <p className="text-sm text-muted-foreground mt-1">Credentials Issued</p>
            </div>
            <div>
              <AnimatedCounter value="<50" suffix="ms" />
              <p className="text-sm text-muted-foreground mt-1">Verification Time</p>
            </div>
            <div>
              <AnimatedCounter value="99.9" suffix="%" />
              <p className="text-sm text-muted-foreground mt-1">Uptime</p>
            </div>
            <div>
              <AnimatedCounter value="500+" />
              <p className="text-sm text-muted-foreground mt-1">Active Issuers</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16 stagger">
            <p className="text-muted-foreground font-medium mb-3">How It Works</p>
            <h2 className="font-display text-4xl font-bold mb-4">Three steps to trusted agents</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Issue verifiable credentials for your AI agents in minutes
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            <StepCard step={1} icon={Key} title="Issue Credentials" description="Create cryptographically signed credentials with specific permissions." />
            <StepCard step={2} icon={Globe} title="Verify Anywhere" description="Services verify via public API. No account needed." />
            <StepCard step={3} icon={RefreshCw} title="Revoke Instantly" description="Compromised agent? Revoke access immediately." />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 border-y border-white/5 bg-white/[0.01]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <p className="text-muted-foreground font-medium mb-3">Features</p>
            <h2 className="font-display text-4xl font-bold">Everything you need</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 stagger">
            <FeatureCard icon={Shield} title="Ed25519 Signatures" description="Cryptographic signatures ensure credentials can't be forged." />
            <FeatureCard icon={Zap} title="Instant Verification" description="Public API verifies in under 50ms. No auth required." />
            <FeatureCard icon={Lock} title="Domain Verification" description="Prove domain ownership via DNS for verified status." />
            <FeatureCard icon={Bell} title="Webhooks" description="Get notified when credentials are verified or revoked." />
            <FeatureCard icon={TrendingUp} title="Trust Scores" description="Track agent reputation over time." />
            <FeatureCard icon={Users} title="Team Management" description="Role-based permissions and audit logs." />
          </div>
        </div>
      </section>

      {/* Code Example */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="stagger">
              <p className="text-muted-foreground font-medium mb-3 flex items-center gap-2">
                <Terminal className="w-4 h-4" />
                Developer Experience
              </p>
              <h2 className="font-display text-4xl font-bold mb-6">Verify in 3 lines</h2>
              <p className="text-muted-foreground mb-8 text-lg">
                Simple, fast, reliable. Integrate in minutes.
              </p>
              <div className="space-y-4">
                <Feature icon={CheckCircle} text="RESTful API with comprehensive docs" />
                <Feature icon={CheckCircle} text="SDKs for JavaScript, Python, Go" />
                <Feature icon={CheckCircle} text="99.9% uptime SLA on paid plans" />
              </div>
            </div>

            <div className="relative">
              <div className="rounded-2xl border border-white/10 bg-black overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-white/20" />
                      <div className="w-3 h-3 rounded-full bg-white/20" />
                      <div className="w-3 h-3 rounded-full bg-white/20" />
                    </div>
                    <span className="text-xs text-muted-foreground font-mono ml-2">verify.js</span>
                  </div>
                  <button onClick={handleCopyCode} className="p-1.5 rounded-md hover:bg-white/5 transition-colors">
                    {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                  </button>
                </div>
                <pre className="p-6 overflow-x-auto font-mono text-sm leading-relaxed">
                  <code>
                    <span className="text-muted-foreground">// Verify an agent credential</span>{'\n'}
                    <span className="text-white">const</span> {'{'} valid, agent {'}'} = <span className="text-white">await</span> fetch({'\n'}
                    {'  '}<span className="text-emerald-400">'https://api.agentid.dev/verify'</span>,{'\n'}
                    {'  '}{'{'}
                    {'\n'}
                    {'    '}method: <span className="text-emerald-400">'POST'</span>,{'\n'}
                    {'    '}body: JSON.stringify({'{'} credential {'}'}){'\n'}
                    {'  '}{'}'}{'\n'}
                    ).then(r {'=> '}r.json());{'\n'}
                    {'\n'}
                    <span className="text-white">if</span> (valid) {'{'}
                    {'\n'}
                    {'  '}<span className="text-muted-foreground">// Agent is trusted ✓</span>{'\n'}
                    {'  '}console.log(<span className="text-emerald-400">`Verified: </span>${'{'}agent.name{'}'}<span className="text-emerald-400">`</span>);{'\n'}
                    {'}'}
                  </code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-24 border-y border-white/5 bg-white/[0.01]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <p className="text-muted-foreground font-medium mb-3">Use Cases</p>
            <h2 className="font-display text-4xl font-bold mb-4">Real-world scenarios</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 stagger">
            <UseCaseCard icon={ShoppingCart} title="E-commerce" scenario="Shopping agents" solution="Verify spending limits" />
            <UseCaseCard icon={HeadphonesIcon} title="Support Bot" scenario="Data access" solution="Enforce permissions" />
            <UseCaseCard icon={CreditCard} title="Trading" scenario="Automated trades" solution="Verify limits" />
            <UseCaseCard icon={Bot} title="Multi-Agent" scenario="Cross-org collaboration" solution="Mutual verification" />
            <UseCaseCard icon={Database} title="Data Pipeline" scenario="Database access" solution="Read-only enforcement" />
            <UseCaseCard icon={Building2} title="Enterprise" scenario="API customers" solution="Tier enforcement" />
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <p className="text-muted-foreground font-medium mb-3">Comparison</p>
            <h2 className="font-display text-4xl font-bold mb-4">AgentID vs MCP</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <ComparisonCard
              icon={Fingerprint}
              title="AgentID"
              subtitle="Identity & Trust"
              description="WHO is this agent?"
              features={['Verifiable credentials', 'Trust scores', 'Permission enforcement', 'Instant revocation']}
              highlighted
            />
            <ComparisonCard
              icon={Cable}
              title="MCP"
              subtitle="Connectivity"
              description="HOW does it connect?"
              features={['Tool discovery', 'Context sharing', 'Multi-model support', 'Local-first design']}
            />
          </div>

          <p className="text-center mt-8 text-muted-foreground">
            <strong className="text-white">Use both:</strong> MCP for connectivity, AgentID for trust.
          </p>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 border-y border-white/5 bg-white/[0.01]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl font-bold mb-4">Simple pricing</h2>
            <p className="text-muted-foreground">Start free, scale as you grow</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto stagger">
            <PricingCard name="Free" price="$0" period="forever" features={['3 credentials', '500 verifications/mo', 'Public API']} />
            <PricingCard name="Pro" price="$29" period="/month" features={['25 credentials', '10K verifications/mo', 'Webhooks']} highlighted />
            <PricingCard name="Business" price="$99" period="/month" features={['100 credentials', '100K verifications/mo', 'Priority support']} />
          </div>

          <div className="text-center mt-8">
            <Link href="/pricing">
              <Button variant="outline" className="gap-2 border-white/10 hover:bg-white/5">
                View Full Pricing
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-glow" />
        <div className="relative max-w-4xl mx-auto px-4 text-center stagger">
          <LogoMark className="w-16 h-16 mx-auto mb-8" />
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
            Ready to start?
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
            Issue your first credential in minutes.
          </p>
          <Link href="/register">
            <Button size="lg" className="bg-white text-black hover:bg-white/90 gap-2 text-base px-8 h-14 font-medium btn-glow">
              Create Free Account
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <Link href="/" className="flex items-center gap-3 mb-4">
                <LogoMark />
                <span className="font-display text-xl font-bold">AgentID</span>
              </Link>
              <p className="text-sm text-muted-foreground">
                Trust infrastructure for AI agents.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="/docs" className="hover:text-white transition-colors">Documentation</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/directory" className="hover:text-white transition-colors">Directory</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="/docs#api" className="hover:text-white transition-colors">API Reference</Link></li>
                <li><Link href="https://github.com/agentid" className="hover:text-white transition-colors flex items-center gap-1">GitHub <ExternalLink className="w-3 h-3" /></Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} AgentID. All rights reserved.
            </p>
            <Link href="https://github.com/agentid" className="text-muted-foreground hover:text-white transition-colors">
              <Github className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Component definitions

function Feature({ icon: Icon, text }: { icon: typeof CheckCircle; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
        <Icon className="w-4 h-4 text-white" />
      </div>
      <span>{text}</span>
    </div>
  );
}

function StepCard({ step, icon: Icon, title, description }: { step: number; icon: typeof Key; title: string; description: string }) {
  return (
    <div className="relative text-center group">
      <div className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center mx-auto mb-6 font-display text-lg font-bold relative z-10">
        {step}
      </div>
      <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4 group-hover:border-white/20 transition-colors">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="font-display font-semibold text-lg mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }: { icon: typeof Shield; title: string; description: string }) {
  return (
    <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] card-hover group">
      <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 group-hover:bg-white/10 transition-colors">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="font-display font-semibold text-lg mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function UseCaseCard({ icon: Icon, title, scenario, solution }: { icon: typeof ShoppingCart; title: string; scenario: string; solution: string }) {
  return (
    <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] card-hover">
      <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="font-display font-semibold text-lg mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-2">{scenario}</p>
      <p className="text-sm text-white/70 flex items-center gap-1">
        <ArrowRight className="w-3 h-3" />
        {solution}
      </p>
    </div>
  );
}

function ComparisonCard({ icon: Icon, title, subtitle, description, features, highlighted }: {
  icon: typeof Fingerprint;
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  highlighted?: boolean;
}) {
  return (
    <div className={cn(
      'p-8 rounded-2xl border transition-all',
      highlighted ? 'border-white/20 bg-white/[0.03]' : 'border-white/10 bg-white/[0.01]'
    )}>
      <div className={cn(
        'w-14 h-14 rounded-xl flex items-center justify-center mb-6',
        highlighted ? 'bg-white text-black' : 'bg-white/10'
      )}>
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="font-display text-xl font-bold mb-1">{title}</h3>
      <p className={cn('text-sm font-medium mb-3', highlighted ? 'text-white' : 'text-muted-foreground')}>{subtitle}</p>
      <p className="text-muted-foreground mb-6">{description}</p>
      <ul className="space-y-2">
        {features.map((feature, i) => (
          <li key={i} className="flex items-center gap-2 text-sm">
            <CheckCircle className={cn('w-4 h-4', highlighted ? 'text-white' : 'text-muted-foreground')} />
            {feature}
          </li>
        ))}
      </ul>
    </div>
  );
}

function PricingCard({ name, price, period, features, highlighted }: {
  name: string;
  price: string;
  period: string;
  features: string[];
  highlighted?: boolean;
}) {
  return (
    <div className={cn(
      'p-6 rounded-2xl border text-center transition-all',
      highlighted ? 'border-white/20 bg-white/[0.03] scale-105' : 'border-white/10 bg-white/[0.01] hover:border-white/20'
    )}>
      {highlighted && (
        <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white text-black text-xs font-medium mb-4">
          <Sparkles className="w-3 h-3" />
          Popular
        </div>
      )}
      <h3 className="font-display font-semibold text-lg mb-2">{name}</h3>
      <div className="mb-4">
        <span className="font-display text-4xl font-bold">{price}</span>
        <span className="text-muted-foreground">{period}</span>
      </div>
      <ul className="space-y-2 text-sm text-muted-foreground mb-6">
        {features.map((feature, i) => (
          <li key={i}>{feature}</li>
        ))}
      </ul>
      <Link href="/register">
        <Button
          variant={highlighted ? 'default' : 'outline'}
          className={cn('w-full', highlighted ? 'bg-white text-black hover:bg-white/90' : 'border-white/10 hover:bg-white/5')}
        >
          Get Started
        </Button>
      </Link>
    </div>
  );
}
