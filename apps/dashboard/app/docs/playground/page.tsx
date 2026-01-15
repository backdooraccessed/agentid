'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  Play,
  Copy,
  Check,
  Loader2,
  Shield,
  Code2,
  Terminal,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type EndpointType = 'verify' | 'verify-batch' | 'registry-search' | 'registry-featured';

interface Endpoint {
  id: EndpointType;
  name: string;
  method: 'GET' | 'POST';
  path: string;
  description: string;
  defaultBody?: object;
  requiresAuth: boolean;
}

const ENDPOINTS: Endpoint[] = [
  {
    id: 'verify',
    name: 'Verify Credential',
    method: 'POST',
    path: '/api/verify',
    description: 'Verify a single credential by ID or agent ID',
    defaultBody: { credential_id: '' },
    requiresAuth: false,
  },
  {
    id: 'verify-batch',
    name: 'Batch Verify',
    method: 'POST',
    path: '/api/verify/batch',
    description: 'Verify multiple credentials in one request',
    defaultBody: { credential_ids: [] },
    requiresAuth: false,
  },
  {
    id: 'registry-search',
    name: 'Search Agents',
    method: 'GET',
    path: '/api/registry',
    description: 'Search the agent registry',
    requiresAuth: false,
  },
  {
    id: 'registry-featured',
    name: 'Featured Agents',
    method: 'GET',
    path: '/api/registry/featured',
    description: 'Get featured agents from the registry',
    requiresAuth: false,
  },
];

export default function PlaygroundPage() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointType>('verify');
  const [requestBody, setRequestBody] = useState('{\n  "credential_id": ""\n}');
  const [queryParams, setQueryParams] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [responseTime, setResponseTime] = useState<number | null>(null);

  const endpoint = ENDPOINTS.find(e => e.id === selectedEndpoint)!;

  const handleRun = async () => {
    setLoading(true);
    setResponse(null);
    setResponseTime(null);

    const startTime = Date.now();

    try {
      let url = endpoint.path;
      if (endpoint.method === 'GET' && queryParams) {
        url += '?' + queryParams;
      }

      const options: RequestInit = {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (endpoint.method === 'POST') {
        options.body = requestBody;
      }

      const res = await fetch(url, options);
      const data = await res.json();

      setResponseTime(Date.now() - startTime);
      setResponse(JSON.stringify(data, null, 2));
    } catch (error) {
      setResponseTime(Date.now() - startTime);
      setResponse(JSON.stringify({ error: (error as Error).message }, null, 2));
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (response) {
      navigator.clipboard.writeText(response);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleEndpointChange = (id: EndpointType) => {
    setSelectedEndpoint(id);
    const ep = ENDPOINTS.find(e => e.id === id)!;
    if (ep.defaultBody) {
      setRequestBody(JSON.stringify(ep.defaultBody, null, 2));
    }
    setQueryParams('');
    setResponse(null);
    setResponseTime(null);
  };

  const generateCurl = () => {
    let curl = `curl -X ${endpoint.method} \\
  'https://agentid.dev${endpoint.path}${endpoint.method === 'GET' && queryParams ? '?' + queryParams : ''}'`;

    if (endpoint.method === 'POST') {
      curl += ` \\
  -H 'Content-Type: application/json' \\
  -d '${requestBody.replace(/\n/g, '')}'`;
    }

    return curl;
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/docs" className="text-white/60 hover:text-white">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-black text-sm font-bold">
                A
              </div>
              <span className="text-xl font-bold text-white">API Playground</span>
            </div>
          </div>
          <Link href="/docs">
            <Button variant="outline" size="sm" className="border-white/10">
              <Code2 className="h-4 w-4 mr-2" />
              Back to Docs
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-[300px_1fr] gap-6">
          {/* Sidebar - Endpoint Selection */}
          <div className="space-y-4">
            <h2 className="text-sm font-medium text-white/60 uppercase tracking-wide">
              Endpoints
            </h2>
            <div className="space-y-2">
              {ENDPOINTS.map((ep) => (
                <button
                  key={ep.id}
                  onClick={() => handleEndpointChange(ep.id)}
                  className={cn(
                    'w-full text-left p-3 rounded-lg border transition-all',
                    selectedEndpoint === ep.id
                      ? 'bg-white/10 border-white/20'
                      : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn(
                      'px-2 py-0.5 rounded text-xs font-mono font-medium',
                      ep.method === 'GET' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
                    )}>
                      {ep.method}
                    </span>
                    <span className="text-sm font-medium text-white">{ep.name}</span>
                  </div>
                  <p className="text-xs text-white/50">{ep.description}</p>
                </button>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="pt-4 border-t border-white/10">
              <h2 className="text-sm font-medium text-white/60 uppercase tracking-wide mb-3">
                Sample Credentials
              </h2>
              <div className="space-y-2 text-xs">
                <button
                  onClick={() => {
                    handleEndpointChange('verify');
                    setRequestBody('{\n  "credential_id": "afe6bcc1-0ec5-42fd-ab88-67187b9c9be0"\n}');
                  }}
                  className="w-full text-left p-2 rounded bg-white/5 hover:bg-white/10 text-white/70 hover:text-white"
                >
                  Support Bot Alpha
                </button>
                <button
                  onClick={() => {
                    handleEndpointChange('verify');
                    setRequestBody('{\n  "credential_id": "ec17bb55-f76d-4595-8120-ca7c58c9d18d"\n}');
                  }}
                  className="w-full text-left p-2 rounded bg-white/5 hover:bg-white/10 text-white/70 hover:text-white"
                >
                  Data Analyst Pro
                </button>
                <button
                  onClick={() => {
                    handleEndpointChange('verify');
                    setRequestBody('{\n  "agent_id": "support-bot-alpha"\n}');
                  }}
                  className="w-full text-left p-2 rounded bg-white/5 hover:bg-white/10 text-white/70 hover:text-white"
                >
                  By Agent ID
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-6">
            {/* Request Card */}
            <Card>
              <CardHeader className="bg-white/[0.02] border-b border-white/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      'px-2 py-1 rounded text-sm font-mono font-medium',
                      endpoint.method === 'GET' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
                    )}>
                      {endpoint.method}
                    </span>
                    <code className="text-sm text-white/70">{endpoint.path}</code>
                  </div>
                  <Button onClick={handleRun} disabled={loading} className="gap-2">
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                    Run
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {endpoint.method === 'POST' ? (
                  <div>
                    <Label className="text-white/60 mb-2 block">Request Body</Label>
                    <textarea
                      value={requestBody}
                      onChange={(e) => setRequestBody(e.target.value)}
                      className="w-full h-40 bg-white/[0.02] border border-white/10 rounded-lg p-4 font-mono text-sm text-white resize-none focus:outline-none focus:border-white/30"
                      spellCheck={false}
                    />
                  </div>
                ) : (
                  <div>
                    <Label className="text-white/60 mb-2 block">Query Parameters</Label>
                    <Input
                      value={queryParams}
                      onChange={(e) => setQueryParams(e.target.value)}
                      placeholder="query=search&limit=10"
                      className="bg-white/[0.02] border-white/10 font-mono"
                    />
                  </div>
                )}

                {/* cURL command */}
                <div>
                  <Label className="text-white/60 mb-2 block flex items-center gap-2">
                    <Terminal className="h-4 w-4" />
                    cURL
                  </Label>
                  <pre className="bg-white/[0.02] border border-white/10 rounded-lg p-4 text-xs text-white/70 overflow-x-auto">
                    {generateCurl()}
                  </pre>
                </div>
              </CardContent>
            </Card>

            {/* Response Card */}
            <Card>
              <CardHeader className="bg-white/[0.02] border-b border-white/5">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Response
                    {responseTime !== null && (
                      <span className="text-xs text-white/50 font-normal">
                        {responseTime}ms
                      </span>
                    )}
                  </CardTitle>
                  {response && (
                    <Button variant="ghost" size="sm" onClick={handleCopy}>
                      {copied ? (
                        <Check className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                {response ? (
                  <pre className="bg-white/[0.02] border border-white/10 rounded-lg p-4 text-sm text-white/80 overflow-x-auto max-h-96">
                    {response}
                  </pre>
                ) : (
                  <div className="text-center py-12 text-white/40">
                    <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Run a request to see the response</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
