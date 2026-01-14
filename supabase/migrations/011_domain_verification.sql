-- Domain Verification for Issuers
-- Adds ability to verify domain ownership via DNS TXT record

-- Add domain verification fields to issuers table
ALTER TABLE issuers
ADD COLUMN IF NOT EXISTS domain_verification_token TEXT,
ADD COLUMN IF NOT EXISTS domain_verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS domain_verification_method TEXT CHECK (domain_verification_method IN ('dns_txt', 'meta_tag', 'file'));

-- Create domain verification attempts log
CREATE TABLE IF NOT EXISTS domain_verification_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issuer_id UUID NOT NULL REFERENCES issuers(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('dns_txt', 'meta_tag', 'file')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'success', 'failed')),
  failure_reason TEXT,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_issuer FOREIGN KEY (issuer_id) REFERENCES issuers(id) ON DELETE CASCADE
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_domain_verification_issuer ON domain_verification_attempts(issuer_id);
CREATE INDEX IF NOT EXISTS idx_domain_verification_status ON domain_verification_attempts(status);

-- Enable RLS
ALTER TABLE domain_verification_attempts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own verification attempts
CREATE POLICY "Users can view own domain verification attempts"
  ON domain_verification_attempts
  FOR SELECT
  USING (
    issuer_id IN (
      SELECT id FROM issuers WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can insert their own verification attempts
CREATE POLICY "Users can create own domain verification attempts"
  ON domain_verification_attempts
  FOR INSERT
  WITH CHECK (
    issuer_id IN (
      SELECT id FROM issuers WHERE user_id = auth.uid()
    )
  );

-- Function to generate verification token
CREATE OR REPLACE FUNCTION generate_domain_verification_token(issuer_uuid UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  token TEXT;
BEGIN
  -- Generate a unique token
  token := 'agentid-verify=' || encode(gen_random_bytes(16), 'hex');

  -- Update the issuer with the token
  UPDATE issuers
  SET domain_verification_token = token
  WHERE id = issuer_uuid;

  RETURN token;
END;
$$;
