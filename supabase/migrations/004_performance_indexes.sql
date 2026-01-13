-- Performance indexes for AgentID
-- Optimizes credential lookup and verification queries

-- Index for credential lookups by issuer with status filtering
-- This partial index only includes active credentials, making it smaller and faster
CREATE INDEX IF NOT EXISTS idx_credentials_issuer_status
  ON credentials(issuer_id, status)
  WHERE status = 'active';

-- Index for verification by credential ID (covers the common lookup pattern)
CREATE INDEX IF NOT EXISTS idx_credentials_id_status
  ON credentials(id, status);

-- Index for issuer lookup by user_id (used during credential issuance)
CREATE INDEX IF NOT EXISTS idx_issuers_user_id
  ON issuers(user_id);
