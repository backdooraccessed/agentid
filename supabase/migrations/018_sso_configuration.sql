-- =============================================================================
-- Migration 018: SSO/SAML Configuration
-- =============================================================================
-- Enterprise SSO support with SAML 2.0 authentication

-- SSO Configuration Table
CREATE TABLE sso_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issuer_id UUID NOT NULL REFERENCES issuers(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'saml',
  name TEXT NOT NULL DEFAULT 'SSO',
  entity_id TEXT NOT NULL,
  sso_url TEXT NOT NULL,
  slo_url TEXT,
  certificate TEXT NOT NULL,
  private_key TEXT,
  attribute_mapping JSONB NOT NULL DEFAULT '{
    "email": "email",
    "firstName": "firstName",
    "lastName": "lastName",
    "role": "role"
  }'::JSONB,
  auto_provision BOOLEAN NOT NULL DEFAULT true,
  default_role TEXT NOT NULL DEFAULT 'member',
  allowed_domains TEXT[] DEFAULT '{}',
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(issuer_id)
);

-- SSO Sessions Table (tracks SAML sessions for logout)
CREATE TABLE sso_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sso_config_id UUID NOT NULL REFERENCES sso_configurations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  saml_name_id TEXT NOT NULL,
  saml_session_index TEXT,
  attributes JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  UNIQUE(sso_config_id, user_id)
);

-- Indexes
CREATE INDEX idx_sso_config_issuer ON sso_configurations(issuer_id);
CREATE INDEX idx_sso_sessions_user ON sso_sessions(user_id);
CREATE INDEX idx_sso_sessions_config ON sso_sessions(sso_config_id);
CREATE INDEX idx_sso_sessions_expires ON sso_sessions(expires_at);

-- RLS Policies
ALTER TABLE sso_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sso_sessions ENABLE ROW LEVEL SECURITY;

-- SSO Configuration policies
CREATE POLICY "Owners can manage SSO configuration"
  ON sso_configurations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM issuers i
      WHERE i.id = sso_configurations.issuer_id
      AND i.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.issuer_id = sso_configurations.issuer_id
      AND tm.user_id = auth.uid()
      AND tm.role IN ('owner', 'admin')
    )
  );

-- SSO Sessions policies
CREATE POLICY "Users can view their own SSO sessions"
  ON sso_sessions
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Service role can manage SSO sessions"
  ON sso_sessions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_sso_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sso_config_updated_at
  BEFORE UPDATE ON sso_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_sso_config_updated_at();

-- Function to clean up expired SSO sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sso_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM sso_sessions
  WHERE expires_at < now();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON TABLE sso_configurations IS 'SAML SSO configuration for enterprise issuers';
COMMENT ON TABLE sso_sessions IS 'Active SSO sessions for SAML logout coordination';
COMMENT ON FUNCTION cleanup_expired_sso_sessions() IS 'Removes expired SSO sessions, can be called periodically';
