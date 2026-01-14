'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CheckCircle,
  XCircle,
  Loader2,
  Copy,
  RefreshCw,
  Globe,
  Shield,
  AlertCircle,
} from 'lucide-react';

interface DomainVerificationProps {
  domain: string | null;
}

interface VerificationStatus {
  domain: string | null;
  verified: boolean;
  verified_at: string | null;
  method: string | null;
  token: string | null;
  recent_attempts: Array<{
    id: string;
    status: string;
    failure_reason: string | null;
    attempted_at: string;
  }>;
}

export function DomainVerification({ domain }: DomainVerificationProps) {
  const [status, setStatus] = useState<VerificationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/domain/verify');
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch domain status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const generateToken = async () => {
    setGenerating(true);
    try {
      const response = await fetch('/api/domain/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate' }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Verification token generated');
        fetchStatus();
      } else {
        toast.error(data.error || 'Failed to generate token');
      }
    } catch (error) {
      toast.error('Failed to generate token');
    } finally {
      setGenerating(false);
    }
  };

  const verifyDomain = async () => {
    setVerifying(true);
    try {
      const response = await fetch('/api/domain/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify' }),
      });

      const data = await response.json();

      if (data.verified) {
        toast.success('Domain verified successfully!');
        fetchStatus();
      } else {
        toast.error(data.error || 'Verification failed');
      }
    } catch (error) {
      toast.error('Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!domain) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Domain Verification
          </CardTitle>
          <CardDescription>
            Verify ownership of your domain to increase trust
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please add a domain to your profile first, then you can verify it.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Domain Verification
            </CardTitle>
            <CardDescription>
              Verify ownership of your domain to increase trust
            </CardDescription>
          </div>
          {status?.verified && (
            <Badge variant="success" className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Verified
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Status */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              status?.verified ? 'bg-green-100 dark:bg-green-900/30' : 'bg-yellow-100 dark:bg-yellow-900/30'
            }`}>
              {status?.verified ? (
                <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
              ) : (
                <Globe className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              )}
            </div>
            <div>
              <div className="font-medium">{domain}</div>
              <div className="text-sm text-muted-foreground">
                {status?.verified
                  ? `Verified on ${new Date(status.verified_at!).toLocaleDateString()}`
                  : 'Not verified'}
              </div>
            </div>
          </div>
        </div>

        {/* Verification Instructions */}
        {!status?.verified && (
          <div className="space-y-4">
            <div className="text-sm font-medium">Verification Steps:</div>

            {/* Step 1: Generate Token */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                  1
                </span>
                <span>Generate a verification token</span>
              </div>

              {status?.token ? (
                <div className="ml-8 p-3 rounded-lg bg-muted font-mono text-sm break-all">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">Token:</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(status.token!, 'Token')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-1">{status.token}</div>
                </div>
              ) : (
                <div className="ml-8">
                  <Button onClick={generateToken} disabled={generating}>
                    {generating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      'Generate Token'
                    )}
                  </Button>
                </div>
              )}
            </div>

            {/* Step 2: Add DNS Record */}
            {status?.token && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                    2
                  </span>
                  <span>Add a TXT record to your DNS</span>
                </div>

                <div className="ml-8 space-y-3">
                  <div className="p-3 rounded-lg bg-muted">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Type:</span>
                        <span className="ml-2 font-mono">TXT</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Host:</span>
                        <span className="ml-2 font-mono">_agentid</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 ml-1"
                          onClick={() => copyToClipboard('_agentid', 'Host')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Value:</span>
                        <span className="ml-2 font-mono text-xs break-all">{status.token}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 ml-1"
                          onClick={() => copyToClipboard(status.token!, 'Value')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      DNS changes can take up to 48 hours to propagate. The full record will be: <code className="text-xs">_agentid.{domain}</code>
                    </AlertDescription>
                  </Alert>
                </div>
              </div>
            )}

            {/* Step 3: Verify */}
            {status?.token && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                    3
                  </span>
                  <span>Click verify once DNS is configured</span>
                </div>

                <div className="ml-8 flex gap-2">
                  <Button onClick={verifyDomain} disabled={verifying}>
                    {verifying ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Verify Domain
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={generateToken} disabled={generating}>
                    Regenerate Token
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Recent Attempts */}
        {status?.recent_attempts && status.recent_attempts.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Recent Verification Attempts</div>
            <div className="space-y-2">
              {status.recent_attempts.slice(0, 3).map((attempt) => (
                <div
                  key={attempt.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/50 text-sm"
                >
                  <div className="flex items-center gap-2">
                    {attempt.status === 'success' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : attempt.status === 'failed' ? (
                      <XCircle className="h-4 w-4 text-red-600" />
                    ) : (
                      <Loader2 className="h-4 w-4 text-yellow-600 animate-spin" />
                    )}
                    <span className="capitalize">{attempt.status}</span>
                    {attempt.failure_reason && (
                      <span className="text-muted-foreground text-xs">
                        - {attempt.failure_reason}
                      </span>
                    )}
                  </div>
                  <span className="text-muted-foreground text-xs">
                    {new Date(attempt.attempted_at).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Verified State */}
        {status?.verified && (
          <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              Your domain is verified! Your credentials now display the verified badge, increasing trust with verifiers.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
