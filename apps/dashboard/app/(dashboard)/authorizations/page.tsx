'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Shield,
  Plus,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Ban,
  ArrowLeft,
  Bot,
  AlertTriangle,
  Check,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AuthorizationRequest {
  id: string;
  requester_credential_id: string;
  grantor_credential_id: string;
  requested_permissions: Array<{
    action: string;
    resource?: string;
  }>;
  scope: string | null;
  constraints: Record<string, unknown> | null;
  valid_from: string;
  valid_until: string | null;
  status: 'pending' | 'approved' | 'denied' | 'revoked' | 'expired';
  response_message: string | null;
  responded_at: string | null;
  created_at: string;
  requester?: {
    id: string;
    agent_name: string;
    issuer?: { display_name: string };
  };
  grantor?: {
    id: string;
    agent_name: string;
    issuer?: { display_name: string };
  };
  // From view
  requester_name?: string;
  requester_issuer?: string;
  requester_trust_score?: number;
  grantor_name?: string;
  grantor_issuer?: string;
}

interface Credential {
  id: string;
  agent_name: string;
}

export default function AuthorizationsPage() {
  const [authorizations, setAuthorizations] = useState<AuthorizationRequest[]>([]);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCredential, setSelectedCredential] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // New request dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newReqCredential, setNewReqCredential] = useState('');
  const [newReqGrantor, setNewReqGrantor] = useState('');
  const [newReqPermissions, setNewReqPermissions] = useState('');
  const [newReqScope, setNewReqScope] = useState('');
  const [creating, setCreating] = useState(false);

  // Response dialog
  const [responseDialogOpen, setResponseDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<AuthorizationRequest | null>(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [responding, setResponding] = useState(false);

  useEffect(() => {
    fetchCredentials();
  }, []);

  useEffect(() => {
    if (selectedCredential) {
      fetchAuthorizations();
    }
  }, [selectedCredential, roleFilter, statusFilter]);

  async function fetchCredentials() {
    try {
      const response = await fetch('/api/credentials');
      const data = await response.json();
      const creds = data.credentials || [];
      setCredentials(creds);
      if (creds.length > 0) {
        setSelectedCredential(creds[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch credentials:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchAuthorizations() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('credential_id', selectedCredential);
      if (roleFilter !== 'all') {
        params.set('role', roleFilter);
      }
      if (statusFilter !== 'all') {
        params.set('status', statusFilter);
      }

      const response = await fetch(`/api/a2a/authorizations?${params}`);
      const data = await response.json();
      setAuthorizations(data.authorizations || []);
    } catch (error) {
      console.error('Failed to fetch authorizations:', error);
    } finally {
      setLoading(false);
    }
  }

  async function createRequest() {
    if (!newReqCredential || !newReqGrantor || !newReqPermissions) return;

    setCreating(true);
    try {
      // Parse permissions
      let permissions;
      try {
        permissions = JSON.parse(newReqPermissions);
        if (!Array.isArray(permissions)) {
          permissions = [{ action: newReqPermissions }];
        }
      } catch {
        permissions = [{ action: newReqPermissions }];
      }

      const response = await fetch('/api/a2a/authorizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requester_credential_id: newReqCredential,
          grantor_credential_id: newReqGrantor,
          requested_permissions: permissions,
          scope: newReqScope || null,
          signature: 'dashboard-signature',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Failed to create request');
        return;
      }

      setDialogOpen(false);
      setNewReqGrantor('');
      setNewReqPermissions('');
      setNewReqScope('');
      fetchAuthorizations();
    } catch (error) {
      console.error('Failed to create request:', error);
    } finally {
      setCreating(false);
    }
  }

  async function respondToRequest(approved: boolean) {
    if (!selectedRequest) return;

    setResponding(true);
    try {
      const response = await fetch(`/api/a2a/authorizations/${selectedRequest.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grantor_credential_id: selectedCredential,
          approved,
          message: responseMessage || null,
          signature: 'dashboard-signature',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Failed to respond');
        return;
      }

      setResponseDialogOpen(false);
      setSelectedRequest(null);
      setResponseMessage('');
      fetchAuthorizations();
    } catch (error) {
      console.error('Failed to respond:', error);
    } finally {
      setResponding(false);
    }
  }

  async function revokeAuthorization(requestId: string) {
    if (!confirm('Are you sure you want to revoke this authorization?')) return;

    try {
      const response = await fetch(`/api/a2a/authorizations/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'revoke' }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Failed to revoke');
        return;
      }

      fetchAuthorizations();
    } catch (error) {
      console.error('Failed to revoke:', error);
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'pending':
        return (
          <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'approved':
        return (
          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case 'denied':
        return (
          <Badge className="bg-red-500/10 text-red-400 border-red-500/20">
            <XCircle className="h-3 w-3 mr-1" />
            Denied
          </Badge>
        );
      case 'revoked':
        return (
          <Badge className="bg-white/10 text-white/60 border-white/20">
            <Ban className="h-3 w-3 mr-1" />
            Revoked
          </Badge>
        );
      case 'expired':
        return (
          <Badge className="bg-white/10 text-white/60 border-white/20">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Expired
          </Badge>
        );
      default:
        return null;
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString();
  }

  function getAgentInfo(auth: AuthorizationRequest, role: 'requester' | 'grantor') {
    if (role === 'requester') {
      return {
        name: auth.requester_name || auth.requester?.agent_name || 'Unknown',
        issuer: auth.requester_issuer || auth.requester?.issuer?.display_name || '',
      };
    }
    return {
      name: auth.grantor_name || auth.grantor?.agent_name || 'Unknown',
      issuer: auth.grantor_issuer || auth.grantor?.issuer?.display_name || '',
    };
  }

  // Separate authorizations into incoming and outgoing
  const incomingRequests = authorizations.filter(
    (a) => a.grantor_credential_id === selectedCredential
  );
  const outgoingRequests = authorizations.filter(
    (a) => a.requester_credential_id === selectedCredential
  );

  if (credentials.length === 0 && !loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Agent Authorizations</h1>
          <p className="text-white/60">Manage permission requests between agents</p>
        </div>

        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="h-12 w-12 text-white/30 mx-auto mb-4" />
            <p className="text-white/50 mb-4">
              You need at least one credential to manage authorizations.
            </p>
            <Link href="/credentials/new">
              <Button>Create Credential</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/conversations" className="text-white/60 hover:text-white">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-2xl font-bold">Agent Authorizations</h1>
          </div>
          <p className="text-white/60">Manage permission requests between agents</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Request Authorization
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Authorization</DialogTitle>
              <DialogDescription>
                Request permission to perform actions on behalf of another agent
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Your Agent (Requester)</label>
                <Select value={newReqCredential} onValueChange={setNewReqCredential}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your agent" />
                  </SelectTrigger>
                  <SelectContent>
                    {credentials.map((cred) => (
                      <SelectItem key={cred.id} value={cred.id}>
                        {cred.agent_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Grantor Credential ID</label>
                <Input
                  placeholder="cred_..."
                  value={newReqGrantor}
                  onChange={(e) => setNewReqGrantor(e.target.value)}
                />
                <p className="text-xs text-white/50">
                  The credential ID of the agent you&apos;re requesting authorization from
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Permissions</label>
                <Textarea
                  placeholder='e.g., "read-data" or [{"action": "read", "resource": "users"}]'
                  value={newReqPermissions}
                  onChange={(e) => setNewReqPermissions(e.target.value)}
                  rows={3}
                />
                <p className="text-xs text-white/50">
                  Enter a permission name or JSON array of permissions
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Scope (optional)</label>
                <Input
                  placeholder="Describe the scope of access needed"
                  value={newReqScope}
                  onChange={(e) => setNewReqScope(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={createRequest}
                disabled={!newReqCredential || !newReqGrantor || !newReqPermissions || creating}
              >
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Sending...
                  </>
                ) : (
                  'Send Request'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Select value={selectedCredential} onValueChange={setSelectedCredential}>
                <SelectTrigger>
                  <SelectValue placeholder="Select agent" />
                </SelectTrigger>
                <SelectContent>
                  {credentials.map((cred) => (
                    <SelectItem key={cred.id} value={cred.id}>
                      {cred.agent_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="denied">Denied</SelectItem>
                <SelectItem value="revoked">Revoked</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Incoming/Outgoing */}
      <Tabs defaultValue="incoming" className="space-y-4">
        <TabsList>
          <TabsTrigger value="incoming" className="gap-2">
            Incoming Requests
            {incomingRequests.filter((r) => r.status === 'pending').length > 0 && (
              <Badge variant="secondary" className="ml-1 bg-amber-500/20 text-amber-400">
                {incomingRequests.filter((r) => r.status === 'pending').length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="outgoing">Outgoing Requests</TabsTrigger>
        </TabsList>

        {/* Incoming Requests */}
        <TabsContent value="incoming">
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-white/30 mx-auto mb-4" />
              <p className="text-white/50">Loading...</p>
            </div>
          ) : incomingRequests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Shield className="h-12 w-12 text-white/30 mx-auto mb-4" />
                <p className="text-white/50">No incoming authorization requests</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {incomingRequests.map((auth) => {
                const requester = getAgentInfo(auth, 'requester');

                return (
                  <Card key={auth.id}>
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                            <Bot className="h-5 w-5 text-white/50" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{requester.name}</span>
                              {getStatusBadge(auth.status)}
                            </div>
                            <p className="text-sm text-white/50 mb-2">
                              {requester.issuer}
                            </p>
                            <div className="space-y-1">
                              <p className="text-sm text-white/70">
                                <span className="text-white/50">Permissions:</span>{' '}
                                {auth.requested_permissions
                                  .map((p) => p.action)
                                  .join(', ')}
                              </p>
                              {auth.scope && (
                                <p className="text-sm text-white/50">
                                  <span className="text-white/40">Scope:</span> {auth.scope}
                                </p>
                              )}
                              <p className="text-xs text-white/40">
                                Requested {formatDate(auth.created_at)}
                                {auth.valid_until && ` · Expires ${formatDate(auth.valid_until)}`}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          {auth.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-400 border-red-500/20 hover:bg-red-500/10"
                                onClick={() => {
                                  setSelectedRequest(auth);
                                  setResponseDialogOpen(true);
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                                onClick={() => {
                                  setSelectedRequest(auth);
                                  setResponseDialogOpen(true);
                                }}
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                            </>
                          )}
                          {auth.status === 'approved' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-400"
                              onClick={() => revokeAuthorization(auth.id)}
                            >
                              Revoke
                            </Button>
                          )}
                        </div>
                      </div>

                      {auth.response_message && (
                        <div className="mt-3 pt-3 border-t border-white/5">
                          <p className="text-sm text-white/50">
                            <span className="text-white/40">Response:</span>{' '}
                            {auth.response_message}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Outgoing Requests */}
        <TabsContent value="outgoing">
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-white/30 mx-auto mb-4" />
              <p className="text-white/50">Loading...</p>
            </div>
          ) : outgoingRequests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Shield className="h-12 w-12 text-white/30 mx-auto mb-4" />
                <p className="text-white/50 mb-4">No outgoing authorization requests</p>
                <Button variant="outline" onClick={() => setDialogOpen(true)}>
                  Request Authorization
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {outgoingRequests.map((auth) => {
                const grantor = getAgentInfo(auth, 'grantor');

                return (
                  <Card key={auth.id}>
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                            <Bot className="h-5 w-5 text-white/50" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">To: {grantor.name}</span>
                              {getStatusBadge(auth.status)}
                            </div>
                            <p className="text-sm text-white/50 mb-2">
                              {grantor.issuer}
                            </p>
                            <div className="space-y-1">
                              <p className="text-sm text-white/70">
                                <span className="text-white/50">Permissions:</span>{' '}
                                {auth.requested_permissions
                                  .map((p) => p.action)
                                  .join(', ')}
                              </p>
                              {auth.scope && (
                                <p className="text-sm text-white/50">
                                  <span className="text-white/40">Scope:</span> {auth.scope}
                                </p>
                              )}
                              <p className="text-xs text-white/40">
                                Requested {formatDate(auth.created_at)}
                                {auth.responded_at && (
                                  <>
                                    {' · '}
                                    {auth.status === 'approved' ? 'Approved' : 'Responded'}{' '}
                                    {formatDate(auth.responded_at)}
                                  </>
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {auth.response_message && (
                        <div className="mt-3 pt-3 border-t border-white/5">
                          <p className="text-sm text-white/50">
                            <span className="text-white/40">Response:</span>{' '}
                            {auth.response_message}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Response Dialog */}
      <Dialog open={responseDialogOpen} onOpenChange={setResponseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Respond to Authorization Request</DialogTitle>
            <DialogDescription>
              {selectedRequest && (
                <>
                  <span className="font-medium">
                    {getAgentInfo(selectedRequest, 'requester').name}
                  </span>{' '}
                  is requesting:{' '}
                  {selectedRequest.requested_permissions.map((p) => p.action).join(', ')}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Response Message (optional)</label>
              <Textarea
                placeholder="Add a message to your response..."
                value={responseMessage}
                onChange={(e) => setResponseMessage(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setResponseDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              className="text-red-400 border-red-500/20 hover:bg-red-500/10"
              onClick={() => respondToRequest(false)}
              disabled={responding}
            >
              {responding ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Deny'}
            </Button>
            <Button
              className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
              onClick={() => respondToRequest(true)}
              disabled={responding}
            >
              {responding ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Approve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
