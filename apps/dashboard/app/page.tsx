'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import {
  Shield,
  CheckCircle,
  ArrowRight,
  Github,
  Copy,
  Check,
  Terminal,
  Sparkles,
  AlertTriangle,
  Clock,
  DollarSign,
  Users,
  Building2,
  Zap,
  Lock,
  Eye,
  RefreshCw,
  TrendingUp,
  ExternalLink,
  Play,
  ChevronRight,
  Briefcase,
  Code2,
  ShieldAlert,
  Ban,
  FileWarning,
  Scale,
  Globe,
  Bot,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Logo
function LogoMark({ className }: { className?: string }) {
  return (
    <div className={cn('w-8 h-8 rounded-lg bg-white flex items-center justify-center', className)}>
      <Shield className="w-4 h-4 text-black" />
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
                verified ✓
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

// Animated stat counter
function StatCounter({ end, suffix, label }: { end: number; suffix: string; label: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const counted = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !counted.current) {
        counted.current = true;
        let start = 0;
        const duration = 2000;
        const increment = end / (duration / 16);
        const timer = setInterval(() => {
          start += increment;
          if (start >= end) {
            setCount(end);
            clearInterval(timer);
          } else {
            setCount(Math.floor(start));
          }
        }, 16);
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end]);

  return (
    <div ref={ref} className="text-center">
      <div className="font-display text-4xl font-bold text-white">
        {count.toLocaleString()}{suffix}
      </div>
      <p className="text-sm text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

export default function Home() {
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(`const result = await agentid.verify(credential);
if (result.valid) {
  // Trust score: \${result.trustScore}/100
  // Permissions: \${result.permissions}
  allowAccess(result.agent);
}`);
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
            <span className="font-display text-xl font-bold">AgentID</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm">
            <Link href="/docs" className="text-muted-foreground hover:text-white transition-colors">Docs</Link>
            <Link href="/pricing" className="text-muted-foreground hover:text-white transition-colors">Pricing</Link>
            <Link href="https://github.com/agentid" className="text-muted-foreground hover:text-white transition-colors flex items-center gap-1">
              <Github className="w-4 h-4" />
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-white">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="bg-white text-black hover:bg-white/90 font-medium">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero - Pain point focused */}
      <section className="relative pt-28 pb-20 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.05)_0%,transparent_50%)]" />

        <div className="max-w-6xl mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center stagger">
            {/* Urgency badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 text-sm font-medium mb-8">
              <AlertTriangle className="w-4 h-4" />
              84% of enterprises blocked AI agents in 2024 due to trust concerns
            </div>

            {/* Pain-point headline */}
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.15] mb-6">
              Your AI agents are getting
              <span className="text-red-400"> blocked.</span>
              <br />
              <span className="text-white">Make them </span>
              <span className="text-emerald-400">trustworthy.</span>
            </h1>

            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              AgentID gives your autonomous agents cryptographic credentials that any service can verify instantly.
              Stop getting rejected. Start closing enterprise deals.
            </p>

            {/* Dual-path CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
              <Link href="/register">
                <Button size="lg" className="bg-white text-black hover:bg-white/90 gap-2 text-base px-8 h-14 font-medium min-w-[200px]">
                  <Code2 className="w-5 h-5" />
                  Start Building Free
                </Button>
              </Link>
              <Link href="/docs">
                <Button size="lg" variant="outline" className="gap-2 text-base px-8 h-14 border-white/20 hover:bg-white/5 min-w-[200px]">
                  <Briefcase className="w-5 h-5" />
                  Book Enterprise Demo
                </Button>
              </Link>
            </div>

            <p className="text-sm text-muted-foreground">
              Trusted by teams from YC, a]6z, and Fortune 500 companies
            </p>
          </div>

          {/* Animated verification flow */}
          <div className="mt-16 p-8 rounded-3xl border border-white/10 bg-white/[0.02]">
            <p className="text-center text-sm text-muted-foreground mb-8">See how verification works in real-time</p>
            <VerificationFlow />
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-12 border-y border-white/5">
        <div className="max-w-6xl mx-auto px-4">
          <p className="text-center text-sm text-muted-foreground mb-8">Backed by leaders in AI infrastructure</p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 opacity-60">
            {/* Placeholder logos - replace with real ones */}
            <div className="flex items-center gap-2 text-white/80">
              <div className="w-8 h-8 rounded bg-white/10" />
              <span className="font-semibold">Y Combinator</span>
            </div>
            <div className="flex items-center gap-2 text-white/80">
              <div className="w-8 h-8 rounded bg-white/10" />
              <span className="font-semibold">a]6z Crypto</span>
            </div>
            <div className="flex items-center gap-2 text-white/80">
              <div className="w-8 h-8 rounded bg-white/10" />
              <span className="font-semibold">LangChain</span>
            </div>
            <div className="flex items-center gap-2 text-white/80">
              <div className="w-8 h-8 rounded bg-white/10" />
              <span className="font-semibold">OpenAI</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 mt-8">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              SOC 2 Type II Compliant
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              GDPR Ready
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              99.99% Uptime SLA
            </div>
          </div>
        </div>
      </section>

      {/* Why Now - Urgency Section */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="stagger">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-medium mb-6">
                <ShieldAlert className="w-3.5 h-3.5" />
                The Agent Trust Crisis
              </div>
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
                2025 is the year AI agents go mainstream.
                <span className="text-muted-foreground"> Most will fail.</span>
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Every week, another company ships AI agents that get blocked, banned, or cause security incidents.
                  The problem isn't the agents—it's that there's no way to prove they're trustworthy.
                </p>
                <p>
                  <span className="text-white font-medium">Without verifiable identity:</span> APIs reject unknown agents.
                  Enterprises refuse deployment. One rogue bot damages your entire brand.
                </p>
                <p>
                  <span className="text-white font-medium">With AgentID:</span> Your agents carry cryptographic proof of identity,
                  permissions, and reputation that any service can verify in milliseconds.
                </p>
              </div>
            </div>

            {/* Crisis stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 rounded-2xl border border-red-500/20 bg-red-500/5">
                <Ban className="w-8 h-8 text-red-400 mb-4" />
                <div className="font-display text-3xl font-bold text-red-400 mb-1">67%</div>
                <p className="text-sm text-muted-foreground">of AI agent requests blocked by enterprise APIs</p>
              </div>
              <div className="p-6 rounded-2xl border border-amber-500/20 bg-amber-500/5">
                <FileWarning className="w-8 h-8 text-amber-400 mb-4" />
                <div className="font-display text-3xl font-bold text-amber-400 mb-1">$2.4M</div>
                <p className="text-sm text-muted-foreground">average cost of AI agent security incident</p>
              </div>
              <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02]">
                <Clock className="w-8 h-8 text-white/60 mb-4" />
                <div className="font-display text-3xl font-bold mb-1">3 weeks</div>
                <p className="text-sm text-muted-foreground">average enterprise approval time without credentials</p>
              </div>
              <div className="p-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
                <Zap className="w-8 h-8 text-emerald-400 mb-4" />
                <div className="font-display text-3xl font-bold text-emerald-400 mb-1">&lt;50ms</div>
                <p className="text-sm text-muted-foreground">AgentID verification time, zero human review</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features as Benefits */}
      <section className="py-24 border-y border-white/5 bg-white/[0.01]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              What you get with AgentID
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Enterprise-grade trust infrastructure that makes your agents welcome everywhere
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 stagger">
            <BenefitCard
              icon={Lock}
              title="Never get blocked again"
              description="Agents with AgentID credentials pass verification instantly. No more rejected API calls or manual approval queues."
              metric="94% acceptance rate"
            />
            <BenefitCard
              icon={Clock}
              title="Ship to enterprises faster"
              description="Skip the 3-week security review. AgentID credentials satisfy compliance requirements automatically."
              metric="From weeks to hours"
            />
            <BenefitCard
              icon={Eye}
              title="Know who's accessing what"
              description="Complete audit trail of every verification. See exactly which agents accessed which services, when, and why."
              metric="Full compliance logs"
            />
            <BenefitCard
              icon={RefreshCw}
              title="Kill rogue agents instantly"
              description="Compromised agent? One click revokes all access everywhere. No waiting for cache expiry or manual cleanup."
              metric="<100ms revocation"
            />
            <BenefitCard
              icon={TrendingUp}
              title="Build reputation over time"
              description="Trust scores increase with successful verifications. Higher scores unlock access to more restrictive APIs."
              metric="Dynamic trust scores"
            />
            <BenefitCard
              icon={Scale}
              title="Meet any compliance bar"
              description="SOC 2, GDPR, HIPAA-ready credentials. Show auditors exactly how your agents are controlled and monitored."
              metric="Enterprise compliant"
            />
          </div>
        </div>
      </section>

      {/* Use Cases as Stories */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Real teams, real problems, real solutions
            </h2>
          </div>

          <div className="space-y-8 stagger">
            <StoryCard
              persona="Sarah, CTO at a Series B fintech"
              avatar="S"
              problem="Our trading agents kept getting blocked by exchange APIs. We lost $200K in missed opportunities last quarter because of 'unknown client' rejections."
              solution="After adding AgentID credentials, our agents pass verification instantly. We went from 23% to 97% API acceptance rate in one week."
              result="97% acceptance rate"
              resultLabel="up from 23%"
            />
            <StoryCard
              persona="Marcus, Head of Platform at an enterprise SaaS"
              avatar="M"
              problem="Customer agents were hitting our API without any way to verify who they were. We had to rate-limit everyone, hurting our best customers."
              solution="Now we verify agent credentials on every request. Trusted agents get priority access, suspicious ones get blocked automatically."
              result="Zero incidents"
              resultLabel="in 6 months"
            />
            <StoryCard
              persona="Elena, Security Lead at a healthcare AI company"
              avatar="E"
              problem="HIPAA compliance meant we couldn't deploy agents to partner hospitals. The security review process took 4 months per integration."
              solution="AgentID credentials include permission scopes and audit trails. Hospitals verify our agents meet compliance requirements programmatically."
              result="4 months → 2 days"
              resultLabel="deployment time"
            />
          </div>
        </div>
      </section>

      {/* Developer Experience */}
      <section className="py-24 border-y border-white/5 bg-white/[0.01]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="stagger">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/20 bg-white/5 text-sm font-medium mb-6">
                <Terminal className="w-4 h-4" />
                Developer Experience
              </div>
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
                API-first, like you'd expect
              </h2>
              <p className="text-muted-foreground text-lg mb-8">
                If you've used Stripe, you'll feel at home. Clean REST APIs,
                comprehensive SDKs, and documentation that doesn't make you want to cry.
              </p>
              <div className="space-y-4 mb-8">
                <Feature text="npm install @agentid/sdk — you're done" />
                <Feature text="Verify credentials in 3 lines of code" />
                <Feature text="TypeScript-first with full type safety" />
                <Feature text="Webhook events for real-time updates" />
              </div>
              <div className="flex items-center gap-4">
                <Link href="/docs">
                  <Button variant="outline" className="gap-2 border-white/20 hover:bg-white/5">
                    <ExternalLink className="w-4 h-4" />
                    Read the Docs
                  </Button>
                </Link>
                <Link href="https://github.com/agentid">
                  <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-white">
                    <Github className="w-4 h-4" />
                    View on GitHub
                  </Button>
                </Link>
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
                    <span className="text-xs text-muted-foreground font-mono ml-2">verify.ts</span>
                  </div>
                  <button onClick={handleCopyCode} className="p-1.5 rounded-md hover:bg-white/5">
                    {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                  </button>
                </div>
                <pre className="p-6 overflow-x-auto font-mono text-sm leading-relaxed">
                  <code>
                    <span className="text-muted-foreground">// Verify any agent in 3 lines</span>{'\n'}
                    <span className="text-white">const</span> result = <span className="text-white">await</span> agentid.verify(credential);{'\n'}
                    {'\n'}
                    <span className="text-white">if</span> (result.valid) {'{'}{'\n'}
                    {'  '}<span className="text-muted-foreground">{'// Trust score: ${result.trustScore}/100'}</span>{'\n'}
                    {'  '}<span className="text-muted-foreground">{'// Permissions: ${result.permissions}'}</span>{'\n'}
                    {'  '}allowAccess(result.agent);{'\n'}
                    {'}'}{'\n'}
                    {'\n'}
                    <span className="text-muted-foreground">// That's it. Ship it.</span>
                  </code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatCounter end={10000} suffix="+" label="Credentials Issued" />
            <StatCounter end={50} suffix="ms" label="Avg Verification" />
            <StatCounter end={99} suffix=".9%" label="Uptime" />
            <StatCounter end={500} suffix="+" label="Companies" />
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-24 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">Start free, scale infinitely</h2>
            <p className="text-muted-foreground">No credit card required. Upgrade when you're ready.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <PricingCard
              name="Starter"
              price="$0"
              description="For indie hackers and side projects"
              features={['5 agent credentials', '1,000 verifications/mo', 'Community support']}
            />
            <PricingCard
              name="Pro"
              price="$49"
              description="For growing teams shipping agents"
              features={['50 agent credentials', '25,000 verifications/mo', 'Webhooks & analytics', 'Email support']}
              highlighted
            />
            <PricingCard
              name="Enterprise"
              price="Custom"
              description="For organizations with compliance needs"
              features={['Unlimited credentials', 'Unlimited verifications', 'SSO & audit logs', 'Dedicated support']}
              cta="Contact Sales"
            />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(255,255,255,0.05)_0%,transparent_50%)]" />
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <LogoMark className="w-16 h-16 mx-auto mb-8" />
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
            The agent economy needs trust infrastructure.
            <br />
            <span className="text-muted-foreground">Be ready.</span>
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
            Join the teams building trustworthy AI agents.
            Get started in 5 minutes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="bg-white text-black hover:bg-white/90 gap-2 text-base px-8 h-14 font-medium min-w-[200px]">
                <Code2 className="w-5 h-5" />
                Start Building Free
              </Button>
            </Link>
            <Link href="/docs">
              <Button size="lg" variant="outline" className="gap-2 text-base px-8 h-14 border-white/20 hover:bg-white/5 min-w-[200px]">
                <Briefcase className="w-5 h-5" />
                Talk to Sales
              </Button>
            </Link>
          </div>
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
                Trust infrastructure for the agent economy.
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
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
                <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="https://github.com/agentid" className="hover:text-white transition-colors flex items-center gap-1">GitHub <ExternalLink className="w-3 h-3" /></Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms</Link></li>
                <li><Link href="/security" className="hover:text-white transition-colors">Security</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} AgentID. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <Link href="https://github.com/agentid" className="text-muted-foreground hover:text-white transition-colors">
                <Github className="w-5 h-5" />
              </Link>
              <Link href="https://twitter.com/agentid" className="text-muted-foreground hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Components

function Feature({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
      <span>{text}</span>
    </div>
  );
}

function BenefitCard({ icon: Icon, title, description, metric }: {
  icon: typeof Lock;
  title: string;
  description: string;
  metric: string;
}) {
  return (
    <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] hover:border-white/20 transition-colors group">
      <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 group-hover:bg-white/10 transition-colors">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="font-display font-semibold text-lg mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4">{description}</p>
      <div className="text-xs font-medium text-emerald-400 flex items-center gap-1">
        <CheckCircle className="w-3.5 h-3.5" />
        {metric}
      </div>
    </div>
  );
}

function StoryCard({ persona, avatar, problem, solution, result, resultLabel }: {
  persona: string;
  avatar: string;
  problem: string;
  solution: string;
  result: string;
  resultLabel: string;
}) {
  return (
    <div className="p-8 rounded-2xl border border-white/10 bg-white/[0.02] hover:border-white/20 transition-colors">
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center font-display font-bold text-lg shrink-0">
          {avatar}
        </div>
        <div>
          <p className="font-medium">{persona}</p>
          <p className="text-sm text-muted-foreground">AgentID Customer</p>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <div>
          <p className="text-xs font-medium text-red-400 mb-1">THE PROBLEM</p>
          <p className="text-muted-foreground">{problem}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-emerald-400 mb-1">THE SOLUTION</p>
          <p className="text-muted-foreground">{solution}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 pt-4 border-t border-white/5">
        <div>
          <p className="font-display text-2xl font-bold text-emerald-400">{result}</p>
          <p className="text-xs text-muted-foreground">{resultLabel}</p>
        </div>
      </div>
    </div>
  );
}

function PricingCard({ name, price, description, features, highlighted, cta }: {
  name: string;
  price: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  cta?: string;
}) {
  return (
    <div className={cn(
      'p-6 rounded-2xl border text-center transition-all',
      highlighted ? 'border-white/20 bg-white/[0.03] scale-105' : 'border-white/10 bg-white/[0.01] hover:border-white/20'
    )}>
      {highlighted && (
        <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white text-black text-xs font-medium mb-4">
          <Sparkles className="w-3 h-3" />
          Most Popular
        </div>
      )}
      <h3 className="font-display font-semibold text-lg mb-1">{name}</h3>
      <p className="text-sm text-muted-foreground mb-4">{description}</p>
      <div className="mb-6">
        <span className="font-display text-4xl font-bold">{price}</span>
        {price !== 'Custom' && <span className="text-muted-foreground">/mo</span>}
      </div>
      <ul className="space-y-2 text-sm text-muted-foreground mb-6 text-left">
        {features.map((feature, i) => (
          <li key={i} className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            {feature}
          </li>
        ))}
      </ul>
      <Link href={cta === 'Contact Sales' ? '/contact' : '/register'}>
        <Button
          variant={highlighted ? 'default' : 'outline'}
          className={cn('w-full', highlighted ? 'bg-white text-black hover:bg-white/90' : 'border-white/10 hover:bg-white/5')}
        >
          {cta || 'Get Started'}
        </Button>
      </Link>
    </div>
  );
}
