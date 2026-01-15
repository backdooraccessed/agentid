'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Code,
  PenTool,
  Search,
  Zap,
  BarChart2,
  Headphones,
  Palette,
  CheckSquare,
  Terminal,
  Grid,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
}

interface Credential {
  id: string;
  agent_name: string;
  agent_id: string;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  'code': <Code className="h-5 w-5" />,
  'pen-tool': <PenTool className="h-5 w-5" />,
  'search': <Search className="h-5 w-5" />,
  'zap': <Zap className="h-5 w-5" />,
  'bar-chart-2': <BarChart2 className="h-5 w-5" />,
  'headphones': <Headphones className="h-5 w-5" />,
  'palette': <Palette className="h-5 w-5" />,
  'check-square': <CheckSquare className="h-5 w-5" />,
  'terminal': <Terminal className="h-5 w-5" />,
  'grid': <Grid className="h-5 w-5" />,
};

const STEPS = [
  { id: 'basics', label: 'Basic Info' },
  { id: 'details', label: 'Details' },
  { id: 'links', label: 'Links' },
  { id: 'review', label: 'Review' },
];

type PricingType = 'free' | 'freemium' | 'paid' | 'contact';

export default function SubmitAppPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [iconUrl, setIconUrl] = useState('');
  const [appUrl, setAppUrl] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [docsUrl, setDocsUrl] = useState('');
  const [pricingType, setPricingType] = useState<PricingType>('free');
  const [pricingAmount, setPricingAmount] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [tags, setTags] = useState('');
  const [credentialId, setCredentialId] = useState('');

  useEffect(() => {
    fetchCategories();
    fetchCredentials();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/marketplace/categories');
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchCredentials = async () => {
    try {
      const res = await fetch('/api/credentials');
      if (res.ok) {
        const data = await res.json();
        setCredentials(data.credentials || []);
      }
    } catch (error) {
      console.error('Error fetching credentials:', error);
    }
  };

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id].slice(0, 3)
    );
  };

  const canProceed = () => {
    switch (step) {
      case 0:
        return name.trim() && tagline.trim() && selectedCategories.length > 0;
      case 1:
        return description.trim();
      case 2:
        return appUrl.trim();
      case 3:
        return true;
      default:
        return false;
    }
  };

  const handleSubmit = async (publish: boolean) => {
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          tagline,
          description,
          icon_url: iconUrl || undefined,
          app_url: appUrl,
          demo_url: demoUrl || undefined,
          github_url: githubUrl || undefined,
          docs_url: docsUrl || undefined,
          pricing_type: pricingType,
          pricing_amount: pricingType === 'paid' ? parseFloat(pricingAmount) : undefined,
          category_ids: selectedCategories,
          tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
          credential_id: credentialId || undefined,
          publish,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit app');
      }

      router.push('/apps');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <Link
        href="/apps"
        className="inline-flex items-center gap-2 font-retro text-gray-600 hover:text-black"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to My Apps
      </Link>

      <div>
        <h1 className="font-pixel text-3xl text-black uppercase mb-2">Submit Your App</h1>
        <p className="font-retro text-gray-600">
          Share your AI application with the AgentID community
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center">
            <div
              className={cn(
                'w-8 h-8 border-2 flex items-center justify-center text-sm font-retro font-bold',
                i < step
                  ? 'bg-black border-black text-white'
                  : i === step
                  ? 'bg-black border-black text-white'
                  : 'bg-white border-gray-300 text-gray-500'
              )}
            >
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <span
              className={cn(
                'ml-2 text-sm hidden sm:inline font-retro',
                i <= step ? 'text-black' : 'text-gray-500'
              )}
            >
              {s.label}
            </span>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  'w-12 sm:w-24 h-1 mx-2',
                  i < step ? 'bg-black' : 'bg-gray-200'
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="border-4 border-black bg-white p-6">
        {step === 0 && (
          <div className="space-y-6">
            <div>
              <Label htmlFor="name" className="text-sm font-retro font-bold uppercase">App Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Awesome AI App"
                className="mt-1 bg-white border-2 border-gray-300 font-retro"
              />
            </div>

            <div>
              <Label htmlFor="tagline" className="text-sm font-retro font-bold uppercase">Tagline *</Label>
              <Input
                id="tagline"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="A short description of what your app does"
                maxLength={100}
                className="mt-1 bg-white border-2 border-gray-300 font-retro"
              />
              <p className="text-xs font-retro text-gray-500 mt-1">
                {tagline.length}/100 characters
              </p>
            </div>

            <div>
              <Label className="text-sm font-retro font-bold uppercase">Categories * (select up to 3)</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    className={cn(
                      'flex items-center gap-2 p-3 border-2 text-left transition-colors font-retro',
                      selectedCategories.includes(cat.id)
                        ? 'border-black bg-gray-50 text-black'
                        : 'border-gray-200 hover:border-gray-400 text-gray-600'
                    )}
                  >
                    {ICON_MAP[cat.icon] || <Grid className="h-4 w-4" />}
                    <span className="text-sm">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <Label htmlFor="description" className="text-sm font-retro font-bold uppercase">Description *</Label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what your app does, its features, and why users should try it..."
                rows={6}
                className="w-full mt-1 px-3 py-2 border-2 border-gray-300 bg-white font-retro resize-none"
              />
            </div>

            <div>
              <Label htmlFor="iconUrl" className="text-sm font-retro font-bold uppercase">Icon URL</Label>
              <Input
                id="iconUrl"
                value={iconUrl}
                onChange={(e) => setIconUrl(e.target.value)}
                placeholder="https://example.com/icon.png"
                className="mt-1 bg-white border-2 border-gray-300 font-retro"
              />
              <p className="text-xs font-retro text-gray-500 mt-1">
                Recommended: 256x256px PNG or JPG
              </p>
            </div>

            <div>
              <Label htmlFor="tags" className="text-sm font-retro font-bold uppercase">Tags</Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="ai, chatbot, automation (comma separated)"
                className="mt-1 bg-white border-2 border-gray-300 font-retro"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <Label htmlFor="appUrl" className="text-sm font-retro font-bold uppercase">App URL *</Label>
              <Input
                id="appUrl"
                value={appUrl}
                onChange={(e) => setAppUrl(e.target.value)}
                placeholder="https://myapp.com"
                className="mt-1 bg-white border-2 border-gray-300 font-retro"
              />
            </div>

            <div>
              <Label htmlFor="demoUrl" className="text-sm font-retro font-bold uppercase">Demo URL</Label>
              <Input
                id="demoUrl"
                value={demoUrl}
                onChange={(e) => setDemoUrl(e.target.value)}
                placeholder="https://myapp.com/demo"
                className="mt-1 bg-white border-2 border-gray-300 font-retro"
              />
            </div>

            <div>
              <Label htmlFor="githubUrl" className="text-sm font-retro font-bold uppercase">GitHub URL</Label>
              <Input
                id="githubUrl"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/username/repo"
                className="mt-1 bg-white border-2 border-gray-300 font-retro"
              />
            </div>

            <div>
              <Label htmlFor="docsUrl" className="text-sm font-retro font-bold uppercase">Documentation URL</Label>
              <Input
                id="docsUrl"
                value={docsUrl}
                onChange={(e) => setDocsUrl(e.target.value)}
                placeholder="https://docs.myapp.com"
                className="mt-1 bg-white border-2 border-gray-300 font-retro"
              />
            </div>

            <div>
              <Label className="text-sm font-retro font-bold uppercase">Pricing</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                {(['free', 'freemium', 'paid', 'contact'] as PricingType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setPricingType(type)}
                    className={cn(
                      'p-3 border-2 text-center capitalize transition-colors font-retro',
                      pricingType === type
                        ? 'border-black bg-gray-50 text-black'
                        : 'border-gray-200 hover:border-gray-400 text-gray-600'
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>
              {pricingType === 'paid' && (
                <div className="mt-3">
                  <Label htmlFor="pricingAmount" className="text-sm font-retro font-bold uppercase">Price (USD/month)</Label>
                  <Input
                    id="pricingAmount"
                    type="number"
                    value={pricingAmount}
                    onChange={(e) => setPricingAmount(e.target.value)}
                    placeholder="9.99"
                    className="mt-1 bg-white border-2 border-gray-300 font-retro"
                  />
                </div>
              )}
            </div>

            {credentials.length > 0 && (
              <div>
                <Label htmlFor="credentialId" className="text-sm font-retro font-bold uppercase">Link Credential (optional)</Label>
                <select
                  id="credentialId"
                  value={credentialId}
                  onChange={(e) => setCredentialId(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border-2 border-gray-300 bg-white font-retro"
                >
                  <option value="">No credential</option>
                  {credentials.map((cred) => (
                    <option key={cred.id} value={cred.id}>
                      {cred.agent_name} ({cred.agent_id})
                    </option>
                  ))}
                </select>
                <p className="text-xs font-retro text-gray-500 mt-1">
                  Link a credential to show trust score on your app listing
                </p>
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h3 className="font-retro font-bold text-black uppercase">Review Your Submission</h3>

            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-gray-50 border-2 border-gray-200">
                <div className="w-16 h-16 bg-gray-100 border-2 border-gray-300 flex items-center justify-center flex-shrink-0">
                  {iconUrl ? (
                    <img
                      src={iconUrl}
                      alt={name}
                      className="w-12 h-12 object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-pixel text-gray-600">
                      {name.charAt(0)}
                    </span>
                  )}
                </div>
                <div>
                  <h4 className="font-retro font-bold text-black">{name}</h4>
                  <p className="text-sm font-retro text-gray-600">{tagline}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm font-retro">
                <div>
                  <span className="text-gray-500">Categories:</span>
                  <p className="text-black">
                    {selectedCategories
                      .map((id) => categories.find((c) => c.id === id)?.name)
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Pricing:</span>
                  <p className="capitalize text-black">
                    {pricingType}
                    {pricingType === 'paid' && ` - $${pricingAmount}/mo`}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">App URL:</span>
                  <p className="truncate text-black">{appUrl}</p>
                </div>
                {demoUrl && (
                  <div>
                    <span className="text-gray-500">Demo:</span>
                    <p className="truncate text-black">{demoUrl}</p>
                  </div>
                )}
              </div>

              <div>
                <span className="text-gray-500 text-sm font-retro">Description:</span>
                <p className="text-sm mt-1 whitespace-pre-wrap font-retro text-black">{description}</p>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 border-4 border-red-500 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <p className="text-sm font-retro text-red-700">{error}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 0}
          className="border-2 border-gray-300 hover:bg-gray-50 font-retro uppercase"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {step < STEPS.length - 1 ? (
          <Button
            onClick={() => setStep((s) => s + 1)}
            disabled={!canProceed()}
            className="bg-black text-white hover:bg-gray-800 font-retro uppercase"
          >
            Continue
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => handleSubmit(false)}
              disabled={submitting}
              className="border-2 border-gray-300 hover:bg-gray-50 font-retro uppercase"
            >
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save as Draft
            </Button>
            <Button
              onClick={() => handleSubmit(true)}
              disabled={submitting}
              className="bg-black text-white hover:bg-gray-800 font-retro uppercase"
            >
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Publish App
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
