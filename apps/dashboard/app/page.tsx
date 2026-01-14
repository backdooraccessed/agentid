'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Shield,
  CheckCircle,
  Zap,
  Code,
  ArrowRight,
  Github,
  ExternalLink,
  Bell,
  TrendingUp,
  Cable,
  Fingerprint,
  ShoppingCart,
  HeadphonesIcon,
  Bot,
  Building2,
  CreditCard,
  Database,
  Lock,
  Key,
  RefreshCw,
  Eye,
  AlertTriangle,
  Users,
  Globe,
  ChevronRight,
  Copy,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Logo, LogoIcon, LogoAnimated } from '@/components/brand/logo';
import { cn } from '@/lib/utils';

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-lg">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Logo size="md" />
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link href="/docs" className="text-muted-foreground hover:text-foreground transition-colors">
              Docs
            </Link>
            <Link href="/directory" className="text-muted-foreground hover:text-foreground transition-colors">
              Directory
            </Link>
            <Link href="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link href="https://github.com/agentid" className="text-muted-foreground hover:text-foreground transition-colors">
              GitHub
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-hero-pattern bg-hero-pattern opacity-50" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-radial from-indigo-500/20 via-transparent to-transparent blur-3xl" />
        </div>

        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center space-y-8 max-w-3xl mx-auto animate-fade-in-up">
            <Badge variant="secondary" className="px-4 py-1.5 animate-fade-in">
              Trust Infrastructure for AI Agents
            </Badge>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-balance">
              <span className="text-foreground">Ship </span>
              <span className="gradient-text">trusted</span>
              <span className="text-foreground"> AI agents</span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
              One dashboard to issue credentials, verify agents, and revoke access instantly.
              Stop getting blocked. Start closing deals.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link href="/register">
                <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 gap-2 text-base px-8 h-12 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all">
                  Get Started Free
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/docs">
                <Button size="lg" variant="outline" className="gap-2 text-base px-8 h-12">
                  View Documentation
                </Button>
              </Link>
            </div>

            <p className="text-sm text-muted-foreground">
              No credit card required • Free tier available
            </p>
          </div>

          {/* Hero Image/Animation */}
          <div className="mt-16 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 pointer-events-none h-32 bottom-0 top-auto" />
            <div className="relative mx-auto max-w-4xl animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              <div className="rounded-xl border bg-card shadow-2xl shadow-indigo-500/10 overflow-hidden">
                <div className="border-b bg-muted/30 px-4 py-3 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                  <div className="flex-1 text-center text-xs text-muted-foreground">
                    AgentID Dashboard
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  {/* Mock credential cards */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <MockCredentialCard
                      name="Shopping Assistant"
                      status="active"
                      trust={92}
                    />
                    <MockCredentialCard
                      name="Data Pipeline Agent"
                      status="active"
                      trust={88}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              AI agents are everywhere.
              <span className="text-muted-foreground"> But how do you know which ones to trust?</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 stagger-children">
            <ProblemCard
              icon={AlertTriangle}
              title="Agents get blocked"
              description="Services can't verify if an agent is legitimate, so they block it by default."
            />
            <ProblemCard
              icon={Eye}
              title="No identity standard"
              description="There's no universal way for agents to prove who they are and what they can do."
            />
            <ProblemCard
              icon={Shield}
              title="Trust erosion"
              description="One rogue agent can damage trust in your entire product and brand."
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">How It Works</Badge>
            <h2 className="text-3xl font-bold mb-4">Three steps to trusted agents</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Issue verifiable credentials for your AI agents in minutes
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connection line */}
            <div className="hidden md:block absolute top-16 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500" />

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
              description="Services verify credentials via our public API. No account needed to verify — just trust."
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
      <section className="py-20 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">Features</Badge>
            <h2 className="text-3xl font-bold mb-4">Everything you need to ship trusted agents</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
            <FeatureCard
              icon={Shield}
              title="Cryptographic Signatures"
              description="Ed25519 signatures ensure credentials can't be forged or tampered with."
            />
            <FeatureCard
              icon={Zap}
              title="Instant Verification"
              description="Public API verifies credentials in under 50ms. No authentication required."
            />
            <FeatureCard
              icon={Lock}
              title="Domain Verification"
              description="Prove you own your domain via DNS. Build trust with verified issuer status."
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
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="secondary" className="mb-4">Developer Experience</Badge>
              <h2 className="text-3xl font-bold mb-4">Verify agents in 3 lines of code</h2>
              <p className="text-muted-foreground mb-6">
                Our API is designed for developers. Simple, fast, and reliable.
                Integrate in minutes, not days.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  <span>RESTful API with comprehensive documentation</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  <span>SDKs for JavaScript, Python, and Go</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  <span>99.9% uptime SLA on paid plans</span>
                </div>
              </div>
            </div>
            <div>
              <CodeExample />
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">Use Cases</Badge>
            <h2 className="text-3xl font-bold mb-4">Real-world scenarios</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              See how companies use AgentID to secure their AI agents
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
            <UseCaseCard
              icon={ShoppingCart}
              title="E-commerce Agent"
              scenario="Shopping agents making purchases on behalf of users"
              solution="Verify spending limits and merchant authorization before processing orders"
            />
            <UseCaseCard
              icon={HeadphonesIcon}
              title="Support Bot"
              scenario="Customer service bots accessing user data"
              solution="Enforce read-only permissions and audit all data access"
            />
            <UseCaseCard
              icon={CreditCard}
              title="Trading Agent"
              scenario="Automated trading on exchanges"
              solution="Verify trading limits, allowed pairs, and daily volume caps"
            />
            <UseCaseCard
              icon={Bot}
              title="Multi-Agent Systems"
              scenario="Agents from different companies collaborating"
              solution="Mutual verification before sharing data or taking actions"
            />
            <UseCaseCard
              icon={Database}
              title="Data Pipeline"
              scenario="ETL agents accessing databases"
              solution="Grant read-only access, prevent destructive operations"
            />
            <UseCaseCard
              icon={Building2}
              title="Enterprise SaaS"
              scenario="Customer agents using your API"
              solution="Enforce tier limits and track usage per agent"
            />
          </div>
        </div>
      </section>

      {/* AgentID vs MCP */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">Comparison</Badge>
            <h2 className="text-3xl font-bold mb-4">AgentID vs MCP</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Different problems, complementary solutions
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <ComparisonCard
              icon={Fingerprint}
              title="AgentID"
              subtitle="Identity & Trust"
              description="WHO is this agent? CAN I trust it?"
              features={[
                'Verifiable credentials',
                'Trust scores & reputation',
                'Permission enforcement',
                'Instant revocation',
              ]}
              color="indigo"
            />
            <ComparisonCard
              icon={Cable}
              title="MCP"
              subtitle="Connectivity"
              description="HOW does this agent connect to tools?"
              features={[
                'Tool discovery protocol',
                'Context sharing',
                'Multi-model support',
                'Local-first design',
              ]}
              color="gray"
            />
          </div>

          <div className="text-center mt-8">
            <p className="text-muted-foreground">
              <strong>Use both:</strong> MCP for connectivity, AgentID for trust.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Simple, transparent pricing</h2>
            <p className="text-muted-foreground">Start free, scale as you grow</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <PricingCard
              name="Free"
              price="$0"
              period="forever"
              features={['3 agent credentials', '500 verifications/mo', 'Public API']}
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
              <Button variant="outline" className="gap-2">
                View Full Pricing
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <LogoAnimated size="xl" />
          <h2 className="text-3xl font-bold mt-8 mb-4">
            Ready to ship trusted AI agents?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Join the developers building the future of AI agent infrastructure.
            Get started in minutes.
          </p>
          <Link href="/register">
            <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 gap-2 text-base px-8 h-12 shadow-lg shadow-indigo-500/25">
              Create Free Account
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <Logo size="md" className="mb-4" />
              <p className="text-sm text-muted-foreground">
                Trust infrastructure for the AI agent economy.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/docs" className="hover:text-foreground transition-colors">Documentation</Link></li>
                <li><Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link></li>
                <li><Link href="/directory" className="hover:text-foreground transition-colors">Directory</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/docs#api" className="hover:text-foreground transition-colors">API Reference</Link></li>
                <li><Link href="/docs#getting-started" className="hover:text-foreground transition-colors">Getting Started</Link></li>
                <li><Link href="https://github.com/agentid" className="hover:text-foreground transition-colors">GitHub</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} AgentID. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <Link href="https://github.com/agentid" className="text-muted-foreground hover:text-foreground transition-colors">
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

function MockCredentialCard({ name, status, trust }: { name: string; status: string; trust: number }) {
  return (
    <div className="rounded-lg border bg-background p-4 animate-fade-in-up">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
            <Bot className="w-4 h-4 text-indigo-600" />
          </div>
          <span className="font-medium">{name}</span>
        </div>
        <Badge variant="active" className="gap-1">
          <CheckCircle className="w-3 h-3" />
          Active
        </Badge>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Trust Score</span>
        <span className="font-semibold text-emerald-600">{trust}</span>
      </div>
    </div>
  );
}

function ProblemCard({ icon: Icon, title, description }: { icon: typeof AlertTriangle; title: string; description: string }) {
  return (
    <div className="p-6 rounded-xl border bg-card hover:shadow-lg hover:border-red-200 dark:hover:border-red-800 transition-all">
      <div className="w-12 h-12 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-red-600 dark:text-red-400" />
      </div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function StepCard({ step, icon: Icon, title, description }: { step: number; icon: typeof Key; title: string; description: string }) {
  return (
    <div className="relative text-center">
      <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center mx-auto mb-4 text-lg font-bold shadow-lg shadow-indigo-500/30 relative z-10">
        {step}
      </div>
      <div className="w-14 h-14 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mx-auto mb-4">
        <Icon className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
      </div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }: { icon: typeof Shield; title: string; description: string }) {
  return (
    <div className="p-6 rounded-xl border bg-card hover:shadow-lg hover:border-indigo-200 dark:hover:border-indigo-800 transition-all group">
      <div className="w-12 h-12 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-4 group-hover:bg-indigo-600 transition-colors">
        <Icon className="w-6 h-6 text-indigo-600 dark:text-indigo-400 group-hover:text-white transition-colors" />
      </div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function UseCaseCard({ icon: Icon, title, scenario, solution }: { icon: typeof ShoppingCart; title: string; scenario: string; solution: string }) {
  return (
    <div className="p-6 rounded-xl border bg-card hover:shadow-lg transition-all">
      <div className="w-12 h-12 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
      </div>
      <h3 className="font-semibold mb-3">{title}</h3>
      <div className="space-y-2 text-sm">
        <p className="text-muted-foreground">{scenario}</p>
        <p className="text-emerald-600 dark:text-emerald-400 font-medium">→ {solution}</p>
      </div>
    </div>
  );
}

function ComparisonCard({ icon: Icon, title, subtitle, description, features, color }: {
  icon: typeof Fingerprint;
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  color: 'indigo' | 'gray';
}) {
  return (
    <div className={cn(
      'p-8 rounded-2xl border',
      color === 'indigo' && 'border-indigo-200 bg-indigo-50/50 dark:border-indigo-800 dark:bg-indigo-900/20',
      color === 'gray' && 'border-border bg-muted/30'
    )}>
      <div className={cn(
        'w-14 h-14 rounded-xl flex items-center justify-center mb-6',
        color === 'indigo' && 'bg-indigo-600',
        color === 'gray' && 'bg-gray-600'
      )}>
        <Icon className="w-7 h-7 text-white" />
      </div>
      <h3 className="text-xl font-bold mb-1">{title}</h3>
      <p className={cn(
        'text-sm font-medium mb-2',
        color === 'indigo' && 'text-indigo-600 dark:text-indigo-400',
        color === 'gray' && 'text-muted-foreground'
      )}>{subtitle}</p>
      <p className="text-muted-foreground mb-6">{description}</p>
      <ul className="space-y-2">
        {features.map((feature, i) => (
          <li key={i} className="flex items-center gap-2 text-sm">
            <CheckCircle className={cn(
              'w-4 h-4',
              color === 'indigo' && 'text-indigo-600 dark:text-indigo-400',
              color === 'gray' && 'text-muted-foreground'
            )} />
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
      'p-6 rounded-xl border text-center',
      highlighted && 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20 ring-1 ring-indigo-500 scale-105',
      !highlighted && 'bg-card'
    )}>
      {highlighted && (
        <Badge className="mb-4 bg-indigo-600">Most Popular</Badge>
      )}
      <h3 className="font-semibold mb-2">{name}</h3>
      <div className="mb-4">
        <span className="text-3xl font-bold">{price}</span>
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
          className={cn('w-full', highlighted && 'bg-indigo-600 hover:bg-indigo-700')}
        >
          Get Started
        </Button>
      </Link>
    </div>
  );
}

function CodeExample() {
  const [copied, setCopied] = useState(false);

  const code = `// Verify an agent credential
const response = await fetch(
  'https://api.agentid.dev/verify',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential })
  }
);

const { valid, agent } = await response.json();

if (valid) {
  // Agent is trusted - proceed with action
  console.log(\`Verified: \${agent.name}\`);
}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative rounded-xl overflow-hidden border bg-gray-950">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <Code className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-400">verify.js</span>
        </div>
        <button
          onClick={handleCopy}
          className="p-1.5 rounded hover:bg-gray-800 transition-colors"
        >
          {copied ? (
            <Check className="w-4 h-4 text-emerald-400" />
          ) : (
            <Copy className="w-4 h-4 text-gray-400" />
          )}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm">
        <code className="text-gray-300">
          <span className="text-gray-500">// Verify an agent credential</span>{'\n'}
          <span className="text-purple-400">const</span> response = <span className="text-purple-400">await</span> <span className="text-blue-400">fetch</span>({'\n'}
          {'  '}<span className="text-emerald-400">'https://api.agentid.dev/verify'</span>,{'\n'}
          {'  '}{'{'}
          {'\n'}
          {'    '}method: <span className="text-emerald-400">'POST'</span>,{'\n'}
          {'    '}headers: {'{'} <span className="text-emerald-400">'Content-Type'</span>: <span className="text-emerald-400">'application/json'</span> {'}'},
          {'\n'}
          {'    '}body: <span className="text-blue-400">JSON</span>.<span className="text-blue-400">stringify</span>({'{'} credential {'}'}){'\n'}
          {'  '}{'}'}{'\n'}
          );{'\n'}
          {'\n'}
          <span className="text-purple-400">const</span> {'{'} valid, agent {'}'} = <span className="text-purple-400">await</span> response.<span className="text-blue-400">json</span>();{'\n'}
          {'\n'}
          <span className="text-purple-400">if</span> (valid) {'{'}{'\n'}
          {'  '}<span className="text-gray-500">// Agent is trusted - proceed</span>{'\n'}
          {'  '}<span className="text-blue-400">console</span>.<span className="text-blue-400">log</span>(<span className="text-emerald-400">`Verified: </span>${'{'}agent.name{'}'}<span className="text-emerald-400">`</span>);{'\n'}
          {'}'}
        </code>
      </pre>
    </div>
  );
}
