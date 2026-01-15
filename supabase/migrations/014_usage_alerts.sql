-- Migration: Usage Alerts & Anomaly Detection
-- This enables issuers to configure alerts for unusual agent behavior

-- Alert rule types
CREATE TYPE alert_rule_type AS ENUM (
  'verification_failed',  -- Alert when verifications fail
  'geo_anomaly',          -- Alert when used from unexpected location
  'usage_spike',          -- Alert when usage pattern changes dramatically
  'permission_denied',    -- Alert when permission violations attempted
  'credential_expiring',  -- Alert before credential expires
  'trust_score_drop'      -- Alert when trust score decreases
);

-- Alert severity levels
CREATE TYPE alert_severity AS ENUM ('low', 'medium', 'high', 'critical');

-- Alert status
CREATE TYPE alert_status AS ENUM ('triggered', 'acknowledged', 'resolved', 'dismissed');

-- Alert rules configuration
CREATE TABLE alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issuer_id UUID NOT NULL REFERENCES issuers(id) ON DELETE CASCADE,
  credential_id UUID REFERENCES credentials(id) ON DELETE CASCADE, -- NULL = applies to all issuer's credentials

  name TEXT NOT NULL,
  description TEXT,
  rule_type alert_rule_type NOT NULL,
  severity alert_severity NOT NULL DEFAULT 'medium',

  -- Rule configuration (varies by type)
  config JSONB NOT NULL DEFAULT '{}',
  -- verification_failed: { "threshold": 3, "window_minutes": 60 }
  -- geo_anomaly: { "expected_regions": ["US", "EU"], "alert_on_new": true }
  -- usage_spike: { "threshold_multiplier": 5, "baseline_window_hours": 24 }
  -- permission_denied: { "threshold": 1 } -- alert on any denial by default
  -- credential_expiring: { "days_before": 7 }
  -- trust_score_drop: { "threshold_points": 10 }

  -- Notification settings
  notify_webhook TEXT,
  notify_email TEXT,
  notify_in_dashboard BOOLEAN NOT NULL DEFAULT true,

  -- Cooldown to prevent alert spam
  cooldown_minutes INTEGER NOT NULL DEFAULT 60,
  last_triggered_at TIMESTAMPTZ,

  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for looking up rules by issuer/credential
CREATE INDEX idx_alert_rules_issuer ON alert_rules(issuer_id) WHERE is_active = true;
CREATE INDEX idx_alert_rules_credential ON alert_rules(credential_id) WHERE credential_id IS NOT NULL AND is_active = true;
CREATE INDEX idx_alert_rules_type ON alert_rules(rule_type) WHERE is_active = true;

-- Triggered alert events
CREATE TABLE alert_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_rule_id UUID NOT NULL REFERENCES alert_rules(id) ON DELETE CASCADE,
  issuer_id UUID NOT NULL REFERENCES issuers(id) ON DELETE CASCADE,
  credential_id UUID REFERENCES credentials(id) ON DELETE SET NULL,

  severity alert_severity NOT NULL,
  status alert_status NOT NULL DEFAULT 'triggered',

  -- Event details
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  event_data JSONB NOT NULL DEFAULT '{}',
  -- Contains context like: { "failed_count": 5, "window": "1h", "locations": ["CN", "RU"] }

  -- Resolution tracking
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  resolution_note TEXT,

  -- Notification tracking
  webhook_sent_at TIMESTAMPTZ,
  webhook_response_code INTEGER,
  email_sent_at TIMESTAMPTZ,

  triggered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for querying alerts
CREATE INDEX idx_alert_events_issuer ON alert_events(issuer_id, triggered_at DESC);
CREATE INDEX idx_alert_events_credential ON alert_events(credential_id, triggered_at DESC) WHERE credential_id IS NOT NULL;
CREATE INDEX idx_alert_events_status ON alert_events(issuer_id, status) WHERE status = 'triggered';
CREATE INDEX idx_alert_events_severity ON alert_events(issuer_id, severity, triggered_at DESC);

-- Usage metrics for anomaly detection (hourly aggregates)
CREATE TABLE usage_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credential_id UUID NOT NULL REFERENCES credentials(id) ON DELETE CASCADE,

  -- Time bucket (hourly)
  bucket_hour TIMESTAMPTZ NOT NULL,

  -- Metrics
  verification_count INTEGER NOT NULL DEFAULT 0,
  verification_success_count INTEGER NOT NULL DEFAULT 0,
  verification_failure_count INTEGER NOT NULL DEFAULT 0,
  permission_denied_count INTEGER NOT NULL DEFAULT 0,

  -- Geographic distribution
  regions JSONB NOT NULL DEFAULT '{}', -- { "US": 10, "EU": 5, "CN": 2 }

  -- Timing stats
  avg_verification_time_ms INTEGER,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(credential_id, bucket_hour)
);

-- Index for querying metrics
CREATE INDEX idx_usage_metrics_credential ON usage_metrics(credential_id, bucket_hour DESC);

-- Function to record a usage metric (upsert into hourly bucket)
CREATE OR REPLACE FUNCTION record_usage_metric(
  p_credential_id UUID,
  p_success BOOLEAN,
  p_permission_denied BOOLEAN DEFAULT false,
  p_region TEXT DEFAULT NULL,
  p_verification_time_ms INTEGER DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_bucket_hour TIMESTAMPTZ;
  v_regions JSONB;
BEGIN
  -- Get current hour bucket
  v_bucket_hour := date_trunc('hour', now());

  -- Build regions update
  IF p_region IS NOT NULL THEN
    v_regions := jsonb_build_object(p_region, 1);
  ELSE
    v_regions := '{}'::jsonb;
  END IF;

  -- Upsert metric
  INSERT INTO usage_metrics (
    credential_id,
    bucket_hour,
    verification_count,
    verification_success_count,
    verification_failure_count,
    permission_denied_count,
    regions,
    avg_verification_time_ms
  ) VALUES (
    p_credential_id,
    v_bucket_hour,
    1,
    CASE WHEN p_success THEN 1 ELSE 0 END,
    CASE WHEN NOT p_success THEN 1 ELSE 0 END,
    CASE WHEN p_permission_denied THEN 1 ELSE 0 END,
    v_regions,
    p_verification_time_ms
  )
  ON CONFLICT (credential_id, bucket_hour) DO UPDATE SET
    verification_count = usage_metrics.verification_count + 1,
    verification_success_count = usage_metrics.verification_success_count + CASE WHEN p_success THEN 1 ELSE 0 END,
    verification_failure_count = usage_metrics.verification_failure_count + CASE WHEN NOT p_success THEN 1 ELSE 0 END,
    permission_denied_count = usage_metrics.permission_denied_count + CASE WHEN p_permission_denied THEN 1 ELSE 0 END,
    regions = CASE
      WHEN p_region IS NOT NULL THEN
        usage_metrics.regions || jsonb_build_object(
          p_region,
          COALESCE((usage_metrics.regions->>p_region)::integer, 0) + 1
        )
      ELSE usage_metrics.regions
    END,
    avg_verification_time_ms = CASE
      WHEN p_verification_time_ms IS NOT NULL THEN
        ((COALESCE(usage_metrics.avg_verification_time_ms, 0) * usage_metrics.verification_count) + p_verification_time_ms)
        / (usage_metrics.verification_count + 1)
      ELSE usage_metrics.avg_verification_time_ms
    END;
END;
$$;

-- Function to check and trigger alerts after verification
CREATE OR REPLACE FUNCTION check_verification_alerts(
  p_credential_id UUID,
  p_success BOOLEAN,
  p_failure_reason TEXT DEFAULT NULL,
  p_region TEXT DEFAULT NULL
)
RETURNS TABLE(
  alert_triggered BOOLEAN,
  alert_event_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_rule RECORD;
  v_credential RECORD;
  v_event_id UUID;
  v_triggered BOOLEAN := false;
  v_should_trigger BOOLEAN;
  v_title TEXT;
  v_message TEXT;
  v_event_data JSONB;
  v_window_start TIMESTAMPTZ;
  v_failure_count INTEGER;
  v_baseline_avg NUMERIC;
  v_current_count INTEGER;
BEGIN
  -- Get credential info
  SELECT c.*, i.id as issuer_id
  INTO v_credential
  FROM credentials c
  JOIN issuers i ON c.issuer_id = i.id
  WHERE c.id = p_credential_id;

  IF v_credential IS NULL THEN
    RETURN QUERY SELECT false, NULL::UUID;
    RETURN;
  END IF;

  -- Check all active rules for this credential/issuer
  FOR v_rule IN
    SELECT * FROM alert_rules
    WHERE is_active = true
      AND issuer_id = v_credential.issuer_id
      AND (credential_id IS NULL OR credential_id = p_credential_id)
      AND (last_triggered_at IS NULL OR last_triggered_at < now() - (cooldown_minutes || ' minutes')::interval)
  LOOP
    v_should_trigger := false;
    v_title := NULL;
    v_message := NULL;
    v_event_data := '{}';

    CASE v_rule.rule_type
      -- Verification Failed Alert
      WHEN 'verification_failed' THEN
        IF NOT p_success THEN
          v_window_start := now() - ((COALESCE((v_rule.config->>'window_minutes')::integer, 60)) || ' minutes')::interval;

          SELECT COUNT(*) INTO v_failure_count
          FROM verification_logs
          WHERE credential_id = p_credential_id
            AND is_valid = false
            AND created_at >= v_window_start;

          IF v_failure_count >= COALESCE((v_rule.config->>'threshold')::integer, 3) THEN
            v_should_trigger := true;
            v_title := 'High Verification Failure Rate';
            v_message := format('%s verification failures in the last %s minutes for %s',
              v_failure_count,
              COALESCE((v_rule.config->>'window_minutes')::integer, 60),
              v_credential.agent_name
            );
            v_event_data := jsonb_build_object(
              'failure_count', v_failure_count,
              'window_minutes', COALESCE((v_rule.config->>'window_minutes')::integer, 60),
              'last_failure_reason', p_failure_reason
            );
          END IF;
        END IF;

      -- Geo Anomaly Alert
      WHEN 'geo_anomaly' THEN
        IF p_region IS NOT NULL THEN
          DECLARE
            v_expected_regions TEXT[];
            v_known_regions TEXT[];
          BEGIN
            v_expected_regions := ARRAY(SELECT jsonb_array_elements_text(v_rule.config->'expected_regions'));

            -- Check if region is unexpected
            IF array_length(v_expected_regions, 1) > 0 AND NOT p_region = ANY(v_expected_regions) THEN
              -- Check if this is truly new (not seen in last 7 days)
              IF COALESCE((v_rule.config->>'alert_on_new')::boolean, true) THEN
                SELECT ARRAY_AGG(DISTINCT region) INTO v_known_regions
                FROM (
                  SELECT jsonb_object_keys(regions) as region
                  FROM usage_metrics
                  WHERE credential_id = p_credential_id
                    AND bucket_hour >= now() - interval '7 days'
                ) r;

                IF v_known_regions IS NULL OR NOT p_region = ANY(v_known_regions) THEN
                  v_should_trigger := true;
                  v_title := 'Geographic Anomaly Detected';
                  v_message := format('Verification from unexpected region %s for %s (expected: %s)',
                    p_region,
                    v_credential.agent_name,
                    array_to_string(v_expected_regions, ', ')
                  );
                  v_event_data := jsonb_build_object(
                    'detected_region', p_region,
                    'expected_regions', v_expected_regions
                  );
                END IF;
              ELSE
                v_should_trigger := true;
                v_title := 'Geographic Anomaly Detected';
                v_message := format('Verification from unexpected region %s for %s', p_region, v_credential.agent_name);
                v_event_data := jsonb_build_object(
                  'detected_region', p_region,
                  'expected_regions', v_expected_regions
                );
              END IF;
            END IF;
          END;
        END IF;

      -- Usage Spike Alert
      WHEN 'usage_spike' THEN
        DECLARE
          v_baseline_hours INTEGER;
          v_multiplier NUMERIC;
        BEGIN
          v_baseline_hours := COALESCE((v_rule.config->>'baseline_window_hours')::integer, 24);
          v_multiplier := COALESCE((v_rule.config->>'threshold_multiplier')::numeric, 5);

          -- Get baseline average (hourly)
          SELECT AVG(verification_count) INTO v_baseline_avg
          FROM usage_metrics
          WHERE credential_id = p_credential_id
            AND bucket_hour >= now() - (v_baseline_hours || ' hours')::interval
            AND bucket_hour < date_trunc('hour', now());

          -- Get current hour count
          SELECT verification_count INTO v_current_count
          FROM usage_metrics
          WHERE credential_id = p_credential_id
            AND bucket_hour = date_trunc('hour', now());

          -- Check for spike
          IF v_baseline_avg IS NOT NULL AND v_baseline_avg > 0
             AND v_current_count IS NOT NULL
             AND v_current_count > v_baseline_avg * v_multiplier THEN
            v_should_trigger := true;
            v_title := 'Usage Spike Detected';
            v_message := format('Unusual usage spike for %s: %s verifications this hour (baseline: %s)',
              v_credential.agent_name,
              v_current_count,
              ROUND(v_baseline_avg)
            );
            v_event_data := jsonb_build_object(
              'current_count', v_current_count,
              'baseline_avg', ROUND(v_baseline_avg),
              'multiplier', ROUND(v_current_count::numeric / v_baseline_avg, 2)
            );
          END IF;
        END;

      -- Permission Denied Alert
      WHEN 'permission_denied' THEN
        IF p_failure_reason ILIKE '%permission%' OR p_failure_reason ILIKE '%unauthorized%' THEN
          v_should_trigger := true;
          v_title := 'Permission Violation Attempted';
          v_message := format('Permission denied for %s: %s', v_credential.agent_name, p_failure_reason);
          v_event_data := jsonb_build_object('failure_reason', p_failure_reason);
        END IF;

      ELSE
        -- Other rule types handled elsewhere
        NULL;
    END CASE;

    -- Trigger alert if conditions met
    IF v_should_trigger THEN
      INSERT INTO alert_events (
        alert_rule_id,
        issuer_id,
        credential_id,
        severity,
        title,
        message,
        event_data
      ) VALUES (
        v_rule.id,
        v_credential.issuer_id,
        p_credential_id,
        v_rule.severity,
        v_title,
        v_message,
        v_event_data
      )
      RETURNING id INTO v_event_id;

      -- Update last triggered time
      UPDATE alert_rules
      SET last_triggered_at = now(), updated_at = now()
      WHERE id = v_rule.id;

      v_triggered := true;
    END IF;
  END LOOP;

  RETURN QUERY SELECT v_triggered, v_event_id;
END;
$$;

-- Function to check credential expiring alerts (run via cron)
CREATE OR REPLACE FUNCTION check_expiring_credentials()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_rule RECORD;
  v_cred RECORD;
  v_days_before INTEGER;
  v_count INTEGER := 0;
BEGIN
  FOR v_rule IN
    SELECT ar.*, i.id as issuer_id
    FROM alert_rules ar
    JOIN issuers i ON ar.issuer_id = i.id
    WHERE ar.is_active = true
      AND ar.rule_type = 'credential_expiring'
      AND (ar.last_triggered_at IS NULL OR ar.last_triggered_at < now() - interval '1 day')
  LOOP
    v_days_before := COALESCE((v_rule.config->>'days_before')::integer, 7);

    FOR v_cred IN
      SELECT * FROM credentials
      WHERE issuer_id = v_rule.issuer_id
        AND (v_rule.credential_id IS NULL OR id = v_rule.credential_id)
        AND status = 'active'
        AND valid_until <= now() + (v_days_before || ' days')::interval
        AND valid_until > now()
    LOOP
      INSERT INTO alert_events (
        alert_rule_id,
        issuer_id,
        credential_id,
        severity,
        title,
        message,
        event_data
      ) VALUES (
        v_rule.id,
        v_rule.issuer_id,
        v_cred.id,
        v_rule.severity,
        'Credential Expiring Soon',
        format('Credential for %s expires in %s days',
          v_cred.agent_name,
          EXTRACT(DAY FROM v_cred.valid_until - now())::integer
        ),
        jsonb_build_object(
          'expires_at', v_cred.valid_until,
          'days_remaining', EXTRACT(DAY FROM v_cred.valid_until - now())::integer
        )
      );

      v_count := v_count + 1;
    END LOOP;

    -- Update last triggered
    IF v_count > 0 THEN
      UPDATE alert_rules
      SET last_triggered_at = now(), updated_at = now()
      WHERE id = v_rule.id;
    END IF;
  END LOOP;

  RETURN v_count;
END;
$$;

-- RLS Policies
ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_metrics ENABLE ROW LEVEL SECURITY;

-- Alert rules: issuers can manage their own rules
CREATE POLICY alert_rules_select ON alert_rules
  FOR SELECT USING (
    issuer_id IN (SELECT id FROM issuers WHERE user_id = auth.uid())
  );

CREATE POLICY alert_rules_insert ON alert_rules
  FOR INSERT WITH CHECK (
    issuer_id IN (SELECT id FROM issuers WHERE user_id = auth.uid())
  );

CREATE POLICY alert_rules_update ON alert_rules
  FOR UPDATE USING (
    issuer_id IN (SELECT id FROM issuers WHERE user_id = auth.uid())
  );

CREATE POLICY alert_rules_delete ON alert_rules
  FOR DELETE USING (
    issuer_id IN (SELECT id FROM issuers WHERE user_id = auth.uid())
  );

-- Alert events: issuers can view and update their own alerts
CREATE POLICY alert_events_select ON alert_events
  FOR SELECT USING (
    issuer_id IN (SELECT id FROM issuers WHERE user_id = auth.uid())
  );

CREATE POLICY alert_events_update ON alert_events
  FOR UPDATE USING (
    issuer_id IN (SELECT id FROM issuers WHERE user_id = auth.uid())
  );

-- Usage metrics: issuers can view metrics for their credentials
CREATE POLICY usage_metrics_select ON usage_metrics
  FOR SELECT USING (
    credential_id IN (
      SELECT c.id FROM credentials c
      JOIN issuers i ON c.issuer_id = i.id
      WHERE i.user_id = auth.uid()
    )
  );

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION record_usage_metric TO authenticated, anon;
GRANT EXECUTE ON FUNCTION check_verification_alerts TO authenticated, anon;
GRANT EXECUTE ON FUNCTION check_expiring_credentials TO authenticated;

-- View for alert summary
CREATE VIEW v_alert_summary AS
SELECT
  ae.issuer_id,
  COUNT(*) FILTER (WHERE ae.status = 'triggered') as triggered_count,
  COUNT(*) FILTER (WHERE ae.status = 'acknowledged') as acknowledged_count,
  COUNT(*) FILTER (WHERE ae.severity = 'critical' AND ae.status = 'triggered') as critical_count,
  COUNT(*) FILTER (WHERE ae.severity = 'high' AND ae.status = 'triggered') as high_count,
  COUNT(*) FILTER (WHERE ae.triggered_at >= now() - interval '24 hours') as last_24h_count,
  MAX(ae.triggered_at) as last_alert_at
FROM alert_events ae
GROUP BY ae.issuer_id;

-- Grant access to view
GRANT SELECT ON v_alert_summary TO authenticated;

COMMENT ON TABLE alert_rules IS 'Configuration for alert triggers on credential usage';
COMMENT ON TABLE alert_events IS 'Triggered alert instances';
COMMENT ON TABLE usage_metrics IS 'Hourly aggregated usage metrics for anomaly detection';
COMMENT ON FUNCTION record_usage_metric IS 'Records a usage metric in the hourly bucket';
COMMENT ON FUNCTION check_verification_alerts IS 'Checks and triggers alerts after a verification';
COMMENT ON FUNCTION check_expiring_credentials IS 'Cron job to check for expiring credentials';
