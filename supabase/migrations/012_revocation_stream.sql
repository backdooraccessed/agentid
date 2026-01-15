-- =============================================================================
-- AgentID - Revocation Stream
-- =============================================================================
-- Real-time revocation broadcasting for instant credential invalidation
-- =============================================================================

-- =============================================================================
-- REVOCATIONS_STREAM
-- =============================================================================
-- Stream of revocation events for real-time subscription
-- This table is optimized for real-time subscriptions via Supabase Realtime

CREATE TABLE revocations_stream (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Credential reference
  credential_id UUID NOT NULL REFERENCES credentials(id) ON DELETE CASCADE,

  -- Revocation details
  revoked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reason TEXT,

  -- Who revoked it
  revoked_by UUID REFERENCES auth.users(id),

  -- For efficient polling
  sequence_number BIGSERIAL,

  -- Timestamp for TTL cleanup
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for efficient polling by time
CREATE INDEX idx_revocations_stream_created ON revocations_stream(created_at DESC);
CREATE INDEX idx_revocations_stream_sequence ON revocations_stream(sequence_number DESC);
CREATE INDEX idx_revocations_stream_credential ON revocations_stream(credential_id);

-- Enable Realtime on this table
ALTER PUBLICATION supabase_realtime ADD TABLE revocations_stream;

-- =============================================================================
-- REVOCATION FUNCTION
-- =============================================================================
-- Function to revoke a credential and broadcast the event

CREATE OR REPLACE FUNCTION revoke_credential(
  p_credential_id UUID,
  p_reason TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  revocation_id UUID
) AS $$
DECLARE
  v_revocation_id UUID;
  v_credential RECORD;
BEGIN
  -- Check if credential exists and is active
  SELECT id, status, issuer_id
  INTO v_credential
  FROM credentials
  WHERE id = p_credential_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Credential not found'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  IF v_credential.status = 'revoked' THEN
    RETURN QUERY SELECT false, 'Credential already revoked'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- Verify user has permission to revoke (owns the issuer)
  IF p_user_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM issuers
      WHERE id = v_credential.issuer_id
      AND user_id = p_user_id
    ) THEN
      RETURN QUERY SELECT false, 'Not authorized to revoke this credential'::TEXT, NULL::UUID;
      RETURN;
    END IF;
  END IF;

  -- Update credential status
  UPDATE credentials
  SET
    status = 'revoked',
    revoked_at = now(),
    revocation_reason = p_reason,
    updated_at = now()
  WHERE id = p_credential_id;

  -- Insert into revocations stream (triggers Realtime broadcast)
  INSERT INTO revocations_stream (credential_id, reason, revoked_by)
  VALUES (p_credential_id, p_reason, p_user_id)
  RETURNING id INTO v_revocation_id;

  RETURN QUERY SELECT true, 'Credential revoked successfully'::TEXT, v_revocation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

ALTER TABLE revocations_stream ENABLE ROW LEVEL SECURITY;

-- Anyone can read revocations (for verification)
CREATE POLICY "Anyone can read revocations"
  ON revocations_stream
  FOR SELECT
  USING (true);

-- Only issuers can insert revocations for their credentials
CREATE POLICY "Issuers can revoke their credentials"
  ON revocations_stream
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM credentials c
      JOIN issuers i ON i.id = c.issuer_id
      WHERE c.id = credential_id
      AND i.user_id = auth.uid()
    )
  );

-- =============================================================================
-- CLEANUP FUNCTION
-- =============================================================================
-- Clean up old revocation events (keep last 7 days)

CREATE OR REPLACE FUNCTION cleanup_old_revocations()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM revocations_stream
  WHERE created_at < now() - INTERVAL '7 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- API FUNCTION FOR POLLING
-- =============================================================================
-- Get revocations since a given timestamp or sequence number

CREATE OR REPLACE FUNCTION get_revocations_since(
  p_since_ms BIGINT DEFAULT 0,
  p_credential_ids TEXT[] DEFAULT NULL,
  p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
  credential_id UUID,
  revoked_at TIMESTAMPTZ,
  reason TEXT,
  sequence_number BIGINT
) AS $$
DECLARE
  v_since_ts TIMESTAMPTZ;
BEGIN
  -- Convert milliseconds to timestamp
  v_since_ts := to_timestamp(p_since_ms / 1000.0);

  RETURN QUERY
  SELECT
    rs.credential_id,
    rs.revoked_at,
    rs.reason,
    rs.sequence_number
  FROM revocations_stream rs
  WHERE rs.created_at > v_since_ts
    AND (p_credential_ids IS NULL OR rs.credential_id::TEXT = ANY(p_credential_ids))
  ORDER BY rs.sequence_number DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
