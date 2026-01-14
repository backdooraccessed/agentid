'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DomainVerification } from '@/components/settings/domain-verification';
import { ISSUER_TYPES, ISSUER_TYPE_LABELS } from '@agentid/shared';
import type { Issuer, IssuerType } from '@agentid/shared';
import {
  CheckCircle,
  Copy,
  Settings,
  User,
  Building2,
  Globe2,
  Key,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const issuerTypeIcons: Record<IssuerType, typeof User> = {
  individual: User,
  organization: Building2,
  platform: Globe2,
};

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
      toast.success('Profile created successfully!');
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
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
          <Settings className="h-6 w-6 text-white/70" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            {issuer ? 'Manage your issuer profile and verification' : 'Create your issuer profile to get started'}
          </p>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert className="border-red-500/20 bg-red-500/5">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <AlertDescription className="text-red-200">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-emerald-500/20 bg-emerald-500/5">
          <CheckCircle className="h-4 w-4 text-emerald-400" />
          <AlertDescription className="text-emerald-200">
            Profile saved successfully!
          </AlertDescription>
        </Alert>
      )}

      {/* Issuer Profile Form */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-white/[0.02] border-b border-white/5">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
              <User className="h-4 w-4 text-white/70" />
            </div>
            Issuer Profile
          </CardTitle>
          <CardDescription>
            {issuer
              ? 'Your issuer profile identifies you when issuing credentials'
              : 'Create your issuer profile to start issuing credentials'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Organization / Individual Name
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Acme Corp"
                required
                disabled={!!issuer}
                className="h-11 bg-white/[0.02] border-white/10"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">Issuer Type</Label>
              <div className="grid grid-cols-3 gap-3">
                {ISSUER_TYPES.map((type) => {
                  const Icon = issuerTypeIcons[type];
                  const isSelected = formData.issuer_type === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() =>
                        !issuer && setFormData((prev) => ({ ...prev, issuer_type: type }))
                      }
                      disabled={!!issuer}
                      className={cn(
                        'p-4 rounded-xl border-2 text-left transition-all',
                        isSelected
                          ? 'border-white/30 bg-white/[0.04]'
                          : 'border-white/10 hover:border-white/20 hover:bg-white/[0.02]',
                        issuer && 'cursor-not-allowed opacity-60'
                      )}
                    >
                      <Icon
                        className={cn(
                          'h-5 w-5 mb-2',
                          isSelected
                            ? 'text-white'
                            : 'text-muted-foreground'
                        )}
                      />
                      <div
                        className={cn(
                          'font-medium text-sm',
                          isSelected && 'text-white'
                        )}
                      >
                        {ISSUER_TYPE_LABELS[type]}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="domain" className="text-sm font-medium">
                Domain <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input
                id="domain"
                value={formData.domain}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, domain: e.target.value }))
                }
                placeholder="acme.com"
                disabled={!!issuer}
                className="h-11 bg-white/[0.02] border-white/10"
              />
              <p className="text-xs text-muted-foreground">
                Your organization&apos;s domain for verification
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Description <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="AI automation company specializing in..."
                disabled={!!issuer}
                className="h-11 bg-white/[0.02] border-white/10"
              />
            </div>

            {!issuer && (
              <Button
                type="submit"
                disabled={saving}
                className="h-11 px-6 btn-glow"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Create Profile
                  </>
                )}
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Domain Verification */}
      {issuer && <DomainVerification domain={issuer.domain || null} />}

      {/* Public Key Display */}
      {issuer && (
        <Card className="overflow-hidden">
          <CardHeader className="bg-white/[0.02] border-b border-white/5">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                <Key className="h-4 w-4 text-white/70" />
              </div>
              Public Key
            </CardTitle>
            <CardDescription>
              Services use this key to verify credentials you issue
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Key ID
              </Label>
              <div className="flex items-center gap-2">
                <div className="font-mono text-sm bg-white/[0.02] border border-white/10 p-3 rounded-lg flex-1">
                  {issuer.key_id}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-11 w-11 shrink-0 border-white/10 hover:bg-white/[0.04]"
                  onClick={() => {
                    navigator.clipboard.writeText(issuer.key_id);
                    toast.success('Key ID copied');
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Public Key (Base64)
              </Label>
              <div className="flex items-center gap-2">
                <div className="font-mono text-xs bg-white/[0.02] border border-white/10 p-3 rounded-lg flex-1 break-all">
                  {issuer.public_key}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-11 w-11 shrink-0 border-white/10 hover:bg-white/[0.04]"
                  onClick={() => {
                    navigator.clipboard.writeText(issuer.public_key);
                    toast.success('Public key copied');
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Admin Verification Status */}
      {issuer && (
        <Card className="overflow-hidden">
          <CardHeader className="bg-white/[0.02] border-b border-white/5">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                <ShieldCheck className="h-4 w-4 text-white/70" />
              </div>
              Verification Status
            </CardTitle>
            <CardDescription>
              Additional verification by the AgentID team
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {issuer.is_verified ? (
              <div className="flex items-center gap-4 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-emerald-400" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-emerald-300">
                    Verified Issuer
                  </div>
                  <p className="text-sm text-emerald-200/70">
                    Your organization has been verified by AgentID
                  </p>
                </div>
                <Badge className="gap-1 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                  <ShieldCheck className="h-3 w-3" />
                  Verified
                </Badge>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
                  <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                    <AlertCircle className="h-6 w-6 text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-amber-300">
                      Not Yet Verified
                    </div>
                    <p className="text-sm text-amber-200/70">
                      Complete domain verification or contact support for organization verification
                    </p>
                  </div>
                  <Badge className="gap-1 bg-amber-500/10 text-amber-400 border-amber-500/20">
                    Pending
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground bg-white/[0.02] border border-white/5 p-4 rounded-lg">
                  <p className="font-medium mb-2">How to get verified:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Complete DNS domain verification above</li>
                    <li>Contact <span className="font-mono text-white">support@agentid.dev</span> for organization verification</li>
                    <li>Verified issuers receive higher trust scores</li>
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
