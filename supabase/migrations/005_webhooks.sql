-- =============================================================================
-- AgentID - Webhooks System
-- =============================================================================
-- Real-time notifications for credential events
-- =============================================================================

-- =============================================================================
-- WEBHOOK SUBSCRIPTIONS
-- =============================================================================
-- Issuer-managed webhook endpoints

CREATE TABLE webhook_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Owner
  issuer_id UUID NOT NULL REFERENCES issuers(id) ON DELETE CASCADE,

  -- Webhook configuration
  url TEXT NOT NULL,
  events TEXT[] NOT NULL DEFAULT ARRAY['credential.revoked'],
  description TEXT,

  -- Security (HMAC-SHA256 secret)
  secret TEXT NOT NULL,

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  consecutive_failures INTEGER NOT NULL DEFAULT 0,
  last_triggered_at TIMESTAMPTZ,
  last_success_at TIMESTAMPTZ,
  last_failure_at TIMESTAMPTZ,
  last_failure_reason TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_webhook_subscriptions_issuer ON webhook_subscriptions(issuer_id);
CREATE INDEX idx_webhook_subscriptions_active ON webhook_subscriptions(is_active) WHERE is_active = true;
CREATE INDEX idx_webhook_subscriptions_events ON webhook_subscriptions USING GIN (events);

-- Trigger for updated_at
CREATE TRIGGER update_webhook_subscriptions_updated_at
  BEFORE UPDATE ON webhook_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- WEBHOOK DELIVERIES
-- =============================================================================
-- Delivery log with retry tracking

CREATE TABLE webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Reference
  subscription_id UUID NOT NULL REFERENCES webhook_subscriptions(id) ON DELETE CASCADE,
  credential_id UUID REFERENCES credentials(id) ON DELETE SET NULL,

  -- Event details
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,

  -- Delivery status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'failed', 'retrying')),
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 5,

  -- Response tracking
  response_status INTEGER,
  response_body TEXT,

  -- Timing
  next_attempt_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_webhook_deliveries_subscription ON webhook_deliveries(subscription_id);
CREATE INDEX idx_webhook_deliveries_status ON webhook_deliveries(status);
CREATE INDEX idx_webhook_deliveries_pending ON webhook_deliveries(next_attempt_at)
  WHERE status IN ('pending', 'retrying');
CREATE INDEX idx_webhook_deliveries_created ON webhook_deliveries(created_at DESC);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE webhook_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;

-- Webhook subscriptions: issuers can manage their own
CREATE POLICY "Issuers can view own webhook subscriptions"
  ON webhook_subscriptions FOR SELECT
  USING (issuer_id = get_issuer_id_for_user(auth.uid()));

CREATE POLICY "Issuers can create webhook subscriptions"
  ON webhook_subscriptions FOR INSERT
  WITH CHECK (issuer_id = get_issuer_id_for_user(auth.uid()));

CREATE POLICY "Issuers can update own webhook subscriptions"
  ON webhook_subscriptions FOR UPDATE
  USING (issuer_id = get_issuer_id_for_user(auth.uid()));

CREATE POLICY "Issuers can delete own webhook subscriptions"
  ON webhook_subscriptions FOR DELETE
  USING (issuer_id = get_issuer_id_for_user(auth.uid()));

-- Webhook deliveries: issuers can view their own
CREATE POLICY "Issuers can view own webhook deliveries"
  ON webhook_deliveries FOR SELECT
  USING (
    subscription_id IN (
      SELECT id FROM webhook_subscriptions
      WHERE issuer_id = get_issuer_id_for_user(auth.uid())
    )
  );

-- =============================================================================
-- SERVICE ROLE POLICIES
-- =============================================================================
-- Allow service role to manage deliveries

CREATE POLICY "Service role full access to webhook_subscriptions"
  ON webhook_subscriptions FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to webhook_deliveries"
  ON webhook_deliveries FOR ALL
  USING (auth.role() = 'service_role');
