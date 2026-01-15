'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CodeBlock } from '@/components/docs/code-block';
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
  ArrowRight,
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

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('overview');

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b-4 border-black sticky top-0 bg-white z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold flex items-center gap-3">
            <span className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white text-sm font-bold">
              A
            </span>
            <span className="text-black font-retro">AgentID Docs</span>
          </Link>
          <div className="flex gap-2">
            <Link href="/directory">
              <Button variant="ghost" className="text-gray-600 hover:text-black hover:bg-gray-100 font-retro">Directory</Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" className="border-gray-300 hover:bg-gray-100 font-retro">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button className="font-retro">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Table of Contents - Fixed Sidebar */}
          <nav className="hidden lg:block w-56 shrink-0">
            <div className="sticky top-24">
              <h3 className="font-semibold mb-4 text-sm text-gray-700 font-retro">Documentation</h3>
              <ul className="space-y-1">
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <li key={section.id}>
                      <button
                        onClick={() => scrollToSection(section.id)}
                        className={cn(
                          'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-all font-retro',
                          activeSection === section.id
                            ? 'bg-white text-black font-medium border-2 border-black'
                            : 'text-gray-600 hover:text-black hover:bg-gray-100'
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {section.label}
                      </button>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-8 pt-8 border-t-4 border-black space-y-3">
                <Link href="/docs/playground">
                  <Button variant="outline" className="w-full gap-2 border-gray-300 hover:bg-gray-100 font-retro">
                    <Code className="h-4 w-4" />
                    API Playground
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="w-full gap-2 font-retro">
                    Get Started Free
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </nav>

          {/* Main Content */}
          <div className="flex-1 max-w-3xl space-y-12">
            {/* Hero */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gray-50 border-4 border-black flex items-center justify-center">
                  <BookOpen className="h-7 w-7 text-gray-700" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold tracking-tight text-black font-pixel">Documentation</h1>
                  <p className="text-gray-600 font-retro">
                    Everything you need to know about AgentID
                  </p>
                </div>
              </div>
            </div>

            {/* Overview */}
            <section id="overview" className="scroll-mt-24">
              <div className="overflow-hidden border-4 border-black bg-white">
                <div className="bg-gray-50 border-b-4 border-black p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-gray-700" />
                    </div>
                    <div>
                      <h3 className="font-retro font-bold text-black text-base">What is AgentID?</h3>
                      <p className="font-retro text-gray-600 text-sm">
                        A credential infrastructure for AI agents
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-6 prose prose-sm prose-headings:text-black prose-p:text-gray-700 prose-li:text-gray-700 prose-strong:text-black max-w-none font-retro">
                  <p>
                    AgentID is a platform that enables organizations to issue verifiable credentials
                    to AI agents. These credentials help establish trust and accountability in
                    AI-to-AI and AI-to-human interactions.
                  </p>

                  <h4>Key Concepts</h4>
                  <ul>
                    <li>
                      <strong>Issuer</strong> - An organization or individual that issues credentials
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
                  <ol className="text-gray-700">
                    <li>Create an issuer profile and set up your organization</li>
                    <li>Issue credentials to your AI agents with specific permissions</li>
                    <li>Your agents present these credentials when interacting with others</li>
                    <li>Third parties verify credentials using our public API</li>
                    <li>You can revoke or renew credentials at any time</li>
                  </ol>
                </div>
              </div>
            </section>

            {/* Getting Started */}
            <section id="getting-started" className="scroll-mt-24">
              <div className="overflow-hidden border-4 border-black bg-white">
                <div className="bg-gray-50 border-b-4 border-black p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                      <Rocket className="h-4 w-4 text-gray-700" />
                    </div>
                    <div>
                      <h3 className="font-retro font-bold text-black text-base">Getting Started</h3>
                      <p className="font-retro text-gray-600 text-sm">
                        Set up your account and start issuing credentials
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-6 prose prose-sm prose-headings:text-black prose-p:text-gray-700 prose-li:text-gray-700 prose-strong:text-black max-w-none font-retro">
                  <h4>Step 1: Create Your Account</h4>
                  <p>
                    <Link href="/register" className="text-black hover:underline">Sign up for free</Link> to
                    create your AgentID account. You&apos;ll need a valid email address.
                  </p>

                  <h4>Step 2: Create Your Issuer Profile</h4>
                  <p>
                    After signing up, create your issuer profile with:
                  </p>
                  <ul>
                    <li><strong>Organization Name</strong> - Your company or project name</li>
                    <li><strong>Issuer Type</strong> - Organization, Individual, or Platform</li>
                    <li><strong>Domain</strong> (optional) - Your website for verification</li>
                    <li><strong>Description</strong> - A brief description of your organization</li>
                  </ul>

                  <h4>Step 3: Issue Your First Credential</h4>
                  <p>
                    Create credentials for your AI agents. Each credential includes:
                  </p>
                  <ul>
                    <li><strong>Agent ID</strong> - A unique identifier for your AI agent</li>
                    <li><strong>Agent Name</strong> - A human-readable name</li>
                    <li><strong>Capabilities</strong> - What the agent is allowed to do</li>
                    <li><strong>Constraints</strong> - Limitations and restrictions</li>
                    <li><strong>Validity Period</strong> - When the credential expires</li>
                  </ul>

                  <h4>Step 4: Integrate with Your Agent</h4>
                  <p>
                    After issuing a credential, integrate it with your AI agent. The agent can
                    include the credential ID in requests, allowing third parties to verify its
                    identity and permissions.
                  </p>
                </div>
              </div>
            </section>

            {/* Issuing Credentials */}
            <section id="credentials" className="scroll-mt-24">
              <div className="overflow-hidden border-4 border-black bg-white">
                <div className="bg-gray-50 border-b-4 border-black p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                      <Shield className="h-4 w-4 text-gray-700" />
                    </div>
                    <div>
                      <h3 className="font-retro font-bold text-black text-base">Issuing Credentials</h3>
                      <p className="font-retro text-gray-600 text-sm">
                        Create and manage credentials for your AI agents
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-6 prose prose-sm prose-headings:text-black prose-p:text-gray-700 prose-li:text-gray-700 prose-strong:text-black prose-code:text-gray-800 prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded max-w-none font-retro">
                  <h4>Credential Structure</h4>
                  <p>Each credential contains:</p>

                  <CodeBlock language="json">{`{
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
}`}</CodeBlock>

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
                </div>
              </div>
            </section>

            {/* Managing Credentials */}
            <section id="managing" className="scroll-mt-24">
              <div className="overflow-hidden border-4 border-black bg-white">
                <div className="bg-gray-50 border-b-4 border-black p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                      <Settings className="h-4 w-4 text-gray-700" />
                    </div>
                    <div>
                      <h3 className="font-retro font-bold text-black text-base">Managing Credentials</h3>
                      <p className="font-retro text-gray-600 text-sm">
                        View, revoke, and renew your issued credentials
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-6 prose prose-sm prose-headings:text-black prose-p:text-gray-700 prose-li:text-gray-700 prose-strong:text-black max-w-none font-retro">
                  <h4>Credential Lifecycle</h4>
                  <p>Credentials go through several states:</p>
                  <ul>
                    <li><strong>Active</strong> - Currently valid and usable</li>
                    <li><strong>Expired</strong> - Past validity date, can be renewed</li>
                    <li><strong>Revoked</strong> - Permanently invalidated</li>
                  </ul>

                  <h4>Revoking Credentials</h4>
                  <p>
                    If an agent is compromised or should no longer have access, revoke
                    its credential immediately. Revocation is permanent - you&apos;ll need
                    to issue a new credential if access should be restored.
                  </p>

                  <h4>Renewing Credentials</h4>
                  <p>
                    Extend the validity of active or expired credentials by specifying
                    an extension period (1-365 days). The credential will be re-signed
                    with the new validity dates.
                  </p>

                  <h4>Bulk Operations</h4>
                  <p>For managing many credentials at once:</p>
                  <ul>
                    <li><strong>Bulk Revoke</strong> - Revoke multiple credentials at once</li>
                    <li><strong>Bulk Renew</strong> - Extend multiple credentials</li>
                    <li><strong>Export</strong> - Download credentials as CSV or JSON</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Verification */}
            <section id="verification" className="scroll-mt-24">
              <div className="overflow-hidden border-4 border-black bg-white">
                <div className="bg-gray-50 border-b-4 border-black p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-gray-700" />
                    </div>
                    <div>
                      <h3 className="font-retro font-bold text-black text-base">Verification</h3>
                      <p className="font-retro text-gray-600 text-sm">
                        How to verify agent credentials
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-6 prose prose-sm prose-headings:text-black prose-p:text-gray-700 prose-li:text-gray-700 prose-strong:text-black prose-code:text-gray-800 prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded max-w-none font-retro">
                  <h4>Public Verification Endpoint</h4>
                  <p>
                    Anyone can verify a credential using our public API. No authentication required:
                  </p>
                  <CodeBlock language="http">{`POST https://agentid.dev/api/verify
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
}`}</CodeBlock>

                  <h4>Batch Verification</h4>
                  <p>Verify multiple credentials in a single request (up to 100):</p>
                  <CodeBlock language="http">{`POST https://agentid.dev/api/verify/batch
Content-Type: application/json

{
  "credentials": [
    { "credential_id": "uuid-1" },
    { "credential_id": "uuid-2" }
  ]
}`}</CodeBlock>

                  <h4>Verification Response</h4>
                  <p>The verification response tells you:</p>
                  <ul>
                    <li><strong>valid</strong> - Whether the credential is currently valid</li>
                    <li><strong>credential</strong> - Details about the agent and issuer</li>
                    <li><strong>reputation</strong> - Trust score and verification history</li>
                    <li><strong>error</strong> - If invalid, why it failed verification</li>
                  </ul>

                  <h4>Verification Badge</h4>
                  <p>Display a verification badge on your website:</p>
                  <CodeBlock language="html">{`<img src="https://agentid.dev/api/badge/{credential_id}"
     alt="AgentID Verified" />`}</CodeBlock>
                </div>
              </div>
            </section>

            {/* API Integration */}
            <section id="api" className="scroll-mt-24">
              <div className="overflow-hidden border-4 border-black bg-white">
                <div className="bg-gray-50 border-b-4 border-black p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                      <Code className="h-4 w-4 text-gray-700" />
                    </div>
                    <div>
                      <h3 className="font-retro font-bold text-black text-base">API Integration</h3>
                      <p className="font-retro text-gray-600 text-sm">
                        Programmatic access to AgentID features
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-6 prose prose-sm prose-headings:text-black prose-p:text-gray-700 prose-li:text-gray-700 prose-strong:text-black prose-code:text-gray-800 prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded max-w-none font-retro">
                  <h4>API Keys</h4>
                  <p>
                    Create API keys in your dashboard to access the API programmatically.
                    Each key can have specific scopes:
                  </p>
                  <ul>
                    <li><code>credentials:read</code> - List and view credentials</li>
                    <li><code>credentials:write</code> - Issue, revoke, and renew credentials</li>
                    <li><code>analytics:read</code> - Access analytics data</li>
                  </ul>

                  <h4>Authentication</h4>
                  <p>Include your API key in the Authorization header:</p>
                  <CodeBlock>{`Authorization: Bearer agid_xxxxx_xxxxxxxxx`}</CodeBlock>

                  <h4>API Endpoints</h4>
                  <div className="not-prose">
                    <table className="w-full text-sm border-2 border-black rounded-lg overflow-hidden">
                      <thead>
                        <tr className="bg-gray-50 border-b-2 border-black">
                          <th className="text-left px-4 py-3 font-medium text-gray-700 font-retro">Endpoint</th>
                          <th className="text-left px-4 py-3 font-medium text-gray-700 font-retro">Method</th>
                          <th className="text-left px-4 py-3 font-medium text-gray-700 font-retro">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        <tr>
                          <td className="px-4 py-3"><code className="text-gray-800 bg-gray-100 px-1 py-0.5 rounded text-xs">/api/credentials</code></td>
                          <td className="px-4 py-3 text-gray-600 font-retro">GET</td>
                          <td className="px-4 py-3 text-gray-600 font-retro">List your credentials</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3"><code className="text-gray-800 bg-gray-100 px-1 py-0.5 rounded text-xs">/api/credentials</code></td>
                          <td className="px-4 py-3 text-gray-600 font-retro">POST</td>
                          <td className="px-4 py-3 text-gray-600 font-retro">Issue a new credential</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3"><code className="text-gray-800 bg-gray-100 px-1 py-0.5 rounded text-xs">/api/credentials/:id</code></td>
                          <td className="px-4 py-3 text-gray-600 font-retro">GET</td>
                          <td className="px-4 py-3 text-gray-600 font-retro">Get credential details</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3"><code className="text-gray-800 bg-gray-100 px-1 py-0.5 rounded text-xs">/api/credentials/:id/revoke</code></td>
                          <td className="px-4 py-3 text-gray-600 font-retro">POST</td>
                          <td className="px-4 py-3 text-gray-600 font-retro">Revoke a credential</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3"><code className="text-gray-800 bg-gray-100 px-1 py-0.5 rounded text-xs">/api/credentials/:id/renew</code></td>
                          <td className="px-4 py-3 text-gray-600 font-retro">POST</td>
                          <td className="px-4 py-3 text-gray-600 font-retro">Renew a credential</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3"><code className="text-gray-800 bg-gray-100 px-1 py-0.5 rounded text-xs">/api/verify</code></td>
                          <td className="px-4 py-3 text-gray-600 font-retro">POST</td>
                          <td className="px-4 py-3 text-gray-600 font-retro">Verify a credential (public)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <h4>SDKs</h4>
                  <p>Official SDKs are available for quick integration:</p>
                  <CodeBlock language="bash">{`# JavaScript/TypeScript
npm install @agentid/sdk

# Python
pip install agentid`}</CodeBlock>
                </div>
              </div>
            </section>

            {/* Webhooks */}
            <section id="webhooks" className="scroll-mt-24">
              <div className="overflow-hidden border-4 border-black bg-white">
                <div className="bg-gray-50 border-b-4 border-black p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                      <Webhook className="h-4 w-4 text-gray-700" />
                    </div>
                    <div>
                      <h3 className="font-retro font-bold text-black text-base">Webhooks</h3>
                      <p className="font-retro text-gray-600 text-sm">
                        Receive real-time notifications for credential events
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-6 prose prose-sm prose-headings:text-black prose-p:text-gray-700 prose-li:text-gray-700 prose-strong:text-black prose-code:text-gray-800 prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded max-w-none font-retro">
                  <h4>Available Events</h4>
                  <ul>
                    <li><code>credential.revoked</code> - A credential was revoked</li>
                    <li><code>credential.renewed</code> - A credential was renewed</li>
                    <li><code>credential.expired</code> - A credential expired</li>
                  </ul>

                  <h4>Webhook Payload</h4>
                  <CodeBlock language="json">{`{
  "event": "credential.revoked",
  "timestamp": "2025-01-13T12:00:00Z",
  "data": {
    "credential_id": "uuid",
    "agent_id": "agent-123",
    "revoked_at": "2025-01-13T12:00:00Z",
    "reason": "Security concern"
  }
}`}</CodeBlock>

                  <h4>Signature Verification</h4>
                  <p>
                    Each webhook includes an HMAC signature in the <code>X-AgentID-Signature</code>
                    header. Always verify this signature before processing webhooks:
                  </p>
                  <CodeBlock language="javascript">{`const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}`}</CodeBlock>

                  <h4>Retry Behavior</h4>
                  <p>
                    Failed webhooks are retried with exponential backoff. After 5 consecutive
                    failures, the webhook subscription is automatically disabled.
                  </p>
                </div>
              </div>
            </section>

            {/* Reputation */}
            <section id="reputation" className="scroll-mt-24">
              <div className="overflow-hidden border-4 border-black bg-white">
                <div className="bg-gray-50 border-b-4 border-black p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                      <Star className="h-4 w-4 text-gray-700" />
                    </div>
                    <div>
                      <h3 className="font-retro font-bold text-black text-base">Reputation System</h3>
                      <p className="font-retro text-gray-600 text-sm">
                        Understanding trust scores and reputation
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-6 prose prose-sm prose-headings:text-black prose-p:text-gray-700 prose-li:text-gray-700 prose-strong:text-black prose-code:text-gray-800 prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded max-w-none font-retro">
                  <h4>How Reputation Works</h4>
                  <p>
                    Every credential and issuer has a trust score from 0-100. Higher scores
                    indicate more trustworthy agents based on their track record.
                  </p>

                  <h4>Score Components</h4>
                  <ul>
                    <li>
                      <strong>Verification Score (30%)</strong> - Based on successful verification
                      rate
                    </li>
                    <li>
                      <strong>Longevity Score (25%)</strong> - Older credentials with good track
                      records score higher
                    </li>
                    <li>
                      <strong>Issuer Score (25%)</strong> - Verified issuers boost scores
                    </li>
                    <li>
                      <strong>Activity Score (20%)</strong> - Recent verification activity
                    </li>
                  </ul>

                  <h4>What Affects Scores</h4>
                  <div className="not-prose">
                    <table className="w-full text-sm border-2 border-black rounded-lg overflow-hidden">
                      <thead>
                        <tr className="bg-gray-50 border-b-2 border-black">
                          <th className="text-left px-4 py-3 font-medium text-gray-700 font-retro">Action</th>
                          <th className="text-left px-4 py-3 font-medium text-gray-700 font-retro">Effect</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        <tr>
                          <td className="px-4 py-3 text-gray-600 font-retro">Successful verification</td>
                          <td className="px-4 py-3 text-emerald-600 font-retro">+1 to +3 points</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 text-gray-600 font-retro">Failed verification</td>
                          <td className="px-4 py-3 text-red-600 font-retro">-2 to -5 points</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 text-gray-600 font-retro">Credential revocation</td>
                          <td className="px-4 py-3 text-red-600 font-retro">-10 points</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 text-gray-600 font-retro">Issuer becomes verified</td>
                          <td className="px-4 py-3 text-emerald-600 font-retro">+10 points</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <h4>Reputation API</h4>
                  <CodeBlock language="http">{`GET /api/reputation/agent/{agent_id}
GET /api/reputation/issuer/{issuer_id}
GET /api/reputation/leaderboard`}</CodeBlock>
                </div>
              </div>
            </section>

            {/* CTA */}
            <div className="overflow-hidden border-4 border-black bg-gray-50">
              <div className="py-10 text-center space-y-6 p-6">
                <div className="flex justify-center">
                  <div className="w-14 h-14 rounded-xl bg-gray-100 border-4 border-black flex items-center justify-center">
                    <Sparkles className="h-7 w-7 text-gray-700" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-black font-pixel">Ready to Get Started?</h2>
                  <p className="text-gray-600 max-w-xl mx-auto font-retro">
                    Create your free account and start issuing credentials to your AI agents today.
                  </p>
                </div>
                <div className="flex gap-4 justify-center">
                  <Link href="/register">
                    <Button size="lg" className="gap-2 font-retro">
                      Create Free Account
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/directory">
                    <Button size="lg" variant="outline" className="border-gray-300 hover:bg-gray-100 font-retro">
                      Browse Directory
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t-4 border-black mt-12">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500 font-retro">
              AgentID - Credential Infrastructure for AI Agents
            </p>
            <div className="flex gap-6 text-sm text-gray-500 font-retro">
              <Link href="/" className="hover:text-black transition-colors">Home</Link>
              <Link href="/directory" className="hover:text-black transition-colors">Directory</Link>
              <Link href="/docs" className="hover:text-black transition-colors">Docs</Link>
              <Link href="/login" className="hover:text-black transition-colors">Sign In</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
