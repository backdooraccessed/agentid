'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  Webhook,
  Users,
  KeyRound,
  ChevronRight,
  FileKey,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Quick links to other settings areas
const settingsLinks = [
  {
    href: '/api-keys',
    icon: Key,
    label: 'API Keys',
    description: 'Manage API keys for programmatic access',
  },
  {
    href: '/webhooks',
    icon: Webhook,
    label: 'Webhooks',
    description: 'Configure event notifications',
  },
  {
    href: '/team',
    icon: Users,
    label: 'Team',
    description: 'Manage team members and roles',
  },
  {
    href: '/settings/sso',
    icon: KeyRound,
    label: 'SSO / SAML',
    description: 'Enterprise single sign-on configuration',
    badge: 'Enterprise',
  },
  {
    href: '/policies',
    icon: FileKey,
    label: 'Permission Policies',
    description: 'Define access control policies',
  },
];

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
        <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-gray-100 border-4 border-black flex items-center justify-center">
          <Settings className="h-6 w-6 text-gray-600" />
        </div>
        <div>
          <h1 className="font-pixel text-3xl uppercase">Settings</h1>
          <p className="font-retro text-gray-600">
            {issuer ? 'Manage your issuer profile and verification' : 'Create your issuer profile to get started'}
          </p>
        </div>
      </div>

      {/* Quick Settings Links */}
      <div className="border-4 border-black bg-white">
        <div className="bg-gray-50 border-b-4 border-black px-4 py-2">
          <h2 className="font-retro text-sm font-bold text-gray-600 uppercase">Quick Settings</h2>
        </div>
        <div className="p-2">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-1">
            {settingsLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors group"
                >
                  <div className="w-9 h-9 bg-gray-100 border-2 border-gray-300 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-gray-500 group-hover:text-black transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-retro font-bold text-black">{link.label}</span>
                      {link.badge && (
                        <Badge className="text-[10px] py-0 px-1.5 bg-amber-100 text-amber-700 border-amber-300 border">
                          {link.badge}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs font-retro text-gray-500 truncate">{link.description}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-black transition-colors" />
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-2 p-3 border-4 border-red-500 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <p className="text-sm font-retro text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-3 border-4 border-emerald-500 bg-emerald-50">
          <CheckCircle className="h-4 w-4 text-emerald-600" />
          <p className="text-sm font-retro text-emerald-700">
            Profile saved successfully!
          </p>
        </div>
      )}

      {/* Issuer Profile Form */}
      <div className="border-4 border-black bg-white">
        <div className="bg-gray-50 border-b-4 border-black px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-100 border-2 border-gray-300 flex items-center justify-center">
              <User className="h-4 w-4 text-gray-600" />
            </div>
            <div>
              <h2 className="font-retro font-bold uppercase">Issuer Profile</h2>
              <p className="text-xs font-retro text-gray-500">
                {issuer
                  ? 'Your issuer profile identifies you when issuing credentials'
                  : 'Create your issuer profile to start issuing credentials'}
              </p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-retro font-bold uppercase">
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
                className="h-11 bg-white border-2 border-gray-300 font-retro"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-retro font-bold uppercase">Issuer Type</Label>
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
                        'p-4 border-4 text-left transition-all',
                        isSelected
                          ? 'border-black bg-gray-50 block-shadow'
                          : 'border-gray-200 hover:border-gray-400 bg-white',
                        issuer && 'cursor-not-allowed opacity-60'
                      )}
                    >
                      <Icon
                        className={cn(
                          'h-5 w-5 mb-2',
                          isSelected
                            ? 'text-black'
                            : 'text-gray-500'
                        )}
                      />
                      <div
                        className={cn(
                          'font-retro text-sm uppercase',
                          isSelected ? 'font-bold text-black' : 'text-gray-600'
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
              <Label htmlFor="domain" className="text-sm font-retro font-bold uppercase">
                Domain <span className="text-gray-500 font-normal">(optional)</span>
              </Label>
              <Input
                id="domain"
                value={formData.domain}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, domain: e.target.value }))
                }
                placeholder="acme.com"
                disabled={!!issuer}
                className="h-11 bg-white border-2 border-gray-300 font-retro"
              />
              <p className="text-xs font-retro text-gray-500">
                Your organization&apos;s domain for verification
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-retro font-bold uppercase">
                Description <span className="text-gray-500 font-normal">(optional)</span>
              </Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="AI automation company specializing in..."
                disabled={!!issuer}
                className="h-11 bg-white border-2 border-gray-300 font-retro"
              />
            </div>

            {!issuer && (
              <Button
                type="submit"
                disabled={saving}
                className="h-11 px-6 bg-black text-white hover:bg-gray-800 font-retro uppercase block-shadow-sm"
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
        </div>
      </div>

      {/* Domain Verification */}
      {issuer && <DomainVerification domain={issuer.domain || null} />}

      {/* Public Key Display */}
      {issuer && (
        <div className="border-4 border-black bg-white">
          <div className="bg-gray-50 border-b-4 border-black px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-100 border-2 border-gray-300 flex items-center justify-center">
                <Key className="h-4 w-4 text-gray-600" />
              </div>
              <div>
                <h2 className="font-retro font-bold uppercase">Public Key</h2>
                <p className="text-xs font-retro text-gray-500">
                  Services use this key to verify credentials you issue
                </p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-retro font-bold text-gray-500 uppercase tracking-wider">
                Key ID
              </Label>
              <div className="flex items-center gap-2">
                <div className="font-mono text-sm bg-gray-50 border-2 border-gray-300 p-3 flex-1 text-black">
                  {issuer.key_id}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-11 w-11 shrink-0 border-2 border-gray-300 hover:bg-gray-50"
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
              <Label className="text-xs font-retro font-bold text-gray-500 uppercase tracking-wider">
                Public Key (Base64)
              </Label>
              <div className="flex items-center gap-2">
                <div className="font-mono text-xs bg-gray-50 border-2 border-gray-300 p-3 flex-1 break-all text-black">
                  {issuer.public_key}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-11 w-11 shrink-0 border-2 border-gray-300 hover:bg-gray-50"
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
        </div>
      )}

      {/* Admin Verification Status */}
      {issuer && (
        <div className="border-4 border-black bg-white">
          <div className="bg-gray-50 border-b-4 border-black px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-100 border-2 border-gray-300 flex items-center justify-center">
                <ShieldCheck className="h-4 w-4 text-gray-600" />
              </div>
              <div>
                <h2 className="font-retro font-bold uppercase">Verification Status</h2>
                <p className="text-xs font-retro text-gray-500">
                  Additional verification by the AgentID team
                </p>
              </div>
            </div>
          </div>
          <div className="p-6">
            {issuer.is_verified ? (
              <div className="flex items-center gap-4 p-4 bg-emerald-50 border-4 border-emerald-500">
                <div className="w-12 h-12 bg-emerald-100 border-2 border-emerald-300 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <div className="font-retro font-bold text-emerald-700 uppercase">
                    Verified Issuer
                  </div>
                  <p className="text-sm font-retro text-emerald-600">
                    Your organization has been verified by AgentID
                  </p>
                </div>
                <Badge className="gap-1 bg-emerald-100 text-emerald-700 border-2 border-emerald-300 font-retro uppercase">
                  <ShieldCheck className="h-3 w-3" />
                  Verified
                </Badge>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-amber-50 border-4 border-amber-500">
                  <div className="w-12 h-12 bg-amber-100 border-2 border-amber-300 flex items-center justify-center">
                    <AlertCircle className="h-6 w-6 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-retro font-bold text-amber-700 uppercase">
                      Not Yet Verified
                    </div>
                    <p className="text-sm font-retro text-amber-600">
                      Complete domain verification or contact support for organization verification
                    </p>
                  </div>
                  <Badge className="gap-1 bg-amber-100 text-amber-700 border-2 border-amber-300 font-retro uppercase">
                    Pending
                  </Badge>
                </div>
                <div className="text-sm font-retro text-gray-600 bg-gray-50 border-2 border-gray-300 p-4">
                  <p className="font-bold mb-2 uppercase">How to get verified:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs text-gray-600">
                    <li>Complete DNS domain verification above</li>
                    <li>Contact <span className="font-mono text-black">support@agentid.dev</span> for organization verification</li>
                    <li>Verified issuers receive higher trust scores</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
