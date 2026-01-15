'use client';

import { useState, useEffect, useRef, use } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Bot,
  MoreVertical,
  XCircle,
  CheckCircle,
  Ban,
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
          <Badge className="bg-emerald-100 text-emerald-700 border-2 border-emerald-700 font-retro uppercase">
            <CheckCircle className="h-3 w-3 mr-1" />
            Active
          </Badge>
        );
      case 'closed':
        return (
          <Badge className="bg-gray-100 text-gray-600 border-2 border-gray-600 font-retro uppercase">
            <XCircle className="h-3 w-3 mr-1" />
            Closed
          </Badge>
        );
      case 'blocked':
        return (
          <Badge className="bg-red-100 text-red-700 border-2 border-red-700 font-retro uppercase">
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
      return <p className="whitespace-pre-wrap font-retro">{content.text}</p>;
    }

    if (content.request) {
      return (
        <div className="bg-amber-50 border-2 border-amber-600 p-3">
          <div className="flex items-center gap-2 text-amber-700 text-sm mb-2 font-retro uppercase">
            <Shield className="h-4 w-4" />
            Action Request
          </div>
          <p className="font-mono text-sm text-black">{content.request.action}</p>
          {content.request.params && (
            <pre className="mt-2 text-xs text-gray-600 overflow-auto font-mono">
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
            'p-3 border-2',
            content.response.success
              ? 'bg-emerald-50 border-emerald-600'
              : 'bg-red-50 border-red-600'
          )}
        >
          <div
            className={cn(
              'flex items-center gap-2 text-sm mb-2 font-retro uppercase',
              content.response.success ? 'text-emerald-700' : 'text-red-700'
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
            <pre className="text-xs overflow-auto font-mono text-black">
              {JSON.stringify(content.response.result, null, 2)}
            </pre>
          )}
          {content.response.error && (
            <p className="text-sm text-red-700 font-retro">{content.response.error}</p>
          )}
        </div>
      );
    }

    if (content.data) {
      return (
        <div className="bg-gray-50 border-2 border-gray-300 p-3">
          <div className="text-sm text-gray-600 mb-2 font-retro uppercase">Data</div>
          <pre className="text-xs overflow-auto font-mono text-black">
            {JSON.stringify(content.data, null, 2)}
          </pre>
        </div>
      );
    }

    return <p className="text-gray-500 italic font-retro">Empty message</p>;
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
          className="text-gray-600 hover:text-black flex items-center gap-2 font-retro"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Conversations
        </Link>

        <div className="border-4 border-black bg-white p-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="py-12 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600 font-retro">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!conversation || loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
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
      <div className="flex items-center justify-between pb-4 border-b-4 border-black">
        <div className="flex items-center gap-4">
          <Link
            href="/conversations"
            className="text-gray-600 hover:text-black"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="w-10 h-10 bg-gray-100 border-2 border-black flex items-center justify-center">
            <Bot className="h-5 w-5 text-gray-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-pixel text-black uppercase">{otherAgent.name}</span>
              {getStatusBadge(conversation.status)}
            </div>
            <p className="text-sm text-gray-600 font-retro">
              {conversation.subject || otherAgent.issuer}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchMessages(true)}
            className="text-gray-600 hover:text-black hover:bg-gray-100 font-retro"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="hover:bg-gray-100">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="border-2 border-black bg-white">
              {conversation.status === 'active' && (
                <DropdownMenuItem
                  onClick={() => updateConversationStatus('closed')}
                  className="font-retro"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Close Conversation
                </DropdownMenuItem>
              )}
              {conversation.status === 'closed' && (
                <DropdownMenuItem
                  onClick={() => updateConversationStatus('active')}
                  className="font-retro"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Reopen Conversation
                </DropdownMenuItem>
              )}
              {conversation.status !== 'blocked' && (
                <DropdownMenuItem
                  onClick={() => updateConversationStatus('blocked')}
                  className="text-red-600 font-retro"
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
            <Bot className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-retro">No messages yet</p>
            <p className="text-sm text-gray-400 font-retro">Send a message to start the conversation</p>
          </div>
        ) : (
          messageGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="space-y-4">
              <div className="flex items-center justify-center">
                <div className="px-3 py-1 bg-gray-100 border-2 border-gray-300 text-xs text-gray-600 font-retro uppercase">
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
                        'w-8 h-8 flex items-center justify-center flex-shrink-0 border-2 border-black',
                        isOwnMessage ? 'bg-blue-100' : 'bg-gray-100'
                      )}
                    >
                      <Bot
                        className={cn(
                          'h-4 w-4',
                          isOwnMessage ? 'text-blue-600' : 'text-gray-600'
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
                        <span className="text-gray-600 font-retro">{senderName}</span>
                        <span className="text-gray-400 font-retro">
                          {formatTime(message.created_at)}
                        </span>
                        {message.message_type !== 'text' && (
                          <Badge variant="outline" className="text-[10px] py-0 border-2 border-black font-retro uppercase">
                            {message.message_type}
                          </Badge>
                        )}
                      </div>

                      <div
                        className={cn(
                          'px-4 py-2 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]',
                          isOwnMessage
                            ? 'bg-blue-100'
                            : 'bg-white'
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
        <div className="pt-4 border-t-4 border-black">
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
              className="min-h-[44px] max-h-32 resize-none border-2 border-black bg-white font-retro focus:ring-0 focus:border-black"
              rows={1}
            />
            <Button
              onClick={sendMessage}
              disabled={!newMessage.trim() || sending}
              size="lg"
              className="bg-black text-white hover:bg-gray-800 font-retro uppercase border-2 border-black disabled:opacity-50"
            >
              {sending ? (
                <div className="w-4 h-4 border-2 border-gray-300 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2 font-retro">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      ) : (
        <div className="pt-4 border-t-4 border-black">
          <div className="bg-gray-50 border-2 border-gray-300 p-4 text-center">
            <p className="text-gray-600 font-retro">
              This conversation is {conversation.status}. You cannot send messages.
            </p>
            {conversation.status === 'closed' && (
              <Button
                variant="outline"
                size="sm"
                className="mt-2 bg-black text-white hover:bg-gray-800 font-retro uppercase border-2 border-black"
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
