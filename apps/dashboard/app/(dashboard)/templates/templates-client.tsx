'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AGENT_TYPE_LABELS } from '@agentid/shared';
import type { AgentType } from '@agentid/shared';

interface Template {
  id: string;
  name: string;
  description: string | null;
  agent_type: string;
  permissions: string[];
  geographic_restrictions: string[];
  allowed_services: string[];
  validity_days: number | null;
  metadata_schema: Record<string, unknown>;
  default_metadata: Record<string, unknown>;
  is_active: boolean;
  usage_count: number;
  created_at: string;
}

const AGENT_TYPES = Object.entries(AGENT_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

const COMMON_PERMISSIONS = [
  'read',
  'write',
  'execute',
  'delete',
  'admin',
  'api_access',
  'data_processing',
  'user_interaction',
];

export function TemplatesClient({ initialTemplates }: { initialTemplates: Template[] }) {
  const router = useRouter();
  const [templates, setTemplates] = useState(initialTemplates);
  const [isCreating, setIsCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [agentType, setAgentType] = useState('assistant');
  const [permissions, setPermissions] = useState<string[]>(['read']);
  const [validityDays, setValidityDays] = useState<string>('');

  const handleCreate = async () => {
    setError(null);
    setIsCreating(true);

    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description: description || undefined,
          agent_type: agentType,
          permissions,
          validity_days: validityDays ? parseInt(validityDays) : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create template');
        return;
      }

      setTemplates([data.template, ...templates]);
      setDialogOpen(false);
      resetForm();
    } catch {
      setError('Failed to create template');
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleActive = async (templateId: string, currentActive: boolean) => {
    try {
      const res = await fetch(`/api/templates/${templateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentActive }),
      });

      if (res.ok) {
        setTemplates(templates.map(t =>
          t.id === templateId ? { ...t, is_active: !currentActive } : t
        ));
      }
    } catch {
      // Ignore
    }
  };

  const handleDelete = async (templateId: string) => {
    try {
      const res = await fetch(`/api/templates/${templateId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setTemplates(templates.filter(t => t.id !== templateId));
      }
    } catch {
      // Ignore
    }
  };

  const togglePermission = (permission: string) => {
    if (permissions.includes(permission)) {
      setPermissions(permissions.filter(p => p !== permission));
    } else {
      setPermissions([...permissions, permission]);
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setAgentType('assistant');
    setPermissions(['read']);
    setValidityDays('');
    setError(null);
  };

  return (
    <>
      {/* Create Template Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
        <DialogTrigger asChild>
          <Button>Create Template</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Template</DialogTitle>
            <DialogDescription>
              Create a reusable template for issuing credentials
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            <div>
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Production Assistant"
              />
            </div>
            <div>
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Template for production AI assistants"
                rows={2}
              />
            </div>
            <div>
              <Label>Agent Type</Label>
              <Select value={agentType} onValueChange={setAgentType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AGENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Permissions</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {COMMON_PERMISSIONS.map((permission) => (
                  <label
                    key={permission}
                    className="flex items-center gap-2 text-sm cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={permissions.includes(permission)}
                      onChange={() => togglePermission(permission)}
                      className="rounded"
                    />
                    {permission}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <Label>Default Validity Period</Label>
              <Select value={validityDays} onValueChange={setValidityDays}>
                <SelectTrigger>
                  <SelectValue placeholder="No default (set per credential)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No default</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                  <SelectItem value="180">180 days</SelectItem>
                  <SelectItem value="365">1 year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              onClick={handleCreate}
              disabled={isCreating || !name || permissions.length === 0}
            >
              {isCreating ? 'Creating...' : 'Create Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Templates List */}
      <div className="space-y-4 mt-6">
        {templates.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No templates yet. Create a template to issue credentials faster.
            </CardContent>
          </Card>
        ) : (
          templates.map((template) => (
            <Card key={template.id} className={!template.is_active ? 'opacity-60' : ''}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {template.name}
                      {!template.is_active && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                          Inactive
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {AGENT_TYPE_LABELS[template.agent_type as AgentType] || template.agent_type}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/credentials/new?template=${template.id}`}>
                      <Button variant="outline" size="sm">
                        Use Template
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActive(template.id, template.is_active)}
                    >
                      {template.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(template.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span>Permissions: {template.permissions.join(', ')}</span>
                  <span>Used: {template.usage_count} times</span>
                  {template.validity_days && (
                    <span>Default validity: {template.validity_days} days</span>
                  )}
                </div>
                {template.description && (
                  <p className="text-sm mt-2">{template.description}</p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </>
  );
}
