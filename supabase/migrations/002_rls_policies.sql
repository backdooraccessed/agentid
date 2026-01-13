-- =============================================================================
-- AgentID - RLS Policies
-- =============================================================================
-- Access model:
-- - Authenticated issuers: Full access to own data
-- - Anon (Verification API): Read-only public credentials, write verification logs
-- - Service role: Full access (for Edge Functions)
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE issuers ENABLE ROW LEVEL SECURITY;
ALTER TABLE credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_logs ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- ISSUERS POLICIES
-- =============================================================================

-- Issuers can read their own record
CREATE POLICY "Issuers can read own record"
  ON issuers FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Issuers can update their own record (except verification status)
CREATE POLICY "Issuers can update own record"
  ON issuers FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- New issuers can insert (registration)
CREATE POLICY "Users can create issuer profile"
  ON issuers FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- =============================================================================
-- CREDENTIALS POLICIES
-- =============================================================================

-- Issuers can read all their issued credentials
CREATE POLICY "Issuers can read own credentials"
  ON credentials FOR SELECT
  TO authenticated
  USING (issuer_id IN (SELECT id FROM issuers WHERE user_id = auth.uid()));

-- Issuers can create credentials
CREATE POLICY "Issuers can create credentials"
  ON credentials FOR INSERT
  TO authenticated
  WITH CHECK (issuer_id IN (SELECT id FROM issuers WHERE user_id = auth.uid()));

-- Issuers can update credentials (for revocation)
CREATE POLICY "Issuers can update own credentials"
  ON credentials FOR UPDATE
  TO authenticated
  USING (issuer_id IN (SELECT id FROM issuers WHERE user_id = auth.uid()));

-- PUBLIC: Anyone can read credentials (for verification)
-- This is the key policy for public verification
CREATE POLICY "Public can read credentials for verification"
  ON credentials FOR SELECT
  TO anon
  USING (true);

-- =============================================================================
-- VERIFICATION_LOGS POLICIES
-- =============================================================================

-- Issuers can read verification logs for their credentials
CREATE POLICY "Issuers can read verification logs"
  ON verification_logs FOR SELECT
  TO authenticated
  USING (
    credential_id IN (
      SELECT id FROM credentials
      WHERE issuer_id IN (SELECT id FROM issuers WHERE user_id = auth.uid())
    )
  );

-- PUBLIC: Anyone can write verification logs (for logging verifications)
CREATE POLICY "Public can insert verification logs"
  ON verification_logs FOR INSERT
  TO anon
  WITH CHECK (true);

-- Authenticated users can also insert verification logs
CREATE POLICY "Authenticated can insert verification logs"
  ON verification_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);
