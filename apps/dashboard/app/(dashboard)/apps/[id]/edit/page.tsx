'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Loader2,
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
  Save,
  Globe,
  EyeOff,
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

interface App {
  id: string;
  name: string;
  tagline: string;
  description: string;
  icon_url: string | null;
  app_url: string;
  demo_url: string | null;
  github_url: string | null;
  docs_url: string | null;
  pricing_type: string;
  pricing_amount: number | null;
  status: string;
  credential_id: string | null;
  tags: string[] | null;
  categories: { id: string }[];
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

type PricingType = 'free' | 'freemium' | 'paid' | 'contact';

export default function EditAppPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [credentials, setCredentials] = useState<Credential[]>([]);

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
  const [status, setStatus] = useState('draft');

  useEffect(() => {
    fetchCategories();
    fetchCredentials();
    if (id) {
      fetchApp();
    }
  }, [id]);

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

  const fetchApp = async () => {
    try {
      const res = await fetch(`/api/apps/${id}`);
      if (res.ok) {
        const data = await res.json();
        const app: App = data.app;

        setName(app.name);
        setTagline(app.tagline);
        setDescription(app.description);
        setIconUrl(app.icon_url || '');
        setAppUrl(app.app_url);
        setDemoUrl(app.demo_url || '');
        setGithubUrl(app.github_url || '');
        setDocsUrl(app.docs_url || '');
        setPricingType(app.pricing_type as PricingType);
        setPricingAmount(app.pricing_amount?.toString() || '');
        setSelectedCategories(app.categories?.map((c) => c.id) || []);
        setTags(app.tags?.join(', ') || '');
        setCredentialId(app.credential_id || '');
        setStatus(app.status);
      }
    } catch (error) {
      console.error('Error fetching app:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (catId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(catId)
        ? prev.filter((c) => c !== catId)
        : [...prev, catId].slice(0, 3)
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/apps/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          tagline,
          description,
          icon_url: iconUrl || null,
          app_url: appUrl,
          demo_url: demoUrl || null,
          github_url: githubUrl || null,
          docs_url: docsUrl || null,
          pricing_type: pricingType,
          pricing_amount:
            pricingType === 'paid' ? parseFloat(pricingAmount) : null,
          category_ids: selectedCategories,
          tags: tags
            ? tags.split(',').map((t) => t.trim()).filter(Boolean)
            : [],
          credential_id: credentialId || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save app');
      }

      router.push('/apps');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/apps/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'live' }),
      });
      if (res.ok) {
        setStatus('live');
      }
    } catch (error) {
      console.error('Error publishing:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleUnpublish = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/apps/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'unlisted' }),
      });
      if (res.ok) {
        setStatus('unlisted');
      }
    } catch (error) {
      console.error('Error unpublishing:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <Link
          href="/apps"
          className="inline-flex items-center gap-2 font-retro text-gray-600 hover:text-black"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to My Apps
        </Link>

        <div className="flex gap-2">
          {status !== 'live' ? (
            <Button
              variant="outline"
              onClick={handlePublish}
              disabled={saving}
              className="border-2 border-gray-300 hover:bg-gray-50 font-retro uppercase"
            >
              <Globe className="h-4 w-4 mr-2" />
              Publish
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={handleUnpublish}
              disabled={saving}
              className="border-2 border-gray-300 hover:bg-gray-50 font-retro uppercase"
            >
              <EyeOff className="h-4 w-4 mr-2" />
              Unpublish
            </Button>
          )}
        </div>
      </div>

      <h1 className="font-pixel text-3xl text-black uppercase">Edit App</h1>

      <div className="space-y-8">
        {/* Basic Info */}
        <div className="border-4 border-black bg-white">
          <div className="bg-gray-50 border-b-4 border-black p-4">
            <h2 className="font-retro font-bold text-black uppercase">Basic Info</h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <Label htmlFor="name" className="text-sm font-retro font-bold uppercase">App Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 bg-white border-2 border-gray-300 font-retro"
              />
            </div>

            <div>
              <Label htmlFor="tagline" className="text-sm font-retro font-bold uppercase">Tagline *</Label>
              <Input
                id="tagline"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                maxLength={100}
                className="mt-1 bg-white border-2 border-gray-300 font-retro"
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-sm font-retro font-bold uppercase">Description *</Label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                className="w-full mt-1 px-3 py-2 border-2 border-gray-300 bg-white font-retro resize-none"
              />
            </div>

            <div>
              <Label className="text-sm font-retro font-bold uppercase">Categories (up to 3)</Label>
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
        </div>

        {/* Links */}
        <div className="border-4 border-black bg-white">
          <div className="bg-gray-50 border-b-4 border-black p-4">
            <h2 className="font-retro font-bold text-black uppercase">Links</h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <Label htmlFor="appUrl" className="text-sm font-retro font-bold uppercase">App URL *</Label>
              <Input
                id="appUrl"
                value={appUrl}
                onChange={(e) => setAppUrl(e.target.value)}
                className="mt-1 bg-white border-2 border-gray-300 font-retro"
              />
            </div>

            <div>
              <Label htmlFor="demoUrl" className="text-sm font-retro font-bold uppercase">Demo URL</Label>
              <Input
                id="demoUrl"
                value={demoUrl}
                onChange={(e) => setDemoUrl(e.target.value)}
                className="mt-1 bg-white border-2 border-gray-300 font-retro"
              />
            </div>

            <div>
              <Label htmlFor="githubUrl" className="text-sm font-retro font-bold uppercase">GitHub URL</Label>
              <Input
                id="githubUrl"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                className="mt-1 bg-white border-2 border-gray-300 font-retro"
              />
            </div>

            <div>
              <Label htmlFor="docsUrl" className="text-sm font-retro font-bold uppercase">Documentation URL</Label>
              <Input
                id="docsUrl"
                value={docsUrl}
                onChange={(e) => setDocsUrl(e.target.value)}
                className="mt-1 bg-white border-2 border-gray-300 font-retro"
              />
            </div>

            <div>
              <Label htmlFor="iconUrl" className="text-sm font-retro font-bold uppercase">Icon URL</Label>
              <Input
                id="iconUrl"
                value={iconUrl}
                onChange={(e) => setIconUrl(e.target.value)}
                className="mt-1 bg-white border-2 border-gray-300 font-retro"
              />
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="border-4 border-black bg-white">
          <div className="bg-gray-50 border-b-4 border-black p-4">
            <h2 className="font-retro font-bold text-black uppercase">Pricing</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['free', 'freemium', 'paid', 'contact'] as PricingType[]).map(
                (type) => (
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
                )
              )}
            </div>

            {pricingType === 'paid' && (
              <div>
                <Label htmlFor="pricingAmount" className="text-sm font-retro font-bold uppercase">Price (USD/month)</Label>
                <Input
                  id="pricingAmount"
                  type="number"
                  value={pricingAmount}
                  onChange={(e) => setPricingAmount(e.target.value)}
                  className="mt-1 bg-white border-2 border-gray-300 font-retro"
                />
              </div>
            )}
          </div>
        </div>

        {/* Additional */}
        <div className="border-4 border-black bg-white">
          <div className="bg-gray-50 border-b-4 border-black p-4">
            <h2 className="font-retro font-bold text-black uppercase">Additional</h2>
          </div>
          <div className="p-6 space-y-4">
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

            {credentials.length > 0 && (
              <div>
                <Label htmlFor="credentialId" className="text-sm font-retro font-bold uppercase">Linked Credential</Label>
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
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 border-4 border-red-500 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <p className="text-sm font-retro text-red-700">{error}</p>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Link href="/apps">
            <Button variant="outline" className="border-2 border-gray-300 hover:bg-gray-50 font-retro uppercase">
              Cancel
            </Button>
          </Link>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-black text-white hover:bg-gray-800 font-retro uppercase"
          >
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
