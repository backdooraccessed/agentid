'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProfileSelector, ProfileBadge } from '@/components/credentials/profile-selector';
import { ProfileFields, CustomMetadata } from '@/components/credentials/profile-fields';
import {
  Plus,
  Bot,
  Shield,
  Clock,
  AlertCircle,
  Loader2,
  ArrowLeft,
  ArrowRight,
  Check,
  Settings2,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  PERMISSION_ACTIONS,
  PERMISSION_ACTION_LABELS,
  PERMISSION_DOMAINS,
  PERMISSION_DOMAIN_LABELS,
  PROFILE_DEFINITIONS,
  getAgentTypeForProfile,
  type AgentProfile,
} from '@agentid/shared';

type Step = 'profile' | 'details' | 'permissions' | 'review';

const STEPS: { id: Step; label: string }[] = [
  { id: 'profile', label: 'Agent Profile' },
  { id: 'details', label: 'Details' },
  { id: 'permissions', label: 'Permissions' },
  { id: 'review', label: 'Review' },
];

export default function NewCredentialPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<Step>('profile');

  // Form state
  const [selectedProfile, setSelectedProfile] = useState<AgentProfile | null>(null);
  const [basicInfo, setBasicInfo] = useState({
    agent_id: '',
    agent_name: '',
    agent_description: '',
  });
  const [profileData, setProfileData] = useState<Record<string, unknown>>({});
  const [customMetadata, setCustomMetadata] = useState<Record<string, string>>({});
  const [permissions, setPermissions] = useState({
    actions: [] as string[],
    domains: [] as string[],
  });
  const [validDays, setValidDays] = useState('30');

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === STEPS.length - 1;

  const canProceed = () => {
    switch (currentStep) {
      case 'profile':
        return selectedProfile !== null;
      case 'details':
        return basicInfo.agent_id.trim() !== '' && basicInfo.agent_name.trim() !== '';
      case 'permissions':
        return permissions.actions.length > 0 && permissions.domains.length > 0;
      case 'review':
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (!canProceed()) return;
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex].id);
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex].id);
    }
  };

  const handleProfileSelect = (profile: AgentProfile) => {
    setSelectedProfile(profile);
    // Pre-fill suggested permissions
    const profileDef = PROFILE_DEFINITIONS[profile];
    setPermissions({
      actions: profileDef.suggestedPermissions.actions,
      domains: profileDef.suggestedPermissions.domains,
    });
    // Reset profile-specific data
    setProfileData({});
  };

  const handleProfileDataChange = (key: string, value: unknown) => {
    setProfileData((prev) => ({ ...prev, [key]: value }));
  };

  const toggleAction = (action: string) => {
    setPermissions((prev) => ({
      ...prev,
      actions: prev.actions.includes(action)
        ? prev.actions.filter((a) => a !== action)
        : [...prev.actions, action],
    }));
  };

  const toggleDomain = (domain: string) => {
    setPermissions((prev) => ({
      ...prev,
      domains: prev.domains.includes(domain)
        ? prev.domains.filter((d) => d !== domain)
        : [...prev.domains, domain],
    }));
  };

  const handleSubmit = async () => {
    if (!selectedProfile) return;

    setLoading(true);
    setError(null);

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + parseInt(validDays));

    // Map the profile to the correct agent_type (autonomous, supervised, hybrid)
    const agentType = getAgentTypeForProfile(selectedProfile);

    const payload = {
      agent_id: basicInfo.agent_id,
      agent_name: basicInfo.agent_name,
      agent_type: agentType,
      agent_profile: selectedProfile,
      permissions: {
        actions: permissions.actions,
        domains: permissions.domains,
        resource_limits: {},
      },
      valid_until: validUntil.toISOString(),
      metadata: {
        description: basicInfo.agent_description || undefined,
        profile_data: profileData,
        custom: customMetadata,
      },
    };

    try {
      const response = await fetch('/api/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to issue credential');
        toast.error('Failed to issue credential', { description: data.error || 'Please try again' });
        setLoading(false);
        return;
      }

      toast.success('Credential issued!', { description: `Created credential for ${basicInfo.agent_name}` });
      router.push('/credentials');
      router.refresh();
    } catch {
      setError('Network error. Please try again.');
      toast.error('Network error', { description: 'Please check your connection and try again' });
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center">
          <Plus className="h-7 w-7 text-white/70" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Issue New Credential</h1>
          <p className="text-muted-foreground">
            Create a verifiable credential for your AI agent
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => {
            const isActive = step.id === currentStep;
            const isCompleted = index < currentStepIndex;
            return (
              <div key={step.id} className="flex items-center flex-1">
                <button
                  type="button"
                  onClick={() => {
                    if (isCompleted) setCurrentStep(step.id);
                  }}
                  disabled={!isCompleted}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg transition-all',
                    isActive && 'bg-white/10',
                    isCompleted && 'cursor-pointer hover:bg-white/5',
                    !isActive && !isCompleted && 'opacity-50'
                  )}
                >
                  <div
                    className={cn(
                      'w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium',
                      isActive && 'bg-white text-black',
                      isCompleted && 'bg-emerald-500 text-white',
                      !isActive && !isCompleted && 'bg-white/10 text-white/50'
                    )}
                  >
                    {isCompleted ? <Check className="h-4 w-4" /> : index + 1}
                  </div>
                  <span
                    className={cn(
                      'text-sm font-medium hidden sm:block',
                      isActive && 'text-white',
                      !isActive && 'text-white/50'
                    )}
                  >
                    {step.label}
                  </span>
                </button>
                {index < STEPS.length - 1 && (
                  <div
                    className={cn(
                      'flex-1 h-px mx-2',
                      isCompleted ? 'bg-emerald-500' : 'bg-white/10'
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 mb-6">
          <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Step Content */}
      <div className="space-y-6">
        {/* Step 1: Profile Selection */}
        {currentStep === 'profile' && (
          <Card className="overflow-hidden">
            <CardHeader className="bg-white/[0.02] border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-white/70" />
                </div>
                <div>
                  <CardTitle className="text-base">Select Agent Profile</CardTitle>
                  <CardDescription>
                    Choose a profile that best matches your agent type
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <ProfileSelector
                selected={selectedProfile}
                onSelect={handleProfileSelect}
              />
            </CardContent>
          </Card>
        )}

        {/* Step 2: Details */}
        {currentStep === 'details' && selectedProfile && (
          <>
            {/* Basic Info */}
            <Card className="overflow-hidden">
              <CardHeader className="bg-white/[0.02] border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-white/70" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Agent Identity</CardTitle>
                    <CardDescription>Basic information about your agent</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="agent_id" className="text-sm font-medium">
                    Agent ID <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="agent_id"
                    placeholder="my-trading-agent-v1"
                    value={basicInfo.agent_id}
                    onChange={(e) =>
                      setBasicInfo((prev) => ({ ...prev, agent_id: e.target.value }))
                    }
                    required
                    pattern="^[a-zA-Z0-9_-]+$"
                    title="Only letters, numbers, underscores, and hyphens"
                    className="bg-white/[0.02] border-white/10 focus:border-white/30"
                  />
                  <p className="text-xs text-muted-foreground">
                    Unique identifier (alphanumeric, underscores, hyphens)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="agent_name" className="text-sm font-medium">
                    Agent Name <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="agent_name"
                    placeholder="Trading Agent v1"
                    value={basicInfo.agent_name}
                    onChange={(e) =>
                      setBasicInfo((prev) => ({ ...prev, agent_name: e.target.value }))
                    }
                    required
                    className="bg-white/[0.02] border-white/10 focus:border-white/30"
                  />
                  <p className="text-xs text-muted-foreground">
                    Human-readable name for display
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="agent_description" className="text-sm font-medium">
                    Description
                  </Label>
                  <Input
                    id="agent_description"
                    placeholder="A brief description of what this agent does"
                    value={basicInfo.agent_description}
                    onChange={(e) =>
                      setBasicInfo((prev) => ({ ...prev, agent_description: e.target.value }))
                    }
                    className="bg-white/[0.02] border-white/10 focus:border-white/30"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Profile-Specific Fields */}
            <Card className="overflow-hidden">
              <CardHeader className="bg-white/[0.02] border-b border-white/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                      <Settings2 className="h-4 w-4 text-white/70" />
                    </div>
                    <div>
                      <CardTitle className="text-base">
                        {PROFILE_DEFINITIONS[selectedProfile].name} Configuration
                      </CardTitle>
                      <CardDescription>
                        Profile-specific settings and metadata
                      </CardDescription>
                    </div>
                  </div>
                  <ProfileBadge profile={selectedProfile} size="sm" />
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <ProfileFields
                  fields={PROFILE_DEFINITIONS[selectedProfile].fields}
                  values={profileData}
                  onChange={handleProfileDataChange}
                />
              </CardContent>
            </Card>

            {/* Custom Metadata */}
            <Card className="overflow-hidden">
              <CardHeader className="bg-white/[0.02] border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                    <Plus className="h-4 w-4 text-white/70" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Custom Metadata</CardTitle>
                    <CardDescription>
                      Add any additional key-value pairs (optional)
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <CustomMetadata
                  metadata={customMetadata}
                  onChange={setCustomMetadata}
                />
              </CardContent>
            </Card>
          </>
        )}

        {/* Step 3: Permissions */}
        {currentStep === 'permissions' && (
          <>
            <Card className="overflow-hidden">
              <CardHeader className="bg-white/[0.02] border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                    <Shield className="h-4 w-4 text-white/70" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Permissions</CardTitle>
                    <CardDescription>What actions can this agent perform?</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Allowed Actions <span className="text-red-400">*</span>
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {PERMISSION_ACTIONS.map((action) => (
                      <button
                        key={action}
                        type="button"
                        onClick={() => toggleAction(action)}
                        className={cn(
                          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                          permissions.actions.includes(action)
                            ? 'bg-white text-black'
                            : 'bg-white/5 text-white/70 hover:bg-white/10'
                        )}
                      >
                        {permissions.actions.includes(action) && (
                          <Check className="h-3.5 w-3.5" />
                        )}
                        {PERMISSION_ACTION_LABELS[action]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Allowed Domains <span className="text-red-400">*</span>
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {PERMISSION_DOMAINS.map((domain) => (
                      <button
                        key={domain}
                        type="button"
                        onClick={() => toggleDomain(domain)}
                        className={cn(
                          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                          permissions.domains.includes(domain)
                            ? 'bg-white text-black'
                            : 'bg-white/5 text-white/70 hover:bg-white/10'
                        )}
                      >
                        {permissions.domains.includes(domain) && (
                          <Check className="h-3.5 w-3.5" />
                        )}
                        {PERMISSION_DOMAIN_LABELS[domain]}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Validity */}
            <Card className="overflow-hidden">
              <CardHeader className="bg-white/[0.02] border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-white/70" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Validity Period</CardTitle>
                    <CardDescription>How long should this credential be valid?</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <Label htmlFor="valid_days" className="text-sm font-medium">
                    Valid for (days)
                  </Label>
                  <Input
                    id="valid_days"
                    type="number"
                    min="1"
                    max="365"
                    value={validDays}
                    onChange={(e) => setValidDays(e.target.value)}
                    required
                    className="bg-white/[0.02] border-white/10 focus:border-white/30 max-w-[200px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum 365 days. Credential expires on{' '}
                    {new Date(
                      Date.now() + parseInt(validDays || '30') * 24 * 60 * 60 * 1000
                    ).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Step 4: Review */}
        {currentStep === 'review' && selectedProfile && (
          <Card className="overflow-hidden">
            <CardHeader className="bg-white/[0.02] border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                  <Check className="h-4 w-4 text-white/70" />
                </div>
                <div>
                  <CardTitle className="text-base">Review & Confirm</CardTitle>
                  <CardDescription>Verify the credential details before issuing</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Profile */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Profile</Label>
                <ProfileBadge profile={selectedProfile} size="lg" />
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">Agent ID</Label>
                  <p className="font-mono text-sm">{basicInfo.agent_id}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">Agent Name</Label>
                  <p className="text-sm">{basicInfo.agent_name}</p>
                </div>
              </div>

              {basicInfo.agent_description && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">Description</Label>
                  <p className="text-sm text-white/70">{basicInfo.agent_description}</p>
                </div>
              )}

              {/* Permissions */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Permissions</Label>
                <div className="flex flex-wrap gap-2">
                  {permissions.actions.map((action) => (
                    <span
                      key={action}
                      className="px-2 py-1 rounded bg-white/5 text-xs font-medium"
                    >
                      {PERMISSION_ACTION_LABELS[action as keyof typeof PERMISSION_ACTION_LABELS] || action}
                    </span>
                  ))}
                  {permissions.domains.map((domain) => (
                    <span
                      key={domain}
                      className="px-2 py-1 rounded bg-white/10 text-xs font-medium"
                    >
                      {PERMISSION_DOMAIN_LABELS[domain as keyof typeof PERMISSION_DOMAIN_LABELS] || domain}
                    </span>
                  ))}
                </div>
              </div>

              {/* Profile Data */}
              {Object.keys(profileData).length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                    {PROFILE_DEFINITIONS[selectedProfile].name} Settings
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(profileData).map(([key, value]) => {
                      if (value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) return null;
                      return (
                        <div key={key} className="p-2 rounded bg-white/[0.02] border border-white/5">
                          <span className="text-xs text-muted-foreground">{key}:</span>
                          <span className="text-sm ml-2">
                            {typeof value === 'boolean' ? (value ? 'Yes' : 'No') :
                             Array.isArray(value) ? value.join(', ') : String(value)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Custom Metadata */}
              {Object.keys(customMetadata).length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">Custom Metadata</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(customMetadata).map(([key, value]) => (
                      <div key={key} className="p-2 rounded bg-white/[0.02] border border-white/5">
                        <span className="text-xs text-muted-foreground">{key}:</span>
                        <span className="text-sm ml-2">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Validity */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Validity</Label>
                <p className="text-sm">
                  {validDays} days (expires{' '}
                  {new Date(Date.now() + parseInt(validDays) * 24 * 60 * 60 * 1000).toLocaleDateString()})
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8">
        <Button
          type="button"
          variant="outline"
          onClick={isFirstStep ? () => router.back() : handleBack}
          className="gap-2 border-white/10 hover:bg-white/[0.04]"
        >
          <ArrowLeft className="h-4 w-4" />
          {isFirstStep ? 'Cancel' : 'Back'}
        </Button>

        {isLastStep ? (
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !canProceed()}
            className="gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Issuing...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Issue Credential
              </>
            )}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleNext}
            disabled={!canProceed()}
            className="gap-2"
          >
            Continue
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
