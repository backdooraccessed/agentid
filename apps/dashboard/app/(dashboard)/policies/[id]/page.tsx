'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
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
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!policy) {
    return (
      <div className="p-6">
        <div className="border-4 border-black bg-white p-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-gray-600 font-retro text-center">Policy not found</p>
          <div className="flex justify-center mt-4">
            <Button asChild className="bg-black text-white hover:bg-gray-800 font-retro uppercase">
              <Link href="/policies">Back to Policies</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          asChild
          className="border-2 border-black hover:bg-gray-100"
        >
          <Link href="/policies">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <FileKey className="h-6 w-6 text-gray-600" />
            <h1 className="font-pixel text-3xl text-black uppercase">{policy.name}</h1>
            {policy.is_active ? (
              <span className="text-xs px-2 py-0.5 border-2 border-green-600 bg-green-100 text-green-600 font-retro uppercase">
                Active
              </span>
            ) : (
              <span className="text-xs px-2 py-0.5 border-2 border-gray-300 bg-gray-100 text-gray-600 font-retro uppercase">
                Inactive
              </span>
            )}
          </div>
          <p className="text-gray-600 font-retro mt-1">
            {policy.description || 'No description'}
          </p>
        </div>
        <Button
          onClick={() => setShowDelete(true)}
          className="bg-red-600 text-white hover:bg-red-700 font-retro uppercase border-2 border-black"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="border-4 border-red-600 bg-red-50 text-red-600 px-4 py-3 font-retro">
          {error}
          <button className="ml-2 underline" onClick={() => setError(null)}>
            Dismiss
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border-4 border-black bg-white p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-gray-600 font-retro text-sm uppercase">Version</p>
          <div className="flex items-center gap-2 mt-2">
            <History className="h-5 w-5 text-gray-600" />
            <span className="font-pixel text-2xl text-black">v{policy.version}</span>
          </div>
        </div>
        <div className="border-4 border-black bg-white p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-gray-600 font-retro text-sm uppercase">Credentials Using</p>
          <div className="flex items-center gap-2 mt-2">
            <Users className="h-5 w-5 text-gray-600" />
            <span className="font-pixel text-2xl text-black">{credentials.total}</span>
          </div>
        </div>
        <div className="border-4 border-black bg-white p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-gray-600 font-retro text-sm uppercase">Live Updates</p>
          <div className="flex items-center gap-2 mt-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            <span className="text-sm text-gray-600 font-retro">
              Changes apply instantly to all credentials
            </span>
          </div>
        </div>
      </div>

      {/* Permissions Editor */}
      <div className="border-4 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="border-b-4 border-black p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-pixel text-xl text-black uppercase">Permissions</h2>
              <p className="text-gray-600 font-retro text-sm mt-1">
                Edit permissions to instantly update what all assigned credentials can do
              </p>
            </div>
            {!editMode ? (
              <Button
                onClick={() => setEditMode(true)}
                className="bg-black text-white hover:bg-gray-800 font-retro uppercase"
              >
                Edit Permissions
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  onClick={() => setEditMode(false)}
                  className="bg-white text-black border-2 border-black hover:bg-gray-100 font-retro uppercase"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-black text-white hover:bg-gray-800 font-retro uppercase"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            )}
          </div>
        </div>
        <div className="p-4">
          {editMode ? (
            <div className="space-y-4">
              <div className="border-4 border-yellow-500 bg-yellow-50 text-yellow-700 px-4 py-3 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-retro font-bold uppercase">Live Permission Update</p>
                  <p className="text-sm font-retro">
                    Changes will apply immediately to {credentials.total} credential
                    {credentials.total !== 1 ? 's' : ''}. All verifications will return the new
                    permissions.
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-retro uppercase text-black">Permissions (JSON)</Label>
                <Textarea
                  className="font-mono text-sm min-h-[200px] border-2 border-black focus:ring-0 focus:border-black"
                  value={editedPermissions}
                  onChange={(e) => setEditedPermissions(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="font-retro uppercase text-black">Change Reason (optional)</Label>
                <Input
                  placeholder="Why are you making this change?"
                  value={changeReason}
                  onChange={(e) => setChangeReason(e.target.value)}
                  className="border-2 border-black focus:ring-0 focus:border-black font-retro"
                />
              </div>
            </div>
          ) : (
            <pre className="bg-gray-100 p-4 border-2 border-gray-300 overflow-auto text-sm font-mono">
              {JSON.stringify(policy.permissions, null, 2)}
            </pre>
          )}
        </div>
      </div>

      {/* Credentials Using This Policy */}
      {credentials.total > 0 && (
        <div className="border-4 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="border-b-4 border-black p-4">
            <h2 className="font-pixel text-xl text-black uppercase">Credentials Using This Policy</h2>
            <p className="text-gray-600 font-retro text-sm mt-1">
              These credentials will receive permission updates when you change this policy
            </p>
          </div>
          <div className="p-4">
            <div className="space-y-2">
              {credentials.items.map((cred) => (
                <Link
                  key={cred.id}
                  href={`/credentials/${cred.id}`}
                  className="block p-3 border-2 border-black hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-retro font-bold text-black">{cred.agent_name}</p>
                      <p className="text-sm text-gray-600 font-retro">{cred.agent_id}</p>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 font-retro uppercase ${
                        cred.status === 'active'
                          ? 'border-2 border-green-600 bg-green-100 text-green-600'
                          : 'border-2 border-gray-300 bg-gray-100 text-gray-600'
                      }`}
                    >
                      {cred.status}
                    </span>
                  </div>
                </Link>
              ))}
              {credentials.total > credentials.items.length && (
                <p className="text-sm text-gray-600 font-retro text-center py-2">
                  And {credentials.total - credentials.items.length} more...
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Version History */}
      {versions.length > 0 && (
        <div className="border-4 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="border-b-4 border-black p-4">
            <h2 className="font-pixel text-xl text-black uppercase">Version History</h2>
            <p className="text-gray-600 font-retro text-sm mt-1">Track all changes to this policy</p>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {versions.map((v) => (
                <div
                  key={v.id}
                  className="flex items-start justify-between p-3 border-2 border-gray-300"
                >
                  <div>
                    <p className="font-retro font-bold text-black">
                      Version {v.version}
                      <span className="ml-2 text-xs text-gray-600 font-retro uppercase">
                        {v.change_type}
                      </span>
                    </p>
                    {v.change_reason && (
                      <p className="text-sm text-gray-600 font-retro">{v.change_reason}</p>
                    )}
                  </div>
                  <span className="text-xs text-gray-600 font-retro">
                    {new Date(v.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent className="border-4 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <DialogHeader>
            <DialogTitle className="font-pixel text-xl text-black uppercase">
              Delete Permission Policy
            </DialogTitle>
            <DialogDescription className="text-gray-600 font-retro">
              This action cannot be undone. {credentials.total} credential
              {credentials.total !== 1 ? 's' : ''} will revert to their static permissions.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label className="font-retro text-black">
              Type <span className="font-mono font-bold">DELETE</span> to confirm
            </Label>
            <Input
              className="mt-2 border-2 border-black focus:ring-0 focus:border-black font-retro"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="DELETE"
            />
          </div>
          <DialogFooter>
            <Button
              onClick={() => setShowDelete(false)}
              className="bg-white text-black border-2 border-black hover:bg-gray-100 font-retro uppercase"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleteConfirm !== 'DELETE' || deleting}
              className="bg-red-600 text-white hover:bg-red-700 font-retro uppercase border-2 border-black"
            >
              {deleting ? 'Deleting...' : 'Delete Policy'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
