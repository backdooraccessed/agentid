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
  Stamp,
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

// SVG Seal Component
function SealMark({ className, animate = false }: { className?: string; animate?: boolean }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={cn('w-full h-full', animate && 'animate-seal', className)}
      fill="none"
    >
      <defs>
        <linearGradient id="copper-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#d4956a" />
          <stop offset="50%" stopColor="#e8b089" />
          <stop offset="100%" stopColor="#d4956a" />
        </linearGradient>
      </defs>
      {/* Outer ring */}
      <circle cx="50" cy="50" r="46" stroke="url(#copper-grad)" strokeWidth="2" fill="none" />
      <circle cx="50" cy="50" r="40" stroke="url(#copper-grad)" strokeWidth="1" fill="none" opacity="0.5" />
      {/* Inner content */}
      <text x="50" y="35" textAnchor="middle" fill="#d4956a" fontSize="8" fontFamily="'Clash Display', sans-serif" fontWeight="600">
        AGENT
      </text>
      <text x="50" y="58" textAnchor="middle" fill="#e8b089" fontSize="14" fontFamily="'Clash Display', sans-serif" fontWeight="700">
        ID
      </text>
      <text x="50" y="72" textAnchor="middle" fill="#d4956a" fontSize="6" fontFamily="'Clash Display', sans-serif">
        VERIFIED
      </text>
      {/* Decorative elements */}
      <line x1="25" y1="45" x2="35" y2="45" stroke="#d4956a" strokeWidth="1" />
      <line x1="65" y1="45" x2="75" y2="45" stroke="#d4956a" strokeWidth="1" />
      <circle cx="50" cy="82" r="2" fill="#d4956a" />
    </svg>
  );
}

// Trust Score Ring Component
function TrustRing({ score, size = 80 }: { score: number; size?: number }) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const circumference = 2 * Math.PI * 35;
  const offset = circumference - (animatedScore / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 100);
    return () => clearTimeout(timer);
  }, [score]);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
        <defs>
          <linearGradient id="trust-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8b6b4a" />
            <stop offset="100%" stopColor="#e8b089" />
          </linearGradient>
        </defs>
        <circle
          cx="40"
          cy="40"
          r="35"
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          className="text-obsidian-600"
        />
        <circle
          cx="40"
          cy="40"
          r="35"
          fill="none"
          stroke="url(#trust-gradient)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-display text-xl font-bold text-copper">{animatedScore}</span>
      </div>
    </div>
  );
}

// Animated Counter Component
function AnimatedCounter({ value, suffix = '' }: { value: string; suffix?: string }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={cn('transition-all duration-700', isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4')}>
      <span className="font-display text-4xl font-bold gradient-text-copper">{value}</span>
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
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 transition-transform group-hover:scale-110">
              <SealMark />
            </div>
            <span className="font-display text-xl font-bold">
              Agent<span className="text-copper">ID</span>
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm">
            <Link href="/docs" className="text-muted-foreground hover:text-copper transition-colors">
              Docs
            </Link>
            <Link href="/directory" className="text-muted-foreground hover:text-copper transition-colors">
              Directory
            </Link>
            <Link href="/pricing" className="text-muted-foreground hover:text-copper transition-colors">
              Pricing
            </Link>
            <Link href="https://github.com/agentid" className="text-muted-foreground hover:text-copper transition-colors flex items-center gap-1">
              <Github className="w-4 h-4" />
              GitHub
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="bg-copper hover:bg-copper-600 text-obsidian-900 font-medium btn-glow">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-grid" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-radial from-copper/10 via-transparent to-transparent blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-radial from-copper/5 via-transparent to-transparent blur-3xl" />
        </div>

        <div className="max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Text content */}
            <div className="space-y-8 stagger">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-copper/20 bg-copper/5 text-copper text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                Trust Infrastructure for AI Agents
              </div>

              <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
                <span className="text-foreground">Seal of</span>
                <br />
                <span className="gradient-text-copper">Trust</span>
                <br />
                <span className="text-foreground">for AI</span>
              </h1>

              <p className="text-xl text-muted-foreground max-w-lg leading-relaxed">
                Issue verifiable credentials. Verify identity in milliseconds.
                Build reputation over time.
              </p>

              <div className="flex flex-col sm:flex-row items-start gap-4 pt-4">
                <Link href="/register">
                  <Button size="lg" className="bg-copper hover:bg-copper-600 text-obsidian-900 gap-2 text-base px-8 h-14 font-medium shadow-glow-lg hover:shadow-glow-xl transition-all">
                    Start Issuing Free
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
                <Link href="/docs">
                  <Button size="lg" variant="outline" className="gap-2 text-base px-8 h-14 border-border hover:border-copper/50 hover:bg-copper/5">
                    <Terminal className="w-5 h-5" />
                    View API Docs
                  </Button>
                </Link>
              </div>

              <p className="text-sm text-muted-foreground flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-patina" />
                  Free tier available
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-patina" />
                  No credit card
                </span>
              </p>
            </div>

            {/* Right: Seal visualization */}
            <div className="relative hidden lg:block">
              <div className="absolute inset-0 bg-gradient-radial from-copper/20 via-transparent to-transparent blur-3xl" />
              <div className="relative w-80 h-80 mx-auto animate-float">
                <div className="absolute inset-0 animate-glow-pulse rounded-full" />
                <SealMark animate />
              </div>
              {/* Floating credential cards */}
              <div className="absolute -left-8 top-1/4 animate-float" style={{ animationDelay: '1s' }}>
                <MiniCredentialCard name="Claude" score={94} />
              </div>
              <div className="absolute -right-4 bottom-1/4 animate-float" style={{ animationDelay: '2s' }}>
                <MiniCredentialCard name="GPT Agent" score={87} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y border-border/50">
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
            <p className="text-copper font-medium mb-3 flex items-center justify-center gap-2">
              <Stamp className="w-4 h-4" />
              How It Works
            </p>
            <h2 className="font-display text-4xl font-bold mb-4">Three steps to trusted agents</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Issue verifiable credentials for your AI agents in minutes
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connection line */}
            <div className="hidden md:block absolute top-24 left-[20%] right-[20%] h-px bg-gradient-to-r from-transparent via-copper/30 to-transparent" />

            <StepCard
              step={1}
              icon={Key}
              title="Issue Credentials"
              description="Create cryptographically signed credentials for your AI agents with specific permissions and constraints."
            />
            <StepCard
              step={2}
              icon={Globe}
              title="Verify Anywhere"
              description="Services verify credentials via our public API. No account needed — just trust."
            />
            <StepCard
              step={3}
              icon={RefreshCw}
              title="Revoke Instantly"
              description="Compromised agent? Revoke access immediately. All verifications fail instantly."
            />
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-obsidian-800/50" />
        <div className="relative max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <p className="text-copper font-medium mb-3">Features</p>
            <h2 className="font-display text-4xl font-bold mb-4">Everything you need</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 stagger">
            <FeatureCard
              icon={Shield}
              title="Ed25519 Signatures"
              description="Cryptographic signatures ensure credentials can't be forged or tampered with."
            />
            <FeatureCard
              icon={Zap}
              title="Instant Verification"
              description="Public API verifies credentials in under 50ms. No authentication required."
            />
            <FeatureCard
              icon={Lock}
              title="Domain Verification"
              description="Prove domain ownership via DNS. Build trust with verified issuer status."
            />
            <FeatureCard
              icon={Bell}
              title="Webhooks"
              description="Get notified when credentials are verified, expired, or revoked."
            />
            <FeatureCard
              icon={TrendingUp}
              title="Trust Scores"
              description="Track agent reputation over time. Higher scores unlock more trust."
            />
            <FeatureCard
              icon={Users}
              title="Team Management"
              description="Invite team members with role-based permissions and audit logs."
            />
          </div>
        </div>
      </section>

      {/* Code Example */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="stagger">
              <p className="text-copper font-medium mb-3 flex items-center gap-2">
                <Terminal className="w-4 h-4" />
                Developer Experience
              </p>
              <h2 className="font-display text-4xl font-bold mb-6">Verify in 3 lines of code</h2>
              <p className="text-muted-foreground mb-8 text-lg">
                Our API is designed for developers. Simple, fast, and reliable.
                Integrate in minutes, not days.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-foreground">
                  <div className="w-8 h-8 rounded-lg bg-copper/10 flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-copper" />
                  </div>
                  <span>RESTful API with comprehensive docs</span>
                </div>
                <div className="flex items-center gap-3 text-foreground">
                  <div className="w-8 h-8 rounded-lg bg-copper/10 flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-copper" />
                  </div>
                  <span>SDKs for JavaScript, Python, Go</span>
                </div>
                <div className="flex items-center gap-3 text-foreground">
                  <div className="w-8 h-8 rounded-lg bg-copper/10 flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-copper" />
                  </div>
                  <span>99.9% uptime SLA on paid plans</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-copper/20 via-copper/10 to-transparent blur-2xl rounded-3xl" />
              <div className="relative rounded-2xl border border-border bg-obsidian-900 overflow-hidden shadow-2xl">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-obsidian-800">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500/80" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                      <div className="w-3 h-3 rounded-full bg-green-500/80" />
                    </div>
                    <span className="text-xs text-muted-foreground font-mono ml-2">verify.js</span>
                  </div>
                  <button
                    onClick={handleCopyCode}
                    className="p-1.5 rounded-md hover:bg-obsidian-700 transition-colors"
                  >
                    {copiedCode ? (
                      <Check className="w-4 h-4 text-patina" />
                    ) : (
                      <Copy className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
                <pre className="p-6 overflow-x-auto font-mono text-sm leading-relaxed">
                  <code>
                    <span className="text-muted-foreground">// Verify an agent credential</span>{'\n'}
                    <span className="text-copper">const</span> {'{'} valid, agent {'}'} = <span className="text-copper">await</span> <span className="text-copper-300">fetch</span>({'\n'}
                    {'  '}<span className="text-patina">'https://api.agentid.dev/verify'</span>,{'\n'}
                    {'  '}{'{'}
                    {'\n'}
                    {'    '}method: <span className="text-patina">'POST'</span>,{'\n'}
                    {'    '}body: <span className="text-copper-300">JSON</span>.<span className="text-copper-300">stringify</span>({'{'} credential {'}'}){'\n'}
                    {'  '}{'}'}{'\n'}
                    ).<span className="text-copper-300">then</span>(r {'=> '}r.<span className="text-copper-300">json</span>());{'\n'}
                    {'\n'}
                    <span className="text-copper">if</span> (valid) {'{'}
                    {'\n'}
                    {'  '}<span className="text-muted-foreground">// Agent is trusted ✓</span>{'\n'}
                    {'  '}<span className="text-copper-300">console</span>.<span className="text-copper-300">log</span>(<span className="text-patina">`Verified: </span>${'{'}agent.name{'}'}<span className="text-patina">`</span>);{'\n'}
                    {'}'}
                  </code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-obsidian-800/50" />
        <div className="relative max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <p className="text-copper font-medium mb-3">Use Cases</p>
            <h2 className="font-display text-4xl font-bold mb-4">Real-world scenarios</h2>
            <p className="text-muted-foreground">See how companies secure their AI agents</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 stagger">
            <UseCaseCard
              icon={ShoppingCart}
              title="E-commerce Agent"
              scenario="Shopping agents making purchases"
              solution="Verify spending limits and merchant authorization"
            />
            <UseCaseCard
              icon={HeadphonesIcon}
              title="Support Bot"
              scenario="Bots accessing user data"
              solution="Enforce read-only permissions and audit access"
            />
            <UseCaseCard
              icon={CreditCard}
              title="Trading Agent"
              scenario="Automated trading on exchanges"
              solution="Verify trading limits and allowed pairs"
            />
            <UseCaseCard
              icon={Bot}
              title="Multi-Agent Systems"
              scenario="Agents from different orgs collaborating"
              solution="Mutual verification before sharing data"
            />
            <UseCaseCard
              icon={Database}
              title="Data Pipeline"
              scenario="ETL agents accessing databases"
              solution="Grant read-only access, prevent destructive ops"
            />
            <UseCaseCard
              icon={Building2}
              title="Enterprise SaaS"
              scenario="Customer agents using your API"
              solution="Enforce tier limits and track usage"
            />
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <p className="text-copper font-medium mb-3">Comparison</p>
            <h2 className="font-display text-4xl font-bold mb-4">AgentID vs MCP</h2>
            <p className="text-muted-foreground">Different problems, complementary solutions</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <ComparisonCard
              icon={Fingerprint}
              title="AgentID"
              subtitle="Identity & Trust"
              description="WHO is this agent? CAN I trust it?"
              features={['Verifiable credentials', 'Trust scores', 'Permission enforcement', 'Instant revocation']}
              highlighted
            />
            <ComparisonCard
              icon={Cable}
              title="MCP"
              subtitle="Connectivity"
              description="HOW does this agent connect to tools?"
              features={['Tool discovery', 'Context sharing', 'Multi-model support', 'Local-first design']}
            />
          </div>

          <p className="text-center mt-8 text-muted-foreground">
            <strong className="text-foreground">Use both:</strong> MCP for connectivity, AgentID for trust.
          </p>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-obsidian-800/50" />
        <div className="relative max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl font-bold mb-4">Simple, transparent pricing</h2>
            <p className="text-muted-foreground">Start free, scale as you grow</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto stagger">
            <PricingCard
              name="Free"
              price="$0"
              period="forever"
              features={['3 credentials', '500 verifications/mo', 'Public API']}
            />
            <PricingCard
              name="Pro"
              price="$29"
              period="/month"
              features={['25 credentials', '10K verifications/mo', 'Webhooks & Analytics']}
              highlighted
            />
            <PricingCard
              name="Business"
              price="$99"
              period="/month"
              features={['100 credentials', '100K verifications/mo', 'Priority support']}
            />
          </div>

          <div className="text-center mt-8">
            <Link href="/pricing">
              <Button variant="outline" className="gap-2 border-border hover:border-copper/50">
                View Full Pricing
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-copper/10 via-transparent to-transparent" />
        <div className="relative max-w-4xl mx-auto px-4 text-center stagger">
          <div className="w-24 h-24 mx-auto mb-8">
            <SealMark animate />
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
            Ready to issue your first credential?
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
            Join developers building the future of AI agent trust.
            Get started in minutes.
          </p>
          <Link href="/register">
            <Button size="lg" className="bg-copper hover:bg-copper-600 text-obsidian-900 gap-2 text-base px-8 h-14 font-medium shadow-glow-lg hover:shadow-glow-xl">
              Create Free Account
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <Link href="/" className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8">
                  <SealMark />
                </div>
                <span className="font-display text-xl font-bold">
                  Agent<span className="text-copper">ID</span>
                </span>
              </Link>
              <p className="text-sm text-muted-foreground">
                Trust infrastructure for the AI agent economy.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Product</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="/docs" className="hover:text-copper transition-colors">Documentation</Link></li>
                <li><Link href="/pricing" className="hover:text-copper transition-colors">Pricing</Link></li>
                <li><Link href="/directory" className="hover:text-copper transition-colors">Directory</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Resources</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="/docs#api" className="hover:text-copper transition-colors">API Reference</Link></li>
                <li><Link href="/docs#getting-started" className="hover:text-copper transition-colors">Getting Started</Link></li>
                <li><Link href="https://github.com/agentid" className="hover:text-copper transition-colors flex items-center gap-1">GitHub <ExternalLink className="w-3 h-3" /></Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Legal</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="/privacy" className="hover:text-copper transition-colors">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-copper transition-colors">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} AgentID. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link href="https://github.com/agentid" className="text-muted-foreground hover:text-copper transition-colors">
                <Github className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Component definitions

function MiniCredentialCard({ name, score }: { name: string; score: number }) {
  return (
    <div className="px-4 py-3 rounded-xl border border-border bg-card/80 backdrop-blur-sm shadow-lg">
      <div className="flex items-center gap-3">
        <TrustRing score={score} size={40} />
        <div>
          <p className="font-medium text-sm">{name}</p>
          <p className="text-xs text-patina flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Verified
          </p>
        </div>
      </div>
    </div>
  );
}

function StepCard({ step, icon: Icon, title, description }: { step: number; icon: typeof Key; title: string; description: string }) {
  return (
    <div className="relative text-center group">
      <div className="w-14 h-14 rounded-full bg-copper text-obsidian-900 flex items-center justify-center mx-auto mb-6 font-display text-xl font-bold shadow-glow group-hover:shadow-glow-lg transition-shadow relative z-10">
        {step}
      </div>
      <div className="w-16 h-16 rounded-2xl bg-obsidian-800 border border-border flex items-center justify-center mx-auto mb-4 group-hover:border-copper/30 transition-colors">
        <Icon className="w-7 h-7 text-copper" />
      </div>
      <h3 className="font-display font-semibold text-lg mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }: { icon: typeof Shield; title: string; description: string }) {
  return (
    <div className="p-6 rounded-2xl border border-border bg-card card-hover group">
      <div className="w-12 h-12 rounded-xl bg-copper/10 border border-copper/20 flex items-center justify-center mb-4 group-hover:bg-copper/20 transition-colors">
        <Icon className="w-6 h-6 text-copper" />
      </div>
      <h3 className="font-display font-semibold text-lg mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function UseCaseCard({ icon: Icon, title, scenario, solution }: { icon: typeof ShoppingCart; title: string; scenario: string; solution: string }) {
  return (
    <div className="p-6 rounded-2xl border border-border bg-card card-hover">
      <div className="w-12 h-12 rounded-xl bg-copper/10 border border-copper/20 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-copper" />
      </div>
      <h3 className="font-display font-semibold text-lg mb-3">{title}</h3>
      <p className="text-sm text-muted-foreground mb-2">{scenario}</p>
      <p className="text-sm text-patina font-medium flex items-center gap-1">
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
      highlighted
        ? 'border-copper/30 bg-copper/5 shadow-glow'
        : 'border-border bg-card'
    )}>
      <div className={cn(
        'w-14 h-14 rounded-xl flex items-center justify-center mb-6',
        highlighted ? 'bg-copper text-obsidian-900' : 'bg-obsidian-700'
      )}>
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="font-display text-xl font-bold mb-1">{title}</h3>
      <p className={cn('text-sm font-medium mb-3', highlighted ? 'text-copper' : 'text-muted-foreground')}>{subtitle}</p>
      <p className="text-muted-foreground mb-6">{description}</p>
      <ul className="space-y-2">
        {features.map((feature, i) => (
          <li key={i} className="flex items-center gap-2 text-sm">
            <CheckCircle className={cn('w-4 h-4', highlighted ? 'text-copper' : 'text-muted-foreground')} />
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
      highlighted
        ? 'border-copper bg-copper/5 scale-105 shadow-glow-lg'
        : 'border-border bg-card hover:border-copper/30'
    )}>
      {highlighted && (
        <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-copper text-obsidian-900 text-xs font-medium mb-4">
          <Sparkles className="w-3 h-3" />
          Most Popular
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
          className={cn('w-full', highlighted && 'bg-copper hover:bg-copper-600 text-obsidian-900')}
        >
          Get Started
        </Button>
      </Link>
    </div>
  );
}
