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
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading settings...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
          <Settings className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            {issuer ? 'Manage your issuer profile and verification' : 'Create your issuer profile to get started'}
          </p>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive" className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30">
          <CheckCircle className="h-4 w-4 text-emerald-600" />
          <AlertDescription className="text-emerald-800 dark:text-emerald-200">
            Profile saved successfully!
          </AlertDescription>
        </Alert>
      )}

      {/* Issuer Profile Form */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-muted/30">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <User className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
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
                className="h-11"
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
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30'
                          : 'border-muted hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-muted/50',
                        issuer && 'cursor-not-allowed opacity-60'
                      )}
                    >
                      <Icon
                        className={cn(
                          'h-5 w-5 mb-2',
                          isSelected
                            ? 'text-indigo-600 dark:text-indigo-400'
                            : 'text-muted-foreground'
                        )}
                      />
                      <div
                        className={cn(
                          'font-medium text-sm',
                          isSelected && 'text-indigo-700 dark:text-indigo-300'
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
                className="h-11"
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
                className="h-11"
              />
            </div>

            {!issuer && (
              <Button
                type="submit"
                disabled={saving}
                className="h-11 px-6 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/25"
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
          <CardHeader className="bg-muted/30">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                <Key className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
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
                <div className="font-mono text-sm bg-slate-100 dark:bg-slate-800 p-3 rounded-lg flex-1 border">
                  {issuer.key_id}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-11 w-11 shrink-0"
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
                <div className="font-mono text-xs bg-slate-100 dark:bg-slate-800 p-3 rounded-lg flex-1 break-all border">
                  {issuer.public_key}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-11 w-11 shrink-0"
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
          <CardHeader className="bg-muted/30">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                <ShieldCheck className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              Verification Status
            </CardTitle>
            <CardDescription>
              Additional verification by the AgentID team
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {issuer.is_verified ? (
              <div className="flex items-center gap-4 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-emerald-800 dark:text-emerald-200">
                    Verified Issuer
                  </div>
                  <p className="text-sm text-emerald-700 dark:text-emerald-300">
                    Your organization has been verified by AgentID
                  </p>
                </div>
                <Badge variant="verified" className="gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  Verified
                </Badge>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                  <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                    <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-amber-800 dark:text-amber-200">
                      Not Yet Verified
                    </div>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      Complete domain verification or contact support for organization verification
                    </p>
                  </div>
                  <Badge variant="warning" className="gap-1">
                    Pending
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground bg-muted/30 p-4 rounded-lg">
                  <p className="font-medium mb-1">How to get verified:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Complete DNS domain verification above</li>
                    <li>Contact <span className="font-mono text-indigo-600 dark:text-indigo-400">support@agentid.dev</span> for organization verification</li>
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
