'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  ExternalLink,
  Eye,
  MousePointer,
  MoreVertical,
  Edit,
  Trash2,
  Globe,
  EyeOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface App {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  icon_url: string | null;
  status: string;
  view_count: number;
  click_count: number;
  pricing_type: string;
  created_at: string;
  published_at: string | null;
  categories: { name: string }[];
}

export default function MyAppsPage() {
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApps();
  }, []);

  const fetchApps = async () => {
    try {
      const res = await fetch('/api/apps');
      if (res.ok) {
        const data = await res.json();
        setApps(data.apps || []);
      }
    } catch (error) {
      console.error('Error fetching apps:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (id: string) => {
    try {
      const res = await fetch(`/api/apps/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'live' }),
      });
      if (res.ok) {
        fetchApps();
      }
    } catch (error) {
      console.error('Error publishing app:', error);
    }
  };

  const handleUnpublish = async (id: string) => {
    try {
      const res = await fetch(`/api/apps/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'unlisted' }),
      });
      if (res.ok) {
        fetchApps();
      }
    } catch (error) {
      console.error('Error unpublishing app:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this app?')) return;

    try {
      const res = await fetch(`/api/apps/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchApps();
      }
    } catch (error) {
      console.error('Error deleting app:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'live':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">
            <Globe className="h-3 w-3" />
            Live
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
            <Edit className="h-3 w-3" />
            Draft
          </span>
        );
      case 'unlisted':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded-full">
            <EyeOff className="h-3 w-3" />
            Unlisted
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded-full">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">My Apps</h1>
          <p className="text-muted-foreground">
            Manage your AI applications in the marketplace
          </p>
        </div>
        <Link href="/apps/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Submit New App
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-card border rounded-lg p-6 animate-pulse"
            >
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-muted rounded-xl" />
                <div className="flex-1">
                  <div className="h-5 bg-muted rounded w-32 mb-2" />
                  <div className="h-4 bg-muted rounded w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : apps.length === 0 ? (
        <div className="text-center py-16 border border-dashed rounded-lg">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No apps yet</h3>
          <p className="text-muted-foreground mb-4">
            Submit your first AI app to the marketplace
          </p>
          <Link href="/apps/new">
            <Button>Submit Your First App</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {apps.map((app) => (
            <div
              key={app.id}
              className="bg-card border rounded-lg p-6 hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  {app.icon_url ? (
                    <img
                      src={app.icon_url}
                      alt={app.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-bold text-muted-foreground">
                      {app.name.charAt(0)}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold truncate">{app.name}</h3>
                    {getStatusBadge(app.status)}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-1 mb-3">
                    {app.tagline}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {app.view_count.toLocaleString()} views
                    </span>
                    <span className="flex items-center gap-1">
                      <MousePointer className="h-4 w-4" />
                      {app.click_count.toLocaleString()} clicks
                    </span>
                    {app.categories.length > 0 && (
                      <span>{app.categories.map(c => c.name).join(', ')}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {app.status === 'live' && (
                    <Link href={`/marketplace/${app.slug}`} target="_blank">
                      <Button variant="outline" size="sm" className="gap-1">
                        <ExternalLink className="h-4 w-4" />
                        View
                      </Button>
                    </Link>
                  )}
                  <Link href={`/apps/${app.id}/edit`}>
                    <Button variant="outline" size="sm" className="gap-1">
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {app.status !== 'live' ? (
                        <DropdownMenuItem onClick={() => handlePublish(app.id)}>
                          <Globe className="h-4 w-4 mr-2" />
                          Publish
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => handleUnpublish(app.id)}>
                          <EyeOff className="h-4 w-4 mr-2" />
                          Unpublish
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() => handleDelete(app.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
