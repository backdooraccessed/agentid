'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DomainVerification } from '@/components/settings/domain-verification';
import { ISSUER_TYPES, ISSUER_TYPE_LABELS } from '@agentid/shared';
import type { Issuer, IssuerType } from '@agentid/shared';
import { CheckCircle, Copy } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const [issuer, setIssuer] = useState<Issuer | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    issuer_type: 'individual' as IssuerType,
    domain: '',
    description: '',
  });

  useEffect(() => {
    async function fetchIssuer() {
      try {
        const response = await fetch('/api/issuers/register');
        const data = await response.json();

        if (data.issuer) {
          setIssuer(data.issuer);
          setFormData({
            name: data.issuer.name,
            issuer_type: data.issuer.issuer_type,
            domain: data.issuer.domain || '',
            description: data.issuer.description || '',
          });
        }
      } catch {
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    }

    fetchIssuer();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/issuers/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to save');
        return;
      }

      setIssuer(data.issuer);
      setSuccess(true);
      router.refresh();
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          {issuer ? 'Manage your issuer profile' : 'Create your issuer profile'}
        </p>
      </div>

      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 text-sm text-green-700 bg-green-50 rounded-md">
          Profile saved successfully!
        </div>
      )}

      {/* Issuer Profile Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Issuer Profile</CardTitle>
          <CardDescription>
            {issuer
              ? 'Your issuer profile is used to identify you when issuing credentials'
              : 'Create your issuer profile to start issuing credentials'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Organization/Individual Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Acme Corp"
                required
                disabled={!!issuer}
              />
            </div>

            <div className="space-y-2">
              <Label>Issuer Type</Label>
              <div className="grid grid-cols-3 gap-2">
                {ISSUER_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() =>
                      !issuer && setFormData((prev) => ({ ...prev, issuer_type: type }))
                    }
                    disabled={!!issuer}
                    className={`p-3 rounded-md border text-left transition-colors ${
                      formData.issuer_type === type
                        ? 'border-primary bg-primary/5'
                        : 'border-input hover:bg-accent'
                    } ${issuer ? 'cursor-not-allowed opacity-60' : ''}`}
                  >
                    <div className="font-medium text-sm">
                      {ISSUER_TYPE_LABELS[type]}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="domain">Domain (optional)</Label>
              <Input
                id="domain"
                value={formData.domain}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, domain: e.target.value }))
                }
                placeholder="acme.com"
                disabled={!!issuer}
              />
              <p className="text-xs text-muted-foreground">
                Your organization&apos;s domain for verification
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="AI automation company"
                disabled={!!issuer}
              />
            </div>

            {!issuer && (
              <Button type="submit" disabled={saving}>
                {saving ? 'Creating...' : 'Create Profile'}
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Domain Verification */}
      {issuer && <DomainVerification domain={issuer.domain || null} />}

      {/* Public Key Display */}
      {issuer && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Public Key</CardTitle>
            <CardDescription>
              Services can use this key to verify credentials you issue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Key ID</Label>
                <div className="flex items-center gap-2 mt-1">
                  <div className="font-mono text-sm bg-muted p-2 rounded flex-1">
                    {issuer.key_id}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(issuer.key_id);
                      toast.success('Key ID copied');
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Public Key (Base64)</Label>
                <div className="flex items-center gap-2 mt-1">
                  <div className="font-mono text-xs bg-muted p-2 rounded flex-1 break-all">
                    {issuer.public_key}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(issuer.public_key);
                      toast.success('Public key copied');
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Admin Verification Status */}
      {issuer && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Admin Verification</CardTitle>
            <CardDescription>
              Additional verification by AgentID team
            </CardDescription>
          </CardHeader>
          <CardContent>
            {issuer.is_verified ? (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <div className="font-medium text-green-800 dark:text-green-200">Verified Issuer</div>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Your organization has been verified by AgentID
                  </p>
                </div>
                <Badge variant="success" className="ml-auto">Verified</Badge>
              </div>
            ) : (
              <div className="text-muted-foreground">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                  Not yet verified
                </div>
                <p className="text-sm">
                  Domain verification is self-service. For additional organization verification,
                  contact support@agentid.dev. Verified issuers have higher trust scores.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
