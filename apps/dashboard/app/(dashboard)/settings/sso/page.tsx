'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
        <Loader2 className="h-8 w-8 animate-spin text-white/50" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">SSO Configuration</h1>
        <p className="text-white/60 mt-1">
          Configure SAML 2.0 Single Sign-On for your organization
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
          <p className="text-emerald-400">{success}</p>
        </div>
      )}

      {/* Service Provider Metadata */}
      {spMetadata && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Service Provider Details
            </CardTitle>
            <CardDescription>
              Use these values when configuring your Identity Provider (IdP)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="text-white/60">Entity ID / Issuer</Label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 bg-white/5 px-3 py-2 rounded text-sm text-white/80 truncate">
                    {spMetadata.entity_id}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(spMetadata.entity_id, 'entity')}
                  >
                    {copied === 'entity' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-white/60">ACS URL (Callback)</Label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 bg-white/5 px-3 py-2 rounded text-sm text-white/80 truncate">
                    {spMetadata.acs_url}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(spMetadata.acs_url, 'acs')}
                  >
                    {copied === 'acs' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
            <div>
              <Label className="text-white/60">Metadata XML</Label>
              <div className="flex items-center gap-2 mt-1">
                <a
                  href={`/api/auth/saml/${spMetadata.entity_id.split('/').pop()}/metadata`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
                >
                  Download SP Metadata <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* IdP Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Identity Provider Configuration</CardTitle>
              <CardDescription>
                Enter the SAML configuration from your Identity Provider
              </CardDescription>
            </div>
            {config && (
              <Badge variant={config.is_enabled ? 'default' : 'secondary'}>
                {config.is_enabled ? 'Enabled' : 'Disabled'}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Configuration Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Okta SSO, Azure AD"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="entity_id">IdP Entity ID / Issuer *</Label>
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
              <Label htmlFor="sso_url">SSO URL (Login) *</Label>
              <Input
                id="sso_url"
                value={formData.sso_url}
                onChange={(e) => setFormData({ ...formData, sso_url: e.target.value })}
                placeholder="https://idp.example.com/sso/saml"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slo_url">SLO URL (Logout)</Label>
              <Input
                id="slo_url"
                value={formData.slo_url}
                onChange={(e) => setFormData({ ...formData, slo_url: e.target.value })}
                placeholder="https://idp.example.com/slo/saml"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="certificate">IdP Certificate (X.509) *</Label>
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
            <Label htmlFor="allowed_domains">Allowed Email Domains</Label>
            <Input
              id="allowed_domains"
              value={formData.allowed_domains}
              onChange={(e) => setFormData({ ...formData, allowed_domains: e.target.value })}
              placeholder="example.com, company.org (leave empty for any domain)"
            />
            <p className="text-xs text-white/50">
              Comma-separated list of allowed email domains. Leave empty to allow all domains.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* User Provisioning */}
      <Card>
        <CardHeader>
          <CardTitle>User Provisioning</CardTitle>
          <CardDescription>
            Configure how users are created and assigned roles
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label>Auto-provision Users</Label>
              <p className="text-sm text-white/50">
                Automatically create accounts for new SSO users
              </p>
            </div>
            <Switch
              checked={formData.auto_provision}
              onCheckedChange={(checked) => setFormData({ ...formData, auto_provision: checked })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="default_role">Default Role</Label>
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
            <p className="text-xs text-white/50">
              Role assigned to new users. Can be overridden by SAML role attribute.
            </p>
          </div>

          <div className="border-t border-white/10 pt-4">
            <Label className="text-white/80">Attribute Mapping</Label>
            <p className="text-sm text-white/50 mb-4">
              Map SAML attributes to user fields
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="attr_email" className="text-sm">Email Attribute</Label>
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
                <Label htmlFor="attr_role" className="text-sm">Role Attribute</Label>
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
                <Label htmlFor="attr_first" className="text-sm">First Name Attribute</Label>
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
                <Label htmlFor="attr_last" className="text-sm">Last Name Attribute</Label>
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
        </CardContent>
      </Card>

      {/* Enable SSO */}
      <Card>
        <CardHeader>
          <CardTitle>Enable SSO</CardTitle>
          <CardDescription>
            Once enabled, users can log in via your Identity Provider
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label>SSO Enabled</Label>
              <p className="text-sm text-white/50">
                Enable SAML SSO authentication for this organization
              </p>
            </div>
            <Switch
              checked={formData.is_enabled}
              onCheckedChange={(checked) => setFormData({ ...formData, is_enabled: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div>
          {config && (
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              Delete Configuration
            </Button>
          )}
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {config ? 'Update Configuration' : 'Save Configuration'}
        </Button>
      </div>
    </div>
  );
}
