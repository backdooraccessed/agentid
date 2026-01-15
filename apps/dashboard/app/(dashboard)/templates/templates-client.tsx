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
import { Plus, FileText, Play, Power, Trash2, Check, AlertCircle, Loader2, Clock, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/shared/empty-state';

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
  { value: 'read', label: 'Read', description: 'View data' },
  { value: 'write', label: 'Write', description: 'Modify data' },
  { value: 'execute', label: 'Execute', description: 'Run operations' },
  { value: 'delete', label: 'Delete', description: 'Remove data' },
  { value: 'admin', label: 'Admin', description: 'Full control' },
  { value: 'api_access', label: 'API Access', description: 'External APIs' },
  { value: 'data_processing', label: 'Data Processing', description: 'Process data' },
  { value: 'user_interaction', label: 'User Interaction', description: 'Interact with users' },
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
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create Template
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg bg-black border-white/10">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-white/70" />
              </div>
              <div>
                <DialogTitle>Create Template</DialogTitle>
                <DialogDescription>
                  Create a reusable template for issuing credentials
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">Template Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Production Assistant"
                className="bg-white/[0.02] border-white/10 focus:border-white/30"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">Description (optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Template for production AI assistants"
                rows={2}
                className="bg-white/[0.02] border-white/10 focus:border-white/30 resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Agent Type</Label>
              <Select value={agentType} onValueChange={setAgentType}>
                <SelectTrigger className="bg-white/[0.02] border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-black border-white/10">
                  {AGENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Permissions</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {COMMON_PERMISSIONS.map((permission) => (
                  <label
                    key={permission.value}
                    className={cn(
                      'flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-all',
                      permissions.includes(permission.value)
                        ? 'bg-white/[0.04] border-white/20'
                        : 'bg-white/[0.02] border-white/10 hover:border-white/15'
                    )}
                  >
                    <div className={cn(
                      'w-4 h-4 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0',
                      permissions.includes(permission.value)
                        ? 'bg-white border-white'
                        : 'border-white/30'
                    )}>
                      {permissions.includes(permission.value) && (
                        <Check className="h-2.5 w-2.5 text-black" />
                      )}
                    </div>
                    <input
                      type="checkbox"
                      checked={permissions.includes(permission.value)}
                      onChange={() => togglePermission(permission.value)}
                      className="sr-only"
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-medium">{permission.label}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Default Validity Period</Label>
              <Select value={validityDays} onValueChange={setValidityDays}>
                <SelectTrigger className="bg-white/[0.02] border-white/10">
                  <SelectValue placeholder="No default (set per credential)" />
                </SelectTrigger>
                <SelectContent className="bg-black border-white/10">
                  <SelectItem value="">No default</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                  <SelectItem value="180">180 days</SelectItem>
                  <SelectItem value="365">1 year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              onClick={handleCreate}
              disabled={isCreating || !name || permissions.length === 0}
              className="w-full gap-2"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Create Template
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Templates List */}
      <div className="space-y-4 mt-6">
        {templates.length === 0 ? (
          <Card className="overflow-hidden">
            <EmptyState
              illustration="templates"
              title="No templates yet"
              description="Create a template to issue credentials faster"
            />
          </Card>
        ) : (
          templates.map((template) => (
            <Card
              key={template.id}
              className={cn(
                'overflow-hidden transition-opacity',
                !template.is_active && 'opacity-60'
              )}
            >
              <CardHeader className="bg-white/[0.02] border-b border-white/5 pb-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                        template.is_active ? 'bg-white/5' : 'bg-amber-500/10'
                      )}>
                        {template.is_active ? (
                          <FileText className="h-4 w-4 text-white/70" />
                        ) : (
                          <Power className="h-4 w-4 text-amber-400" />
                        )}
                      </div>
                      <CardTitle className="text-base flex items-center gap-2">
                        {template.name}
                        {!template.is_active && (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400">
                            Inactive
                          </span>
                        )}
                      </CardTitle>
                    </div>
                    <CardDescription className="ml-11">
                      {AGENT_TYPE_LABELS[template.agent_type as AgentType] || template.agent_type}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Link href={`/credentials/new?template=${template.id}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 border-white/10 hover:bg-white/[0.04]"
                      >
                        <Play className="h-3.5 w-3.5" />
                        Use
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActive(template.id, template.is_active)}
                      className="gap-1.5 border-white/10 hover:bg-white/[0.04]"
                    >
                      <Power className="h-3.5 w-3.5" />
                      {template.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(template.id)}
                      className="gap-1.5 border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Check className="h-3.5 w-3.5" />
                    <span>Permissions: {template.permissions.join(', ')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Hash className="h-3.5 w-3.5" />
                    <span>Used {template.usage_count} times</span>
                  </div>
                  {template.validity_days && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Default: {template.validity_days} days</span>
                    </div>
                  )}
                </div>
                {template.description && (
                  <p className="text-sm text-muted-foreground mt-3">{template.description}</p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </>
  );
}
