-- API Keys for programmatic access
-- Allows issuers to create API keys for their applications

-- API keys table
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issuer_id UUID NOT NULL REFERENCES issuers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  -- Key hash (we store hash, not the actual key)
  key_hash TEXT NOT NULL UNIQUE,
  -- Key prefix for identification (first 8 chars)
  key_prefix TEXT NOT NULL,
  -- Permissions
  scopes TEXT[] NOT NULL DEFAULT ARRAY['credentials:read', 'credentials:write'],
  -- Rate limiting override (null = use default)
  rate_limit_override INTEGER,
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  -- Usage tracking
  last_used_at TIMESTAMPTZ,
  usage_count INTEGER NOT NULL DEFAULT 0,
  -- Expiration (null = never expires)
  expires_at TIMESTAMPTZ,
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_api_keys_issuer ON api_keys(issuer_id);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_prefix ON api_keys(key_prefix);

-- Update timestamp trigger
CREATE TRIGGER update_api_keys_updated_at
  BEFORE UPDATE ON api_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- API key usage logs (for analytics)
CREATE TABLE api_key_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  response_time_ms INTEGER,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for querying usage
CREATE INDEX idx_api_key_usage_key ON api_key_usage(api_key_id);
CREATE INDEX idx_api_key_usage_created ON api_key_usage(created_at DESC);

-- Partition by month for efficient querying (optional, for high volume)
-- CREATE INDEX idx_api_key_usage_month ON api_key_usage(date_trunc('month', created_at));

-- RLS policies
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_key_usage ENABLE ROW LEVEL SECURITY;

-- Issuers can manage their own API keys
CREATE POLICY "Issuers can view own API keys"
  ON api_keys FOR SELECT
  USING (issuer_id IN (
    SELECT id FROM issuers WHERE user_id = auth.uid()
  ));

CREATE POLICY "Issuers can create own API keys"
  ON api_keys FOR INSERT
  WITH CHECK (issuer_id IN (
    SELECT id FROM issuers WHERE user_id = auth.uid()
  ));

CREATE POLICY "Issuers can update own API keys"
  ON api_keys FOR UPDATE
  USING (issuer_id IN (
    SELECT id FROM issuers WHERE user_id = auth.uid()
  ));

CREATE POLICY "Issuers can delete own API keys"
  ON api_keys FOR DELETE
  USING (issuer_id IN (
    SELECT id FROM issuers WHERE user_id = auth.uid()
  ));

-- Usage logs - issuers can view their own
CREATE POLICY "Issuers can view own API key usage"
  ON api_key_usage FOR SELECT
  USING (api_key_id IN (
    SELECT ak.id FROM api_keys ak
    JOIN issuers i ON ak.issuer_id = i.id
    WHERE i.user_id = auth.uid()
  ));

-- Service role can do everything (for API key validation)
CREATE POLICY "Service role full access to api_keys"
  ON api_keys FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to api_key_usage"
  ON api_key_usage FOR ALL
  USING (auth.role() = 'service_role');

-- Comments
COMMENT ON TABLE api_keys IS 'API keys for programmatic access to AgentID';
COMMENT ON COLUMN api_keys.key_hash IS 'SHA-256 hash of the API key (key itself is only shown once)';
COMMENT ON COLUMN api_keys.key_prefix IS 'First 8 characters of key for identification';
COMMENT ON COLUMN api_keys.scopes IS 'Allowed scopes: credentials:read, credentials:write, webhooks:read, webhooks:write';
