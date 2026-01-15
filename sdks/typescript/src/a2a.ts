/**
 * AgentID A2A (Agent-to-Agent) Protocol
 *
 * Enables secure communication between AI agents using their AgentID credentials.
 *
 * @example
 * ```typescript
 * import { A2AClient, AgentCredential } from '@agentid/sdk';
 *
 * const credential = new AgentCredential('cred_xxx');
 * const a2a = new A2AClient({ credential });
 *
 * // Start a conversation
 * const conversationId = await a2a.startConversation({
 *   recipientId: 'cred_yyy',
 *   subject: 'Data request',
 * });
 *
 * // Send a message
 * await a2a.sendMessage({
 *   conversationId,
 *   content: { text: 'Hello!' },
 * });
 *
 * // Request authorization
 * await a2a.requestAuthorization({
 *   grantorId: 'cred_yyy',
 *   permissions: [{ action: 'read', resource: 'user-data' }],
 * });
 * ```
 */

import { DEFAULT_API_BASE } from './credential';
import { generateRequestSignature, generateNonce } from './signature';

/** A2A message types */
export type A2AMessageType =
  | 'text'
  | 'request'
  | 'response'
  | 'authorization'
  | 'data'
  | 'error';

/** A2A conversation status */
export type ConversationStatus = 'active' | 'closed' | 'blocked';

/** A2A authorization status */
export type AuthorizationStatus =
  | 'pending'
  | 'approved'
  | 'denied'
  | 'revoked'
  | 'expired';

/** A2A message content */
export interface A2AMessageContent {
  text?: string;
  data?: unknown;
  request?: {
    action: string;
    params?: Record<string, unknown>;
  };
  response?: {
    success: boolean;
    result?: unknown;
    error?: string;
  };
  authorization?: {
    action: 'request' | 'grant' | 'deny' | 'revoke';
    permissions?: Array<{ action: string; resource?: string }>;
  };
}

/** A2A conversation */
export interface A2AConversation {
  id: string;
  initiatorCredentialId: string;
  recipientCredentialId: string;
  subject?: string;
  status: ConversationStatus;
  encrypted: boolean;
  createdAt: string;
  updatedAt: string;
  lastMessageAt?: string;
  messageCount?: number;
  initiatorName?: string;
  initiatorIssuer?: string;
  recipientName?: string;
  recipientIssuer?: string;
}

/** A2A message */
export interface A2AMessage {
  id: string;
  conversationId: string;
  senderCredentialId: string;
  messageType: A2AMessageType;
  content: A2AMessageContent;
  signature: string;
  signatureTimestamp: number;
  nonce: string;
  replyToId?: string;
  delivered: boolean;
  deliveredAt?: string;
  readAt?: string;
  createdAt: string;
}

/** A2A authorization request */
export interface A2AAuthorizationRequest {
  id: string;
  requesterCredentialId: string;
  grantorCredentialId: string;
  requestedPermissions: Array<{
    action: string;
    resource?: string;
    conditions?: Record<string, unknown>;
  }>;
  scope?: string;
  constraints?: Record<string, unknown>;
  validFrom: string;
  validUntil?: string;
  status: AuthorizationStatus;
  responseMessage?: string;
  respondedAt?: string;
  createdAt: string;
}

/** A2A client options */
export interface A2AClientOptions {
  /** Credential ID of the agent */
  credentialId: string;
  /** API key for authentication */
  apiKey: string;
  /** Signing secret for message signatures */
  signingSecret?: string;
  /** Base URL for AgentID API */
  apiBase?: string;
}

/** Start conversation options */
export interface StartConversationOptions {
  /** Credential ID of the recipient */
  recipientId: string;
  /** Optional subject for the conversation */
  subject?: string;
}

/** Send message options */
export interface SendMessageOptions {
  /** Conversation ID */
  conversationId: string;
  /** Message content */
  content: A2AMessageContent;
  /** Message type (default: 'text') */
  messageType?: A2AMessageType;
  /** ID of message to reply to */
  replyToId?: string;
}

/** Request authorization options */
export interface RequestAuthorizationOptions {
  /** Credential ID of the agent to request authorization from */
  grantorId: string;
  /** Permissions being requested */
  permissions: Array<{
    action: string;
    resource?: string;
    conditions?: Record<string, unknown>;
  }>;
  /** Scope description */
  scope?: string;
  /** Authorization constraints */
  constraints?: Record<string, unknown>;
  /** When the authorization should expire */
  validUntil?: Date;
}

/** Respond to authorization options */
export interface RespondToAuthorizationOptions {
  /** Authorization request ID */
  requestId: string;
  /** Whether to approve the request */
  approved: boolean;
  /** Optional response message */
  message?: string;
}

/**
 * A2A Client for agent-to-agent communication
 */
export class A2AClient {
  private readonly credentialId: string;
  private readonly apiKey: string;
  private readonly apiBase: string;
  private readonly signingSecret?: string;

  constructor(options: A2AClientOptions) {
    this.credentialId = options.credentialId;
    this.apiKey = options.apiKey;
    this.apiBase = (options.apiBase ?? DEFAULT_API_BASE).replace(/\/$/, '');
    this.signingSecret = options.signingSecret;
  }

  /**
   * Sign a data payload
   */
  private async sign(data: string): Promise<string> {
    return generateRequestSignature({
      method: 'POST',
      url: 'a2a-message',
      body: data,
      timestamp: Math.floor(Date.now() / 1000),
      credentialId: this.credentialId,
      secret: this.signingSecret,
    });
  }

  /**
   * Start a new conversation with another agent
   */
  async startConversation(options: StartConversationOptions): Promise<string> {
    const response = await this.fetch('/api/a2a/conversations', {
      method: 'POST',
      body: JSON.stringify({
        initiator_credential_id: this.credentialId,
        recipient_credential_id: options.recipientId,
        subject: options.subject,
      }),
    });

    const data = await response.json() as { conversation_id: string };
    return data.conversation_id;
  }

  /**
   * Get a conversation by ID
   */
  async getConversation(conversationId: string): Promise<A2AConversation | null> {
    const response = await this.fetch(`/api/a2a/conversations/${conversationId}`);

    if (response.status === 404) {
      return null;
    }

    const data = await response.json() as { conversation: Record<string, unknown> };
    return this.transformConversation(data.conversation);
  }

  /**
   * List conversations
   */
  async listConversations(options: {
    status?: ConversationStatus;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ conversations: A2AConversation[]; total: number }> {
    const params = new URLSearchParams();
    params.set('credential_id', this.credentialId);
    if (options.status) params.set('status', options.status);
    if (options.limit !== undefined) params.set('limit', String(options.limit));
    if (options.offset !== undefined) params.set('offset', String(options.offset));

    const response = await this.fetch(`/api/a2a/conversations?${params}`);
    const data = await response.json() as {
      conversations: Record<string, unknown>[];
      total: number;
    };

    return {
      conversations: (data.conversations || []).map((c) => this.transformConversation(c)),
      total: data.total || 0,
    };
  }

  /**
   * Close a conversation
   */
  async closeConversation(conversationId: string): Promise<void> {
    await this.fetch(`/api/a2a/conversations/${conversationId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'closed' }),
    });
  }

  /**
   * Send a message in a conversation
   */
  async sendMessage(options: SendMessageOptions): Promise<string> {
    const content = options.content;
    const nonce = generateNonce();
    const timestamp = Math.floor(Date.now() / 1000);

    // Sign the message content
    const signatureData = JSON.stringify({
      conversation_id: options.conversationId,
      content,
      timestamp,
      nonce,
    });
    const signature = await this.sign(signatureData);

    const response = await this.fetch(
      `/api/a2a/conversations/${options.conversationId}/messages`,
      {
        method: 'POST',
        body: JSON.stringify({
          sender_credential_id: this.credentialId,
          message_type: options.messageType || 'text',
          content,
          signature,
          signature_timestamp: timestamp,
          nonce,
          reply_to_id: options.replyToId,
        }),
      }
    );

    const data = await response.json() as { message_id: string };
    return data.message_id;
  }

  /**
   * Get messages in a conversation
   */
  async getMessages(
    conversationId: string,
    options: {
      limit?: number;
      offset?: number;
      after?: string;
    } = {}
  ): Promise<A2AMessage[]> {
    const params = new URLSearchParams();
    if (options.limit !== undefined) params.set('limit', String(options.limit));
    if (options.offset !== undefined) params.set('offset', String(options.offset));
    if (options.after) params.set('after', options.after);

    const response = await this.fetch(
      `/api/a2a/conversations/${conversationId}/messages?${params}`
    );

    const data = await response.json() as { messages: Record<string, unknown>[] };
    return (data.messages || []).map((m) => this.transformMessage(m));
  }

  /**
   * Request authorization from another agent
   */
  async requestAuthorization(
    options: RequestAuthorizationOptions
  ): Promise<string> {
    const timestamp = Math.floor(Date.now() / 1000);

    // Sign the authorization request
    const signatureData = JSON.stringify({
      grantor_id: options.grantorId,
      permissions: options.permissions,
      scope: options.scope,
      timestamp,
    });
    const signature = await this.sign(signatureData);

    const response = await this.fetch('/api/a2a/authorizations', {
      method: 'POST',
      body: JSON.stringify({
        requester_credential_id: this.credentialId,
        grantor_credential_id: options.grantorId,
        requested_permissions: options.permissions,
        scope: options.scope,
        constraints: options.constraints,
        valid_until: options.validUntil?.toISOString(),
        signature,
      }),
    });

    const data = await response.json() as { authorization_id: string };
    return data.authorization_id;
  }

  /**
   * Respond to an authorization request (as grantor)
   */
  async respondToAuthorization(options: RespondToAuthorizationOptions): Promise<void> {
    const timestamp = Math.floor(Date.now() / 1000);

    // Sign the response
    const signatureData = JSON.stringify({
      request_id: options.requestId,
      approved: options.approved,
      timestamp,
    });
    const signature = await this.sign(signatureData);

    await this.fetch(`/api/a2a/authorizations/${options.requestId}`, {
      method: 'POST',
      body: JSON.stringify({
        grantor_credential_id: this.credentialId,
        approved: options.approved,
        message: options.message,
        signature,
      }),
    });
  }

  /**
   * Get an authorization request by ID
   */
  async getAuthorization(requestId: string): Promise<A2AAuthorizationRequest | null> {
    const response = await this.fetch(`/api/a2a/authorizations/${requestId}`);

    if (response.status === 404) {
      return null;
    }

    const data = await response.json() as { authorization: Record<string, unknown> };
    return this.transformAuthorization(data.authorization);
  }

  /**
   * List authorization requests
   */
  async listAuthorizations(options: {
    role?: 'requester' | 'grantor';
    status?: AuthorizationStatus;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ authorizations: A2AAuthorizationRequest[]; total: number }> {
    const params = new URLSearchParams();
    params.set('credential_id', this.credentialId);
    if (options.role) params.set('role', options.role);
    if (options.status) params.set('status', options.status);
    if (options.limit !== undefined) params.set('limit', String(options.limit));
    if (options.offset !== undefined) params.set('offset', String(options.offset));

    const response = await this.fetch(`/api/a2a/authorizations?${params}`);
    const data = await response.json() as {
      authorizations: Record<string, unknown>[];
      total: number;
    };

    return {
      authorizations: (data.authorizations || []).map((a) =>
        this.transformAuthorization(a)
      ),
      total: data.total || 0,
    };
  }

  /**
   * Revoke a previously granted authorization
   */
  async revokeAuthorization(requestId: string): Promise<void> {
    await this.fetch(`/api/a2a/authorizations/${requestId}`, {
      method: 'PATCH',
      body: JSON.stringify({ action: 'revoke' }),
    });
  }

  /**
   * Check if an agent is authorized for a specific action
   */
  async checkAuthorization(
    requesterId: string,
    permission: string
  ): Promise<{
    authorized: boolean;
    authorizationId?: string;
    constraints?: Record<string, unknown>;
    validUntil?: string;
  }> {
    const response = await this.fetch('/api/a2a/authorizations/check', {
      method: 'POST',
      body: JSON.stringify({
        requester_credential_id: requesterId,
        grantor_credential_id: this.credentialId,
        permission,
      }),
    });

    const data = await response.json() as {
      authorized: boolean;
      authorization_id?: string;
      constraints?: Record<string, unknown>;
      valid_until?: string;
    };

    return {
      authorized: data.authorized,
      authorizationId: data.authorization_id,
      constraints: data.constraints,
      validUntil: data.valid_until,
    };
  }

  private async fetch(path: string, init?: RequestInit): Promise<Response> {
    const response = await globalThis.fetch(`${this.apiBase}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
        ...init?.headers,
      },
    });

    if (!response.ok && response.status !== 404) {
      const error = await response.json().catch(() => ({})) as Record<string, string>;
      throw new Error(error.error || `Request failed: ${response.status}`);
    }

    return response;
  }

  private transformConversation(raw: Record<string, unknown>): A2AConversation {
    return {
      id: raw.id as string,
      initiatorCredentialId: raw.initiator_credential_id as string,
      recipientCredentialId: raw.recipient_credential_id as string,
      subject: raw.subject as string | undefined,
      status: raw.status as ConversationStatus,
      encrypted: raw.encrypted as boolean,
      createdAt: raw.created_at as string,
      updatedAt: raw.updated_at as string,
      lastMessageAt: raw.last_message_at as string | undefined,
      messageCount: raw.message_count as number | undefined,
      initiatorName: raw.initiator_name as string | undefined,
      initiatorIssuer: raw.initiator_issuer as string | undefined,
      recipientName: raw.recipient_name as string | undefined,
      recipientIssuer: raw.recipient_issuer as string | undefined,
    };
  }

  private transformMessage(raw: Record<string, unknown>): A2AMessage {
    return {
      id: raw.id as string,
      conversationId: raw.conversation_id as string,
      senderCredentialId: raw.sender_credential_id as string,
      messageType: raw.message_type as A2AMessageType,
      content: raw.content as A2AMessageContent,
      signature: raw.signature as string,
      signatureTimestamp: raw.signature_timestamp as number,
      nonce: raw.nonce as string,
      replyToId: raw.reply_to_id as string | undefined,
      delivered: raw.delivered as boolean,
      deliveredAt: raw.delivered_at as string | undefined,
      readAt: raw.read_at as string | undefined,
      createdAt: raw.created_at as string,
    };
  }

  private transformAuthorization(raw: Record<string, unknown>): A2AAuthorizationRequest {
    return {
      id: raw.id as string,
      requesterCredentialId: raw.requester_credential_id as string,
      grantorCredentialId: raw.grantor_credential_id as string,
      requestedPermissions: raw.requested_permissions as Array<{
        action: string;
        resource?: string;
        conditions?: Record<string, unknown>;
      }>,
      scope: raw.scope as string | undefined,
      constraints: raw.constraints as Record<string, unknown> | undefined,
      validFrom: raw.valid_from as string,
      validUntil: raw.valid_until as string | undefined,
      status: raw.status as AuthorizationStatus,
      responseMessage: raw.response_message as string | undefined,
      respondedAt: raw.responded_at as string | undefined,
      createdAt: raw.created_at as string,
    };
  }
}

/**
 * Create an A2A client instance
 */
export function createA2AClient(options: A2AClientOptions): A2AClient {
  return new A2AClient(options);
}
