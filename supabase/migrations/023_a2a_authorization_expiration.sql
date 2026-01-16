-- =============================================================================
-- A2A Authorization Expiration Handling
-- =============================================================================
-- Adds function to mark expired authorizations and audit fields for revocation
-- =============================================================================

-- Add revocation audit fields to authorization requests
ALTER TABLE a2a_authorization_requests
ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS revocation_reason TEXT,
ADD COLUMN IF NOT EXISTS expired_at TIMESTAMPTZ;

-- Function to expire authorizations that have passed their valid_until date
CREATE OR REPLACE FUNCTION expire_a2a_authorizations()
RETURNS TABLE(
  expired_count INTEGER,
  expired_ids UUID[]
) AS $$
DECLARE
  v_count INTEGER;
  v_ids UUID[];
BEGIN
  -- Mark approved authorizations as expired if past valid_until
  WITH expired AS (
    UPDATE a2a_authorization_requests
    SET
      status = 'expired',
      expired_at = NOW(),
      updated_at = NOW()
    WHERE
      status = 'approved'
      AND valid_until IS NOT NULL
      AND valid_until < NOW()
    RETURNING id
  )
  SELECT ARRAY_AGG(id), COUNT(*)::INTEGER
  INTO v_ids, v_count
  FROM expired;

  RETURN QUERY SELECT COALESCE(v_count, 0), COALESCE(v_ids, ARRAY[]::UUID[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get soon-to-expire authorizations (for notifications)
CREATE OR REPLACE FUNCTION get_expiring_authorizations(
  p_hours_until_expiration INTEGER DEFAULT 24
)
RETURNS TABLE(
  id UUID,
  requester_credential_id UUID,
  grantor_credential_id UUID,
  requested_permissions JSONB,
  valid_until TIMESTAMPTZ,
  hours_remaining NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ar.id,
    ar.requester_credential_id,
    ar.grantor_credential_id,
    ar.requested_permissions,
    ar.valid_until,
    EXTRACT(EPOCH FROM (ar.valid_until - NOW())) / 3600 AS hours_remaining
  FROM a2a_authorization_requests ar
  WHERE
    ar.status = 'approved'
    AND ar.valid_until IS NOT NULL
    AND ar.valid_until > NOW()
    AND ar.valid_until < NOW() + (p_hours_until_expiration || ' hours')::INTERVAL
  ORDER BY ar.valid_until ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Index for efficient expiration queries
CREATE INDEX IF NOT EXISTS idx_a2a_auth_expiration
ON a2a_authorization_requests(valid_until)
WHERE status = 'approved' AND valid_until IS NOT NULL;

-- View for authorization audit log
CREATE OR REPLACE VIEW v_a2a_authorization_audit AS
SELECT
  ar.id,
  ar.requester_credential_id,
  ar.grantor_credential_id,
  rc.agent_name AS requester_agent_name,
  gc.agent_name AS grantor_agent_name,
  ar.requested_permissions,
  ar.status,
  ar.created_at AS requested_at,
  ar.responded_at,
  ar.valid_from,
  ar.valid_until,
  ar.revoked_at,
  ar.revocation_reason,
  ar.expired_at,
  CASE
    WHEN ar.status = 'approved' AND ar.valid_until IS NOT NULL AND ar.valid_until < NOW()
    THEN 'expired (not yet marked)'
    ELSE ar.status
  END AS effective_status
FROM a2a_authorization_requests ar
LEFT JOIN credentials rc ON rc.id = ar.requester_credential_id
LEFT JOIN credentials gc ON gc.id = ar.grantor_credential_id;

-- Grant access to the view
GRANT SELECT ON v_a2a_authorization_audit TO authenticated;
