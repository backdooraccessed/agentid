'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  AlertTriangle,
  ArrowLeft,
  History,
  Save,
  Trash2,
  Users,
  Zap,
  FileKey,
} from 'lucide-react';

interface Policy {
  id: string;
  name: string;
  description: string | null;
  permissions: unknown[];
  version: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface PolicyVersion {
  id: string;
  version: number;
  permissions: unknown[];
  change_type: string;
  change_reason: string | null;
  created_at: string;
}

interface Credential {
  id: string;
  agent_id: string;
  agent_name: string;
  status: string;
}

export default function PolicyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [policy, setPolicy] = useState<Policy | null>(null);
  const [versions, setVersions] = useState<PolicyVersion[]>([]);
  const [credentials, setCredentials] = useState<{ items: Credential[]; total: number }>({
    items: [],
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit state
  const [editMode, setEditMode] = useState(false);
  const [editedPermissions, setEditedPermissions] = useState('');
  const [changeReason, setChangeReason] = useState('');

  // Delete dialog
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');

  useEffect(() => {
    fetchPolicy();
  }, [id]);

  async function fetchPolicy() {
    try {
      const response = await fetch(`/api/policies/${id}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to fetch policy');
        return;
      }

      setPolicy(data.policy);
      setVersions(data.versions || []);
      setCredentials(data.credentials || { items: [], total: 0 });
      setEditedPermissions(JSON.stringify(data.policy.permissions, null, 2));
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!policy) return;

    try {
      setSaving(true);
      setError(null);

      let permissions;
      try {
        permissions = JSON.parse(editedPermissions);
      } catch {
        setError('Invalid JSON format');
        return;
      }

      const response = await fetch(`/api/policies/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          permissions,
          change_reason: changeReason || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to update policy');
        return;
      }

      setEditMode(false);
      setChangeReason('');
      fetchPolicy();
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    try {
      setDeleting(true);

      const response = await fetch(`/api/policies/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to delete policy');
        return;
      }

      router.push('/policies');
    } catch {
      setError('Network error');
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!policy) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Policy not found</p>
            <Button asChild className="mt-4">
              <Link href="/policies">Back to Policies</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/policies">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <FileKey className="h-6 w-6 text-muted-foreground" />
            <h1 className="text-2xl font-semibold">{policy.name}</h1>
            {policy.is_active ? (
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-600">
                Active
              </span>
            ) : (
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                Inactive
              </span>
            )}
          </div>
          <p className="text-muted-foreground mt-1">
            {policy.description || 'No description'}
          </p>
        </div>
        <Button variant="destructive" onClick={() => setShowDelete(true)}>
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md">
          {error}
          <button className="ml-2 underline" onClick={() => setError(null)}>
            Dismiss
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Version</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold">v{policy.version}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Credentials Using</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold">{credentials.total}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Live Updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              <span className="text-sm text-muted-foreground">
                Changes apply instantly to all credentials
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Permissions Editor */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Permissions</CardTitle>
              <CardDescription>
                Edit permissions to instantly update what all assigned credentials can do
              </CardDescription>
            </div>
            {!editMode ? (
              <Button onClick={() => setEditMode(true)}>Edit Permissions</Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setEditMode(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {editMode ? (
            <div className="space-y-4">
              <div className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 px-4 py-3 rounded-md flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Live Permission Update</p>
                  <p className="text-sm">
                    Changes will apply immediately to {credentials.total} credential
                    {credentials.total !== 1 ? 's' : ''}. All verifications will return the new
                    permissions.
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Permissions (JSON)</Label>
                <Textarea
                  className="font-mono text-sm min-h-[200px]"
                  value={editedPermissions}
                  onChange={(e) => setEditedPermissions(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Change Reason (optional)</Label>
                <Input
                  placeholder="Why are you making this change?"
                  value={changeReason}
                  onChange={(e) => setChangeReason(e.target.value)}
                />
              </div>
            </div>
          ) : (
            <pre className="bg-muted p-4 rounded-md overflow-auto text-sm font-mono">
              {JSON.stringify(policy.permissions, null, 2)}
            </pre>
          )}
        </CardContent>
      </Card>

      {/* Credentials Using This Policy */}
      {credentials.total > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Credentials Using This Policy</CardTitle>
            <CardDescription>
              These credentials will receive permission updates when you change this policy
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {credentials.items.map((cred) => (
                <Link
                  key={cred.id}
                  href={`/credentials/${cred.id}`}
                  className="block p-3 rounded-md border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{cred.agent_name}</p>
                      <p className="text-sm text-muted-foreground">{cred.agent_id}</p>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        cred.status === 'active'
                          ? 'bg-green-500/10 text-green-600'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {cred.status}
                    </span>
                  </div>
                </Link>
              ))}
              {credentials.total > credentials.items.length && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  And {credentials.total - credentials.items.length} more...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Version History */}
      {versions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Version History</CardTitle>
            <CardDescription>Track all changes to this policy</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {versions.map((v) => (
                <div
                  key={v.id}
                  className="flex items-start justify-between p-3 rounded-md border"
                >
                  <div>
                    <p className="font-medium">
                      Version {v.version}
                      <span className="ml-2 text-xs text-muted-foreground">
                        {v.change_type}
                      </span>
                    </p>
                    {v.change_reason && (
                      <p className="text-sm text-muted-foreground">{v.change_reason}</p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(v.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Dialog */}
      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Permission Policy</DialogTitle>
            <DialogDescription>
              This action cannot be undone. {credentials.total} credential
              {credentials.total !== 1 ? 's' : ''} will revert to their static permissions.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>
              Type <span className="font-mono font-bold">DELETE</span> to confirm
            </Label>
            <Input
              className="mt-2"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="DELETE"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDelete(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteConfirm !== 'DELETE' || deleting}
            >
              {deleting ? 'Deleting...' : 'Delete Policy'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
