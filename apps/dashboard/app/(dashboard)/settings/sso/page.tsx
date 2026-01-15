'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Shield, Copy, Check, AlertCircle, ExternalLink } from 'lucide-react';

interface SSOConfig {
  id: string;
  name: string;
  entity_id: string;
  sso_url: string;
  slo_url?: string;
  certificate: string;
  attribute_mapping: {
    email?: string;
    firstName?: string;
    lastName?: string;
    role?: string;
  };
  auto_provision: boolean;
  default_role: string;
  allowed_domains: string[];
  is_enabled: boolean;
}

interface SPMetadata {
  entity_id: string;
  acs_url: string;
  slo_url: string;
}

export default function SSOSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<SSOConfig | null>(null);
  const [spMetadata, setSpMetadata] = useState<SPMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: 'SSO',
    entity_id: '',
    sso_url: '',
    slo_url: '',
    certificate: '',
    auto_provision: true,
    default_role: 'member',
    allowed_domains: '',
    is_enabled: false,
    attribute_mapping: {
      email: 'email',
      firstName: 'firstName',
      lastName: 'lastName',
      role: 'role',
    },
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  async function fetchConfig() {
    try {
      const res = await fetch('/api/admin/sso');
      const data = await res.json();

      if (res.ok) {
        setSpMetadata(data.sp_metadata);
        if (data.config) {
          setConfig(data.config);
          setFormData({
            name: data.config.name || 'SSO',
            entity_id: data.config.entity_id || '',
            sso_url: data.config.sso_url || '',
            slo_url: data.config.slo_url || '',
            certificate: data.config.certificate || '',
            auto_provision: data.config.auto_provision ?? true,
            default_role: data.config.default_role || 'member',
            allowed_domains: (data.config.allowed_domains || []).join(', '),
            is_enabled: data.config.is_enabled ?? false,
            attribute_mapping: data.config.attribute_mapping || {
              email: 'email',
              firstName: 'firstName',
              lastName: 'lastName',
              role: 'role',
            },
          });
        }
      } else {
        setError(data.error);
      }
    } catch {
      setError('Failed to load SSO configuration');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/admin/sso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          allowed_domains: formData.allowed_domains
            .split(',')
            .map(d => d.trim())
            .filter(Boolean),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(data.message);
        setConfig(data.config);
      } else {
        setError(data.error);
      }
    } catch {
      setError('Failed to save SSO configuration');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete the SSO configuration? This will disable SSO login for all users.')) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/sso', { method: 'DELETE' });
      const data = await res.json();

      if (res.ok) {
        setConfig(null);
        setFormData({
          name: 'SSO',
          entity_id: '',
          sso_url: '',
          slo_url: '',
          certificate: '',
          auto_provision: true,
          default_role: 'member',
          allowed_domains: '',
          is_enabled: false,
          attribute_mapping: {
            email: 'email',
            firstName: 'firstName',
            lastName: 'lastName',
            role: 'role',
          },
        });
        setSuccess('SSO configuration deleted');
      } else {
        setError(data.error);
      }
    } catch {
      setError('Failed to delete SSO configuration');
    } finally {
      setSaving(false);
    }
  }

  function copyToClipboard(text: string, field: string) {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-pixel text-3xl text-black uppercase">SSO Configuration</h1>
        <p className="font-retro text-gray-600 mt-1">
          Configure SAML 2.0 Single Sign-On for your organization
        </p>
      </div>

      {error && (
        <div className="border-4 border-red-500 bg-red-50 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="font-retro text-red-600">{error}</p>
        </div>
      )}

      {success && (
        <div className="border-4 border-emerald-500 bg-emerald-50 p-4">
          <p className="font-retro text-emerald-600">{success}</p>
        </div>
      )}

      {/* Service Provider Metadata */}
      {spMetadata && (
        <div className="border-4 border-black bg-white p-6 space-y-4">
          <div>
            <h2 className="font-pixel text-xl text-black uppercase flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Service Provider Details
            </h2>
            <p className="font-retro text-gray-600 mt-1">
              Use these values when configuring your Identity Provider (IdP)
            </p>
          </div>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="font-retro text-gray-600">Entity ID / Issuer</Label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 bg-gray-100 px-3 py-2 text-sm text-black truncate border-2 border-black">
                    {spMetadata.entity_id}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-black text-white hover:bg-gray-800 font-retro uppercase border-2 border-black"
                    onClick={() => copyToClipboard(spMetadata.entity_id, 'entity')}
                  >
                    {copied === 'entity' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div>
                <Label className="font-retro text-gray-600">ACS URL (Callback)</Label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 bg-gray-100 px-3 py-2 text-sm text-black truncate border-2 border-black">
                    {spMetadata.acs_url}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-black text-white hover:bg-gray-800 font-retro uppercase border-2 border-black"
                    onClick={() => copyToClipboard(spMetadata.acs_url, 'acs')}
                  >
                    {copied === 'acs' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
            <div>
              <Label className="font-retro text-gray-600">Metadata XML</Label>
              <div className="flex items-center gap-2 mt-1">
                <a
                  href={`/api/auth/saml/${spMetadata.entity_id.split('/').pop()}/metadata`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-retro text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                >
                  Download SP Metadata <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* IdP Configuration */}
      <div className="border-4 border-black bg-white p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-pixel text-xl text-black uppercase">Identity Provider Configuration</h2>
            <p className="font-retro text-gray-600 mt-1">
              Enter the SAML configuration from your Identity Provider
            </p>
          </div>
          {config && (
            <Badge variant={config.is_enabled ? 'default' : 'secondary'}>
              {config.is_enabled ? 'Enabled' : 'Disabled'}
            </Badge>
          )}
        </div>
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name" className="font-retro text-black">Configuration Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Okta SSO, Azure AD"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="entity_id" className="font-retro text-black">IdP Entity ID / Issuer *</Label>
              <Input
                id="entity_id"
                value={formData.entity_id}
                onChange={(e) => setFormData({ ...formData, entity_id: e.target.value })}
                placeholder="https://idp.example.com/..."
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sso_url" className="font-retro text-black">SSO URL (Login) *</Label>
              <Input
                id="sso_url"
                value={formData.sso_url}
                onChange={(e) => setFormData({ ...formData, sso_url: e.target.value })}
                placeholder="https://idp.example.com/sso/saml"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slo_url" className="font-retro text-black">SLO URL (Logout)</Label>
              <Input
                id="slo_url"
                value={formData.slo_url}
                onChange={(e) => setFormData({ ...formData, slo_url: e.target.value })}
                placeholder="https://idp.example.com/slo/saml"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="certificate" className="font-retro text-black">IdP Certificate (X.509) *</Label>
            <Textarea
              id="certificate"
              value={formData.certificate}
              onChange={(e) => setFormData({ ...formData, certificate: e.target.value })}
              placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
              rows={6}
              className="font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="allowed_domains" className="font-retro text-black">Allowed Email Domains</Label>
            <Input
              id="allowed_domains"
              value={formData.allowed_domains}
              onChange={(e) => setFormData({ ...formData, allowed_domains: e.target.value })}
              placeholder="example.com, company.org (leave empty for any domain)"
            />
            <p className="font-retro text-xs text-gray-600">
              Comma-separated list of allowed email domains. Leave empty to allow all domains.
            </p>
          </div>
        </div>
      </div>

      {/* User Provisioning */}
      <div className="border-4 border-black bg-white p-6 space-y-6">
        <div>
          <h2 className="font-pixel text-xl text-black uppercase">User Provisioning</h2>
          <p className="font-retro text-gray-600 mt-1">
            Configure how users are created and assigned roles
          </p>
        </div>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-retro text-black">Auto-provision Users</Label>
              <p className="font-retro text-sm text-gray-600">
                Automatically create accounts for new SSO users
              </p>
            </div>
            <Switch
              checked={formData.auto_provision}
              onCheckedChange={(checked) => setFormData({ ...formData, auto_provision: checked })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="default_role" className="font-retro text-black">Default Role</Label>
            <Select
              value={formData.default_role}
              onValueChange={(value) => setFormData({ ...formData, default_role: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="viewer">Viewer (Read-only)</SelectItem>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <p className="font-retro text-xs text-gray-600">
              Role assigned to new users. Can be overridden by SAML role attribute.
            </p>
          </div>

          <div className="border-t-4 border-black pt-4">
            <Label className="font-retro text-black">Attribute Mapping</Label>
            <p className="font-retro text-sm text-gray-600 mb-4">
              Map SAML attributes to user fields
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="attr_email" className="font-retro text-sm text-black">Email Attribute</Label>
                <Input
                  id="attr_email"
                  value={formData.attribute_mapping.email}
                  onChange={(e) => setFormData({
                    ...formData,
                    attribute_mapping: { ...formData.attribute_mapping, email: e.target.value }
                  })}
                  placeholder="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="attr_role" className="font-retro text-sm text-black">Role Attribute</Label>
                <Input
                  id="attr_role"
                  value={formData.attribute_mapping.role}
                  onChange={(e) => setFormData({
                    ...formData,
                    attribute_mapping: { ...formData.attribute_mapping, role: e.target.value }
                  })}
                  placeholder="role"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="attr_first" className="font-retro text-sm text-black">First Name Attribute</Label>
                <Input
                  id="attr_first"
                  value={formData.attribute_mapping.firstName}
                  onChange={(e) => setFormData({
                    ...formData,
                    attribute_mapping: { ...formData.attribute_mapping, firstName: e.target.value }
                  })}
                  placeholder="firstName"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="attr_last" className="font-retro text-sm text-black">Last Name Attribute</Label>
                <Input
                  id="attr_last"
                  value={formData.attribute_mapping.lastName}
                  onChange={(e) => setFormData({
                    ...formData,
                    attribute_mapping: { ...formData.attribute_mapping, lastName: e.target.value }
                  })}
                  placeholder="lastName"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enable SSO */}
      <div className="border-4 border-black bg-white p-6 space-y-4">
        <div>
          <h2 className="font-pixel text-xl text-black uppercase">Enable SSO</h2>
          <p className="font-retro text-gray-600 mt-1">
            Once enabled, users can log in via your Identity Provider
          </p>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <Label className="font-retro text-black">SSO Enabled</Label>
            <p className="font-retro text-sm text-gray-600">
              Enable SAML SSO authentication for this organization
            </p>
          </div>
          <Switch
            checked={formData.is_enabled}
            onCheckedChange={(checked) => setFormData({ ...formData, is_enabled: checked })}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div>
          {config && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={saving}
              className="bg-red-600 text-white hover:bg-red-700 font-retro uppercase"
            >
              Delete Configuration
            </Button>
          )}
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-black text-white hover:bg-gray-800 font-retro uppercase"
        >
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {config ? 'Update Configuration' : 'Save Configuration'}
        </Button>
      </div>
    </div>
  );
}
