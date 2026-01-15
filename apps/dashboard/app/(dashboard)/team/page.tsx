'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
        <div className="flex items-center gap-3 text-muted-foreground">
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
          <div className="w-14 h-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
            <Users className="h-7 w-7 text-white/70" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Team</h1>
            <p className="text-muted-foreground">
              Manage team members and their permissions
            </p>
          </div>
        </div>
        <Button onClick={() => setShowInviteForm(true)} className="gap-2">
          <UserPlus className="h-4 w-4" />
          Invite Member
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <CheckCircle className="h-4 w-4 text-emerald-400" />
          <p className="text-sm text-emerald-400">{success}</p>
        </div>
      )}

      {/* Invite Form Card */}
      {showInviteForm && (
        <Card className="overflow-hidden">
          <CardHeader className="bg-white/[0.02] border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                <UserPlus className="h-5 w-5 text-white/70" />
              </div>
              <div>
                <CardTitle className="text-base">Invite Team Member</CardTitle>
                <CardDescription>
                  Send an invitation to join your organization
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@example.com"
                  required
                  className="bg-white/[0.02] border-white/10 focus:border-white/30"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Role</Label>
                <div className="grid grid-cols-3 gap-3">
                  {['admin', 'member', 'viewer'].map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setInviteRole(role)}
                      className={cn(
                        'p-3 rounded-lg border text-left transition-all',
                        inviteRole === role
                          ? 'border-white/30 bg-white/[0.04]'
                          : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white/70">{ROLE_ICONS[role]}</span>
                        <span className="font-medium text-sm">{ROLE_LABELS[role]}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {ROLE_DESCRIPTIONS[role]}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={inviting} className="gap-2">
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
                  className="gap-2 border-white/10 hover:bg-white/[0.04]"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Team Members */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-white/[0.02] border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
              <Users className="h-4 w-4 text-white/70" />
            </div>
            <div>
              <CardTitle className="text-base">Team Members</CardTitle>
              <CardDescription>
                {members.length} member{members.length !== 1 ? 's' : ''} in your organization
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
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
                  className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-sm font-medium">
                      {member.user_id.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-sm">
                        User {member.user_id.slice(0, 8)}...
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Joined {new Date(member.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-white/5 border border-white/10">
                      {ROLE_ICONS[member.role]}
                      {ROLE_LABELS[member.role]}
                    </span>
                    <span className={cn(
                      'text-xs font-medium px-2 py-0.5 rounded-full',
                      member.status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-white/5 text-muted-foreground'
                    )}>
                      {member.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <Card className="overflow-hidden">
          <CardHeader className="bg-white/[0.02] border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Mail className="h-4 w-4 text-amber-400" />
              </div>
              <div>
                <CardTitle className="text-base">Pending Invitations</CardTitle>
                <CardDescription>
                  {invitations.length} invitation{invitations.length !== 1 ? 's' : ''} awaiting acceptance
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-2">
              {invitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-500/10 rounded-full flex items-center justify-center">
                      <Mail className="h-4 w-4 text-amber-400" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">{invitation.email}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Expires {new Date(invitation.expires_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-white/5 border border-white/10">
                      {ROLE_ICONS[invitation.role]}
                      {ROLE_LABELS[invitation.role]}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => cancelInvitation(invitation.id)}
                      className="gap-1.5 border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Role Permissions Info */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-white/[0.02] border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
              <Shield className="h-4 w-4 text-white/70" />
            </div>
            <CardTitle className="text-base">Role Permissions</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left py-3 font-medium text-muted-foreground">Permission</th>
                  <th className="text-center py-3 font-medium text-muted-foreground">Owner</th>
                  <th className="text-center py-3 font-medium text-muted-foreground">Admin</th>
                  <th className="text-center py-3 font-medium text-muted-foreground">Member</th>
                  <th className="text-center py-3 font-medium text-muted-foreground">Viewer</th>
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
                  <tr key={permission as string} className="border-b border-white/5 last:border-0">
                    <td className="py-3 text-muted-foreground">{permission}</td>
                    {roles.map((hasPermission, i) => (
                      <td key={i} className="text-center py-3">
                        {hasPermission ? (
                          <Check className="h-4 w-4 text-emerald-400 mx-auto" />
                        ) : (
                          <span className="text-white/20">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
