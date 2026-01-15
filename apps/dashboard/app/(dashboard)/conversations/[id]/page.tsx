'use client';

import { useState, useEffect, useRef, use } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ArrowLeft,
  Send,
  Loader2,
  Bot,
  MoreVertical,
  XCircle,
  CheckCircle,
  Ban,
  Clock,
  Shield,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  conversation_id: string;
  sender_credential_id: string;
  message_type: string;
  content: {
    text?: string;
    data?: unknown;
    request?: { action: string; params?: Record<string, unknown> };
    response?: { success: boolean; result?: unknown; error?: string };
  };
  signature: string;
  signature_timestamp: number;
  nonce: string;
  reply_to_id: string | null;
  delivered: boolean;
  delivered_at: string | null;
  read_at: string | null;
  created_at: string;
  sender?: {
    id: string;
    agent_name: string;
    issuer?: { display_name: string };
  };
}

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

export default function ConversationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const credentialId = searchParams.get('credential');

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchConversation();
    fetchMessages();

    // Poll for new messages every 5 seconds
    pollIntervalRef.current = setInterval(() => {
      fetchMessages(true);
    }, 5000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  async function fetchConversation() {
    try {
      const response = await fetch(`/api/a2a/conversations/${id}`);
      if (!response.ok) {
        setError('Conversation not found');
        return;
      }
      const data = await response.json();
      setConversation(data.conversation);
    } catch (err) {
      setError('Failed to load conversation');
    }
  }

  async function fetchMessages(silent = false) {
    if (!silent) setLoading(true);
    try {
      const response = await fetch(`/api/a2a/conversations/${id}/messages`);
      if (!response.ok) return;
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  }

  async function sendMessage() {
    if (!newMessage.trim() || !credentialId) return;

    setSending(true);
    try {
      // Generate signature data
      const nonce = crypto.randomUUID().replace(/-/g, '');
      const timestamp = Math.floor(Date.now() / 1000);

      const response = await fetch(`/api/a2a/conversations/${id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_credential_id: credentialId,
          message_type: 'text',
          content: { text: newMessage.trim() },
          signature: 'dashboard-signature', // Simplified for dashboard
          signature_timestamp: timestamp,
          nonce,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Failed to send message');
        return;
      }

      setNewMessage('');
      fetchMessages(true);
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  }

  async function updateConversationStatus(status: string) {
    try {
      const response = await fetch(`/api/a2a/conversations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        fetchConversation();
      }
    } catch (err) {
      console.error('Failed to update conversation:', err);
    }
  }

  function formatTime(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            Active
          </Badge>
        );
      case 'closed':
        return (
          <Badge className="bg-white/10 text-white/60 border-white/20">
            <XCircle className="h-3 w-3 mr-1" />
            Closed
          </Badge>
        );
      case 'blocked':
        return (
          <Badge className="bg-red-500/10 text-red-400 border-red-500/20">
            <Ban className="h-3 w-3 mr-1" />
            Blocked
          </Badge>
        );
      default:
        return null;
    }
  }

  function renderMessageContent(message: Message) {
    const content = message.content;

    if (content.text) {
      return <p className="whitespace-pre-wrap">{content.text}</p>;
    }

    if (content.request) {
      return (
        <div className="bg-white/5 rounded-lg p-3">
          <div className="flex items-center gap-2 text-amber-400 text-sm mb-2">
            <Shield className="h-4 w-4" />
            Action Request
          </div>
          <p className="font-mono text-sm">{content.request.action}</p>
          {content.request.params && (
            <pre className="mt-2 text-xs text-white/50 overflow-auto">
              {JSON.stringify(content.request.params, null, 2)}
            </pre>
          )}
        </div>
      );
    }

    if (content.response) {
      return (
        <div
          className={cn(
            'rounded-lg p-3',
            content.response.success ? 'bg-emerald-500/10' : 'bg-red-500/10'
          )}
        >
          <div
            className={cn(
              'flex items-center gap-2 text-sm mb-2',
              content.response.success ? 'text-emerald-400' : 'text-red-400'
            )}
          >
            {content.response.success ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            {content.response.success ? 'Success' : 'Error'}
          </div>
          {content.response.result !== undefined && (
            <pre className="text-xs overflow-auto">
              {JSON.stringify(content.response.result, null, 2)}
            </pre>
          )}
          {content.response.error && (
            <p className="text-sm text-red-400">{content.response.error}</p>
          )}
        </div>
      );
    }

    if (content.data) {
      return (
        <div className="bg-white/5 rounded-lg p-3">
          <div className="text-sm text-white/50 mb-2">Data</div>
          <pre className="text-xs overflow-auto">
            {JSON.stringify(content.data, null, 2)}
          </pre>
        </div>
      );
    }

    return <p className="text-white/50 italic">Empty message</p>;
  }

  // Group messages by date
  function groupMessagesByDate(messages: Message[]) {
    const groups: { date: string; messages: Message[] }[] = [];
    let currentDate = '';

    for (const message of messages) {
      const messageDate = formatDate(message.created_at);
      if (messageDate !== currentDate) {
        currentDate = messageDate;
        groups.push({ date: messageDate, messages: [message] });
      } else {
        groups[groups.length - 1].messages.push(message);
      }
    }

    return groups;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Link
          href="/conversations"
          className="text-white/60 hover:text-white flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Conversations
        </Link>

        <Card>
          <CardContent className="py-12 text-center">
            <XCircle className="h-12 w-12 text-red-400/50 mx-auto mb-4" />
            <p className="text-white/50">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!conversation || loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-white/30" />
      </div>
    );
  }

  const isInitiator = conversation.initiator_credential_id === credentialId;
  const otherAgent = isInitiator
    ? { name: conversation.recipient_name, issuer: conversation.recipient_issuer }
    : { name: conversation.initiator_name, issuer: conversation.initiator_issuer };

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div className="flex items-center gap-4">
          <Link
            href="/conversations"
            className="text-white/60 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
            <Bot className="h-5 w-5 text-white/50" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{otherAgent.name}</span>
              {getStatusBadge(conversation.status)}
            </div>
            <p className="text-sm text-white/50">
              {conversation.subject || otherAgent.issuer}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchMessages(true)}
            className="text-white/60"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {conversation.status === 'active' && (
                <DropdownMenuItem onClick={() => updateConversationStatus('closed')}>
                  <XCircle className="h-4 w-4 mr-2" />
                  Close Conversation
                </DropdownMenuItem>
              )}
              {conversation.status === 'closed' && (
                <DropdownMenuItem onClick={() => updateConversationStatus('active')}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Reopen Conversation
                </DropdownMenuItem>
              )}
              {conversation.status !== 'blocked' && (
                <DropdownMenuItem
                  onClick={() => updateConversationStatus('blocked')}
                  className="text-red-400"
                >
                  <Ban className="h-4 w-4 mr-2" />
                  Block Agent
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-6">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <Bot className="h-12 w-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/40">No messages yet</p>
            <p className="text-sm text-white/30">Send a message to start the conversation</p>
          </div>
        ) : (
          messageGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="space-y-4">
              <div className="flex items-center justify-center">
                <div className="px-3 py-1 bg-white/5 rounded-full text-xs text-white/50">
                  {group.date}
                </div>
              </div>

              {group.messages.map((message) => {
                const isOwnMessage = message.sender_credential_id === credentialId;
                const senderName =
                  message.sender?.agent_name ||
                  (isOwnMessage ? 'You' : otherAgent.name);

                return (
                  <div
                    key={message.id}
                    className={cn(
                      'flex gap-3',
                      isOwnMessage ? 'flex-row-reverse' : 'flex-row'
                    )}
                  >
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                        isOwnMessage ? 'bg-blue-500/20' : 'bg-white/5'
                      )}
                    >
                      <Bot
                        className={cn(
                          'h-4 w-4',
                          isOwnMessage ? 'text-blue-400' : 'text-white/50'
                        )}
                      />
                    </div>

                    <div
                      className={cn(
                        'max-w-[70%] space-y-1',
                        isOwnMessage ? 'items-end' : 'items-start'
                      )}
                    >
                      <div
                        className={cn(
                          'flex items-center gap-2 text-xs',
                          isOwnMessage ? 'flex-row-reverse' : 'flex-row'
                        )}
                      >
                        <span className="text-white/50">{senderName}</span>
                        <span className="text-white/30">
                          {formatTime(message.created_at)}
                        </span>
                        {message.message_type !== 'text' && (
                          <Badge variant="outline" className="text-[10px] py-0">
                            {message.message_type}
                          </Badge>
                        )}
                      </div>

                      <div
                        className={cn(
                          'rounded-2xl px-4 py-2',
                          isOwnMessage
                            ? 'bg-blue-500/20 rounded-tr-sm'
                            : 'bg-white/5 rounded-tl-sm'
                        )}
                      >
                        {renderMessageContent(message)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {conversation.status === 'active' ? (
        <div className="pt-4 border-t border-white/10">
          <div className="flex gap-2">
            <Textarea
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              className="min-h-[44px] max-h-32 resize-none"
              rows={1}
            />
            <Button
              onClick={sendMessage}
              disabled={!newMessage.trim() || sending}
              size="lg"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-white/30 mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      ) : (
        <div className="pt-4 border-t border-white/10">
          <div className="bg-white/5 rounded-lg p-4 text-center">
            <p className="text-white/50">
              This conversation is {conversation.status}. You cannot send messages.
            </p>
            {conversation.status === 'closed' && (
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => updateConversationStatus('active')}
              >
                Reopen Conversation
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
