/**
 * AgentID Registry - Agent discovery and registration
 */

import { DEFAULT_API_BASE } from './credential';

/** Agent registration options */
export interface AgentRegistrationOptions {
  /** Credential ID of the agent to register */
  credentialId: string;
  /** Display name for the agent */
  displayName: string;
  /** Full description of what the agent does */
  description?: string;
  /** Short description for previews (max 160 chars) */
  shortDescription?: string;
  /** Categories the agent belongs to */
  categories?: string[];
  /** Capabilities the agent has */
  capabilities?: string[];
  /** Tags for search */
  tags?: string[];
  /** API endpoint URL */
  endpointUrl?: string;
  /** Documentation URL */
  documentationUrl?: string;
  /** Support email address */
  supportEmail?: string;
  /** Visibility: public, unlisted, or private */
  visibility?: 'public' | 'unlisted' | 'private';
}

/** Search options for finding agents */
export interface AgentSearchOptions {
  /** Text query to search */
  query?: string;
  /** Filter by categories */
  categories?: string[];
  /** Filter by capabilities */
  capabilities?: string[];
  /** Minimum trust score required */
  minTrustScore?: number;
  /** Only show agents from verified issuers */
  issuerVerified?: boolean;
  /** Number of results to return */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
}

/** Agent profile from registry */
export interface AgentProfile {
  id: string;
  credentialId: string;
  displayName: string;
  shortDescription?: string;
  description?: string;
  logoUrl?: string;
  categories: string[];
  capabilities: string[];
  tags: string[];
  endpointUrl?: string;
  documentationUrl?: string;
  apiSpecUrl?: string;
  supportEmail?: string;
  supportUrl?: string;
  trustScore: number;
  isVerified: boolean;
  isFeatured: boolean;
  verificationCount: number;
  monthlyVerifications: number;
  issuerName: string;
  issuerVerified: boolean;
  createdAt: string;
}

/** Search result item */
export interface AgentSearchResult {
  id: string;
  credentialId: string;
  displayName: string;
  shortDescription?: string;
  categories: string[];
  capabilities: string[];
  tags: string[];
  endpointUrl?: string;
  documentationUrl?: string;
  trustScore: number;
  isVerified: boolean;
  isFeatured: boolean;
  issuerName: string;
  issuerVerified: boolean;
  monthlyVerifications: number;
  createdAt: string;
}

/** Category with agent count */
export interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  agentCount: number;
}

/** Registry options */
export interface RegistryOptions {
  /** Base URL for AgentID API */
  apiBase?: string;
  /** API key for authenticated requests */
  apiKey?: string;
}

/**
 * AgentID Registry client for agent discovery and registration
 */
export class AgentRegistry {
  private apiBase: string;
  private apiKey?: string;

  constructor(options: RegistryOptions = {}) {
    this.apiBase = options.apiBase || DEFAULT_API_BASE;
    this.apiKey = options.apiKey;
  }

  /**
   * Search for agents in the registry
   */
  async search(options: AgentSearchOptions = {}): Promise<{
    agents: AgentSearchResult[];
    total: number;
  }> {
    const params = new URLSearchParams();

    if (options.query) params.set('query', options.query);
    if (options.categories?.length) params.set('categories', options.categories.join(','));
    if (options.capabilities?.length) params.set('capabilities', options.capabilities.join(','));
    if (options.minTrustScore !== undefined) params.set('min_trust_score', options.minTrustScore.toString());
    if (options.issuerVerified !== undefined) params.set('issuer_verified', options.issuerVerified.toString());
    if (options.limit !== undefined) params.set('limit', options.limit.toString());
    if (options.offset !== undefined) params.set('offset', options.offset.toString());

    const response = await fetch(`${this.apiBase}/api/registry?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({})) as Record<string, string>;
      throw new Error(error.error || 'Failed to search agents');
    }

    const data = await response.json() as { agents?: Record<string, unknown>[]; total?: number };
    return {
      agents: (data.agents || []).map(this.transformSearchResult),
      total: data.total || 0,
    };
  }

  /**
   * Get agent profile by credential ID
   */
  async getAgent(credentialId: string): Promise<AgentProfile | null> {
    const response = await fetch(`${this.apiBase}/api/registry/${credentialId}`, {
      headers: this.getHeaders(),
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({})) as Record<string, string>;
      throw new Error(error.error || 'Failed to get agent');
    }

    const data = await response.json() as { agent: Record<string, unknown> };
    return this.transformProfile(data.agent);
  }

  /**
   * Register an agent in the registry (requires authentication)
   */
  async register(options: AgentRegistrationOptions): Promise<{ registryId: string }> {
    if (!this.apiKey) {
      throw new Error('API key required for registration');
    }

    const response = await fetch(`${this.apiBase}/api/registry`, {
      method: 'POST',
      headers: {
        ...this.getHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        credential_id: options.credentialId,
        display_name: options.displayName,
        description: options.description,
        short_description: options.shortDescription,
        categories: options.categories || [],
        capabilities: options.capabilities || [],
        tags: options.tags || [],
        endpoint_url: options.endpointUrl,
        documentation_url: options.documentationUrl,
        support_email: options.supportEmail,
        visibility: options.visibility || 'public',
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({})) as Record<string, string>;
      throw new Error(error.error || 'Failed to register agent');
    }

    const data = await response.json() as { registry_id: string };
    return { registryId: data.registry_id };
  }

  /**
   * Update an agent's registry profile (requires authentication)
   */
  async update(
    registryId: string,
    updates: Partial<Omit<AgentRegistrationOptions, 'credentialId'>>
  ): Promise<void> {
    if (!this.apiKey) {
      throw new Error('API key required for updates');
    }

    const body: Record<string, unknown> = {};
    if (updates.displayName !== undefined) body.display_name = updates.displayName;
    if (updates.description !== undefined) body.description = updates.description;
    if (updates.shortDescription !== undefined) body.short_description = updates.shortDescription;
    if (updates.categories !== undefined) body.categories = updates.categories;
    if (updates.capabilities !== undefined) body.capabilities = updates.capabilities;
    if (updates.tags !== undefined) body.tags = updates.tags;
    if (updates.endpointUrl !== undefined) body.endpoint_url = updates.endpointUrl;
    if (updates.documentationUrl !== undefined) body.documentation_url = updates.documentationUrl;
    if (updates.supportEmail !== undefined) body.support_email = updates.supportEmail;
    if (updates.visibility !== undefined) body.visibility = updates.visibility;

    const response = await fetch(`${this.apiBase}/api/registry/${registryId}`, {
      method: 'PUT',
      headers: {
        ...this.getHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({})) as Record<string, string>;
      throw new Error(error.error || 'Failed to update agent');
    }
  }

  /**
   * Remove an agent from the registry (requires authentication)
   */
  async unregister(registryId: string): Promise<void> {
    if (!this.apiKey) {
      throw new Error('API key required for unregistration');
    }

    const response = await fetch(`${this.apiBase}/api/registry/${registryId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({})) as Record<string, string>;
      throw new Error(error.error || 'Failed to unregister agent');
    }
  }

  /**
   * Get available categories
   */
  async getCategories(): Promise<Category[]> {
    const response = await fetch(`${this.apiBase}/api/registry/categories`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({})) as Record<string, string>;
      throw new Error(error.error || 'Failed to get categories');
    }

    const data = await response.json() as { categories?: Record<string, unknown>[] };
    return (data.categories || []).map((c: Record<string, unknown>) => ({
      id: c.id as string,
      name: c.name as string,
      description: c.description as string | undefined,
      icon: c.icon as string | undefined,
      agentCount: c.agent_count as number,
    }));
  }

  /**
   * Get featured agents
   */
  async getFeatured(): Promise<AgentSearchResult[]> {
    const response = await fetch(`${this.apiBase}/api/registry/featured`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({})) as Record<string, string>;
      throw new Error(error.error || 'Failed to get featured agents');
    }

    const data = await response.json() as { agents?: Record<string, unknown>[] };
    return (data.agents || []).map(this.transformSearchResult);
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }
    return headers;
  }

  private transformSearchResult(raw: Record<string, unknown>): AgentSearchResult {
    return {
      id: raw.id as string,
      credentialId: raw.credential_id as string,
      displayName: raw.display_name as string,
      shortDescription: raw.short_description as string | undefined,
      categories: raw.categories as string[],
      capabilities: raw.capabilities as string[],
      tags: raw.tags as string[],
      endpointUrl: raw.endpoint_url as string | undefined,
      documentationUrl: raw.documentation_url as string | undefined,
      trustScore: raw.trust_score as number,
      isVerified: raw.is_verified as boolean,
      isFeatured: raw.is_featured as boolean,
      issuerName: raw.issuer_name as string,
      issuerVerified: raw.issuer_verified as boolean,
      monthlyVerifications: raw.monthly_verifications as number,
      createdAt: raw.created_at as string,
    };
  }

  private transformProfile(raw: Record<string, unknown>): AgentProfile {
    return {
      id: raw.id as string,
      credentialId: raw.credential_id as string,
      displayName: raw.display_name as string,
      shortDescription: raw.short_description as string | undefined,
      description: raw.description as string | undefined,
      logoUrl: raw.logo_url as string | undefined,
      categories: raw.categories as string[],
      capabilities: raw.capabilities as string[],
      tags: raw.tags as string[],
      endpointUrl: raw.endpoint_url as string | undefined,
      documentationUrl: raw.documentation_url as string | undefined,
      apiSpecUrl: raw.api_spec_url as string | undefined,
      supportEmail: raw.support_email as string | undefined,
      supportUrl: raw.support_url as string | undefined,
      trustScore: raw.trust_score as number,
      isVerified: raw.is_verified as boolean,
      isFeatured: raw.is_featured as boolean,
      verificationCount: raw.verification_count as number,
      monthlyVerifications: raw.monthly_verifications as number,
      issuerName: raw.issuer_name as string,
      issuerVerified: raw.issuer_verified as boolean,
      createdAt: raw.created_at as string,
    };
  }
}

/**
 * Create a registry client instance
 */
export function createRegistry(options: RegistryOptions = {}): AgentRegistry {
  return new AgentRegistry(options);
}
