'use client';

import { useState } from 'react';
import { Copy, Check, Terminal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Tab {
  id: string;
  label: string;
  language: string;
  code: string;
}

const tabs: Tab[] = [
  {
    id: 'curl',
    label: 'cURL',
    language: 'bash',
    code: `curl -X POST https://api.agentid.dev/api/verify \\
  -H "Content-Type: application/json" \\
  -d '{
    "credential_id": "cred_abc123",
    "signature": "sig_...",
    "timestamp": 1704067200
  }'

# Response
{
  "valid": true,
  "agent": {
    "name": "Data Processing Agent",
    "issuer": "Acme Corp"
  },
  "trustScore": 95,
  "permissions": ["read:data", "write:reports"]
}`,
  },
  {
    id: 'javascript',
    label: 'JavaScript',
    language: 'javascript',
    code: `import { AgentID } from '@agentid/sdk';

const agentid = new AgentID({ apiKey: 'sk_...' });

// Verify an agent credential
const result = await agentid.verify({
  credentialId: 'cred_abc123',
  signature: request.headers['x-agent-signature'],
  timestamp: request.headers['x-agent-timestamp'],
});

if (result.valid) {
  console.log(\`Agent: \${result.agent.name}\`);
  console.log(\`Trust Score: \${result.trustScore}/100\`);
  console.log(\`Permissions: \${result.permissions.join(', ')}\`);

  // Grant access to the agent
  return allowAccess(result.agent);
}`,
  },
  {
    id: 'python',
    label: 'Python',
    language: 'python',
    code: `from agentid import AgentID

client = AgentID(api_key="sk_...")

# Verify an agent credential
result = client.verify(
    credential_id="cred_abc123",
    signature=request.headers["x-agent-signature"],
    timestamp=request.headers["x-agent-timestamp"],
)

if result.valid:
    print(f"Agent: {result.agent.name}")
    print(f"Trust Score: {result.trust_score}/100")
    print(f"Permissions: {', '.join(result.permissions)}")

    # Grant access to the agent
    return allow_access(result.agent)`,
  },
];

function SyntaxHighlight({ code, language }: { code: string; language: string }) {
  // Simple syntax highlighting
  const highlightCode = (code: string, lang: string) => {
    let highlighted = code;

    if (lang === 'bash') {
      // Highlight curl commands
      highlighted = highlighted
        .replace(/(curl|-X|-H|-d)/g, '<span class="text-yellow-400">$1</span>')
        .replace(/(POST|GET|PUT|DELETE)/g, '<span class="text-emerald-400">$1</span>')
        .replace(/(https?:\/\/[^\s"]+)/g, '<span class="text-blue-400">$1</span>')
        .replace(/("Content-Type: application\/json")/g, '<span class="text-purple-400">$1</span>')
        .replace(/(#.*)/g, '<span class="text-muted-foreground">$1</span>')
        .replace(/("valid"|"agent"|"trustScore"|"permissions"|"name"|"issuer")/g, '<span class="text-cyan-400">$1</span>')
        .replace(/: (true|false|\d+)/g, ': <span class="text-orange-400">$1</span>');
    } else if (lang === 'javascript') {
      highlighted = highlighted
        .replace(/\b(import|from|const|await|if|return)\b/g, '<span class="text-purple-400">$1</span>')
        .replace(/\b(new|true|false)\b/g, '<span class="text-orange-400">$1</span>')
        .replace(/(AgentID|console)/g, '<span class="text-yellow-400">$1</span>')
        .replace(/(\.[a-zA-Z]+)\(/g, '<span class="text-blue-400">$1</span>(')
        .replace(/(\/\/.*)/g, '<span class="text-muted-foreground">$1</span>')
        .replace(/('[^']*'|"[^"]*")/g, '<span class="text-emerald-400">$1</span>')
        .replace(/(`[^`]*`)/g, '<span class="text-emerald-400">$1</span>');
    } else if (lang === 'python') {
      highlighted = highlighted
        .replace(/\b(from|import|if|return|print)\b/g, '<span class="text-purple-400">$1</span>')
        .replace(/\b(True|False|None)\b/g, '<span class="text-orange-400">$1</span>')
        .replace(/(AgentID|client)/g, '<span class="text-yellow-400">$1</span>')
        .replace(/(\.[a-zA-Z_]+)\(/g, '<span class="text-blue-400">$1</span>(')
        .replace(/(#.*)/g, '<span class="text-muted-foreground">$1</span>')
        .replace(/(f?"[^"]*"|'[^']*')/g, '<span class="text-emerald-400">$1</span>');
    }

    return highlighted;
  };

  return (
    <pre
      className="overflow-x-auto font-mono text-sm leading-relaxed"
      dangerouslySetInnerHTML={{ __html: highlightCode(code, language) }}
    />
  );
}

export function CodeExample() {
  const [activeTab, setActiveTab] = useState('javascript');
  const [copied, setCopied] = useState(false);

  const activeCode = tabs.find((t) => t.id === activeTab);

  const handleCopy = () => {
    if (activeCode) {
      navigator.clipboard.writeText(activeCode.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <section className="py-24">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-sm font-medium mb-6">
              <Terminal className="w-4 h-4 text-emerald-400" />
              Developer Experience
            </div>

            <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
              <span className="text-white">API-first, </span>
              <span className="bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
                like you'd expect
              </span>
            </h2>

            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Clean REST APIs, comprehensive SDKs for JavaScript and Python, and documentation that
              actually helps. Verify agent credentials in just a few lines of code.
            </p>

            <div className="space-y-4">
              <Feature text="npm install @agentid/sdk" />
              <Feature text="Verify credentials in 3 lines of code" />
              <Feature text="TypeScript-first with full type safety" />
              <Feature text="Webhook events for real-time updates" />
            </div>
          </div>

          {/* Code block */}
          <div className="relative">
            <div className="rounded-2xl border border-white/10 bg-black overflow-hidden shadow-2xl">
              {/* Tab bar */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-1">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                        activeTab === tab.id
                          ? 'bg-white/10 text-white'
                          : 'text-muted-foreground hover:text-white hover:bg-white/5'
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleCopy}
                  className="p-2 rounded-md hover:bg-white/5 transition-colors"
                  title="Copy code"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
              </div>

              {/* Code content */}
              <div className="p-6 max-h-[400px] overflow-y-auto">
                {activeCode && (
                  <SyntaxHighlight code={activeCode.code} language={activeCode.language} />
                )}
              </div>
            </div>

            {/* Decorative gradient */}
            <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/20 via-blue-500/20 to-purple-500/20 rounded-3xl blur-2xl -z-10 opacity-50" />
          </div>
        </div>
      </div>
    </section>
  );
}

function Feature({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
        <Check className="w-3 h-3 text-emerald-400" />
      </div>
      <span className="text-white/80">{text}</span>
    </div>
  );
}
