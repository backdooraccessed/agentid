-- =============================================================================
-- Migration 019: A2A Message Encryption Keys
-- =============================================================================
-- Stores public keys for end-to-end encrypted A2A conversations

-- Encryption Keys Table
CREATE TABLE a2a_encryption_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES a2a_conversations(id) ON DELETE CASCADE,
  credential_id UUID NOT NULL REFERENCES credentials(id) ON DELETE CASCADE,
  public_key TEXT NOT NULL,
  key_algorithm TEXT NOT NULL DEFAULT 'x25519',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  UNIQUE(conversation_id, credential_id)
);

-- Indexes
CREATE INDEX idx_encryption_keys_conversation ON a2a_encryption_keys(conversation_id);
CREATE INDEX idx_encryption_keys_credential ON a2a_encryption_keys(credential_id);

-- Add encryption flag to messages if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'a2a_messages' AND column_name = 'encrypted'
  ) THEN
    ALTER TABLE a2a_messages ADD COLUMN encrypted BOOLEAN NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'a2a_messages' AND column_name = 'encryption_metadata'
  ) THEN
    ALTER TABLE a2a_messages ADD COLUMN encryption_metadata JSONB;
  END IF;
END $$;

-- RLS Policies
ALTER TABLE a2a_encryption_keys ENABLE ROW LEVEL SECURITY;

-- Participants can view keys for their conversations
CREATE POLICY "Participants can view encryption keys"
  ON a2a_encryption_keys
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM a2a_conversations c
      WHERE c.id = a2a_encryption_keys.conversation_id
      AND (
        c.initiator_credential_id IN (
          SELECT id FROM credentials WHERE issuer_id IN (
            SELECT id FROM issuers WHERE user_id = auth.uid()
            UNION
            SELECT issuer_id FROM team_members WHERE user_id = auth.uid()
          )
        )
        OR c.recipient_credential_id IN (
          SELECT id FROM credentials WHERE issuer_id IN (
            SELECT id FROM issuers WHERE user_id = auth.uid()
            UNION
            SELECT issuer_id FROM team_members WHERE user_id = auth.uid()
          )
        )
      )
    )
  );

-- Participants can insert their own keys
CREATE POLICY "Participants can insert their own keys"
  ON a2a_encryption_keys
  FOR INSERT
  WITH CHECK (
    credential_id IN (
      SELECT id FROM credentials WHERE issuer_id IN (
        SELECT id FROM issuers WHERE user_id = auth.uid()
        UNION
        SELECT issuer_id FROM team_members WHERE user_id = auth.uid()
      )
    )
  );

-- Participants can update their own keys
CREATE POLICY "Participants can update their own keys"
  ON a2a_encryption_keys
  FOR UPDATE
  USING (
    credential_id IN (
      SELECT id FROM credentials WHERE issuer_id IN (
        SELECT id FROM issuers WHERE user_id = auth.uid()
        UNION
        SELECT issuer_id FROM team_members WHERE user_id = auth.uid()
      )
    )
  );

-- Participants can delete their own keys
CREATE POLICY "Participants can delete their own keys"
  ON a2a_encryption_keys
  FOR DELETE
  USING (
    credential_id IN (
      SELECT id FROM credentials WHERE issuer_id IN (
        SELECT id FROM issuers WHERE user_id = auth.uid()
        UNION
        SELECT issuer_id FROM team_members WHERE user_id = auth.uid()
      )
    )
  );

-- Comments
COMMENT ON TABLE a2a_encryption_keys IS 'Public keys for end-to-end encrypted A2A conversations';
COMMENT ON COLUMN a2a_encryption_keys.public_key IS 'Base64-encoded X25519 public key';
COMMENT ON COLUMN a2a_encryption_keys.key_algorithm IS 'Key exchange algorithm (default: x25519)';
