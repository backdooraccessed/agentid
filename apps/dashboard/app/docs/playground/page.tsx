'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
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
    <div className="min-h-screen bg-white font-retro">
      {/* Header */}
      <header className="border-b-4 border-black bg-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/docs" className="text-gray-600 hover:text-black">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white text-sm font-bold">
                A
              </div>
              <span className="text-xl font-pixel font-bold text-black">API Playground</span>
            </div>
          </div>
          <Link href="/docs">
            <Button variant="outline" size="sm" className="border-2 border-gray-300 hover:border-gray-400">
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
            <h2 className="text-sm font-medium text-gray-600 uppercase tracking-wide">
              Endpoints
            </h2>
            <div className="space-y-2">
              {ENDPOINTS.map((ep) => (
                <button
                  key={ep.id}
                  onClick={() => handleEndpointChange(ep.id)}
                  className={cn(
                    'w-full text-left p-3 rounded-lg border-2 transition-all',
                    selectedEndpoint === ep.id
                      ? 'bg-gray-100 border-gray-300'
                      : 'bg-white border-gray-200 hover:border-gray-400'
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn(
                      'px-2 py-0.5 rounded text-xs font-mono font-medium',
                      ep.method === 'GET' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'
                    )}>
                      {ep.method}
                    </span>
                    <span className="text-sm font-medium text-black">{ep.name}</span>
                  </div>
                  <p className="text-xs text-gray-600">{ep.description}</p>
                </button>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="pt-4 border-t border-gray-300">
              <h2 className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-3">
                Sample Credentials
              </h2>
              <div className="space-y-2 text-xs">
                <button
                  onClick={() => {
                    handleEndpointChange('verify');
                    setRequestBody('{\n  "credential_id": "afe6bcc1-0ec5-42fd-ab88-67187b9c9be0"\n}');
                  }}
                  className="w-full text-left p-2 rounded bg-gray-50 hover:bg-gray-100 text-gray-700 hover:text-black"
                >
                  Support Bot Alpha
                </button>
                <button
                  onClick={() => {
                    handleEndpointChange('verify');
                    setRequestBody('{\n  "credential_id": "ec17bb55-f76d-4595-8120-ca7c58c9d18d"\n}');
                  }}
                  className="w-full text-left p-2 rounded bg-gray-50 hover:bg-gray-100 text-gray-700 hover:text-black"
                >
                  Data Analyst Pro
                </button>
                <button
                  onClick={() => {
                    handleEndpointChange('verify');
                    setRequestBody('{\n  "agent_id": "support-bot-alpha"\n}');
                  }}
                  className="w-full text-left p-2 rounded bg-gray-50 hover:bg-gray-100 text-gray-700 hover:text-black"
                >
                  By Agent ID
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-6">
            {/* Request Card */}
            <div className="border-4 border-black bg-white">
              <div className="bg-gray-50 border-b-4 border-black p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      'px-2 py-1 rounded text-sm font-mono font-medium',
                      endpoint.method === 'GET' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'
                    )}>
                      {endpoint.method}
                    </span>
                    <code className="text-sm text-gray-700">{endpoint.path}</code>
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
              </div>
              <div className="p-4 space-y-4">
                {endpoint.method === 'POST' ? (
                  <div>
                    <Label className="text-gray-600 mb-2 block">Request Body</Label>
                    <textarea
                      value={requestBody}
                      onChange={(e) => setRequestBody(e.target.value)}
                      className="w-full h-40 bg-gray-50 border-2 border-gray-300 rounded-lg p-4 font-mono text-sm text-black resize-none focus:outline-none focus:border-black"
                      spellCheck={false}
                    />
                  </div>
                ) : (
                  <div>
                    <Label className="text-gray-600 mb-2 block">Query Parameters</Label>
                    <Input
                      value={queryParams}
                      onChange={(e) => setQueryParams(e.target.value)}
                      placeholder="query=search&limit=10"
                      className="bg-gray-50 border-2 border-gray-300 text-black focus:border-black font-mono"
                    />
                  </div>
                )}

                {/* cURL command */}
                <div>
                  <Label className="text-gray-600 mb-2 block flex items-center gap-2">
                    <Terminal className="h-4 w-4" />
                    cURL
                  </Label>
                  <pre className="bg-gray-100 border-2 border-gray-300 rounded-lg p-4 text-xs text-gray-700 overflow-x-auto">
                    {generateCurl()}
                  </pre>
                </div>
              </div>
            </div>

            {/* Response Card */}
            <div className="border-4 border-black bg-white">
              <div className="bg-gray-50 border-b-4 border-black p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-retro font-bold text-black text-base flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Response
                    {responseTime !== null && (
                      <span className="text-xs text-gray-600 font-normal">
                        {responseTime}ms
                      </span>
                    )}
                  </h3>
                  {response && (
                    <Button variant="ghost" size="sm" onClick={handleCopy}>
                      {copied ? (
                        <Check className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
              <div className="p-4">
                {response ? (
                  <pre className="bg-gray-100 border-2 border-gray-300 rounded-lg p-4 text-sm text-gray-800 overflow-x-auto max-h-96">
                    {response}
                  </pre>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Run a request to see the response</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
