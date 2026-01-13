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
  const [revoking, setRevoking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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

  const handleRevoke = async () => {
    if (!confirm('Are you sure you want to revoke this credential? This cannot be undone.')) {
      return;
    }

    setRevoking(true);
    try {
      const response = await fetch(`/api/credentials/${id}/revoke`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Revoked via dashboard' }),
      });

      if (!response.ok) {
        const result = await response.json();
        setError(result.error || 'Failed to revoke');
        return;
      }

      router.push('/credentials');
      router.refresh();
    } catch {
      setError('Network error');
    } finally {
      setRevoking(false);
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

      {/* Status Alert */}
      {!is_valid && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800">
          This credential is not currently valid.{' '}
          {status === 'revoked' && 'It has been revoked.'}
          {status === 'expired' && 'It has expired.'}
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
      <div className="flex gap-4">
        <Button variant="outline" onClick={() => router.back()}>
          Back
        </Button>
        {status === 'active' && (
          <Button
            variant="destructive"
            onClick={handleRevoke}
            disabled={revoking}
          >
            {revoking ? 'Revoking...' : 'Revoke Credential'}
          </Button>
        )}
      </div>
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
