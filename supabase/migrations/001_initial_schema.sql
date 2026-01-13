-- =============================================================================
-- AgentID - Initial Schema
-- =============================================================================
-- Core tables for credential issuance and verification
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- ISSUERS
-- =============================================================================
-- Organizations or individuals who issue credentials to agents

CREATE TABLE issuers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Supabase Auth user ID (for dashboard login)
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Issuer identity
  name TEXT NOT NULL,
  issuer_type TEXT NOT NULL CHECK (issuer_type IN ('individual', 'organization', 'platform')),
  domain TEXT,
  description TEXT,

  -- Verification status (admin-managed)
  is_verified BOOLEAN NOT NULL DEFAULT false,
  verified_at TIMESTAMPTZ,
  verified_by UUID,

  -- Ed25519 key pair (public key stored, private derived from Supabase secrets)
  public_key TEXT NOT NULL,
  key_id TEXT NOT NULL UNIQUE,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(user_id)
);

CREATE INDEX idx_issuers_user ON issuers(user_id);
CREATE INDEX idx_issuers_verified ON issuers(is_verified) WHERE is_verified = true;
CREATE INDEX idx_issuers_key_id ON issuers(key_id);

-- =============================================================================
-- CREDENTIALS
-- =============================================================================
-- Core credential records issued to agents

CREATE TABLE credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Issuer reference
  issuer_id UUID NOT NULL REFERENCES issuers(id) ON DELETE RESTRICT,

  -- Agent identity
  agent_id TEXT NOT NULL,
  agent_name TEXT NOT NULL,
  agent_type TEXT NOT NULL CHECK (agent_type IN ('autonomous', 'supervised', 'hybrid')),

  -- Permissions (JSONB for flexibility)
  permissions JSONB NOT NULL DEFAULT '{
    "actions": [],
    "domains": [],
    "resource_limits": {}
  }'::jsonb,

  -- Constraints
  valid_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_until TIMESTAMPTZ NOT NULL,
  geographic_restrictions TEXT[] DEFAULT ARRAY[]::TEXT[],
  allowed_services TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- Credential status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired', 'suspended')),
  revoked_at TIMESTAMPTZ,
  revocation_reason TEXT,

  -- Cryptographic proof
  signature TEXT NOT NULL,
  signature_algorithm TEXT NOT NULL DEFAULT 'Ed25519',
  key_id TEXT NOT NULL,

  -- Full credential payload (for verification without joins)
  credential_payload JSONB NOT NULL,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Unique constraint: one credential per agent per issuer
  UNIQUE(issuer_id, agent_id)
);

CREATE INDEX idx_credentials_issuer ON credentials(issuer_id);
CREATE INDEX idx_credentials_agent ON credentials(agent_id);
CREATE INDEX idx_credentials_status ON credentials(status);
CREATE INDEX idx_credentials_valid ON credentials(valid_from, valid_until)
  WHERE status = 'active';
CREATE INDEX idx_credentials_created ON credentials(created_at DESC);

-- =============================================================================
-- VERIFICATION_LOGS
-- =============================================================================
-- Audit trail of verification requests (for analytics)

CREATE TABLE verification_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- What was verified
  credential_id UUID REFERENCES credentials(id) ON DELETE SET NULL,
  agent_id TEXT,

  -- Verification result
  is_valid BOOLEAN NOT NULL,
  failure_reason TEXT,

  -- Request metadata
  verifier_ip TEXT,
  verifier_user_agent TEXT,
  request_context JSONB,

  -- Performance
  verification_time_ms INTEGER,

  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_verification_logs_credential ON verification_logs(credential_id);
CREATE INDEX idx_verification_logs_agent ON verification_logs(agent_id);
CREATE INDEX idx_verification_logs_created ON verification_logs(created_at DESC);
CREATE INDEX idx_verification_logs_valid ON verification_logs(is_valid);

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
CREATE TRIGGER update_issuers_updated_at
  BEFORE UPDATE ON issuers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_credentials_updated_at
  BEFORE UPDATE ON credentials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-expire credentials function (can be called via cron)
CREATE OR REPLACE FUNCTION expire_credentials()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE credentials
  SET status = 'expired', updated_at = now()
  WHERE status = 'active' AND valid_until < now();

  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$ language 'plpgsql';

-- Helper function to get issuer_id for current user
CREATE OR REPLACE FUNCTION get_issuer_id_for_user(uid UUID)
RETURNS UUID AS $$
  SELECT id FROM issuers WHERE user_id = uid LIMIT 1;
$$ language 'sql' SECURITY DEFINER;

-- =============================================================================
-- VIEWS
-- =============================================================================

-- Active credentials with issuer info
CREATE VIEW v_active_credentials AS
SELECT
  c.id,
  c.agent_id,
  c.agent_name,
  c.agent_type,
  c.permissions,
  c.valid_from,
  c.valid_until,
  c.status,
  c.created_at,
  i.id as issuer_id,
  i.name as issuer_name,
  i.issuer_type,
  i.is_verified as issuer_verified
FROM credentials c
JOIN issuers i ON i.id = c.issuer_id
WHERE c.status = 'active'
  AND c.valid_from <= now()
  AND c.valid_until > now();

-- Verification stats (last 24h)
CREATE VIEW v_verification_stats AS
SELECT
  COUNT(*) as total_verifications,
  COUNT(*) FILTER (WHERE is_valid = true) as valid_count,
  COUNT(*) FILTER (WHERE is_valid = false) as invalid_count,
  AVG(verification_time_ms) as avg_verification_ms,
  MAX(verification_time_ms) as max_verification_ms
FROM verification_logs
WHERE created_at > now() - interval '24 hours';
