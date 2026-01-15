'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, UserPlus, Mail, Shield, Eye, Settings, Trash2, X, Check, AlertCircle, CheckCircle, Loader2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/shared/empty-state';

interface TeamMember {
  id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  status: 'pending' | 'active' | 'inactive';
  created_at: string;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  created_at: string;
  expires_at: string;
}

const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
  viewer: 'Viewer',
};

const ROLE_DESCRIPTIONS: Record<string, string> = {
  admin: 'Can manage credentials, team, and settings',
  member: 'Can issue and manage credentials',
  viewer: 'Can view credentials and analytics',
};

const ROLE_ICONS: Record<string, React.ReactNode> = {
  owner: <Shield className="h-4 w-4" />,
  admin: <Settings className="h-4 w-4" />,
  member: <Users className="h-4 w-4" />,
  viewer: <Eye className="h-4 w-4" />,
};

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Invite form
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    try {
      const response = await fetch('/api/team');
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to fetch team');
        return;
      }

      setMembers(data.members || []);
      setInvitations(data.invitations || []);
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to send invitation');
        return;
      }

      setSuccess(`Invitation sent to ${inviteEmail}`);
      setInviteEmail('');
      setShowInviteForm(false);
      fetchTeam();
    } catch {
      setError('Network error');
    } finally {
      setInviting(false);
    }
  };

  const cancelInvitation = async (invitationId: string) => {
    try {
      const response = await fetch(`/api/team/invitations/${invitationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchTeam();
      }
    } catch {
      setError('Failed to cancel invitation');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 font-retro text-gray-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading team...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gray-100 border-4 border-black flex items-center justify-center">
            <Users className="h-7 w-7 text-gray-600" />
          </div>
          <div>
            <h1 className="font-pixel text-3xl uppercase">Team</h1>
            <p className="font-retro text-gray-600">
              Manage team members and their permissions
            </p>
          </div>
        </div>
        <Button onClick={() => setShowInviteForm(true)} className="gap-2 bg-black text-white hover:bg-gray-800 font-retro uppercase block-shadow-sm">
          <UserPlus className="h-4 w-4" />
          Invite Member
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 border-4 border-red-500 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <p className="text-sm font-retro text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-3 border-4 border-emerald-500 bg-emerald-50">
          <CheckCircle className="h-4 w-4 text-emerald-600" />
          <p className="text-sm font-retro text-emerald-700">{success}</p>
        </div>
      )}

      {/* Invite Form Card */}
      {showInviteForm && (
        <div className="border-4 border-black bg-white">
          <div className="bg-gray-50 border-b-4 border-black px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 border-2 border-gray-300 flex items-center justify-center">
                <UserPlus className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <h2 className="font-retro font-bold uppercase">Invite Team Member</h2>
                <p className="text-xs font-retro text-gray-500">
                  Send an invitation to join your organization
                </p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-retro font-bold uppercase">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@example.com"
                  required
                  className="bg-white border-2 border-gray-300 font-retro"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-retro font-bold uppercase">Role</Label>
                <div className="grid grid-cols-3 gap-3">
                  {['admin', 'member', 'viewer'].map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setInviteRole(role)}
                      className={cn(
                        'p-3 border-4 text-left transition-all',
                        inviteRole === role
                          ? 'border-black bg-gray-50 block-shadow'
                          : 'border-gray-200 bg-white hover:border-gray-400'
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-gray-600">{ROLE_ICONS[role]}</span>
                        <span className="font-retro font-bold text-sm text-black">{ROLE_LABELS[role]}</span>
                      </div>
                      <div className="text-xs font-retro text-gray-500">
                        {ROLE_DESCRIPTIONS[role]}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={inviting} className="gap-2 bg-black text-white hover:bg-gray-800 font-retro uppercase">
                  {inviting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4" />
                      Send Invitation
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowInviteForm(false)}
                  className="gap-2 border-2 border-gray-300 hover:bg-gray-50 font-retro uppercase"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Team Members */}
      <div className="border-4 border-black bg-white">
        <div className="bg-gray-50 border-b-4 border-black px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-100 border-2 border-gray-300 flex items-center justify-center">
              <Users className="h-4 w-4 text-gray-600" />
            </div>
            <div>
              <h2 className="font-retro font-bold uppercase">Team Members</h2>
              <p className="text-xs font-retro text-gray-500">
                {members.length} member{members.length !== 1 ? 's' : ''} in your organization
              </p>
            </div>
          </div>
        </div>
        <div className="p-6">
          {members.length === 0 ? (
            <EmptyState
              illustration="team"
              title="No team members yet"
              description="Start by inviting someone to join"
              className="py-8"
            />
          ) : (
            <div className="space-y-2">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 bg-gray-50 border-2 border-gray-200 hover:border-gray-400 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 border-2 border-gray-300 flex items-center justify-center text-sm font-retro font-bold">
                      {member.user_id.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-retro font-bold text-sm text-black">
                        User {member.user_id.slice(0, 8)}...
                      </div>
                      <div className="text-xs font-retro text-gray-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Joined {new Date(member.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-retro font-bold uppercase bg-gray-100 border-2 border-gray-300">
                      {ROLE_ICONS[member.role]}
                      {ROLE_LABELS[member.role]}
                    </span>
                    <span className={cn(
                      'text-xs font-retro font-bold uppercase px-2 py-0.5 border-2',
                      member.status === 'active'
                        ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                        : 'bg-gray-100 text-gray-500 border-gray-300'
                    )}>
                      {member.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <div className="border-4 border-black bg-white">
          <div className="bg-amber-50 border-b-4 border-black px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-amber-100 border-2 border-amber-300 flex items-center justify-center">
                <Mail className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <h2 className="font-retro font-bold uppercase text-amber-700">Pending Invitations</h2>
                <p className="text-xs font-retro text-amber-600">
                  {invitations.length} invitation{invitations.length !== 1 ? 's' : ''} awaiting acceptance
                </p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-2">
              {invitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between p-3 bg-gray-50 border-2 border-gray-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 border-2 border-amber-300 flex items-center justify-center">
                      <Mail className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <div className="font-retro font-bold text-sm text-black">{invitation.email}</div>
                      <div className="text-xs font-retro text-gray-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Expires {new Date(invitation.expires_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-retro font-bold uppercase bg-gray-100 border-2 border-gray-300">
                      {ROLE_ICONS[invitation.role]}
                      {ROLE_LABELS[invitation.role]}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => cancelInvitation(invitation.id)}
                      className="gap-1.5 border-2 border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 font-retro uppercase"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Role Permissions Info */}
      <div className="border-4 border-black bg-white">
        <div className="bg-gray-50 border-b-4 border-black px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-100 border-2 border-gray-300 flex items-center justify-center">
              <Shield className="h-4 w-4 text-gray-600" />
            </div>
            <h2 className="font-retro font-bold uppercase">Role Permissions</h2>
          </div>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-retro">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 font-bold text-gray-600 uppercase">Permission</th>
                  <th className="text-center py-3 font-bold text-gray-600 uppercase">Owner</th>
                  <th className="text-center py-3 font-bold text-gray-600 uppercase">Admin</th>
                  <th className="text-center py-3 font-bold text-gray-600 uppercase">Member</th>
                  <th className="text-center py-3 font-bold text-gray-600 uppercase">Viewer</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['View credentials', true, true, true, true],
                  ['Issue credentials', true, true, true, false],
                  ['Revoke credentials', true, true, true, false],
                  ['Manage templates', true, true, true, false],
                  ['View analytics', true, true, true, true],
                  ['Manage API keys', true, true, false, false],
                  ['Manage webhooks', true, true, false, false],
                  ['Manage team', true, true, false, false],
                  ['Manage settings', true, true, false, false],
                  ['Delete organization', true, false, false, false],
                ].map(([permission, ...roles]) => (
                  <tr key={permission as string} className="border-b border-gray-100 last:border-0">
                    <td className="py-3 text-gray-600">{permission}</td>
                    {roles.map((hasPermission, i) => (
                      <td key={i} className="text-center py-3">
                        {hasPermission ? (
                          <Check className="h-4 w-4 text-emerald-600 mx-auto" />
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
