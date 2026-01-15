'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
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
        <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="border-4 border-red-500 bg-red-50 py-8 text-center">
          <p className="font-retro text-red-700">{error || 'Credential not found'}</p>
        </div>
      </div>
    );
  }

  const { credential, status, is_valid } = data;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 bg-gray-100 border-4 border-black flex items-center justify-center">
            <Bot className="h-7 w-7 text-gray-600" />
          </div>
          <div>
            <h1 className="font-pixel text-3xl uppercase">{credential.agent_name}</h1>
            <p className="font-mono text-sm text-gray-600">
              {credential.agent_id}
            </p>
          </div>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Status Alerts */}
      {error && (
        <div className="p-4 border-4 border-red-500 bg-red-50">
          <p className="font-retro text-red-700">{error}</p>
        </div>
      )}
      {success && (
        <div className="p-4 border-4 border-emerald-500 bg-emerald-50">
          <p className="font-retro text-emerald-700">{success}</p>
        </div>
      )}
      {!is_valid && (
        <div className="p-4 border-4 border-amber-500 bg-amber-50">
          <p className="font-retro text-amber-800">
            This credential is not currently valid.{' '}
            {status === 'revoked' && 'It has been revoked.'}
            {status === 'expired' && 'It has expired.'}
            {status === 'expired' && (
              <button
                onClick={() => handleRenew(90)}
                disabled={renewing}
                className="ml-2 underline hover:no-underline font-bold"
              >
                {renewing ? 'Renewing...' : 'Renew now'}
              </button>
            )}
          </p>
        </div>
      )}

      {/* Agent Info */}
      <div className="border-4 border-black bg-white">
        <div className="bg-gray-50 border-b-4 border-black p-4">
          <h3 className="font-retro font-bold text-black uppercase flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-100 border-2 border-gray-300 flex items-center justify-center">
              <Bot className="h-4 w-4 text-gray-600" />
            </div>
            Agent Information
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-xs font-retro text-gray-500 uppercase tracking-wider mb-1">Agent Type</div>
              <div className="font-retro font-bold text-black">
                {AGENT_TYPE_LABELS[credential.agent_type]}
              </div>
            </div>
            <div>
              <div className="text-xs font-retro text-gray-500 uppercase tracking-wider mb-1">Issuer</div>
              <div className="font-retro font-bold text-black flex items-center gap-2">
                {credential.issuer.name}
                {credential.issuer.issuer_verified && (
                  <span className="inline-flex items-center gap-1 text-xs font-retro font-bold uppercase bg-emerald-100 text-emerald-700 border-2 border-emerald-300 px-2 py-0.5">
                    <ShieldCheck className="h-3 w-3" />
                    Verified
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Permissions */}
      <div className="border-4 border-black bg-white">
        <div className="bg-gray-50 border-b-4 border-black p-4">
          <h3 className="font-retro font-bold text-black uppercase flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-100 border-2 border-gray-300 flex items-center justify-center">
              <ShieldCheck className="h-4 w-4 text-gray-600" />
            </div>
            Permissions
          </h3>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <div className="text-xs font-retro text-gray-500 uppercase tracking-wider mb-3">Actions</div>
            <div className="flex flex-wrap gap-2">
              {credential.permissions.actions.map((action) => (
                <span
                  key={action}
                  className="px-3 py-1.5 bg-gray-100 border-2 border-gray-300 text-sm font-retro font-bold text-black"
                >
                  {PERMISSION_ACTION_LABELS[action]}
                </span>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs font-retro text-gray-500 uppercase tracking-wider mb-3">Domains</div>
            <div className="flex flex-wrap gap-2">
              {credential.permissions.domains.map((domain) => (
                <span
                  key={domain}
                  className="px-3 py-1.5 bg-gray-100 border-2 border-gray-300 text-sm font-retro font-bold text-black"
                >
                  {PERMISSION_DOMAIN_LABELS[domain]}
                </span>
              ))}
            </div>
          </div>
          {credential.permissions.resource_limits.max_transaction_value && (
            <div>
              <div className="text-xs font-retro text-gray-500 uppercase tracking-wider mb-2">Resource Limits</div>
              <div className="text-sm font-retro p-3 bg-gray-50 border-2 border-gray-300">
                Max Transaction:{' '}
                <span className="font-bold text-black">{credential.permissions.resource_limits.max_transaction_value}{' '}
                {credential.permissions.resource_limits.currency || 'USD'}</span>
                {credential.permissions.resource_limits.daily_limit && (
                  <span className="ml-4">Daily Limit: <span className="font-bold text-black">{credential.permissions.resource_limits.daily_limit}</span></span>
                )}
              </div>
            </div>
          )}

          {/* Quick Link to Policies */}
          <div className="pt-4 border-t-2 border-gray-200">
            <Link
              href="/policies"
              className="flex items-center gap-3 p-3 -mx-3 border-2 border-transparent hover:border-gray-300 hover:bg-gray-50 transition-colors group"
            >
              <div className="w-8 h-8 bg-gray-100 border-2 border-gray-300 flex items-center justify-center">
                <FileKey className="h-4 w-4 text-gray-500 group-hover:text-black transition-colors" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-retro font-bold text-black">Manage Permission Policies</div>
                <p className="text-xs font-retro text-gray-500">Create or edit policies to control access</p>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-black transition-colors" />
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-4">
        <Link href="/verifications" className="group">
          <div className="border-4 border-black bg-white hover:bg-gray-50 transition-colors h-full">
            <div className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 border-2 border-gray-300 flex items-center justify-center">
                <Activity className="h-5 w-5 text-gray-500 group-hover:text-black transition-colors" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-retro font-bold text-black">Verification History</div>
                <p className="text-xs font-retro text-gray-500">View verification logs</p>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-black transition-colors" />
            </div>
          </div>
        </Link>
        <Link href="/analytics" className="group">
          <div className="border-4 border-black bg-white hover:bg-gray-50 transition-colors h-full">
            <div className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 border-2 border-gray-300 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-gray-500 group-hover:text-black transition-colors" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-retro font-bold text-black">Trust Score Trends</div>
                <p className="text-xs font-retro text-gray-500">View analytics & trends</p>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-black transition-colors" />
            </div>
          </div>
        </Link>
      </div>

      {/* Validity */}
      <div className="border-4 border-black bg-white">
        <div className="bg-gray-50 border-b-4 border-black p-4">
          <h3 className="font-retro font-bold text-black uppercase flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-100 border-2 border-gray-300 flex items-center justify-center">
              <Calendar className="h-4 w-4 text-gray-600" />
            </div>
            Validity
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-3 gap-6">
            <div>
              <div className="text-xs font-retro text-gray-500 uppercase tracking-wider mb-1">Valid From</div>
              <div className="font-retro font-bold text-black">
                {new Date(credential.constraints.valid_from).toLocaleDateString()}
              </div>
              <div className="text-xs font-retro text-gray-500">
                {new Date(credential.constraints.valid_from).toLocaleTimeString()}
              </div>
            </div>
            <div>
              <div className="text-xs font-retro text-gray-500 uppercase tracking-wider mb-1">Valid Until</div>
              <div className="font-retro font-bold text-black">
                {new Date(credential.constraints.valid_until).toLocaleDateString()}
              </div>
              <div className="text-xs font-retro text-gray-500">
                {new Date(credential.constraints.valid_until).toLocaleTimeString()}
              </div>
            </div>
            <div>
              <div className="text-xs font-retro text-gray-500 uppercase tracking-wider mb-1">Issued At</div>
              <div className="font-retro font-bold text-black">
                {new Date(credential.issued_at).toLocaleDateString()}
              </div>
              <div className="text-xs font-retro text-gray-500">
                {new Date(credential.issued_at).toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Embeddable Badge */}
      <EmbeddableBadge credentialId={id} agentName={credential.agent_name} />

      {/* Credential JSON */}
      <div className="border-4 border-black bg-white">
        <div className="bg-gray-50 border-b-4 border-black p-4">
          <div className="flex justify-between items-center">
            <h3 className="font-retro font-bold text-black uppercase flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-100 border-2 border-gray-300 flex items-center justify-center">
                <Copy className="h-4 w-4 text-gray-600" />
              </div>
              Credential Payload
            </h3>
            <Button variant="outline" size="sm" onClick={copyCredential} className="border-2 border-gray-300 hover:bg-gray-100 font-retro uppercase">
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2 text-emerald-600" />
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
          <p className="font-retro text-xs text-gray-500 mt-2">
            Use this payload to verify the credential programmatically
          </p>
        </div>
        <div className="p-6">
          <pre className="bg-gray-900 border-2 border-gray-300 p-4 text-xs overflow-x-auto font-mono text-gray-300">
            {JSON.stringify(credential, null, 2)}
          </pre>
        </div>
      </div>

      {/* Actions */}
      <div className="border-4 border-black bg-white">
        <div className="bg-gray-50 border-b-4 border-black p-4">
          <h3 className="font-retro font-bold text-black uppercase">Actions</h3>
        </div>
        <div className="p-6">
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => router.back()} className="border-2 border-gray-300 hover:bg-gray-100 font-retro uppercase">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            {(status === 'active' || status === 'expired') && (
              <>
                <Button
                  variant="outline"
                  onClick={() => handleRenew(30)}
                  disabled={renewing}
                  className="border-2 border-gray-300 hover:bg-gray-100 font-retro uppercase"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${renewing ? 'animate-spin' : ''}`} />
                  Extend 30 days
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleRenew(90)}
                  disabled={renewing}
                  className="border-2 border-gray-300 hover:bg-gray-100 font-retro uppercase"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${renewing ? 'animate-spin' : ''}`} />
                  Extend 90 days
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleRenew(365)}
                  disabled={renewing}
                  className="border-2 border-gray-300 hover:bg-gray-100 font-retro uppercase"
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
                className="bg-red-100 text-red-700 border-2 border-red-300 hover:bg-red-200 font-retro uppercase"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Revoke Credential
              </Button>
            )}
          </div>
        </div>
      </div>

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
    active: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    revoked: 'bg-red-100 text-red-700 border-red-300',
    expired: 'bg-amber-100 text-amber-700 border-amber-300',
    suspended: 'bg-orange-100 text-orange-700 border-orange-300',
  };

  return (
    <span className={`px-3 py-1.5 text-sm font-retro font-bold uppercase border-2 ${styles[status]}`}>
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
    <div className="border-4 border-black bg-white">
      <div className="bg-gray-50 border-b-4 border-black p-4">
        <h3 className="font-retro font-bold text-black uppercase flex items-center gap-2">
          <div className="w-8 h-8 bg-gray-100 border-2 border-gray-300 flex items-center justify-center">
            <ExternalLink className="h-4 w-4 text-gray-600" />
          </div>
          Verified Badge
        </h3>
        <p className="font-retro text-xs text-gray-500 mt-2">
          Embed this badge on your website or README to show your agent is verified
        </p>
      </div>
      <div className="p-6 space-y-6">
        {/* Badge Preview */}
        <div>
          <div className="text-xs font-retro text-gray-500 uppercase tracking-wider mb-3">Preview</div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-gray-50 border-2 border-dashed border-gray-300">
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
                  className={`px-3 py-1.5 text-xs font-retro font-bold uppercase transition-all border-2 ${
                    style === s
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
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
            <div className="text-xs font-retro text-gray-500 uppercase tracking-wider">HTML</div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(htmlCode, 'HTML')}
              className="h-7 gap-1.5 hover:bg-gray-100 font-retro"
            >
              {copiedType === 'HTML' ? (
                <Check className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              Copy
            </Button>
          </div>
          <pre className="bg-gray-900 border-2 border-gray-300 p-4 text-xs overflow-x-auto font-mono text-gray-300">
            {htmlCode}
          </pre>
        </div>

        {/* Markdown Embed */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-retro text-gray-500 uppercase tracking-wider">Markdown</div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(markdownCode, 'Markdown')}
              className="h-7 gap-1.5 hover:bg-gray-100 font-retro"
            >
              {copiedType === 'Markdown' ? (
                <Check className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              Copy
            </Button>
          </div>
          <pre className="bg-gray-900 border-2 border-gray-300 p-4 text-xs overflow-x-auto font-mono text-gray-300">
            {markdownCode}
          </pre>
        </div>

        {/* Direct URL */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-retro text-gray-500 uppercase tracking-wider">Direct Image URL</div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(badgeUrl, 'URL')}
              className="h-7 gap-1.5 hover:bg-gray-100 font-retro"
            >
              {copiedType === 'URL' ? (
                <Check className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              Copy
            </Button>
          </div>
          <pre className="bg-gray-900 border-2 border-gray-300 p-4 text-xs overflow-x-auto font-mono text-gray-300">
            {badgeUrl}
          </pre>
        </div>

        {/* Usage Hints */}
        <div className="text-xs font-retro text-gray-500 pt-4 border-t-2 border-gray-200 space-y-1">
          <p>The badge automatically updates to reflect the credential status.</p>
          <p>Add <code className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 font-mono">?theme=dark</code> for dark mode support.</p>
        </div>
      </div>
    </div>
  );
}
