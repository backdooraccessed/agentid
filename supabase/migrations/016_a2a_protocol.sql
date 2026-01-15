-- Agent-to-Agent (A2A) Protocol
-- Enables secure communication between AI agents

-- A2A conversations between agents
CREATE TABLE a2a_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  initiator_credential_id UUID NOT NULL REFERENCES credentials(id),
  recipient_credential_id UUID NOT NULL REFERENCES credentials(id),

  -- Conversation metadata
  subject TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'blocked')),

  -- Encryption (optional)
  encrypted BOOLEAN NOT NULL DEFAULT false,
  encryption_key_id TEXT, -- Reference to key used for E2E encryption

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_message_at TIMESTAMPTZ,

  -- Ensure unique conversations between two agents (bidirectional)
  UNIQUE (initiator_credential_id, recipient_credential_id)
);

-- A2A messages within conversations
CREATE TABLE a2a_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES a2a_conversations(id) ON DELETE CASCADE,
  sender_credential_id UUID NOT NULL REFERENCES credentials(id),

  -- Message content
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN (
    'text',           -- Plain text message
    'request',        -- Action request
    'response',       -- Response to request
    'authorization',  -- Authorization request/grant
    'data',           -- Structured data exchange
    'error'           -- Error message
  )),
  content JSONB NOT NULL, -- Message payload (varies by type)

  -- Signatures for verification
  signature TEXT NOT NULL,          -- Ed25519 signature of content
  signature_timestamp BIGINT NOT NULL, -- Unix timestamp when signed
  nonce TEXT NOT NULL,              -- Unique nonce for replay protection

  -- Reference to previous message (for threading)
  reply_to_id UUID REFERENCES a2a_messages(id),

  -- Delivery status
  delivered BOOLEAN NOT NULL DEFAULT false,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- A2A authorization requests
-- When an agent requests permission to perform actions on behalf of another
CREATE TABLE a2a_authorization_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The agent requesting authorization
  requester_credential_id UUID NOT NULL REFERENCES credentials(id),
  -- The agent being asked to grant authorization
  grantor_credential_id UUID NOT NULL REFERENCES credentials(id),

  -- What permissions are being requested
  requested_permissions JSONB NOT NULL, -- Array of permission objects

  -- Scope and constraints
  scope TEXT, -- Description of scope
  constraints JSONB, -- Any constraints on the authorization

  -- Time bounds
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMPTZ, -- NULL means no expiration

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',    -- Awaiting response
    'approved',   -- Granted
    'denied',     -- Rejected
    'revoked',    -- Previously approved but now revoked
    'expired'     -- Time-limited authorization expired
  )),

  -- Response details
  response_message TEXT,
  responded_at TIMESTAMPTZ,

  -- Signatures
  request_signature TEXT NOT NULL,   -- Requester's signature
  response_signature TEXT,           -- Grantor's signature on response

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_a2a_conversations_initiator ON a2a_conversations(initiator_credential_id);
CREATE INDEX idx_a2a_conversations_recipient ON a2a_conversations(recipient_credential_id);
CREATE INDEX idx_a2a_conversations_status ON a2a_conversations(status);

CREATE INDEX idx_a2a_messages_conversation ON a2a_messages(conversation_id);
CREATE INDEX idx_a2a_messages_sender ON a2a_messages(sender_credential_id);
CREATE INDEX idx_a2a_messages_created ON a2a_messages(created_at DESC);
CREATE INDEX idx_a2a_messages_nonce ON a2a_messages(nonce); -- For replay protection

CREATE INDEX idx_a2a_auth_requests_requester ON a2a_authorization_requests(requester_credential_id);
CREATE INDEX idx_a2a_auth_requests_grantor ON a2a_authorization_requests(grantor_credential_id);
CREATE INDEX idx_a2a_auth_requests_status ON a2a_authorization_requests(status);

-- RLS Policies
ALTER TABLE a2a_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE a2a_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE a2a_authorization_requests ENABLE ROW LEVEL SECURITY;

-- Conversations: visible to participants
CREATE POLICY "Participants can view their conversations"
  ON a2a_conversations FOR SELECT
  USING (
    initiator_credential_id IN (
      SELECT id FROM credentials WHERE issuer_id = auth.uid()
    )
    OR recipient_credential_id IN (
      SELECT id FROM credentials WHERE issuer_id = auth.uid()
    )
  );

CREATE POLICY "Agents can create conversations"
  ON a2a_conversations FOR INSERT
  WITH CHECK (
    initiator_credential_id IN (
      SELECT id FROM credentials WHERE issuer_id = auth.uid()
    )
  );

CREATE POLICY "Participants can update their conversations"
  ON a2a_conversations FOR UPDATE
  USING (
    initiator_credential_id IN (
      SELECT id FROM credentials WHERE issuer_id = auth.uid()
    )
    OR recipient_credential_id IN (
      SELECT id FROM credentials WHERE issuer_id = auth.uid()
    )
  );

-- Messages: visible to conversation participants
CREATE POLICY "Participants can view messages"
  ON a2a_messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM a2a_conversations
      WHERE initiator_credential_id IN (SELECT id FROM credentials WHERE issuer_id = auth.uid())
         OR recipient_credential_id IN (SELECT id FROM credentials WHERE issuer_id = auth.uid())
    )
  );

CREATE POLICY "Participants can send messages"
  ON a2a_messages FOR INSERT
  WITH CHECK (
    sender_credential_id IN (
      SELECT id FROM credentials WHERE issuer_id = auth.uid()
    )
    AND conversation_id IN (
      SELECT id FROM a2a_conversations
      WHERE initiator_credential_id IN (SELECT id FROM credentials WHERE issuer_id = auth.uid())
         OR recipient_credential_id IN (SELECT id FROM credentials WHERE issuer_id = auth.uid())
    )
  );

-- Authorization requests: visible to requester and grantor
CREATE POLICY "Participants can view authorization requests"
  ON a2a_authorization_requests FOR SELECT
  USING (
    requester_credential_id IN (SELECT id FROM credentials WHERE issuer_id = auth.uid())
    OR grantor_credential_id IN (SELECT id FROM credentials WHERE issuer_id = auth.uid())
  );

CREATE POLICY "Agents can create authorization requests"
  ON a2a_authorization_requests FOR INSERT
  WITH CHECK (
    requester_credential_id IN (SELECT id FROM credentials WHERE issuer_id = auth.uid())
  );

CREATE POLICY "Grantors can respond to authorization requests"
  ON a2a_authorization_requests FOR UPDATE
  USING (
    grantor_credential_id IN (SELECT id FROM credentials WHERE issuer_id = auth.uid())
  );

-- Functions

-- Start or get an existing conversation
CREATE OR REPLACE FUNCTION start_a2a_conversation(
  p_initiator_id UUID,
  p_recipient_id UUID,
  p_subject TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_conversation_id UUID;
BEGIN
  -- Check if conversation already exists (in either direction)
  SELECT id INTO v_conversation_id
  FROM a2a_conversations
  WHERE (initiator_credential_id = p_initiator_id AND recipient_credential_id = p_recipient_id)
     OR (initiator_credential_id = p_recipient_id AND recipient_credential_id = p_initiator_id);

  IF v_conversation_id IS NOT NULL THEN
    -- Reactivate if closed
    UPDATE a2a_conversations
    SET status = 'active', updated_at = NOW()
    WHERE id = v_conversation_id AND status = 'closed';

    RETURN v_conversation_id;
  END IF;

  -- Create new conversation
  INSERT INTO a2a_conversations (
    initiator_credential_id,
    recipient_credential_id,
    subject
  ) VALUES (
    p_initiator_id,
    p_recipient_id,
    p_subject
  )
  RETURNING id INTO v_conversation_id;

  RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql;

-- Send a message in a conversation
CREATE OR REPLACE FUNCTION send_a2a_message(
  p_conversation_id UUID,
  p_sender_id UUID,
  p_message_type TEXT,
  p_content JSONB,
  p_signature TEXT,
  p_signature_timestamp BIGINT,
  p_nonce TEXT,
  p_reply_to_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_message_id UUID;
BEGIN
  -- Verify sender is participant
  IF NOT EXISTS (
    SELECT 1 FROM a2a_conversations
    WHERE id = p_conversation_id
    AND (initiator_credential_id = p_sender_id OR recipient_credential_id = p_sender_id)
    AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Sender is not a participant or conversation is not active';
  END IF;

  -- Check for replay (nonce should be unique)
  IF EXISTS (SELECT 1 FROM a2a_messages WHERE nonce = p_nonce) THEN
    RAISE EXCEPTION 'Replay detected: nonce already used';
  END IF;

  -- Insert message
  INSERT INTO a2a_messages (
    conversation_id,
    sender_credential_id,
    message_type,
    content,
    signature,
    signature_timestamp,
    nonce,
    reply_to_id
  ) VALUES (
    p_conversation_id,
    p_sender_id,
    p_message_type,
    p_content,
    p_signature,
    p_signature_timestamp,
    p_nonce,
    p_reply_to_id
  )
  RETURNING id INTO v_message_id;

  -- Update conversation
  UPDATE a2a_conversations
  SET last_message_at = NOW(), updated_at = NOW()
  WHERE id = p_conversation_id;

  RETURN v_message_id;
END;
$$ LANGUAGE plpgsql;

-- Create an authorization request
CREATE OR REPLACE FUNCTION create_a2a_authorization_request(
  p_requester_id UUID,
  p_grantor_id UUID,
  p_permissions JSONB,
  p_scope TEXT,
  p_constraints JSONB,
  p_valid_until TIMESTAMPTZ,
  p_signature TEXT
) RETURNS UUID AS $$
DECLARE
  v_request_id UUID;
BEGIN
  INSERT INTO a2a_authorization_requests (
    requester_credential_id,
    grantor_credential_id,
    requested_permissions,
    scope,
    constraints,
    valid_until,
    request_signature
  ) VALUES (
    p_requester_id,
    p_grantor_id,
    p_permissions,
    p_scope,
    p_constraints,
    p_valid_until,
    p_signature
  )
  RETURNING id INTO v_request_id;

  RETURN v_request_id;
END;
$$ LANGUAGE plpgsql;

-- Respond to an authorization request
CREATE OR REPLACE FUNCTION respond_to_authorization_request(
  p_request_id UUID,
  p_grantor_id UUID,
  p_approved BOOLEAN,
  p_message TEXT,
  p_signature TEXT
) RETURNS VOID AS $$
BEGIN
  UPDATE a2a_authorization_requests
  SET
    status = CASE WHEN p_approved THEN 'approved' ELSE 'denied' END,
    response_message = p_message,
    response_signature = p_signature,
    responded_at = NOW(),
    updated_at = NOW()
  WHERE id = p_request_id
    AND grantor_credential_id = p_grantor_id
    AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found or already responded';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Check if an authorization is valid
CREATE OR REPLACE FUNCTION check_a2a_authorization(
  p_requester_id UUID,
  p_grantor_id UUID,
  p_permission TEXT
) RETURNS TABLE (
  authorized BOOLEAN,
  authorization_id UUID,
  constraints JSONB,
  valid_until TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    true AS authorized,
    ar.id AS authorization_id,
    ar.constraints,
    ar.valid_until
  FROM a2a_authorization_requests ar
  WHERE ar.requester_credential_id = p_requester_id
    AND ar.grantor_credential_id = p_grantor_id
    AND ar.status = 'approved'
    AND (ar.valid_until IS NULL OR ar.valid_until > NOW())
    AND ar.requested_permissions @> jsonb_build_array(jsonb_build_object('action', p_permission))
  LIMIT 1;

  -- Return false if no authorization found
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::JSONB, NULL::TIMESTAMPTZ;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update conversation on message
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE a2a_conversations
  SET last_message_at = NEW.created_at, updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_conversation_on_message
  AFTER INSERT ON a2a_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_on_message();

-- Views

-- Active conversations view
CREATE OR REPLACE VIEW v_a2a_conversations AS
SELECT
  c.id,
  c.subject,
  c.status,
  c.encrypted,
  c.created_at,
  c.last_message_at,
  -- Initiator info
  c.initiator_credential_id,
  init.agent_name AS initiator_name,
  init_i.display_name AS initiator_issuer,
  -- Recipient info
  c.recipient_credential_id,
  recp.agent_name AS recipient_name,
  recp_i.display_name AS recipient_issuer,
  -- Message count
  (SELECT COUNT(*) FROM a2a_messages m WHERE m.conversation_id = c.id) AS message_count
FROM a2a_conversations c
JOIN credentials init ON init.id = c.initiator_credential_id
JOIN issuers init_i ON init_i.id = init.issuer_id
JOIN credentials recp ON recp.id = c.recipient_credential_id
JOIN issuers recp_i ON recp_i.id = recp.issuer_id;

-- Pending authorization requests view
CREATE OR REPLACE VIEW v_pending_authorizations AS
SELECT
  ar.id,
  ar.requested_permissions,
  ar.scope,
  ar.valid_until,
  ar.created_at,
  -- Requester info
  ar.requester_credential_id,
  req.agent_name AS requester_name,
  req_i.display_name AS requester_issuer,
  req_rep.trust_score AS requester_trust_score,
  -- Grantor info
  ar.grantor_credential_id,
  gra.agent_name AS grantor_name,
  gra_i.display_name AS grantor_issuer
FROM a2a_authorization_requests ar
JOIN credentials req ON req.id = ar.requester_credential_id
JOIN issuers req_i ON req_i.id = req.issuer_id
LEFT JOIN reputation req_rep ON req_rep.credential_id = req.id
JOIN credentials gra ON gra.id = ar.grantor_credential_id
JOIN issuers gra_i ON gra_i.id = gra.issuer_id
WHERE ar.status = 'pending';

-- Comments
COMMENT ON TABLE a2a_conversations IS 'Agent-to-Agent conversations';
COMMENT ON TABLE a2a_messages IS 'Messages within A2A conversations';
COMMENT ON TABLE a2a_authorization_requests IS 'Authorization requests between agents';
COMMENT ON FUNCTION start_a2a_conversation IS 'Start or reopen a conversation between two agents';
COMMENT ON FUNCTION send_a2a_message IS 'Send a signed message in a conversation';
COMMENT ON FUNCTION create_a2a_authorization_request IS 'Request authorization from another agent';
COMMENT ON FUNCTION respond_to_authorization_request IS 'Approve or deny an authorization request';
COMMENT ON FUNCTION check_a2a_authorization IS 'Check if an agent is authorized for an action';
