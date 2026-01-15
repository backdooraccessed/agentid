-- Migration: Agent Registry & Discovery
-- Public directory of agents with their capabilities for discovery

-- Agent visibility levels
CREATE TYPE agent_visibility AS ENUM ('public', 'unlisted', 'private');

-- Agent registry entries (linked to credentials)
CREATE TABLE agent_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credential_id UUID NOT NULL UNIQUE REFERENCES credentials(id) ON DELETE CASCADE,
  issuer_id UUID NOT NULL REFERENCES issuers(id) ON DELETE CASCADE,

  -- Public profile
  display_name TEXT NOT NULL,
  description TEXT,
  short_description TEXT, -- For cards/previews (max 160 chars)
  logo_url TEXT,

  -- Categorization
  categories TEXT[] NOT NULL DEFAULT '{}',
  capabilities TEXT[] NOT NULL DEFAULT '{}',
  tags TEXT[] NOT NULL DEFAULT '{}',

  -- How to interact
  endpoint_url TEXT,
  documentation_url TEXT,
  api_spec_url TEXT, -- OpenAPI spec

  -- Contact & support
  support_email TEXT,
  support_url TEXT,

  -- Visibility & status
  visibility agent_visibility NOT NULL DEFAULT 'public',
  is_verified BOOLEAN NOT NULL DEFAULT false, -- Manually verified by AgentID team
  is_featured BOOLEAN NOT NULL DEFAULT false, -- Featured on homepage

  -- Stats (denormalized for performance)
  trust_score INTEGER NOT NULL DEFAULT 50,
  verification_count INTEGER NOT NULL DEFAULT 0,
  monthly_verifications INTEGER NOT NULL DEFAULT 0,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ -- When made public
);

-- Standard categories for agents
CREATE TABLE registry_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT, -- Icon name (e.g., lucide icon)
  parent_id TEXT REFERENCES registry_categories(id),
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default categories
INSERT INTO registry_categories (id, name, description, icon, display_order) VALUES
  ('customer-support', 'Customer Support', 'Agents that handle customer inquiries and support tickets', 'headphones', 1),
  ('data-analysis', 'Data Analysis', 'Agents that analyze and process data', 'bar-chart', 2),
  ('content-creation', 'Content Creation', 'Agents that generate text, images, or other content', 'pen-tool', 3),
  ('code-assistant', 'Code Assistant', 'Agents that help with coding and development', 'code', 4),
  ('research', 'Research', 'Agents that gather and synthesize information', 'search', 5),
  ('automation', 'Automation', 'Agents that automate workflows and tasks', 'zap', 6),
  ('communication', 'Communication', 'Agents that handle emails, messages, and notifications', 'mail', 7),
  ('scheduling', 'Scheduling', 'Agents that manage calendars and appointments', 'calendar', 8),
  ('e-commerce', 'E-Commerce', 'Agents for shopping, orders, and inventory', 'shopping-cart', 9),
  ('finance', 'Finance', 'Agents for financial tasks and analysis', 'dollar-sign', 10),
  ('healthcare', 'Healthcare', 'Agents for health-related tasks', 'heart-pulse', 11),
  ('education', 'Education', 'Agents for learning and education', 'graduation-cap', 12),
  ('legal', 'Legal', 'Agents for legal research and document processing', 'scale', 13),
  ('hr', 'Human Resources', 'Agents for HR and recruitment tasks', 'users', 14),
  ('other', 'Other', 'Other types of agents', 'box', 99);

-- Indexes for efficient searching
CREATE INDEX idx_agent_registry_visibility ON agent_registry(visibility) WHERE visibility = 'public';
CREATE INDEX idx_agent_registry_categories ON agent_registry USING GIN(categories);
CREATE INDEX idx_agent_registry_capabilities ON agent_registry USING GIN(capabilities);
CREATE INDEX idx_agent_registry_tags ON agent_registry USING GIN(tags);
CREATE INDEX idx_agent_registry_trust_score ON agent_registry(trust_score DESC) WHERE visibility = 'public';
CREATE INDEX idx_agent_registry_featured ON agent_registry(is_featured, created_at DESC) WHERE is_featured = true;
CREATE INDEX idx_agent_registry_verified ON agent_registry(is_verified, trust_score DESC) WHERE is_verified = true;
CREATE INDEX idx_agent_registry_issuer ON agent_registry(issuer_id);

-- Full text search: add a column for the search vector
ALTER TABLE agent_registry ADD COLUMN search_vector tsvector;

-- Function to update search vector
CREATE OR REPLACE FUNCTION update_agent_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english',
    coalesce(NEW.display_name, '') || ' ' ||
    coalesce(NEW.description, '') || ' ' ||
    coalesce(array_to_string(NEW.tags, ' '), '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update search vector on insert/update
CREATE TRIGGER trg_agent_registry_search_vector
  BEFORE INSERT OR UPDATE ON agent_registry
  FOR EACH ROW
  EXECUTE FUNCTION update_agent_search_vector();

-- Full text search index
CREATE INDEX idx_agent_registry_search ON agent_registry USING GIN(search_vector);

-- Function to register an agent in the registry
CREATE OR REPLACE FUNCTION register_agent(
  p_credential_id UUID,
  p_display_name TEXT,
  p_description TEXT DEFAULT NULL,
  p_short_description TEXT DEFAULT NULL,
  p_categories TEXT[] DEFAULT '{}',
  p_capabilities TEXT[] DEFAULT '{}',
  p_tags TEXT[] DEFAULT '{}',
  p_endpoint_url TEXT DEFAULT NULL,
  p_documentation_url TEXT DEFAULT NULL,
  p_support_email TEXT DEFAULT NULL,
  p_visibility agent_visibility DEFAULT 'public'
)
RETURNS TABLE(
  registry_id UUID,
  success BOOLEAN,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_credential RECORD;
  v_registry_id UUID;
  v_trust_score INTEGER;
BEGIN
  -- Get credential info
  SELECT c.*, i.id as issuer_id, ar.trust_score as rep_score
  INTO v_credential
  FROM credentials c
  JOIN issuers i ON c.issuer_id = i.id
  LEFT JOIN agent_reputation ar ON c.id = ar.credential_id
  WHERE c.id = p_credential_id;

  IF v_credential IS NULL THEN
    RETURN QUERY SELECT NULL::UUID, false, 'Credential not found'::TEXT;
    RETURN;
  END IF;

  IF v_credential.status != 'active' THEN
    RETURN QUERY SELECT NULL::UUID, false, 'Credential is not active'::TEXT;
    RETURN;
  END IF;

  -- Get trust score
  v_trust_score := COALESCE(v_credential.rep_score, 50);

  -- Upsert registry entry
  INSERT INTO agent_registry (
    credential_id,
    issuer_id,
    display_name,
    description,
    short_description,
    categories,
    capabilities,
    tags,
    endpoint_url,
    documentation_url,
    support_email,
    visibility,
    trust_score,
    published_at
  ) VALUES (
    p_credential_id,
    v_credential.issuer_id,
    p_display_name,
    p_description,
    p_short_description,
    p_categories,
    p_capabilities,
    p_tags,
    p_endpoint_url,
    p_documentation_url,
    p_support_email,
    p_visibility,
    v_trust_score,
    CASE WHEN p_visibility = 'public' THEN now() ELSE NULL END
  )
  ON CONFLICT (credential_id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    short_description = EXCLUDED.short_description,
    categories = EXCLUDED.categories,
    capabilities = EXCLUDED.capabilities,
    tags = EXCLUDED.tags,
    endpoint_url = EXCLUDED.endpoint_url,
    documentation_url = EXCLUDED.documentation_url,
    support_email = EXCLUDED.support_email,
    visibility = EXCLUDED.visibility,
    trust_score = EXCLUDED.trust_score,
    published_at = CASE
      WHEN EXCLUDED.visibility = 'public' AND agent_registry.published_at IS NULL
      THEN now()
      ELSE agent_registry.published_at
    END,
    updated_at = now()
  RETURNING id INTO v_registry_id;

  RETURN QUERY SELECT v_registry_id, true, 'Agent registered successfully'::TEXT;
END;
$$;

-- Function to search agents
CREATE OR REPLACE FUNCTION search_agents(
  p_query TEXT DEFAULT NULL,
  p_categories TEXT[] DEFAULT NULL,
  p_capabilities TEXT[] DEFAULT NULL,
  p_min_trust_score INTEGER DEFAULT NULL,
  p_issuer_verified BOOLEAN DEFAULT NULL,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
  id UUID,
  credential_id UUID,
  display_name TEXT,
  short_description TEXT,
  description TEXT,
  categories TEXT[],
  capabilities TEXT[],
  tags TEXT[],
  endpoint_url TEXT,
  documentation_url TEXT,
  trust_score INTEGER,
  is_verified BOOLEAN,
  is_featured BOOLEAN,
  issuer_name TEXT,
  issuer_verified BOOLEAN,
  monthly_verifications INTEGER,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ar.id,
    ar.credential_id,
    ar.display_name,
    ar.short_description,
    ar.description,
    ar.categories,
    ar.capabilities,
    ar.tags,
    ar.endpoint_url,
    ar.documentation_url,
    ar.trust_score,
    ar.is_verified,
    ar.is_featured,
    i.name as issuer_name,
    i.is_verified as issuer_verified,
    ar.monthly_verifications,
    ar.created_at
  FROM agent_registry ar
  JOIN issuers i ON ar.issuer_id = i.id
  JOIN credentials c ON ar.credential_id = c.id
  WHERE ar.visibility = 'public'
    AND c.status = 'active'
    AND (p_query IS NULL OR to_tsvector('english',
      coalesce(ar.display_name, '') || ' ' ||
      coalesce(ar.description, '') || ' ' ||
      coalesce(array_to_string(ar.tags, ' '), '')
    ) @@ plainto_tsquery('english', p_query))
    AND (p_categories IS NULL OR ar.categories && p_categories)
    AND (p_capabilities IS NULL OR ar.capabilities && p_capabilities)
    AND (p_min_trust_score IS NULL OR ar.trust_score >= p_min_trust_score)
    AND (p_issuer_verified IS NULL OR i.is_verified = p_issuer_verified)
  ORDER BY
    ar.is_featured DESC,
    ar.is_verified DESC,
    ar.trust_score DESC,
    ar.monthly_verifications DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Function to get agent by credential ID (public info)
CREATE OR REPLACE FUNCTION get_agent_profile(p_credential_id UUID)
RETURNS TABLE(
  id UUID,
  credential_id UUID,
  display_name TEXT,
  short_description TEXT,
  description TEXT,
  logo_url TEXT,
  categories TEXT[],
  capabilities TEXT[],
  tags TEXT[],
  endpoint_url TEXT,
  documentation_url TEXT,
  api_spec_url TEXT,
  support_email TEXT,
  support_url TEXT,
  trust_score INTEGER,
  is_verified BOOLEAN,
  is_featured BOOLEAN,
  verification_count INTEGER,
  monthly_verifications INTEGER,
  issuer_name TEXT,
  issuer_verified BOOLEAN,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ar.id,
    ar.credential_id,
    ar.display_name,
    ar.short_description,
    ar.description,
    ar.logo_url,
    ar.categories,
    ar.capabilities,
    ar.tags,
    ar.endpoint_url,
    ar.documentation_url,
    ar.api_spec_url,
    ar.support_email,
    ar.support_url,
    ar.trust_score,
    ar.is_verified,
    ar.is_featured,
    ar.verification_count,
    ar.monthly_verifications,
    i.name as issuer_name,
    i.is_verified as issuer_verified,
    ar.created_at
  FROM agent_registry ar
  JOIN issuers i ON ar.issuer_id = i.id
  JOIN credentials c ON ar.credential_id = c.id
  WHERE ar.credential_id = p_credential_id
    AND ar.visibility = 'public'
    AND c.status = 'active';
END;
$$;

-- Trigger to sync trust score from reputation
CREATE OR REPLACE FUNCTION sync_registry_trust_score()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE agent_registry
  SET trust_score = NEW.trust_score, updated_at = now()
  WHERE credential_id = NEW.credential_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_registry_trust_score
  AFTER INSERT OR UPDATE OF trust_score ON agent_reputation
  FOR EACH ROW
  EXECUTE FUNCTION sync_registry_trust_score();

-- Trigger to update verification counts periodically (could also be a cron job)
CREATE OR REPLACE FUNCTION update_registry_verification_counts()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE agent_registry ar
  SET
    verification_count = COALESCE(counts.total, 0),
    monthly_verifications = COALESCE(counts.monthly, 0),
    updated_at = now()
  FROM (
    SELECT
      credential_id,
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE created_at >= now() - interval '30 days') as monthly
    FROM verification_logs
    WHERE is_valid = true
    GROUP BY credential_id
  ) counts
  WHERE ar.credential_id = counts.credential_id;
END;
$$;

-- RLS Policies
ALTER TABLE agent_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE registry_categories ENABLE ROW LEVEL SECURITY;

-- Public can view public agents
CREATE POLICY agent_registry_public_select ON agent_registry
  FOR SELECT USING (visibility = 'public');

-- Issuers can manage their own agents
CREATE POLICY agent_registry_issuer_all ON agent_registry
  FOR ALL USING (
    issuer_id IN (SELECT id FROM issuers WHERE user_id = auth.uid())
  );

-- Categories are public read
CREATE POLICY registry_categories_public ON registry_categories
  FOR SELECT USING (true);

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION register_agent TO authenticated;
GRANT EXECUTE ON FUNCTION search_agents TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_agent_profile TO anon, authenticated;
GRANT EXECUTE ON FUNCTION update_registry_verification_counts TO authenticated;

-- View for featured agents (homepage)
CREATE VIEW v_featured_agents AS
SELECT
  ar.id,
  ar.credential_id,
  ar.display_name,
  ar.short_description,
  ar.logo_url,
  ar.categories,
  ar.capabilities,
  ar.trust_score,
  ar.is_verified,
  ar.monthly_verifications,
  i.name as issuer_name,
  i.is_verified as issuer_verified
FROM agent_registry ar
JOIN issuers i ON ar.issuer_id = i.id
JOIN credentials c ON ar.credential_id = c.id
WHERE ar.visibility = 'public'
  AND ar.is_featured = true
  AND c.status = 'active'
ORDER BY ar.trust_score DESC
LIMIT 12;

-- View for category stats
CREATE VIEW v_category_stats AS
SELECT
  rc.id,
  rc.name,
  rc.description,
  rc.icon,
  COUNT(ar.id) as agent_count
FROM registry_categories rc
LEFT JOIN agent_registry ar ON rc.id = ANY(ar.categories) AND ar.visibility = 'public'
LEFT JOIN credentials c ON ar.credential_id = c.id AND c.status = 'active'
GROUP BY rc.id, rc.name, rc.description, rc.icon
ORDER BY rc.display_order;

GRANT SELECT ON v_featured_agents TO anon, authenticated;
GRANT SELECT ON v_category_stats TO anon, authenticated;

COMMENT ON TABLE agent_registry IS 'Public directory of registered agents for discovery';
COMMENT ON TABLE registry_categories IS 'Standard categories for agent classification';
COMMENT ON FUNCTION register_agent IS 'Register or update an agent in the public registry';
COMMENT ON FUNCTION search_agents IS 'Search for agents by query, categories, or capabilities';
COMMENT ON FUNCTION get_agent_profile IS 'Get public profile of a registered agent';
