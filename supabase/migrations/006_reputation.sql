-- =============================================================================
-- AgentID - Reputation System
-- =============================================================================
-- Trust scoring for agents and issuers
-- =============================================================================

-- =============================================================================
-- AGENT REPUTATION
-- =============================================================================
-- Per-credential reputation tracking

CREATE TABLE agent_reputation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity
  agent_id TEXT NOT NULL,
  credential_id UUID NOT NULL REFERENCES credentials(id) ON DELETE CASCADE,
  issuer_id UUID NOT NULL REFERENCES issuers(id) ON DELETE CASCADE,

  -- Composite trust score (0-100)
  trust_score INTEGER NOT NULL DEFAULT 50 CHECK (trust_score >= 0 AND trust_score <= 100),

  -- Component scores (0-100)
  verification_score INTEGER NOT NULL DEFAULT 50 CHECK (verification_score >= 0 AND verification_score <= 100),
  longevity_score INTEGER NOT NULL DEFAULT 0 CHECK (longevity_score >= 0 AND longevity_score <= 100),
  activity_score INTEGER NOT NULL DEFAULT 50 CHECK (activity_score >= 0 AND activity_score <= 100),

  -- Verification statistics
  total_verifications INTEGER NOT NULL DEFAULT 0,
  successful_verifications INTEGER NOT NULL DEFAULT 0,
  failed_verifications INTEGER NOT NULL DEFAULT 0,
  last_verification_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- One reputation record per credential
  UNIQUE(credential_id)
);

-- Indexes
CREATE INDEX idx_agent_reputation_credential ON agent_reputation(credential_id);
CREATE INDEX idx_agent_reputation_issuer ON agent_reputation(issuer_id);
CREATE INDEX idx_agent_reputation_trust ON agent_reputation(trust_score DESC);
CREATE INDEX idx_agent_reputation_agent_id ON agent_reputation(agent_id);

-- Trigger for updated_at
CREATE TRIGGER update_agent_reputation_updated_at
  BEFORE UPDATE ON agent_reputation
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- ISSUER REPUTATION
-- =============================================================================
-- Aggregate reputation for issuers

CREATE TABLE issuer_reputation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity
  issuer_id UUID NOT NULL REFERENCES issuers(id) ON DELETE CASCADE UNIQUE,

  -- Trust score (0-100)
  trust_score INTEGER NOT NULL DEFAULT 50 CHECK (trust_score >= 0 AND trust_score <= 100),

  -- Credential statistics
  total_credentials INTEGER NOT NULL DEFAULT 0,
  active_credentials INTEGER NOT NULL DEFAULT 0,
  revoked_credentials INTEGER NOT NULL DEFAULT 0,
  expired_credentials INTEGER NOT NULL DEFAULT 0,

  -- Verification statistics
  total_verifications INTEGER NOT NULL DEFAULT 0,
  successful_verifications INTEGER NOT NULL DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index
CREATE INDEX idx_issuer_reputation_trust ON issuer_reputation(trust_score DESC);

-- Trigger for updated_at
CREATE TRIGGER update_issuer_reputation_updated_at
  BEFORE UPDATE ON issuer_reputation
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE agent_reputation ENABLE ROW LEVEL SECURITY;
ALTER TABLE issuer_reputation ENABLE ROW LEVEL SECURITY;

-- Agent reputation: public read (for trust queries)
CREATE POLICY "Anyone can read agent reputation"
  ON agent_reputation FOR SELECT
  USING (true);

-- Issuer reputation: public read
CREATE POLICY "Anyone can read issuer reputation"
  ON issuer_reputation FOR SELECT
  USING (true);

-- Service role can manage all reputation data
CREATE POLICY "Service role full access to agent_reputation"
  ON agent_reputation FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to issuer_reputation"
  ON issuer_reputation FOR ALL
  USING (auth.role() = 'service_role');

-- =============================================================================
-- REPUTATION CALCULATION FUNCTIONS
-- =============================================================================

-- Calculate longevity score based on credential age
CREATE OR REPLACE FUNCTION calculate_longevity_score(credential_created_at TIMESTAMPTZ)
RETURNS INTEGER AS $$
DECLARE
  days_active INTEGER;
  score INTEGER;
BEGIN
  days_active := EXTRACT(DAY FROM now() - credential_created_at);

  -- Score increases with age: 0 days = 0, 30 days = 25, 90 days = 50, 180 days = 75, 365+ days = 100
  IF days_active >= 365 THEN
    score := 100;
  ELSIF days_active >= 180 THEN
    score := 75 + (days_active - 180) * 25 / 185;
  ELSIF days_active >= 90 THEN
    score := 50 + (days_active - 90) * 25 / 90;
  ELSIF days_active >= 30 THEN
    score := 25 + (days_active - 30) * 25 / 60;
  ELSE
    score := days_active * 25 / 30;
  END IF;

  RETURN LEAST(100, GREATEST(0, score));
END;
$$ LANGUAGE plpgsql;

-- Calculate verification score based on success rate
CREATE OR REPLACE FUNCTION calculate_verification_score(
  total INTEGER,
  successful INTEGER
) RETURNS INTEGER AS $$
DECLARE
  rate FLOAT;
  base_score INTEGER;
  volume_bonus INTEGER;
BEGIN
  IF total = 0 THEN
    RETURN 50; -- Default score for new credentials
  END IF;

  rate := successful::FLOAT / total;
  base_score := ROUND(rate * 100);

  -- Small volume bonus for active credentials (max 10 points)
  volume_bonus := LEAST(10, total / 10);

  RETURN LEAST(100, GREATEST(0, base_score + volume_bonus));
END;
$$ LANGUAGE plpgsql;

-- Calculate activity score based on recent verifications
CREATE OR REPLACE FUNCTION calculate_activity_score(last_verification TIMESTAMPTZ)
RETURNS INTEGER AS $$
DECLARE
  days_since INTEGER;
  score INTEGER;
BEGIN
  IF last_verification IS NULL THEN
    RETURN 50; -- Default for never-verified credentials
  END IF;

  days_since := EXTRACT(DAY FROM now() - last_verification);

  -- Score decreases with inactivity: 0 days = 100, 7 days = 80, 30 days = 50, 90 days = 25, 180+ days = 10
  IF days_since <= 1 THEN
    score := 100;
  ELSIF days_since <= 7 THEN
    score := 100 - (days_since - 1) * 20 / 6;
  ELSIF days_since <= 30 THEN
    score := 80 - (days_since - 7) * 30 / 23;
  ELSIF days_since <= 90 THEN
    score := 50 - (days_since - 30) * 25 / 60;
  ELSIF days_since <= 180 THEN
    score := 25 - (days_since - 90) * 15 / 90;
  ELSE
    score := 10;
  END IF;

  RETURN LEAST(100, GREATEST(0, score));
END;
$$ LANGUAGE plpgsql;

-- Calculate composite trust score
CREATE OR REPLACE FUNCTION calculate_trust_score(
  verification_score INTEGER,
  longevity_score INTEGER,
  activity_score INTEGER,
  issuer_verified BOOLEAN
) RETURNS INTEGER AS $$
DECLARE
  issuer_bonus INTEGER;
  weighted_score FLOAT;
BEGIN
  -- Weights: verification 30%, longevity 25%, activity 20%, issuer 25%
  issuer_bonus := CASE WHEN issuer_verified THEN 100 ELSE 50 END;

  weighted_score :=
    verification_score * 0.30 +
    longevity_score * 0.25 +
    activity_score * 0.20 +
    issuer_bonus * 0.25;

  RETURN ROUND(weighted_score);
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- INITIALIZATION
-- =============================================================================
-- Create reputation records for existing credentials

INSERT INTO agent_reputation (agent_id, credential_id, issuer_id)
SELECT
  c.agent_id,
  c.id,
  c.issuer_id
FROM credentials c
WHERE c.status = 'active'
ON CONFLICT (credential_id) DO NOTHING;

INSERT INTO issuer_reputation (issuer_id, total_credentials, active_credentials)
SELECT
  i.id,
  COUNT(c.id),
  COUNT(c.id) FILTER (WHERE c.status = 'active')
FROM issuers i
LEFT JOIN credentials c ON c.issuer_id = i.id
GROUP BY i.id
ON CONFLICT (issuer_id) DO UPDATE SET
  total_credentials = EXCLUDED.total_credentials,
  active_credentials = EXCLUDED.active_credentials;
