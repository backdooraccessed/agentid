/**
 * Real-time credential revocation subscription
 *
 * Enables instant revocation by subscribing to a WebSocket stream
 * of revocation events, with polling fallback.
 */

import { getGlobalCache } from './cache';
import type { CredentialCache } from './types';

const DEFAULT_API_BASE = 'https://agentid.dev';
const DEFAULT_WS_BASE = 'wss://agentid.dev/ws';

/** Event emitted when a credential is revoked */
export interface RevocationEvent {
  credential_id: string;
  revoked_at: string;
  reason?: string;
}

/** Options for RevocationSubscriber */
export interface RevocationSubscriberOptions {
  /** Base URL for AgentID API (for polling fallback) */
  apiBase?: string;
  /** WebSocket URL for revocation stream */
  wsBase?: string;
  /** Custom cache to clear on revocation */
  cache?: CredentialCache;
  /** Callback when a credential is revoked */
  onRevocation?: (event: RevocationEvent) => void;
  /** Callback on connection state change */
  onConnectionChange?: (connected: boolean) => void;
  /** Callback on error */
  onError?: (error: Error) => void;
  /** Polling interval in ms when WebSocket unavailable (default: 30000) */
  pollInterval?: number;
  /** Max age of revocation check in ms (default: 60000) */
  maxRevocationAge?: number;
  /** Auto-reconnect on disconnect (default: true) */
  autoReconnect?: boolean;
  /** Max reconnection attempts (default: 10) */
  maxReconnectAttempts?: number;
  /** Reconnect backoff multiplier (default: 1.5) */
  reconnectBackoff?: number;
  /** Initial reconnect delay in ms (default: 1000) */
  initialReconnectDelay?: number;
  /** Credential IDs to subscribe to (empty = all) */
  credentialIds?: string[];
}

/** Connection state */
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

/**
 * Subscriber for real-time credential revocations.
 *
 * @example
 * ```typescript
 * const subscriber = new RevocationSubscriber({
 *   onRevocation: (event) => {
 *     console.log(`Credential ${event.credential_id} was revoked`);
 *   }
 * });
 *
 * // Start listening
 * await subscriber.connect();
 *
 * // Later...
 * subscriber.disconnect();
 * ```
 */
export class RevocationSubscriber {
  private readonly apiBase: string;
  private readonly wsBase: string;
  private readonly cache: CredentialCache;
  private readonly onRevocation?: (event: RevocationEvent) => void;
  private readonly onConnectionChange?: (connected: boolean) => void;
  private readonly onError?: (error: Error) => void;
  private readonly pollInterval: number;
  private readonly autoReconnect: boolean;
  private readonly maxReconnectAttempts: number;
  private readonly reconnectBackoff: number;
  private readonly initialReconnectDelay: number;
  private readonly credentialIds: Set<string>;

  private ws: WebSocket | null = null;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private state: ConnectionState = 'disconnected';
  private reconnectAttempts = 0;
  private reconnectDelay: number;
  private lastRevocationCheck = 0;
  private revokedCredentials = new Set<string>();

  constructor(options: RevocationSubscriberOptions = {}) {
    this.apiBase = (options.apiBase ?? DEFAULT_API_BASE).replace(/\/$/, '');
    this.wsBase = (options.wsBase ?? DEFAULT_WS_BASE).replace(/\/$/, '');
    this.cache = options.cache ?? getGlobalCache();
    this.onRevocation = options.onRevocation;
    this.onConnectionChange = options.onConnectionChange;
    this.onError = options.onError;
    this.pollInterval = options.pollInterval ?? 30000;
    this.autoReconnect = options.autoReconnect ?? true;
    this.maxReconnectAttempts = options.maxReconnectAttempts ?? 10;
    this.reconnectBackoff = options.reconnectBackoff ?? 1.5;
    this.initialReconnectDelay = options.initialReconnectDelay ?? 1000;
    this.reconnectDelay = this.initialReconnectDelay;
    this.credentialIds = new Set(options.credentialIds ?? []);
  }

  /**
   * Get current connection state
   */
  get connectionState(): ConnectionState {
    return this.state;
  }

  /**
   * Check if connected (WebSocket or polling)
   */
  get isConnected(): boolean {
    return this.state === 'connected';
  }

  /**
   * Check if a credential is known to be revoked
   */
  isRevoked(credentialId: string): boolean {
    return this.revokedCredentials.has(credentialId);
  }

  /**
   * Connect to the revocation stream
   */
  async connect(): Promise<void> {
    if (this.state !== 'disconnected') {
      return;
    }

    this.setState('connecting');

    // Try WebSocket first
    if (typeof WebSocket !== 'undefined') {
      try {
        await this.connectWebSocket();
        return;
      } catch (error) {
        // WebSocket failed, fall back to polling
        this.handleError(
          error instanceof Error ? error : new Error('WebSocket connection failed')
        );
      }
    }

    // Fall back to polling
    this.startPolling();
  }

  /**
   * Disconnect from the revocation stream
   */
  disconnect(): void {
    this.stopPolling();
    this.closeWebSocket();
    this.clearReconnectTimer();
    this.setState('disconnected');
    this.reconnectAttempts = 0;
    this.reconnectDelay = this.initialReconnectDelay;
  }

  /**
   * Subscribe to a specific credential
   */
  subscribe(credentialId: string): void {
    this.credentialIds.add(credentialId);

    // Send subscription message if connected via WebSocket
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'subscribe',
          credential_id: credentialId,
        })
      );
    }
  }

  /**
   * Unsubscribe from a specific credential
   */
  unsubscribe(credentialId: string): void {
    this.credentialIds.delete(credentialId);

    // Send unsubscription message if connected via WebSocket
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'unsubscribe',
          credential_id: credentialId,
        })
      );
    }
  }

  /**
   * Manually check for revocations (useful with polling)
   */
  async checkRevocations(): Promise<RevocationEvent[]> {
    const events: RevocationEvent[] = [];

    try {
      const url = new URL(`${this.apiBase}/api/revocations`);
      url.searchParams.set('since', String(this.lastRevocationCheck));

      if (this.credentialIds.size > 0) {
        url.searchParams.set('credential_ids', Array.from(this.credentialIds).join(','));
      }

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(`Revocation check failed: ${response.status}`);
      }

      const data = await response.json() as { revocations?: RevocationEvent[] };
      this.lastRevocationCheck = Date.now();

      if (data.revocations && Array.isArray(data.revocations)) {
        for (const revocation of data.revocations as RevocationEvent[]) {
          events.push(revocation);
          this.handleRevocationEvent(revocation);
        }
      }
    } catch (error) {
      this.handleError(
        error instanceof Error ? error : new Error('Revocation check failed')
      );
    }

    return events;
  }

  // Private methods

  private async connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = new URL(`${this.wsBase}/revocations`);

      if (this.credentialIds.size > 0) {
        url.searchParams.set('credential_ids', Array.from(this.credentialIds).join(','));
      }

      const ws = new WebSocket(url.toString());
      let resolved = false;

      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          ws.close();
          reject(new Error('WebSocket connection timeout'));
        }
      }, 10000);

      ws.onopen = () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          this.ws = ws;
          this.setState('connected');
          this.reconnectAttempts = 0;
          this.reconnectDelay = this.initialReconnectDelay;
          resolve();
        }
      };

      ws.onclose = () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          reject(new Error('WebSocket closed'));
        } else {
          this.handleWebSocketClose();
        }
      };

      ws.onerror = () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          reject(new Error('WebSocket error'));
        }
        this.handleError(new Error('WebSocket error'));
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleWebSocketMessage(message);
        } catch (error) {
          this.handleError(new Error('Invalid WebSocket message'));
        }
      };
    });
  }

  private handleWebSocketMessage(message: {
    type: string;
    data?: RevocationEvent;
    error?: string;
  }): void {
    switch (message.type) {
      case 'revocation':
        if (message.data) {
          this.handleRevocationEvent(message.data);
        }
        break;

      case 'ping':
        // Respond to ping
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ type: 'pong' }));
        }
        break;

      case 'error':
        this.handleError(new Error(message.error ?? 'Unknown WebSocket error'));
        break;

      case 'subscribed':
      case 'unsubscribed':
        // Acknowledgment, no action needed
        break;
    }
  }

  private handleWebSocketClose(): void {
    this.ws = null;

    if (this.state === 'disconnected') {
      return;
    }

    if (this.autoReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.scheduleReconnect();
    } else {
      // Fall back to polling
      this.startPolling();
    }
  }

  private scheduleReconnect(): void {
    this.setState('reconnecting');
    this.reconnectAttempts++;

    this.reconnectTimer = setTimeout(async () => {
      try {
        await this.connectWebSocket();
      } catch {
        this.reconnectDelay *= this.reconnectBackoff;
        this.handleWebSocketClose();
      }
    }, this.reconnectDelay);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private closeWebSocket(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private startPolling(): void {
    if (this.pollTimer) {
      return;
    }

    this.setState('connected');

    // Initial check
    this.checkRevocations();

    // Start periodic checks
    this.pollTimer = setInterval(() => {
      this.checkRevocations();
    }, this.pollInterval);
  }

  private stopPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  private handleRevocationEvent(event: RevocationEvent): void {
    // Track revoked credential
    this.revokedCredentials.add(event.credential_id);

    // Clear from cache
    const cacheKey = `verify:${event.credential_id}`;
    this.cache.delete(cacheKey);

    // Also clear credential data cache
    const credCacheKey = `cred:${event.credential_id}`;
    this.cache.delete(credCacheKey);

    // Notify callback
    if (this.onRevocation) {
      try {
        this.onRevocation(event);
      } catch {
        // Ignore callback errors
      }
    }
  }

  private handleError(error: Error): void {
    if (this.onError) {
      try {
        this.onError(error);
      } catch {
        // Ignore callback errors
      }
    }
  }

  private setState(state: ConnectionState): void {
    const wasConnected = this.state === 'connected';
    this.state = state;
    const isNowConnected = state === 'connected';

    if (wasConnected !== isNowConnected && this.onConnectionChange) {
      try {
        this.onConnectionChange(isNowConnected);
      } catch {
        // Ignore callback errors
      }
    }
  }
}

/**
 * Create a verifier with revocation subscription
 *
 * @example
 * ```typescript
 * import { createRevocationAwareVerifier } from '@agentid/sdk';
 *
 * const { verifier, subscriber } = createRevocationAwareVerifier({
 *   onRevocation: (event) => {
 *     console.log(`Credential ${event.credential_id} revoked!`);
 *   }
 * });
 *
 * // Start listening
 * await subscriber.connect();
 *
 * // Verify - will automatically reject revoked credentials
 * const result = await verifier.verifyCredential('cred_xxx');
 * ```
 */
export function createRevocationAwareCache(
  options: RevocationSubscriberOptions = {}
): {
  cache: CredentialCache;
  subscriber: RevocationSubscriber;
} {
  const cache = options.cache ?? getGlobalCache();

  const subscriber = new RevocationSubscriber({
    ...options,
    cache,
  });

  return { cache, subscriber };
}
