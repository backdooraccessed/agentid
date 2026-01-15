'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BookOpen,
  Sparkles,
  Rocket,
  Shield,
  Settings,
  CheckCircle,
  Code,
  Webhook,
  Star,
  HelpCircle,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

const sections = [
  { id: 'overview', label: 'Overview', icon: Sparkles },
  { id: 'getting-started', label: 'Getting Started', icon: Rocket },
  { id: 'credentials', label: 'Issuing Credentials', icon: Shield },
  { id: 'managing', label: 'Managing Credentials', icon: Settings },
  { id: 'verification', label: 'Verification', icon: CheckCircle },
  { id: 'api', label: 'API Integration', icon: Code },
  { id: 'webhooks', label: 'Webhooks', icon: Webhook },
  { id: 'reputation', label: 'Reputation System', icon: Star },
];

export default function GuidePage() {
  const [activeSection, setActiveSection] = useState('overview');

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="flex gap-8">
      {/* Table of Contents - Fixed Sidebar */}
      <nav className="hidden lg:block w-56 shrink-0">
        <div className="sticky top-8">
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <h3 className="font-semibold mb-4 text-sm text-white/70">On this page</h3>
            <ul className="space-y-1">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <li key={section.id}>
                    <button
                      onClick={() => scrollToSection(section.id)}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-all',
                        activeSection === section.id
                          ? 'bg-white text-black font-medium'
                          : 'text-white/60 hover:text-white hover:bg-white/5'
                      )}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      {section.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 max-w-3xl space-y-12">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
            <BookOpen className="h-7 w-7 text-white/70" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Guide</h1>
            <p className="text-muted-foreground">
              Everything you need to know about using AgentID to issue and manage credentials for AI agents.
            </p>
          </div>
        </div>

        {/* Overview */}
        <section id="overview" className="scroll-mt-8">
          <Card className="overflow-hidden">
            <CardHeader className="bg-white/[0.02] border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-white/70" />
                </div>
                <div>
                  <CardTitle className="text-base">What is AgentID?</CardTitle>
                  <CardDescription>
                    A credential infrastructure for AI agents
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 prose prose-sm prose-invert max-w-none prose-headings:text-white prose-p:text-white/70 prose-li:text-white/70 prose-strong:text-white prose-code:text-white/80 prose-code:bg-white/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded">
              <p>
                AgentID is a platform that enables organizations to issue verifiable credentials
                to AI agents. These credentials help establish trust and accountability in
                AI-to-AI and AI-to-human interactions.
              </p>

              <h4>Key Concepts</h4>
              <ul>
                <li>
                  <strong>Issuer</strong> - An organization or individual that issues credentials
                  (that&apos;s you!)
                </li>
                <li>
                  <strong>Agent</strong> - An AI system that receives a credential
                </li>
                <li>
                  <strong>Credential</strong> - A cryptographically signed document asserting
                  an agent&apos;s identity, capabilities, and constraints
                </li>
                <li>
                  <strong>Verifier</strong> - Any party that checks if a credential is valid
                </li>
              </ul>

              <h4>How It Works</h4>
              <ol>
                <li>You create an issuer profile and set up your organization</li>
                <li>You issue credentials to your AI agents with specific permissions</li>
                <li>Your agents present these credentials when interacting with others</li>
                <li>Third parties verify credentials using our public API</li>
                <li>You can revoke or renew credentials at any time</li>
              </ol>
            </CardContent>
          </Card>
        </section>

        {/* Getting Started */}
        <section id="getting-started" className="scroll-mt-8">
          <Card className="overflow-hidden">
            <CardHeader className="bg-white/[0.02] border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                  <Rocket className="h-4 w-4 text-white/70" />
                </div>
                <div>
                  <CardTitle className="text-base">Getting Started</CardTitle>
                  <CardDescription>
                    Set up your account and start issuing credentials
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 prose prose-sm prose-invert max-w-none prose-headings:text-white prose-p:text-white/70 prose-li:text-white/70 prose-strong:text-white prose-code:text-white/80 prose-code:bg-white/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded">
              <h4>Step 1: Create Your Issuer Profile</h4>
              <p>
                After signing up, go to <strong>Settings</strong> to create your issuer profile.
                You&apos;ll need to provide:
              </p>
              <ul>
                <li><strong>Organization Name</strong> - Your company or project name</li>
                <li><strong>Issuer Type</strong> - Organization, Individual, or Platform</li>
                <li><strong>Domain</strong> (optional) - Your website for verification</li>
                <li><strong>Description</strong> - A brief description of your organization</li>
              </ul>

              <h4>Step 2: Create Your First Credential</h4>
              <p>
                Navigate to <strong>Credentials → Issue New</strong> to create your first credential.
                Each credential includes:
              </p>
              <ul>
                <li><strong>Agent ID</strong> - A unique identifier for your AI agent</li>
                <li><strong>Agent Name</strong> - A human-readable name</li>
                <li><strong>Capabilities</strong> - What the agent is allowed to do</li>
                <li><strong>Constraints</strong> - Limitations and restrictions</li>
                <li><strong>Validity Period</strong> - When the credential expires</li>
              </ul>

              <h4>Step 3: Integrate with Your Agent</h4>
              <p>
                After issuing a credential, you&apos;ll receive a credential ID. Your agent can
                include this ID when making requests to prove its identity. Third parties can
                verify credentials using our public API.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Issuing Credentials */}
        <section id="credentials" className="scroll-mt-8">
          <Card className="overflow-hidden">
            <CardHeader className="bg-white/[0.02] border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                  <Shield className="h-4 w-4 text-white/70" />
                </div>
                <div>
                  <CardTitle className="text-base">Issuing Credentials</CardTitle>
                  <CardDescription>
                    Create and manage credentials for your AI agents
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 prose prose-sm prose-invert max-w-none prose-headings:text-white prose-p:text-white/70 prose-li:text-white/70 prose-strong:text-white prose-code:text-white/80 prose-code:bg-white/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded">
              <h4>Credential Structure</h4>
              <p>Each credential contains:</p>

              <pre className="bg-white/[0.02] border border-white/10 p-4 rounded-lg text-xs overflow-x-auto text-white/70">{`{
  "credential_id": "uuid",
  "agent": {
    "id": "agent-123",
    "name": "Customer Support Bot",
    "version": "1.0.0"
  },
  "issuer": {
    "id": "your-issuer-id",
    "name": "Your Organization"
  },
  "capabilities": [
    "customer_support",
    "data_retrieval"
  ],
  "constraints": {
    "valid_from": "2025-01-01T00:00:00Z",
    "valid_until": "2026-01-01T00:00:00Z",
    "rate_limit": 1000,
    "allowed_domains": ["api.example.com"]
  },
  "signature": "ed25519-signature"
}`}</pre>

              <h4>Using Templates</h4>
              <p>
                Templates let you save common credential configurations for quick reuse.
                Go to <strong>Credentials → Templates</strong> to create templates with
                pre-defined capabilities and constraints.
              </p>

              <h4>Capabilities</h4>
              <p>Define what your agent is authorized to do:</p>
              <ul>
                <li><code>data_retrieval</code> - Read data from systems</li>
                <li><code>data_modification</code> - Modify or update data</li>
                <li><code>customer_support</code> - Interact with customers</li>
                <li><code>code_execution</code> - Execute code or scripts</li>
                <li><code>financial_transactions</code> - Handle payments</li>
                <li>Custom capabilities as needed</li>
              </ul>

              <h4>Constraints</h4>
              <p>Set limitations on credential usage:</p>
              <ul>
                <li><strong>Validity Period</strong> - Start and end dates</li>
                <li><strong>Rate Limits</strong> - Maximum requests per period</li>
                <li><strong>Allowed Domains</strong> - Restrict to specific APIs</li>
                <li><strong>Allowed Actions</strong> - Specific permitted operations</li>
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* Managing Credentials */}
        <section id="managing" className="scroll-mt-8">
          <Card className="overflow-hidden">
            <CardHeader className="bg-white/[0.02] border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                  <Settings className="h-4 w-4 text-white/70" />
                </div>
                <div>
                  <CardTitle className="text-base">Managing Credentials</CardTitle>
                  <CardDescription>
                    View, revoke, and renew your issued credentials
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 prose prose-sm prose-invert max-w-none prose-headings:text-white prose-p:text-white/70 prose-li:text-white/70 prose-strong:text-white prose-code:text-white/80 prose-code:bg-white/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded">
              <h4>Viewing Credentials</h4>
              <p>
                The <strong>Credentials</strong> page shows all credentials you&apos;ve issued.
                Each credential displays its status (active, expired, or revoked), the agent
                it was issued to, and validity dates.
              </p>

              <h4>Revoking Credentials</h4>
              <p>
                If an agent is compromised or should no longer have access, you can revoke
                its credential immediately:
              </p>
              <ol>
                <li>Go to the credential detail page</li>
                <li>Click <strong>Revoke Credential</strong></li>
                <li>Provide a reason (optional but recommended)</li>
                <li>Confirm the revocation</li>
              </ol>
              <p>
                Revoked credentials cannot be reinstated. You&apos;ll need to issue a new
                credential if access should be restored.
              </p>

              <h4>Renewing Credentials</h4>
              <p>
                Extend the validity of active or expired credentials:
              </p>
              <ol>
                <li>Go to the credential detail page</li>
                <li>Click <strong>Renew</strong></li>
                <li>Specify the extension period (1-365 days)</li>
                <li>The credential will be re-signed with new dates</li>
              </ol>

              <h4>Bulk Operations</h4>
              <p>
                For managing many credentials at once, use the bulk operations feature:
              </p>
              <ul>
                <li><strong>Bulk Revoke</strong> - Revoke multiple credentials at once</li>
                <li><strong>Bulk Renew</strong> - Extend multiple credentials</li>
                <li><strong>Export</strong> - Download credentials as CSV or JSON</li>
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* Verification */}
        <section id="verification" className="scroll-mt-8">
          <Card className="overflow-hidden">
            <CardHeader className="bg-white/[0.02] border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-white/70" />
                </div>
                <div>
                  <CardTitle className="text-base">Verification</CardTitle>
                  <CardDescription>
                    How third parties verify your credentials
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 prose prose-sm prose-invert max-w-none prose-headings:text-white prose-p:text-white/70 prose-li:text-white/70 prose-strong:text-white prose-code:text-white/80 prose-code:bg-white/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded">
              <h4>Public Verification Endpoint</h4>
              <p>
                Anyone can verify a credential using our public API. No authentication required:
              </p>
              <pre className="bg-white/[0.02] border border-white/10 p-4 rounded-lg text-xs overflow-x-auto text-white/70">{`POST /api/verify
Content-Type: application/json

{
  "credential_id": "uuid-of-credential"
}

// Response
{
  "valid": true,
  "credential": {
    "agent_id": "agent-123",
    "agent_name": "Customer Support Bot",
    "issuer": { "name": "Your Organization" },
    "status": "active",
    "valid_until": "2026-01-01T00:00:00Z"
  },
  "reputation": {
    "trust_score": 85,
    "verification_count": 150
  }
}`}</pre>

              <h4>Batch Verification</h4>
              <p>Verify multiple credentials in a single request:</p>
              <pre className="bg-white/[0.02] border border-white/10 p-4 rounded-lg text-xs overflow-x-auto text-white/70">{`POST /api/verify/batch
Content-Type: application/json

{
  "credentials": [
    { "credential_id": "uuid-1" },
    { "credential_id": "uuid-2" }
  ]
}

// Response includes results for each credential`}</pre>

              <h4>Offline Verification</h4>
              <p>
                Credentials include Ed25519 signatures that can be verified offline.
                Our SDKs provide offline verification methods for use cases requiring
                local validation without network calls.
              </p>

              <h4>Verification Badge</h4>
              <p>
                Display a verification badge on your website or app:
              </p>
              <pre className="bg-white/[0.02] border border-white/10 p-4 rounded-lg text-xs overflow-x-auto text-white/70">{`<img src="https://agentid.dev/api/badge/{credential_id}"
     alt="AgentID Verified" />`}</pre>
            </CardContent>
          </Card>
        </section>

        {/* API Integration */}
        <section id="api" className="scroll-mt-8">
          <Card className="overflow-hidden">
            <CardHeader className="bg-white/[0.02] border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                  <Code className="h-4 w-4 text-white/70" />
                </div>
                <div>
                  <CardTitle className="text-base">API Integration</CardTitle>
                  <CardDescription>
                    Programmatic access to AgentID features
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 prose prose-sm prose-invert max-w-none prose-headings:text-white prose-p:text-white/70 prose-li:text-white/70 prose-strong:text-white prose-code:text-white/80 prose-code:bg-white/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded">
              <h4>API Keys</h4>
              <p>
                Create API keys in <strong>Developer → API Keys</strong> to access the API
                programmatically. Each key can have specific scopes:
              </p>
              <ul>
                <li><code>credentials:read</code> - List and view credentials</li>
                <li><code>credentials:write</code> - Issue, revoke, and renew credentials</li>
                <li><code>analytics:read</code> - Access analytics data</li>
              </ul>

              <h4>Authentication</h4>
              <p>Include your API key in the Authorization header:</p>
              <pre className="bg-white/[0.02] border border-white/10 p-4 rounded-lg text-xs overflow-x-auto text-white/70">{`Authorization: Bearer agid_xxxxx_xxxxxxxxx`}</pre>

              <h4>API Endpoints</h4>
              <div className="overflow-x-auto not-prose">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 font-medium text-white/70">Endpoint</th>
                      <th className="text-left py-3 font-medium text-white/70">Method</th>
                      <th className="text-left py-3 font-medium text-white/70">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-white/5">
                      <td className="py-3"><code className="text-white/80 bg-white/10 px-1.5 py-0.5 rounded text-xs">/api/credentials</code></td>
                      <td className="py-3 text-white/70">GET</td>
                      <td className="py-3 text-white/70">List your credentials</td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="py-3"><code className="text-white/80 bg-white/10 px-1.5 py-0.5 rounded text-xs">/api/credentials</code></td>
                      <td className="py-3 text-white/70">POST</td>
                      <td className="py-3 text-white/70">Issue a new credential</td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="py-3"><code className="text-white/80 bg-white/10 px-1.5 py-0.5 rounded text-xs">/api/credentials/:id</code></td>
                      <td className="py-3 text-white/70">GET</td>
                      <td className="py-3 text-white/70">Get credential details</td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="py-3"><code className="text-white/80 bg-white/10 px-1.5 py-0.5 rounded text-xs">/api/credentials/:id/revoke</code></td>
                      <td className="py-3 text-white/70">POST</td>
                      <td className="py-3 text-white/70">Revoke a credential</td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="py-3"><code className="text-white/80 bg-white/10 px-1.5 py-0.5 rounded text-xs">/api/credentials/:id/renew</code></td>
                      <td className="py-3 text-white/70">POST</td>
                      <td className="py-3 text-white/70">Renew a credential</td>
                    </tr>
                    <tr>
                      <td className="py-3"><code className="text-white/80 bg-white/10 px-1.5 py-0.5 rounded text-xs">/api/verify</code></td>
                      <td className="py-3 text-white/70">POST</td>
                      <td className="py-3 text-white/70">Verify a credential (public)</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h4>SDKs</h4>
              <p>Official SDKs are available for:</p>
              <ul>
                <li>
                  <strong>JavaScript/TypeScript</strong> - <code>npm install @agentid/sdk</code>
                </li>
                <li>
                  <strong>Python</strong> - <code>pip install agentid</code>
                </li>
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* Webhooks */}
        <section id="webhooks" className="scroll-mt-8">
          <Card className="overflow-hidden">
            <CardHeader className="bg-white/[0.02] border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                  <Webhook className="h-4 w-4 text-white/70" />
                </div>
                <div>
                  <CardTitle className="text-base">Webhooks</CardTitle>
                  <CardDescription>
                    Receive real-time notifications for credential events
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 prose prose-sm prose-invert max-w-none prose-headings:text-white prose-p:text-white/70 prose-li:text-white/70 prose-strong:text-white prose-code:text-white/80 prose-code:bg-white/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded">
              <h4>Setting Up Webhooks</h4>
              <p>
                Go to <strong>Developer → Webhooks</strong> to create webhook subscriptions.
                You&apos;ll need to provide:
              </p>
              <ul>
                <li><strong>URL</strong> - Your HTTPS endpoint to receive events</li>
                <li><strong>Events</strong> - Which events to subscribe to</li>
                <li><strong>Description</strong> (optional) - Notes about this webhook</li>
              </ul>

              <h4>Available Events</h4>
              <ul>
                <li><code>credential.revoked</code> - A credential was revoked</li>
                <li><code>credential.renewed</code> - A credential was renewed</li>
                <li><code>credential.expired</code> - A credential expired</li>
              </ul>

              <h4>Webhook Payload</h4>
              <pre className="bg-white/[0.02] border border-white/10 p-4 rounded-lg text-xs overflow-x-auto text-white/70">{`{
  "event": "credential.revoked",
  "timestamp": "2025-01-13T12:00:00Z",
  "data": {
    "credential_id": "uuid",
    "agent_id": "agent-123",
    "revoked_at": "2025-01-13T12:00:00Z",
    "reason": "Security concern"
  }
}`}</pre>

              <h4>Verifying Signatures</h4>
              <p>
                Each webhook includes an HMAC signature in the <code>X-AgentID-Signature</code>
                header. Verify it using your webhook secret:
              </p>
              <pre className="bg-white/[0.02] border border-white/10 p-4 rounded-lg text-xs overflow-x-auto text-white/70">{`const crypto = require('crypto');

function verifySignature(payload, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}`}</pre>

              <h4>Retry Behavior</h4>
              <p>
                If your endpoint returns an error or is unreachable, we&apos;ll retry with
                exponential backoff. After 5 consecutive failures, the webhook is
                automatically disabled.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Reputation */}
        <section id="reputation" className="scroll-mt-8">
          <Card className="overflow-hidden">
            <CardHeader className="bg-white/[0.02] border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                  <Star className="h-4 w-4 text-white/70" />
                </div>
                <div>
                  <CardTitle className="text-base">Reputation System</CardTitle>
                  <CardDescription>
                    Understanding trust scores and reputation
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 prose prose-sm prose-invert max-w-none prose-headings:text-white prose-p:text-white/70 prose-li:text-white/70 prose-strong:text-white prose-code:text-white/80 prose-code:bg-white/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded">
              <h4>How Reputation Works</h4>
              <p>
                Every credential and issuer has a trust score from 0-100. Higher scores
                indicate more trustworthy agents and issuers based on their track record.
              </p>

              <h4>Score Components</h4>
              <ul>
                <li>
                  <strong>Verification Score (30%)</strong> - Based on successful verification
                  rate. Credentials that consistently pass verification score higher.
                </li>
                <li>
                  <strong>Longevity Score (25%)</strong> - Older credentials with good track
                  records score higher.
                </li>
                <li>
                  <strong>Issuer Score (25%)</strong> - Inherits trust from the issuing
                  organization. Verified issuers boost scores.
                </li>
                <li>
                  <strong>Activity Score (20%)</strong> - Recent verification activity
                  indicates an actively used credential.
                </li>
              </ul>

              <h4>What Affects Scores</h4>
              <div className="overflow-x-auto not-prose">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 font-medium text-white/70">Action</th>
                      <th className="text-left py-3 font-medium text-white/70">Effect</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-white/5">
                      <td className="py-3 text-white/70">Successful verification</td>
                      <td className="py-3 text-emerald-400">+1 to +3 points</td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="py-3 text-white/70">Failed verification</td>
                      <td className="py-3 text-red-400">-2 to -5 points</td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="py-3 text-white/70">Credential revocation</td>
                      <td className="py-3 text-red-400">-10 points</td>
                    </tr>
                    <tr>
                      <td className="py-3 text-white/70">Issuer becomes verified</td>
                      <td className="py-3 text-emerald-400">+10 points to all credentials</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h4>Reputation API</h4>
              <p>Query reputation scores programmatically:</p>
              <pre className="bg-white/[0.02] border border-white/10 p-4 rounded-lg text-xs overflow-x-auto text-white/70">{`GET /api/reputation/agent/{agent_id}
GET /api/reputation/issuer/{issuer_id}
GET /api/reputation/leaderboard`}</pre>

              <h4>Improving Your Reputation</h4>
              <ul>
                <li>Get verified as an issuer (contact support)</li>
                <li>Maintain active, regularly-verified credentials</li>
                <li>Avoid frequent revocations</li>
                <li>Keep credentials current (renew before expiration)</li>
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* Help Section */}
        <section className="scroll-mt-8">
          <Card className="overflow-hidden">
            <CardHeader className="bg-white/[0.02] border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                  <HelpCircle className="h-4 w-4 text-white/70" />
                </div>
                <CardTitle className="text-base">Need Help?</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6 prose prose-sm prose-invert max-w-none prose-headings:text-white prose-p:text-white/70 prose-li:text-white/70 prose-strong:text-white prose-code:text-white/80 prose-code:bg-white/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded">
              <ul>
                <li>
                  <strong>Documentation</strong> - Full API reference at{' '}
                  <code>docs.agentid.dev</code>
                </li>
                <li>
                  <strong>Support</strong> - Email us at{' '}
                  <code>support@agentid.dev</code>
                </li>
                <li>
                  <strong>GitHub</strong> - Report issues and contribute at{' '}
                  <code>github.com/agentid</code>
                </li>
              </ul>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
