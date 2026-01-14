import Link from 'next/link';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <span className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground text-sm font-bold">
              A
            </span>
            AgentID
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link href="/docs" className="text-muted-foreground hover:text-foreground transition-colors">
              Docs
            </Link>
            <Link href="/directory" className="text-muted-foreground hover:text-foreground transition-colors">
              Directory
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
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]" />
          <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/20 opacity-20 blur-[100px]" />
        </div>

        <div className="max-w-6xl mx-auto px-4 py-24 md:py-32">
          <div className="text-center space-y-8 max-w-3xl mx-auto">
            <Badge variant="secondary" className="px-4 py-1.5">
              Open Source Credential Infrastructure
            </Badge>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Verifiable Identity for
              </span>
              <br />
              <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                AI Agents
              </span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Issue cryptographically signed credentials to your AI agents.
              Enable any service to verify agent identity, permissions, and trustworthiness in milliseconds.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="gap-2 w-full sm:w-auto">
                  Start Issuing Credentials
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/docs">
                <Button size="lg" variant="outline" className="gap-2 w-full sm:w-auto">
                  <Code className="h-4 w-4" />
                  View Documentation
                </Button>
              </Link>
            </div>

            <p className="text-sm text-muted-foreground">
              Free to start. No credit card required.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Everything you need for agent credentials</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A complete platform to issue, manage, and verify credentials for your AI agents.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon={Shield}
              title="Issue Credentials"
              description="Create cryptographically signed credentials with custom capabilities and constraints."
            />
            <FeatureCard
              icon={CheckCircle}
              title="Instant Verification"
              description="Public API to verify any credential in under 50ms. No authentication required."
            />
            <FeatureCard
              icon={TrendingUp}
              title="Reputation Scores"
              description="Track agent trustworthiness with automated reputation scoring based on behavior."
            />
            <FeatureCard
              icon={Bell}
              title="Real-time Webhooks"
              description="Get notified instantly when credentials are revoked or renewed."
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">How it works</h2>
            <p className="text-muted-foreground">Three simple steps to secure your AI agents</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <StepCard
              number="1"
              title="Create Issuer Profile"
              description="Sign up and create your organization profile. You'll get a unique issuer ID and signing keys."
            />
            <StepCard
              number="2"
              title="Issue Credentials"
              description="Create credentials for your agents with specific capabilities, rate limits, and validity periods."
            />
            <StepCard
              number="3"
              title="Verify Anywhere"
              description="Any service can verify your agent's credentials using our public API or SDKs."
            />
          </div>
        </div>
      </section>

      {/* AgentID vs MCP */}
      <section className="py-24 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">Understanding the Difference</Badge>
            <h2 className="text-3xl font-bold mb-4">AgentID vs MCP</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Different problems, complementary solutions. Here&apos;s how AgentID compares to the Model Context Protocol.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* AgentID Card */}
            <div className="bg-background rounded-xl border-2 border-primary/20 p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Fingerprint className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">AgentID</h3>
                    <p className="text-sm text-muted-foreground">Identity & Trust</p>
                  </div>
                </div>
                <p className="text-muted-foreground mb-6">
                  Answers: <span className="text-foreground font-medium">&quot;WHO is this agent and CAN IT BE TRUSTED?&quot;</span>
                </p>
                <ul className="space-y-3">
                  <ComparisonItem text="Cryptographic identity credentials" />
                  <ComparisonItem text="Permission & capability verification" />
                  <ComparisonItem text="Trust scores & reputation tracking" />
                  <ComparisonItem text="Authorization for agent actions" />
                </ul>
                <div className="mt-6 pt-6 border-t">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Human equivalent:</span> Passport + Work Permit
                  </p>
                </div>
              </div>
            </div>

            {/* MCP Card */}
            <div className="bg-background rounded-xl border p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-muted/50 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                    <Cable className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">MCP</h3>
                    <p className="text-sm text-muted-foreground">Connectivity Protocol</p>
                  </div>
                </div>
                <p className="text-muted-foreground mb-6">
                  Answers: <span className="text-foreground font-medium">&quot;HOW does AI connect to external tools?&quot;</span>
                </p>
                <ul className="space-y-3 text-muted-foreground">
                  <ComparisonItem text="Standardized tool integration" muted />
                  <ComparisonItem text="File & database access" muted />
                  <ComparisonItem text="API connections for AI" muted />
                  <ComparisonItem text="Capability extension" muted />
                </ul>
                <div className="mt-6 pt-6 border-t">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Human equivalent:</span> USB Cable
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Complementary Note */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 text-center">
            <h4 className="font-semibold mb-2">Better Together</h4>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              MCP servers can use AgentID to verify which agents are authorized to connect.
              AgentID fills the gap MCP doesn&apos;t address: <span className="text-foreground font-medium">who should be allowed to use these tools?</span>
            </p>
          </div>
        </div>
      </section>

      {/* Real-World Use Cases */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">Real-World Examples</Badge>
            <h2 className="text-3xl font-bold mb-4">When to use AgentID</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              See how organizations use AgentID to secure their AI agents in production environments.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <UseCaseCard
              icon={ShoppingCart}
              title="E-commerce Purchasing Agent"
              scenario="Your AI agent needs to make purchases on behalf of customers"
              problem="Without verification, any bot could claim to represent your company and make unauthorized purchases"
              solution="Issue credentials with spending limits ($500/transaction, $2000/day). Merchants verify the credential before processing orders."
              tags={["Spending Limits", "Merchant Trust"]}
            />
            <UseCaseCard
              icon={HeadphonesIcon}
              title="Customer Support Bot"
              scenario="Your support bot needs to access customer data from third-party services"
              problem="Third-party APIs can't distinguish your legitimate bot from imposters or malicious agents"
              solution="Your bot presents its AgentID credential. The API verifies it's authorized to access support data, not billing or admin functions."
              tags={["Data Access", "Permission Scoping"]}
            />
            <UseCaseCard
              icon={CreditCard}
              title="Financial Trading Agent"
              scenario="An autonomous agent executes trades on a crypto exchange"
              problem="Exchanges need to verify the agent is authorized and has trading limits before executing orders"
              solution="Credential specifies max trade size, allowed pairs, and daily volume limits. Exchange verifies before each trade."
              tags={["Trading Limits", "Compliance"]}
            />
            <UseCaseCard
              icon={Bot}
              title="Multi-Agent Collaboration"
              scenario="Multiple AI agents from different companies need to work together"
              problem="Agent A can't trust that Agent B is who it claims to be or has the permissions it claims"
              solution="Both agents verify each other's credentials before sharing data. Trust scores help decide collaboration depth."
              tags={["Agent-to-Agent", "Trust Scores"]}
            />
            <UseCaseCard
              icon={Database}
              title="Data Pipeline Agent"
              scenario="An ETL agent needs read access to production databases"
              problem="You need to ensure the agent can only READ data, never write or delete"
              solution="Credential explicitly grants only 'data_read' permission. Database proxy verifies credential and enforces read-only access."
              tags={["Read-Only", "Data Protection"]}
            />
            <UseCaseCard
              icon={Building2}
              title="Enterprise SaaS Integration"
              scenario="A customer's AI agent wants to access your SaaS API"
              problem="You need to verify the agent is from a paying customer and within their plan limits"
              solution="Customer issues credentials to their agents with your API. You verify the issuer is a valid customer and check their tier."
              tags={["B2B", "Plan Enforcement"]}
            />
          </div>

          <div className="mt-12 text-center">
            <p className="text-muted-foreground mb-4">
              The common thread: <span className="text-foreground font-medium">AgentID answers &quot;Should I trust this agent?&quot; before any action is taken.</span>
            </p>
          </div>
        </div>
      </section>

      {/* Code Example */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-4">Simple API, powerful results</h2>
              <p className="text-muted-foreground mb-6">
                Verify any credential with a single API call. No authentication required for verification.
                Our SDKs make integration even easier.
              </p>
              <div className="flex flex-wrap gap-3">
                <Badge variant="outline">JavaScript SDK</Badge>
                <Badge variant="outline">Python SDK</Badge>
                <Badge variant="outline">REST API</Badge>
                <Badge variant="outline">Offline Verification</Badge>
              </div>
            </div>
            <div className="bg-zinc-950 rounded-xl p-6 text-sm font-mono text-zinc-100 overflow-x-auto">
              <div className="flex items-center gap-2 text-zinc-500 mb-4">
                <span className="w-3 h-3 rounded-full bg-red-500" />
                <span className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="w-3 h-3 rounded-full bg-green-500" />
                <span className="ml-2">verify.sh</span>
              </div>
              <pre className="text-green-400">
{`# Verify a credential
curl -X POST https://agentid.dev/api/verify \\
  -H "Content-Type: application/json" \\
  -d '{"credential_id": "cred_abc123"}'

# Response
{
  "valid": true,
  "credential": {
    "agent_id": "agent-007",
    "agent_name": "Customer Support Bot",
    "capabilities": ["support", "data_read"],
    "status": "active"
  },
  "reputation": {
    "trust_score": 92
  }
}`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to secure your AI agents?</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join organizations building trustworthy AI systems. Get started for free in minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="gap-2 w-full sm:w-auto">
                Create Free Account
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/docs">
              <Button size="lg" variant="outline" className="gap-2 w-full sm:w-auto">
                Read the Docs
                <ExternalLink className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <Link href="/" className="flex items-center gap-2 font-bold text-lg mb-4">
                <span className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center text-primary-foreground text-xs font-bold">
                  A
                </span>
                AgentID
              </Link>
              <p className="text-sm text-muted-foreground">
                Credential infrastructure for AI agents.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/docs" className="hover:text-foreground transition-colors">Documentation</Link></li>
                <li><Link href="/directory" className="hover:text-foreground transition-colors">Directory</Link></li>
                <li><Link href="/docs#api" className="hover:text-foreground transition-colors">API Reference</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/docs#getting-started" className="hover:text-foreground transition-colors">Getting Started</Link></li>
                <li><Link href="/docs#webhooks" className="hover:text-foreground transition-colors">Webhooks</Link></li>
                <li><Link href="/docs#reputation" className="hover:text-foreground transition-colors">Reputation System</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Connect</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="https://github.com/agentid" className="hover:text-foreground transition-colors inline-flex items-center gap-1">
                    <Github className="h-4 w-4" />
                    GitHub
                  </a>
                </li>
                <li><Link href="/login" className="hover:text-foreground transition-colors">Sign In</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} AgentID. Open source under MIT license.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Shield;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-background rounded-xl border p-6 hover:shadow-md transition-shadow">
      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function StepCard({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="relative">
      <div className="text-7xl font-bold text-muted/20 absolute -top-4 -left-2">{number}</div>
      <div className="relative pt-8">
        <h3 className="font-semibold mb-2 text-lg">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function ComparisonItem({ text, muted = false }: { text: string; muted?: boolean }) {
  return (
    <li className="flex items-center gap-2">
      <CheckCircle className={`h-4 w-4 flex-shrink-0 ${muted ? 'text-muted-foreground/50' : 'text-primary'}`} />
      <span className={muted ? 'text-muted-foreground' : ''}>{text}</span>
    </li>
  );
}

function UseCaseCard({
  icon: Icon,
  title,
  scenario,
  problem,
  solution,
  tags,
}: {
  icon: typeof Shield;
  title: string;
  scenario: string;
  problem: string;
  solution: string;
  tags: string[];
}) {
  return (
    <div className="bg-background rounded-xl border p-6 hover:shadow-lg transition-all hover:border-primary/30 group">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <h3 className="font-semibold">{title}</h3>
      </div>

      <div className="space-y-3 text-sm">
        <div>
          <span className="text-muted-foreground">Scenario: </span>
          <span>{scenario}</span>
        </div>

        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-lg p-3">
          <span className="text-red-700 dark:text-red-400 font-medium text-xs uppercase tracking-wide">Problem</span>
          <p className="text-red-900 dark:text-red-300 mt-1">{problem}</p>
        </div>

        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/30 rounded-lg p-3">
          <span className="text-green-700 dark:text-green-400 font-medium text-xs uppercase tracking-wide">With AgentID</span>
          <p className="text-green-900 dark:text-green-300 mt-1">{solution}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-4">
        {tags.map((tag) => (
          <span key={tag} className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-full">
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
