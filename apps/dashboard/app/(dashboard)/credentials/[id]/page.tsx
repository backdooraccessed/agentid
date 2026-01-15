'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  CREDENTIAL_STATUS_LABELS,
  AGENT_TYPE_LABELS,
  PERMISSION_ACTION_LABELS,
  PERMISSION_DOMAIN_LABELS,
} from '@agentid/shared';
import { toast } from 'sonner';
import { Copy, Check, ExternalLink, Bot, Building2, ShieldCheck, Calendar, Clock, ArrowLeft, RefreshCw, XCircle, FileKey, TrendingUp, Activity, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { RevocationDialog } from '@/components/credentials/revocation-dialog';
import type { CredentialStatus, AgentType, PermissionAction, PermissionDomain } from '@agentid/shared';

interface CredentialDetail {
  credential: {
    credential_id: string;
    agent_id: string;
    agent_name: string;
    agent_type: AgentType;
    issuer: {
      issuer_id: string;
      issuer_type: string;
      issuer_verified: boolean;
      name: string;
    };
    permissions: {
      actions: PermissionAction[];
      domains: PermissionDomain[];
      resource_limits: {
        max_transaction_value?: number;
        currency?: string;
        daily_limit?: number;
      };
    };
    constraints: {
      valid_from: string;
      valid_until: string;
      geographic_restrictions: string[];
      allowed_services: string[];
    };
    issued_at: string;
    signature: string;
  };
  status: CredentialStatus;
  is_valid: boolean;
}

export default function CredentialDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [data, setData] = useState<CredentialDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [renewing, setRenewing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);

  useEffect(() => {
    async function fetchCredential() {
      try {
        const response = await fetch(`/api/credentials/${id}`);
        const result = await response.json();

        if (!response.ok) {
          setError(result.error || 'Failed to fetch credential');
          return;
        }

        setData(result);
      } catch {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    }

    fetchCredential();
  }, [id]);

  const handleRevoke = async (reason: string) => {
    const response = await fetch(`/api/credentials/${id}/revoke`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error || 'Failed to revoke');
    }

    toast.success('Credential revoked successfully');
    router.push('/credentials');
    router.refresh();
  };

  const handleRenew = async (days: number) => {
    setRenewing(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch(`/api/credentials/${id}/renew`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extend_days: days }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Failed to renew');
        return;
      }

      setSuccess(`Credential renewed for ${days} days`);
      // Refresh the data
      const refreshResponse = await fetch(`/api/credentials/${id}`);
      const refreshData = await refreshResponse.json();
      if (refreshResponse.ok) {
        setData(refreshData);
      }
    } catch {
      setError('Network error');
    } finally {
      setRenewing(false);
    }
  };

  const copyCredential = () => {
    if (data?.credential) {
      navigator.clipboard.writeText(JSON.stringify(data.credential, null, 2));
      setCopied(true);
      toast.success('Credential JSON copied');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-red-500/20 bg-red-500/5">
          <CardContent className="py-8 text-center text-red-400">
            {error || 'Credential not found'}
          </CardContent>
        </Card>
      </div>
    );
  }

  const { credential, status, is_valid } = data;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
            <Bot className="h-7 w-7 text-white/70" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold">{credential.agent_name}</h1>
            <p className="text-muted-foreground font-mono text-sm">
              {credential.agent_id}
            </p>
          </div>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Status Alerts */}
      {error && (
        <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl text-emerald-400">
          {success}
        </div>
      )}
      {!is_valid && (
        <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl text-amber-300">
          This credential is not currently valid.{' '}
          {status === 'revoked' && 'It has been revoked.'}
          {status === 'expired' && 'It has expired.'}
          {status === 'expired' && (
            <button
              onClick={() => handleRenew(90)}
              disabled={renewing}
              className="ml-2 underline hover:no-underline text-amber-400"
            >
              {renewing ? 'Renewing...' : 'Renew now'}
            </button>
          )}
        </div>
      )}

      {/* Agent Info */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-white/[0.02] border-b border-white/5">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
              <Bot className="h-4 w-4 text-white/70" />
            </div>
            Agent Information
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Agent Type</div>
              <div className="font-medium">
                {AGENT_TYPE_LABELS[credential.agent_type]}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Issuer</div>
              <div className="font-medium flex items-center gap-2">
                {credential.issuer.name}
                {credential.issuer.issuer_verified && (
                  <span className="inline-flex items-center gap-1 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    <ShieldCheck className="h-3 w-3" />
                    Verified
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Permissions */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-white/[0.02] border-b border-white/5">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
              <ShieldCheck className="h-4 w-4 text-white/70" />
            </div>
            Permissions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div>
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Actions</div>
            <div className="flex flex-wrap gap-2">
              {credential.permissions.actions.map((action) => (
                <span
                  key={action}
                  className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm"
                >
                  {PERMISSION_ACTION_LABELS[action]}
                </span>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Domains</div>
            <div className="flex flex-wrap gap-2">
              {credential.permissions.domains.map((domain) => (
                <span
                  key={domain}
                  className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm"
                >
                  {PERMISSION_DOMAIN_LABELS[domain]}
                </span>
              ))}
            </div>
          </div>
          {credential.permissions.resource_limits.max_transaction_value && (
            <div>
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Resource Limits</div>
              <div className="text-sm p-3 bg-white/[0.02] border border-white/10 rounded-lg">
                Max Transaction:{' '}
                <span className="font-medium">{credential.permissions.resource_limits.max_transaction_value}{' '}
                {credential.permissions.resource_limits.currency || 'USD'}</span>
                {credential.permissions.resource_limits.daily_limit && (
                  <span className="ml-4">Daily Limit: <span className="font-medium">{credential.permissions.resource_limits.daily_limit}</span></span>
                )}
              </div>
            </div>
          )}

          {/* Quick Link to Policies */}
          <div className="pt-4 border-t border-white/5">
            <Link
              href="/policies"
              className="flex items-center gap-3 p-3 -mx-3 rounded-lg hover:bg-white/[0.04] transition-colors group"
            >
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                <FileKey className="h-4 w-4 text-white/60 group-hover:text-white transition-colors" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium group-hover:text-white transition-colors">Manage Permission Policies</div>
                <p className="text-xs text-white/40">Create or edit policies to control access</p>
              </div>
              <ChevronRight className="h-4 w-4 text-white/20 group-hover:text-white/40 transition-colors" />
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-4">
        <Link href="/verifications" className="group">
          <Card className="overflow-hidden hover:bg-white/[0.02] transition-colors h-full">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                <Activity className="h-5 w-5 text-white/60 group-hover:text-white transition-colors" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium group-hover:text-white transition-colors">Verification History</div>
                <p className="text-xs text-white/40">View verification logs</p>
              </div>
              <ChevronRight className="h-4 w-4 text-white/20 group-hover:text-white/40 transition-colors" />
            </CardContent>
          </Card>
        </Link>
        <Link href="/analytics" className="group">
          <Card className="overflow-hidden hover:bg-white/[0.02] transition-colors h-full">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-white/60 group-hover:text-white transition-colors" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium group-hover:text-white transition-colors">Trust Score Trends</div>
                <p className="text-xs text-white/40">View analytics & trends</p>
              </div>
              <ChevronRight className="h-4 w-4 text-white/20 group-hover:text-white/40 transition-colors" />
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Validity */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-white/[0.02] border-b border-white/5">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
              <Calendar className="h-4 w-4 text-white/70" />
            </div>
            Validity
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-3 gap-6">
            <div>
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Valid From</div>
              <div className="font-medium">
                {new Date(credential.constraints.valid_from).toLocaleDateString()}
              </div>
              <div className="text-xs text-muted-foreground">
                {new Date(credential.constraints.valid_from).toLocaleTimeString()}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Valid Until</div>
              <div className="font-medium">
                {new Date(credential.constraints.valid_until).toLocaleDateString()}
              </div>
              <div className="text-xs text-muted-foreground">
                {new Date(credential.constraints.valid_until).toLocaleTimeString()}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Issued At</div>
              <div className="font-medium">
                {new Date(credential.issued_at).toLocaleDateString()}
              </div>
              <div className="text-xs text-muted-foreground">
                {new Date(credential.issued_at).toLocaleTimeString()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Embeddable Badge */}
      <EmbeddableBadge credentialId={id} agentName={credential.agent_name} />

      {/* Credential JSON */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-white/[0.02] border-b border-white/5">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                <Copy className="h-4 w-4 text-white/70" />
              </div>
              Credential Payload
            </CardTitle>
            <Button variant="outline" size="sm" onClick={copyCredential} className="border-white/10 hover:bg-white/[0.04]">
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2 text-emerald-400" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy JSON
                </>
              )}
            </Button>
          </div>
          <CardDescription>
            Use this payload to verify the credential programmatically
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <pre className="bg-black border border-white/10 p-4 rounded-xl text-xs overflow-x-auto font-mono text-white/70">
            {JSON.stringify(credential, null, 2)}
          </pre>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-white/[0.02] border-b border-white/5">
          <CardTitle className="text-lg">Actions</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => router.back()} className="border-white/10 hover:bg-white/[0.04]">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            {(status === 'active' || status === 'expired') && (
              <>
                <Button
                  variant="outline"
                  onClick={() => handleRenew(30)}
                  disabled={renewing}
                  className="border-white/10 hover:bg-white/[0.04]"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${renewing ? 'animate-spin' : ''}`} />
                  Extend 30 days
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleRenew(90)}
                  disabled={renewing}
                  className="border-white/10 hover:bg-white/[0.04]"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${renewing ? 'animate-spin' : ''}`} />
                  Extend 90 days
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleRenew(365)}
                  disabled={renewing}
                  className="border-white/10 hover:bg-white/[0.04]"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${renewing ? 'animate-spin' : ''}`} />
                  Extend 1 year
                </Button>
              </>
            )}
            {status === 'active' && (
              <Button
                variant="destructive"
                onClick={() => setShowRevokeDialog(true)}
                className="bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Revoke Credential
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Revocation Dialog */}
      <RevocationDialog
        open={showRevokeDialog}
        onOpenChange={setShowRevokeDialog}
        agentName={credential.agent_name}
        agentId={credential.agent_id}
        onConfirm={handleRevoke}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: CredentialStatus }) {
  const styles = {
    active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    revoked: 'bg-red-500/10 text-red-400 border-red-500/20',
    expired: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    suspended: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  };

  return (
    <span className={`px-3 py-1.5 rounded-full text-sm font-semibold border ${styles[status]}`}>
      {CREDENTIAL_STATUS_LABELS[status]}
    </span>
  );
}

function EmbeddableBadge({ credentialId, agentName }: { credentialId: string; agentName: string }) {
  const [style, setStyle] = useState<'modern' | 'flat' | 'plastic'>('modern');
  const [copiedType, setCopiedType] = useState<string | null>(null);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const badgeUrl = `${baseUrl}/api/badge/${credentialId}?style=${style}`;
  const verifyUrl = `${baseUrl}/credentials/${credentialId}`;

  const htmlCode = `<a href="${verifyUrl}" target="_blank" rel="noopener noreferrer">
  <img src="${badgeUrl}" alt="AgentID Verified: ${agentName}" />
</a>`;

  const markdownCode = `[![AgentID Verified: ${agentName}](${badgeUrl})](${verifyUrl})`;

  const copyToClipboard = async (text: string, type: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedType(type);
    toast.success(`${type} code copied`);
    setTimeout(() => setCopiedType(null), 2000);
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-white/[0.02] border-b border-white/5">
        <CardTitle className="text-lg flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
            <ExternalLink className="h-4 w-4 text-white/70" />
          </div>
          Verified Badge
        </CardTitle>
        <CardDescription>
          Embed this badge on your website or README to show your agent is verified
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Badge Preview */}
        <div>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Preview</div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-white/[0.02] rounded-xl border border-dashed border-white/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={badgeUrl}
              alt={`AgentID Verified: ${agentName}`}
              className="h-7"
            />
            <div className="flex gap-2">
              {(['modern', 'flat', 'plastic'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStyle(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    style === s
                      ? 'bg-white text-black'
                      : 'bg-white/5 hover:bg-white/10 text-muted-foreground'
                  }`}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* HTML Embed */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">HTML</div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(htmlCode, 'HTML')}
              className="h-7 gap-1.5 hover:bg-white/[0.04]"
            >
              {copiedType === 'HTML' ? (
                <Check className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              Copy
            </Button>
          </div>
          <pre className="bg-black border border-white/10 p-4 rounded-xl text-xs overflow-x-auto font-mono text-white/70">
            {htmlCode}
          </pre>
        </div>

        {/* Markdown Embed */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Markdown</div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(markdownCode, 'Markdown')}
              className="h-7 gap-1.5 hover:bg-white/[0.04]"
            >
              {copiedType === 'Markdown' ? (
                <Check className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              Copy
            </Button>
          </div>
          <pre className="bg-black border border-white/10 p-4 rounded-xl text-xs overflow-x-auto font-mono text-white/70">
            {markdownCode}
          </pre>
        </div>

        {/* Direct URL */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Direct Image URL</div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(badgeUrl, 'URL')}
              className="h-7 gap-1.5 hover:bg-white/[0.04]"
            >
              {copiedType === 'URL' ? (
                <Check className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              Copy
            </Button>
          </div>
          <pre className="bg-black border border-white/10 p-4 rounded-xl text-xs overflow-x-auto font-mono text-white/70">
            {badgeUrl}
          </pre>
        </div>

        {/* Usage Hints */}
        <div className="text-xs text-muted-foreground pt-4 border-t border-white/5 space-y-1">
          <p>The badge automatically updates to reflect the credential status.</p>
          <p>Add <code className="px-1.5 py-0.5 bg-white/5 rounded font-mono">?theme=dark</code> for dark mode support.</p>
        </div>
      </CardContent>
    </Card>
  );
}
