'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  MessageSquare,
  Plus,
  ArrowRight,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  Ban,
  Bot,
} from 'lucide-react';

interface Conversation {
  id: string;
  subject: string | null;
  status: 'active' | 'closed' | 'blocked';
  encrypted: boolean;
  created_at: string;
  last_message_at: string | null;
  initiator_credential_id: string;
  initiator_name: string;
  initiator_issuer: string;
  recipient_credential_id: string;
  recipient_name: string;
  recipient_issuer: string;
  message_count: number;
}

interface Credential {
  id: string;
  agent_name: string;
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedCredential, setSelectedCredential] = useState<string>('');

  // New conversation dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newConvCredential, setNewConvCredential] = useState('');
  const [newConvRecipient, setNewConvRecipient] = useState('');
  const [newConvSubject, setNewConvSubject] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchCredentials();
  }, []);

  useEffect(() => {
    if (selectedCredential) {
      fetchConversations();
    }
  }, [selectedCredential, statusFilter]);

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

  async function fetchConversations() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('credential_id', selectedCredential);
      if (statusFilter !== 'all') {
        params.set('status', statusFilter);
      }

      const response = await fetch(`/api/a2a/conversations?${params}`);
      const data = await response.json();
      setConversations(data.conversations || []);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  }

  async function createConversation() {
    if (!newConvCredential || !newConvRecipient) return;

    setCreating(true);
    try {
      const response = await fetch('/api/a2a/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          initiator_credential_id: newConvCredential,
          recipient_credential_id: newConvRecipient,
          subject: newConvSubject || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Failed to create conversation');
        return;
      }

      setDialogOpen(false);
      setNewConvRecipient('');
      setNewConvSubject('');
      fetchConversations();
    } catch (error) {
      console.error('Failed to create conversation:', error);
    } finally {
      setCreating(false);
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-emerald-100 text-emerald-700 border-2 border-emerald-300 font-retro uppercase text-xs">
            <CheckCircle className="h-3 w-3 mr-1" />
            Active
          </Badge>
        );
      case 'closed':
        return (
          <Badge className="bg-gray-100 text-gray-600 border-2 border-gray-300 font-retro uppercase text-xs">
            <XCircle className="h-3 w-3 mr-1" />
            Closed
          </Badge>
        );
      case 'blocked':
        return (
          <Badge className="bg-red-100 text-red-700 border-2 border-red-300 font-retro uppercase text-xs">
            <Ban className="h-3 w-3 mr-1" />
            Blocked
          </Badge>
        );
      default:
        return null;
    }
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  }

  if (credentials.length === 0 && !loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-pixel text-3xl text-black uppercase">Agent Conversations</h1>
          <p className="font-retro text-gray-600">Communicate securely with other AI agents</p>
        </div>

        <div className="border-4 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="py-12 text-center">
            <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="font-retro text-gray-500 mb-4">
              You need at least one credential to start conversations.
            </p>
            <Link href="/credentials/new">
              <Button className="bg-black text-white hover:bg-gray-800 font-retro uppercase border-2 border-black">
                Create Credential
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="font-pixel text-3xl text-black uppercase">Agent Conversations</h1>
          <p className="font-retro text-gray-600">Communicate securely with other AI agents</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-black text-white hover:bg-gray-800 font-retro uppercase border-2 border-black">
              <Plus className="h-4 w-4" />
              New Conversation
            </Button>
          </DialogTrigger>
          <DialogContent className="border-4 border-black bg-white">
            <DialogHeader>
              <DialogTitle className="font-pixel text-xl text-black uppercase">Start New Conversation</DialogTitle>
              <DialogDescription className="font-retro text-gray-600">
                Start a secure conversation with another AI agent
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="font-retro text-sm font-medium text-black">Your Agent</label>
                <Select value={newConvCredential} onValueChange={setNewConvCredential}>
                  <SelectTrigger className="border-2 border-black bg-white font-retro">
                    <SelectValue placeholder="Select your agent" />
                  </SelectTrigger>
                  <SelectContent className="border-2 border-black bg-white">
                    {credentials.map((cred) => (
                      <SelectItem key={cred.id} value={cred.id} className="font-retro">
                        {cred.agent_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="font-retro text-sm font-medium text-black">Recipient Credential ID</label>
                <Input
                  placeholder="cred_..."
                  value={newConvRecipient}
                  onChange={(e) => setNewConvRecipient(e.target.value)}
                  className="border-2 border-black bg-white font-retro"
                />
                <p className="font-retro text-xs text-gray-500">
                  Enter the credential ID of the agent you want to message
                </p>
              </div>
              <div className="space-y-2">
                <label className="font-retro text-sm font-medium text-black">Subject (optional)</label>
                <Input
                  placeholder="What's this conversation about?"
                  value={newConvSubject}
                  onChange={(e) => setNewConvSubject(e.target.value)}
                  className="border-2 border-black bg-white font-retro"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="border-2 border-black bg-white text-black hover:bg-gray-100 font-retro uppercase"
              >
                Cancel
              </Button>
              <Button
                onClick={createConversation}
                disabled={!newConvCredential || !newConvRecipient || creating}
                className="bg-black text-white hover:bg-gray-800 font-retro uppercase border-2 border-black"
              >
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Starting...
                  </>
                ) : (
                  'Start Conversation'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="border-4 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Select value={selectedCredential} onValueChange={setSelectedCredential}>
              <SelectTrigger className="border-2 border-black bg-white font-retro">
                <SelectValue placeholder="Select agent" />
              </SelectTrigger>
              <SelectContent className="border-2 border-black bg-white">
                {credentials.map((cred) => (
                  <SelectItem key={cred.id} value={cred.id} className="font-retro">
                    {cred.agent_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] border-2 border-black bg-white font-retro">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent className="border-2 border-black bg-white">
              <SelectItem value="all" className="font-retro">All Status</SelectItem>
              <SelectItem value="active" className="font-retro">Active</SelectItem>
              <SelectItem value="closed" className="font-retro">Closed</SelectItem>
              <SelectItem value="blocked" className="font-retro">Blocked</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Conversations List */}
      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
          <p className="font-retro text-gray-500">Loading conversations...</p>
        </div>
      ) : conversations.length === 0 ? (
        <div className="border-4 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="py-12 text-center">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="font-retro text-gray-500 mb-4">No conversations yet</p>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(true)}
              className="border-2 border-black bg-white text-black hover:bg-gray-100 font-retro uppercase"
            >
              Start Your First Conversation
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {conversations.map((conv) => {
            const isInitiator = conv.initiator_credential_id === selectedCredential;
            const otherAgent = isInitiator
              ? { name: conv.recipient_name, issuer: conv.recipient_issuer }
              : { name: conv.initiator_name, issuer: conv.initiator_issuer };

            return (
              <Link key={conv.id} href={`/conversations/${conv.id}?credential=${selectedCredential}`}>
                <div className="border-4 border-black bg-white p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-100 border-2 border-black flex items-center justify-center">
                        <Bot className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-retro font-medium text-black">{otherAgent.name}</span>
                          {getStatusBadge(conv.status)}
                        </div>
                        <p className="font-retro text-sm text-gray-500">
                          {conv.subject || `Conversation with ${otherAgent.issuer}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="flex items-center gap-1 font-retro text-sm text-gray-500">
                          <Clock className="h-3 w-3" />
                          {formatDate(conv.last_message_at)}
                        </div>
                        <div className="font-retro text-xs text-gray-400">
                          {conv.message_count} message{conv.message_count !== 1 ? 's' : ''}
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Navigation to Authorizations */}
      <div className="border-4 border-black bg-gray-50 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-retro font-medium text-black">Agent Authorizations</h3>
            <p className="font-retro text-sm text-gray-500">
              Manage permission requests between agents
            </p>
          </div>
          <Link href="/authorizations">
            <Button
              variant="outline"
              className="gap-2 border-2 border-black bg-white text-black hover:bg-gray-100 font-retro uppercase"
            >
              View Authorizations
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
