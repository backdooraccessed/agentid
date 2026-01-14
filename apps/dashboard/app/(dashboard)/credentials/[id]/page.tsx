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
import { Copy, Check, ExternalLink } from 'lucide-react';
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
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="py-8 text-center text-destructive">
          {error || 'Credential not found'}
        </CardContent>
      </Card>
    );
  }

  const { credential, status, is_valid } = data;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">{credential.agent_name}</h1>
          <p className="text-muted-foreground font-mono text-sm">
            {credential.agent_id}
          </p>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Status Alerts */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-800">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-md text-green-800">
          {success}
        </div>
      )}
      {!is_valid && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800">
          This credential is not currently valid.{' '}
          {status === 'revoked' && 'It has been revoked.'}
          {status === 'expired' && 'It has expired.'}
          {status === 'expired' && (
            <button
              onClick={() => handleRenew(90)}
              disabled={renewing}
              className="ml-2 underline hover:no-underline"
            >
              {renewing ? 'Renewing...' : 'Renew now'}
            </button>
          )}
        </div>
      )}

      {/* Agent Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Agent Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Agent Type</div>
              <div className="font-medium">
                {AGENT_TYPE_LABELS[credential.agent_type]}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Issuer</div>
              <div className="font-medium">
                {credential.issuer.name}
                {credential.issuer.issuer_verified && (
                  <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                    Verified
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Permissions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Permissions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="text-sm text-muted-foreground mb-2">Actions</div>
            <div className="flex flex-wrap gap-2">
              {credential.permissions.actions.map((action) => (
                <span
                  key={action}
                  className="px-2 py-1 bg-muted rounded text-sm"
                >
                  {PERMISSION_ACTION_LABELS[action]}
                </span>
              ))}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-2">Domains</div>
            <div className="flex flex-wrap gap-2">
              {credential.permissions.domains.map((domain) => (
                <span
                  key={domain}
                  className="px-2 py-1 bg-muted rounded text-sm"
                >
                  {PERMISSION_DOMAIN_LABELS[domain]}
                </span>
              ))}
            </div>
          </div>
          {credential.permissions.resource_limits.max_transaction_value && (
            <div>
              <div className="text-sm text-muted-foreground mb-1">Resource Limits</div>
              <div className="text-sm">
                Max Transaction:{' '}
                {credential.permissions.resource_limits.max_transaction_value}{' '}
                {credential.permissions.resource_limits.currency || 'USD'}
                {credential.permissions.resource_limits.daily_limit && (
                  <> | Daily Limit: {credential.permissions.resource_limits.daily_limit}</>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Validity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Validity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Valid From</div>
              <div className="font-medium">
                {new Date(credential.constraints.valid_from).toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Valid Until</div>
              <div className="font-medium">
                {new Date(credential.constraints.valid_until).toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Issued At</div>
              <div className="font-medium">
                {new Date(credential.issued_at).toLocaleString()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Embeddable Badge */}
      <EmbeddableBadge credentialId={id} agentName={credential.agent_name} />

      {/* Credential JSON */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Credential Payload</CardTitle>
            <Button variant="outline" size="sm" onClick={copyCredential}>
              {copied ? 'Copied!' : 'Copy JSON'}
            </Button>
          </div>
          <CardDescription>
            Use this payload to verify the credential programmatically
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto">
            {JSON.stringify(credential, null, 2)}
          </pre>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => router.back()}>
              Back
            </Button>
            {(status === 'active' || status === 'expired') && (
              <>
                <Button
                  variant="outline"
                  onClick={() => handleRenew(30)}
                  disabled={renewing}
                >
                  {renewing ? 'Renewing...' : 'Extend 30 days'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleRenew(90)}
                  disabled={renewing}
                >
                  {renewing ? 'Renewing...' : 'Extend 90 days'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleRenew(365)}
                  disabled={renewing}
                >
                  {renewing ? 'Renewing...' : 'Extend 1 year'}
                </Button>
              </>
            )}
            {status === 'active' && (
              <Button
                variant="destructive"
                onClick={() => setShowRevokeDialog(true)}
              >
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
  const colors = {
    active: 'bg-green-100 text-green-800',
    revoked: 'bg-red-100 text-red-800',
    expired: 'bg-yellow-100 text-yellow-800',
    suspended: 'bg-orange-100 text-orange-800',
  };

  return (
    <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${colors[status]}`}>
      {CREDENTIAL_STATUS_LABELS[status]}
    </span>
  );
}

function EmbeddableBadge({ credentialId, agentName }: { credentialId: string; agentName: string }) {
  const [style, setStyle] = useState<'flat' | 'plastic'>('flat');
  const [copiedType, setCopiedType] = useState<string | null>(null);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const badgeUrl = `${baseUrl}/api/badge/${credentialId}?style=${style}`;
  const verifyUrl = `${baseUrl}/verify/${credentialId}`;

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
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <ExternalLink className="h-5 w-5" />
          Verified Badge
        </CardTitle>
        <CardDescription>
          Embed this badge on your website or README to show your agent is verified
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Badge Preview */}
        <div>
          <div className="text-sm text-muted-foreground mb-2">Preview</div>
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
            <img
              src={badgeUrl}
              alt={`AgentID Verified: ${agentName}`}
              className="h-5"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setStyle('flat')}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  style === 'flat'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                Flat
              </button>
              <button
                onClick={() => setStyle('plastic')}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  style === 'plastic'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                Plastic
              </button>
            </div>
          </div>
        </div>

        {/* HTML Embed */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-muted-foreground">HTML</div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(htmlCode, 'HTML')}
              className="h-7 gap-1"
            >
              {copiedType === 'HTML' ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              Copy
            </Button>
          </div>
          <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto font-mono">
            {htmlCode}
          </pre>
        </div>

        {/* Markdown Embed */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-muted-foreground">Markdown</div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(markdownCode, 'Markdown')}
              className="h-7 gap-1"
            >
              {copiedType === 'Markdown' ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              Copy
            </Button>
          </div>
          <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto font-mono">
            {markdownCode}
          </pre>
        </div>

        {/* Direct URL */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-muted-foreground">Direct Image URL</div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(badgeUrl, 'URL')}
              className="h-7 gap-1"
            >
              {copiedType === 'URL' ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              Copy
            </Button>
          </div>
          <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto font-mono">
            {badgeUrl}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}
