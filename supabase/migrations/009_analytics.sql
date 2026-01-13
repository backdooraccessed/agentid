-- Analytics and Usage Metrics
-- Tracks verification counts, API usage, and activity metrics

-- Daily aggregated analytics for issuers
CREATE TABLE IF NOT EXISTS issuer_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issuer_id UUID NOT NULL REFERENCES issuers(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  -- Credential metrics
  credentials_issued INTEGER NOT NULL DEFAULT 0,
  credentials_revoked INTEGER NOT NULL DEFAULT 0,
  active_credentials INTEGER NOT NULL DEFAULT 0,
  -- Verification metrics
  verifications_total INTEGER NOT NULL DEFAULT 0,
  verifications_successful INTEGER NOT NULL DEFAULT 0,
  verifications_failed INTEGER NOT NULL DEFAULT 0,
  -- API metrics
  api_requests_total INTEGER NOT NULL DEFAULT 0,
  api_requests_by_endpoint JSONB DEFAULT '{}',
  -- Reputation metrics
  avg_agent_trust_score NUMERIC(5,2),
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Unique per issuer per day
  UNIQUE(issuer_id, date)
);

-- Index for time-range queries
CREATE INDEX IF NOT EXISTS idx_analytics_issuer_date ON issuer_analytics(issuer_id, date DESC);

-- Verification event log for real-time tracking
CREATE TABLE IF NOT EXISTS verification_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credential_id UUID REFERENCES credentials(id) ON DELETE SET NULL,
  issuer_id UUID NOT NULL REFERENCES issuers(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  failure_reason TEXT,
  verifier_info JSONB DEFAULT '{}',
  verified_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for recent verifications
CREATE INDEX IF NOT EXISTS idx_verification_events_issuer ON verification_events(issuer_id, verified_at DESC);
CREATE INDEX IF NOT EXISTS idx_verification_events_credential ON verification_events(credential_id, verified_at DESC);

-- Function to update daily analytics
CREATE OR REPLACE FUNCTION update_daily_analytics()
RETURNS TRIGGER AS $$
DECLARE
  today DATE := CURRENT_DATE;
BEGIN
  -- Upsert analytics record for today
  INSERT INTO issuer_analytics (issuer_id, date, verifications_total, verifications_successful, verifications_failed)
  VALUES (
    NEW.issuer_id,
    today,
    1,
    CASE WHEN NEW.success THEN 1 ELSE 0 END,
    CASE WHEN NEW.success THEN 0 ELSE 1 END
  )
  ON CONFLICT (issuer_id, date)
  DO UPDATE SET
    verifications_total = issuer_analytics.verifications_total + 1,
    verifications_successful = issuer_analytics.verifications_successful + (CASE WHEN NEW.success THEN 1 ELSE 0 END),
    verifications_failed = issuer_analytics.verifications_failed + (CASE WHEN NEW.success THEN 0 ELSE 1 END),
    updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_verification_event_update_analytics
  AFTER INSERT ON verification_events
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_analytics();

-- Function to update credential counts
CREATE OR REPLACE FUNCTION update_credential_analytics()
RETURNS TRIGGER AS $$
DECLARE
  today DATE := CURRENT_DATE;
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO issuer_analytics (issuer_id, date, credentials_issued, active_credentials)
    VALUES (NEW.issuer_id, today, 1, 1)
    ON CONFLICT (issuer_id, date)
    DO UPDATE SET
      credentials_issued = issuer_analytics.credentials_issued + 1,
      active_credentials = issuer_analytics.active_credentials + 1,
      updated_at = now();
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'active' AND NEW.status = 'revoked' THEN
    INSERT INTO issuer_analytics (issuer_id, date, credentials_revoked, active_credentials)
    VALUES (NEW.issuer_id, today, 1, -1)
    ON CONFLICT (issuer_id, date)
    DO UPDATE SET
      credentials_revoked = issuer_analytics.credentials_revoked + 1,
      active_credentials = issuer_analytics.active_credentials - 1,
      updated_at = now();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_credential_change_update_analytics
  AFTER INSERT OR UPDATE ON credentials
  FOR EACH ROW
  EXECUTE FUNCTION update_credential_analytics();

-- RLS Policies
ALTER TABLE issuer_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Issuers can read own analytics"
  ON issuer_analytics FOR SELECT
  USING (
    issuer_id IN (
      SELECT id FROM issuers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Issuers can read own verification events"
  ON verification_events FOR SELECT
  USING (
    issuer_id IN (
      SELECT id FROM issuers WHERE user_id = auth.uid()
    )
  );

-- Allow system to insert verification events (public API doesn't have auth)
CREATE POLICY "System can insert verification events"
  ON verification_events FOR INSERT
  WITH CHECK (true);
