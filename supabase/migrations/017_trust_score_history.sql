-- =============================================================================
-- Migration 017: Trust Score History Tracking
-- =============================================================================
-- Tracks historical trust score changes for trend analysis and compliance

-- Trust Score History Table
CREATE TABLE trust_score_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credential_id UUID NOT NULL REFERENCES credentials(id) ON DELETE CASCADE,
  trust_score INTEGER NOT NULL CHECK (trust_score >= 0 AND trust_score <= 100),
  verification_score INTEGER NOT NULL CHECK (verification_score >= 0 AND verification_score <= 100),
  longevity_score INTEGER NOT NULL CHECK (longevity_score >= 0 AND longevity_score <= 100),
  activity_score INTEGER NOT NULL CHECK (activity_score >= 0 AND activity_score <= 100),
  issuer_score INTEGER NOT NULL CHECK (issuer_score >= 0 AND issuer_score <= 100),
  change_reason TEXT NOT NULL DEFAULT 'verification',
  change_delta INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for efficient querying
CREATE INDEX idx_trust_history_credential ON trust_score_history(credential_id);
CREATE INDEX idx_trust_history_credential_time ON trust_score_history(credential_id, created_at DESC);
CREATE INDEX idx_trust_history_created ON trust_score_history(created_at DESC);

-- RLS Policies
ALTER TABLE trust_score_history ENABLE ROW LEVEL SECURITY;

-- Allow read access to history for credential owners
CREATE POLICY "Users can view trust history for their credentials"
  ON trust_score_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM credentials c
      JOIN issuers i ON c.issuer_id = i.id
      WHERE c.id = trust_score_history.credential_id
      AND i.user_id = auth.uid()
    )
  );

-- Allow service role to insert history
CREATE POLICY "Service role can insert trust history"
  ON trust_score_history
  FOR INSERT
  WITH CHECK (true);

-- =============================================================================
-- Trigger to log trust score changes
-- =============================================================================

CREATE OR REPLACE FUNCTION log_trust_score_change()
RETURNS TRIGGER AS $$
DECLARE
  v_delta INTEGER;
BEGIN
  -- Only log if trust score actually changed
  IF OLD.trust_score IS DISTINCT FROM NEW.trust_score THEN
    v_delta := COALESCE(NEW.trust_score, 0) - COALESCE(OLD.trust_score, 0);

    INSERT INTO trust_score_history (
      credential_id,
      trust_score,
      verification_score,
      longevity_score,
      activity_score,
      issuer_score,
      change_reason,
      change_delta
    ) VALUES (
      NEW.credential_id,
      COALESCE(NEW.trust_score, 0),
      COALESCE(NEW.verification_score, 0),
      COALESCE(NEW.longevity_score, 0),
      COALESCE(NEW.activity_score, 0),
      COALESCE(NEW.issuer_score, 0),
      'verification',
      v_delta
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on agent_reputation table
CREATE TRIGGER trg_log_trust_score_change
  AFTER UPDATE ON agent_reputation
  FOR EACH ROW
  EXECUTE FUNCTION log_trust_score_change();

-- =============================================================================
-- Function to get trust score history
-- =============================================================================

CREATE OR REPLACE FUNCTION get_trust_score_history(
  p_credential_id UUID,
  p_limit INTEGER DEFAULT 100,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  id UUID,
  trust_score INTEGER,
  verification_score INTEGER,
  longevity_score INTEGER,
  activity_score INTEGER,
  issuer_score INTEGER,
  change_reason TEXT,
  change_delta INTEGER,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    tsh.id,
    tsh.trust_score,
    tsh.verification_score,
    tsh.longevity_score,
    tsh.activity_score,
    tsh.issuer_score,
    tsh.change_reason,
    tsh.change_delta,
    tsh.created_at
  FROM trust_score_history tsh
  WHERE tsh.credential_id = p_credential_id
    AND tsh.created_at >= (now() - (p_days || ' days')::INTERVAL)
  ORDER BY tsh.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- Function to get trust score statistics
-- =============================================================================

CREATE OR REPLACE FUNCTION get_trust_score_stats(
  p_credential_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  min_score INTEGER,
  max_score INTEGER,
  avg_score NUMERIC,
  total_changes BIGINT,
  net_change INTEGER,
  trend TEXT
) AS $$
DECLARE
  v_first_score INTEGER;
  v_last_score INTEGER;
  v_net_change INTEGER;
BEGIN
  -- Get first and last scores in the period
  SELECT trust_score INTO v_first_score
  FROM trust_score_history
  WHERE credential_id = p_credential_id
    AND created_at >= (now() - (p_days || ' days')::INTERVAL)
  ORDER BY created_at ASC
  LIMIT 1;

  SELECT trust_score INTO v_last_score
  FROM trust_score_history
  WHERE credential_id = p_credential_id
    AND created_at >= (now() - (p_days || ' days')::INTERVAL)
  ORDER BY created_at DESC
  LIMIT 1;

  v_net_change := COALESCE(v_last_score, 0) - COALESCE(v_first_score, 0);

  RETURN QUERY
  SELECT
    MIN(tsh.trust_score)::INTEGER,
    MAX(tsh.trust_score)::INTEGER,
    ROUND(AVG(tsh.trust_score), 1),
    COUNT(*)::BIGINT,
    v_net_change,
    CASE
      WHEN v_net_change > 5 THEN 'improving'
      WHEN v_net_change < -5 THEN 'declining'
      ELSE 'stable'
    END
  FROM trust_score_history tsh
  WHERE tsh.credential_id = p_credential_id
    AND tsh.created_at >= (now() - (p_days || ' days')::INTERVAL);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- Log initial scores for existing credentials
-- =============================================================================

INSERT INTO trust_score_history (
  credential_id,
  trust_score,
  verification_score,
  longevity_score,
  activity_score,
  issuer_score,
  change_reason
)
SELECT
  credential_id,
  COALESCE(trust_score, 50),
  COALESCE(verification_score, 50),
  COALESCE(longevity_score, 0),
  COALESCE(activity_score, 0),
  COALESCE(issuer_score, 50),
  'initial'
FROM agent_reputation;

-- Comment for documentation
COMMENT ON TABLE trust_score_history IS 'Historical trust score changes for trend analysis and compliance reporting';
COMMENT ON FUNCTION log_trust_score_change() IS 'Automatically logs trust score changes when agent_reputation is updated';
COMMENT ON FUNCTION get_trust_score_history(UUID, INTEGER, INTEGER) IS 'Returns trust score history for a credential';
COMMENT ON FUNCTION get_trust_score_stats(UUID, INTEGER) IS 'Returns statistics about trust score changes';
