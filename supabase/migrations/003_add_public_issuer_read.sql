-- =============================================================================
-- AgentID - Add Public Issuer Read for Verification
-- =============================================================================
-- Allow anon role to read issuers table for credential verification
-- =============================================================================

-- PUBLIC: Anyone can read issuer public keys (for verification)
CREATE POLICY "Public can read issuer public key for verification"
  ON issuers FOR SELECT
  TO anon
  USING (true);
