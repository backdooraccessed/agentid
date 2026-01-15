-- =============================================================================
-- AgentID - Agent Profile Column
-- =============================================================================
-- Add agent_profile column to credentials table for the new profile-based
-- credential issuance system.
-- =============================================================================

-- Add agent_profile column to credentials table
ALTER TABLE credentials
ADD COLUMN IF NOT EXISTS agent_profile TEXT;

-- Create index for filtering by profile
CREATE INDEX IF NOT EXISTS idx_credentials_profile ON credentials(agent_profile)
  WHERE agent_profile IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN credentials.agent_profile IS 'Agent profile type (e.g., trading, code-assistant, customer-service). Maps to agent_type for backwards compatibility.';
