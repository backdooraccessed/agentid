'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
        <div className="w-14 h-14 bg-gray-100 border-4 border-black flex items-center justify-center">
          <Plus className="h-7 w-7 text-gray-600" />
        </div>
        <div>
          <h1 className="font-pixel text-3xl uppercase">Issue New Credential</h1>
          <p className="font-retro text-gray-600">
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
                    'flex items-center gap-2 px-3 py-2 transition-all',
                    isActive && 'bg-gray-100 border-2 border-black',
                    isCompleted && 'cursor-pointer hover:bg-gray-50',
                    !isActive && !isCompleted && 'opacity-50'
                  )}
                >
                  <div
                    className={cn(
                      'w-7 h-7 flex items-center justify-center text-sm font-pixel',
                      isActive && 'bg-black text-white',
                      isCompleted && 'bg-emerald-500 text-white',
                      !isActive && !isCompleted && 'bg-gray-200 text-gray-500'
                    )}
                  >
                    {isCompleted ? <Check className="h-4 w-4" /> : index + 1}
                  </div>
                  <span
                    className={cn(
                      'text-sm font-retro font-bold uppercase hidden sm:block',
                      isActive && 'text-black',
                      !isActive && 'text-gray-400'
                    )}
                  >
                    {step.label}
                  </span>
                </button>
                {index < STEPS.length - 1 && (
                  <div
                    className={cn(
                      'flex-1 h-1 mx-2',
                      isCompleted ? 'bg-emerald-500' : 'bg-gray-200'
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 border-4 border-red-500 bg-red-50 mb-6">
          <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
          <p className="text-sm font-retro text-red-700">{error}</p>
        </div>
      )}

      {/* Step Content */}
      <div className="space-y-6">
        {/* Step 1: Profile Selection */}
        {currentStep === 'profile' && (
          <div className="border-4 border-black bg-white">
            <div className="bg-gray-50 border-b-4 border-black p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-100 border-2 border-gray-300 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-retro font-bold text-black uppercase">Select Agent Profile</h3>
                  <p className="font-retro text-xs text-gray-500">
                    Choose a profile that best matches your agent type
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <ProfileSelector
                selected={selectedProfile}
                onSelect={handleProfileSelect}
              />
            </div>
          </div>
        )}

        {/* Step 2: Details */}
        {currentStep === 'details' && selectedProfile && (
          <>
            {/* Basic Info */}
            <div className="border-4 border-black bg-white">
              <div className="bg-gray-50 border-b-4 border-black p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 border-2 border-gray-300 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-retro font-bold text-black uppercase">Agent Identity</h3>
                    <p className="font-retro text-xs text-gray-500">Basic information about your agent</p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="agent_id" className="text-sm font-retro font-bold uppercase">
                    Agent ID <span className="text-red-600">*</span>
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
                    className="bg-white border-2 border-gray-300 font-retro"
                  />
                  <p className="text-xs font-retro text-gray-500">
                    Unique identifier (alphanumeric, underscores, hyphens)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="agent_name" className="text-sm font-retro font-bold uppercase">
                    Agent Name <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="agent_name"
                    placeholder="Trading Agent v1"
                    value={basicInfo.agent_name}
                    onChange={(e) =>
                      setBasicInfo((prev) => ({ ...prev, agent_name: e.target.value }))
                    }
                    required
                    className="bg-white border-2 border-gray-300 font-retro"
                  />
                  <p className="text-xs font-retro text-gray-500">
                    Human-readable name for display
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="agent_description" className="text-sm font-retro font-bold uppercase">
                    Description
                  </Label>
                  <Input
                    id="agent_description"
                    placeholder="A brief description of what this agent does"
                    value={basicInfo.agent_description}
                    onChange={(e) =>
                      setBasicInfo((prev) => ({ ...prev, agent_description: e.target.value }))
                    }
                    className="bg-white border-2 border-gray-300 font-retro"
                  />
                </div>
              </div>
            </div>

            {/* Profile-Specific Fields */}
            <div className="border-4 border-black bg-white">
              <div className="bg-gray-50 border-b-4 border-black p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-100 border-2 border-gray-300 flex items-center justify-center">
                      <Settings2 className="h-4 w-4 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-retro font-bold text-black uppercase">
                        {PROFILE_DEFINITIONS[selectedProfile].name} Configuration
                      </h3>
                      <p className="font-retro text-xs text-gray-500">
                        Profile-specific settings and metadata
                      </p>
                    </div>
                  </div>
                  <ProfileBadge profile={selectedProfile} size="sm" />
                </div>
              </div>
              <div className="p-6">
                <ProfileFields
                  fields={PROFILE_DEFINITIONS[selectedProfile].fields}
                  values={profileData}
                  onChange={handleProfileDataChange}
                />
              </div>
            </div>

            {/* Custom Metadata */}
            <div className="border-4 border-black bg-white">
              <div className="bg-gray-50 border-b-4 border-black p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 border-2 border-gray-300 flex items-center justify-center">
                    <Plus className="h-4 w-4 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-retro font-bold text-black uppercase">Custom Metadata</h3>
                    <p className="font-retro text-xs text-gray-500">
                      Add any additional key-value pairs (optional)
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <CustomMetadata
                  metadata={customMetadata}
                  onChange={setCustomMetadata}
                />
              </div>
            </div>
          </>
        )}

        {/* Step 3: Permissions */}
        {currentStep === 'permissions' && (
          <>
            <div className="border-4 border-black bg-white">
              <div className="bg-gray-50 border-b-4 border-black p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 border-2 border-gray-300 flex items-center justify-center">
                    <Shield className="h-4 w-4 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-retro font-bold text-black uppercase">Permissions</h3>
                    <p className="font-retro text-xs text-gray-500">What actions can this agent perform?</p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-6">
                <div className="space-y-2">
                  <Label className="text-sm font-retro font-bold uppercase">
                    Allowed Actions <span className="text-red-600">*</span>
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {PERMISSION_ACTIONS.map((action) => (
                      <button
                        key={action}
                        type="button"
                        onClick={() => toggleAction(action)}
                        className={cn(
                          'inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-retro font-bold uppercase transition-all border-2',
                          permissions.actions.includes(action)
                            ? 'bg-black text-white border-black'
                            : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
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
                  <Label className="text-sm font-retro font-bold uppercase">
                    Allowed Domains <span className="text-red-600">*</span>
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {PERMISSION_DOMAINS.map((domain) => (
                      <button
                        key={domain}
                        type="button"
                        onClick={() => toggleDomain(domain)}
                        className={cn(
                          'inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-retro font-bold uppercase transition-all border-2',
                          permissions.domains.includes(domain)
                            ? 'bg-black text-white border-black'
                            : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
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
              </div>
            </div>

            {/* Validity */}
            <div className="border-4 border-black bg-white">
              <div className="bg-gray-50 border-b-4 border-black p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 border-2 border-gray-300 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-retro font-bold text-black uppercase">Validity Period</h3>
                    <p className="font-retro text-xs text-gray-500">How long should this credential be valid?</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-2">
                  <Label htmlFor="valid_days" className="text-sm font-retro font-bold uppercase">
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
                    className="bg-white border-2 border-gray-300 font-retro max-w-[200px]"
                  />
                  <p className="text-xs font-retro text-gray-500">
                    Maximum 365 days. Credential expires on{' '}
                    {new Date(
                      Date.now() + parseInt(validDays || '30') * 24 * 60 * 60 * 1000
                    ).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Step 4: Review */}
        {currentStep === 'review' && selectedProfile && (
          <div className="border-4 border-black bg-white">
            <div className="bg-gray-50 border-b-4 border-black p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-100 border-2 border-gray-300 flex items-center justify-center">
                  <Check className="h-4 w-4 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-retro font-bold text-black uppercase">Review & Confirm</h3>
                  <p className="font-retro text-xs text-gray-500">Verify the credential details before issuing</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* Profile */}
              <div className="space-y-2">
                <Label className="text-xs font-retro text-gray-500 uppercase tracking-wider">Profile</Label>
                <ProfileBadge profile={selectedProfile} size="lg" />
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-retro text-gray-500 uppercase tracking-wider">Agent ID</Label>
                  <p className="font-mono text-sm text-black">{basicInfo.agent_id}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-retro text-gray-500 uppercase tracking-wider">Agent Name</Label>
                  <p className="font-retro text-sm text-black">{basicInfo.agent_name}</p>
                </div>
              </div>

              {basicInfo.agent_description && (
                <div className="space-y-1">
                  <Label className="text-xs font-retro text-gray-500 uppercase tracking-wider">Description</Label>
                  <p className="font-retro text-sm text-gray-600">{basicInfo.agent_description}</p>
                </div>
              )}

              {/* Permissions */}
              <div className="space-y-2">
                <Label className="text-xs font-retro text-gray-500 uppercase tracking-wider">Permissions</Label>
                <div className="flex flex-wrap gap-2">
                  {permissions.actions.map((action) => (
                    <span
                      key={action}
                      className="px-2 py-1 bg-gray-100 border-2 border-gray-300 text-xs font-retro font-bold text-black"
                    >
                      {PERMISSION_ACTION_LABELS[action as keyof typeof PERMISSION_ACTION_LABELS] || action}
                    </span>
                  ))}
                  {permissions.domains.map((domain) => (
                    <span
                      key={domain}
                      className="px-2 py-1 bg-gray-200 border-2 border-gray-400 text-xs font-retro font-bold text-black"
                    >
                      {PERMISSION_DOMAIN_LABELS[domain as keyof typeof PERMISSION_DOMAIN_LABELS] || domain}
                    </span>
                  ))}
                </div>
              </div>

              {/* Profile Data */}
              {Object.keys(profileData).length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs font-retro text-gray-500 uppercase tracking-wider">
                    {PROFILE_DEFINITIONS[selectedProfile].name} Settings
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(profileData).map(([key, value]) => {
                      if (value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) return null;
                      return (
                        <div key={key} className="p-2 border-2 border-gray-200 bg-gray-50">
                          <span className="text-xs font-retro text-gray-500">{key}:</span>
                          <span className="text-sm font-retro text-black ml-2">
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
                  <Label className="text-xs font-retro text-gray-500 uppercase tracking-wider">Custom Metadata</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(customMetadata).map(([key, value]) => (
                      <div key={key} className="p-2 border-2 border-gray-200 bg-gray-50">
                        <span className="text-xs font-retro text-gray-500">{key}:</span>
                        <span className="text-sm font-retro text-black ml-2">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Validity */}
              <div className="space-y-1">
                <Label className="text-xs font-retro text-gray-500 uppercase tracking-wider">Validity</Label>
                <p className="font-retro text-sm text-black">
                  {validDays} days (expires{' '}
                  {new Date(Date.now() + parseInt(validDays) * 24 * 60 * 60 * 1000).toLocaleDateString()})
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8">
        <Button
          type="button"
          variant="outline"
          onClick={isFirstStep ? () => router.back() : handleBack}
          className="gap-2 border-2 border-gray-300 hover:bg-gray-50 font-retro uppercase"
        >
          <ArrowLeft className="h-4 w-4" />
          {isFirstStep ? 'Cancel' : 'Back'}
        </Button>

        {isLastStep ? (
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !canProceed()}
            className="gap-2 bg-black text-white hover:bg-gray-800 font-retro uppercase"
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
            className="gap-2 bg-black text-white hover:bg-gray-800 font-retro uppercase"
          >
            Continue
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
