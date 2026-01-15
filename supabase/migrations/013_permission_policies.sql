-- =============================================================================
-- AgentID - Permission Policies
-- =============================================================================
-- Live permission updates: change what agents can do without re-issuing credentials
-- =============================================================================

-- =============================================================================
-- PERMISSION_POLICIES
-- =============================================================================
-- Reusable permission sets that can be updated independently of credentials

CREATE TABLE permission_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Owner
  issuer_id UUID NOT NULL REFERENCES issuers(id) ON DELETE CASCADE,

  -- Policy identity
  name TEXT NOT NULL,
  description TEXT,

  -- The actual permissions (same structure as credential permissions)
  permissions JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Policy status
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Version tracking for audit
  version INTEGER NOT NULL DEFAULT 1,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Unique name per issuer
  UNIQUE(issuer_id, name)
);

CREATE INDEX idx_permission_policies_issuer ON permission_policies(issuer_id);
CREATE INDEX idx_permission_policies_active ON permission_policies(is_active) WHERE is_active = true;

-- =============================================================================
-- POLICY_VERSIONS (Audit Trail)
-- =============================================================================
-- Track all changes to policies for compliance

CREATE TABLE policy_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Policy reference
  policy_id UUID NOT NULL REFERENCES permission_policies(id) ON DELETE CASCADE,

  -- Version number
  version INTEGER NOT NULL,

  -- Snapshot of permissions at this version
  permissions JSONB NOT NULL,

  -- Who made the change
  changed_by UUID REFERENCES auth.users(id),

  -- Change details
  change_reason TEXT,
  change_type TEXT NOT NULL CHECK (change_type IN ('created', 'updated', 'activated', 'deactivated')),

  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(policy_id, version)
);

CREATE INDEX idx_policy_versions_policy ON policy_versions(policy_id);
CREATE INDEX idx_policy_versions_created ON policy_versions(created_at DESC);

-- =============================================================================
-- ADD POLICY REFERENCE TO CREDENTIALS
-- =============================================================================

ALTER TABLE credentials
ADD COLUMN permission_policy_id UUID REFERENCES permission_policies(id) ON DELETE SET NULL;

CREATE INDEX idx_credentials_policy ON credentials(permission_policy_id)
WHERE permission_policy_id IS NOT NULL;

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Get effective permissions for a credential (policy or static)
CREATE OR REPLACE FUNCTION get_effective_permissions(p_credential_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_credential RECORD;
  v_policy RECORD;
BEGIN
  -- Get credential
  SELECT c.permissions, c.permission_policy_id
  INTO v_credential
  FROM credentials c
  WHERE c.id = p_credential_id;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- If credential has a policy, use policy permissions
  IF v_credential.permission_policy_id IS NOT NULL THEN
    SELECT p.permissions
    INTO v_policy
    FROM permission_policies p
    WHERE p.id = v_credential.permission_policy_id
    AND p.is_active = true;

    IF FOUND THEN
      RETURN v_policy.permissions;
    END IF;
  END IF;

  -- Fall back to static permissions
  RETURN v_credential.permissions;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or update a policy
CREATE OR REPLACE FUNCTION upsert_permission_policy(
  p_issuer_id UUID,
  p_name TEXT,
  p_permissions JSONB,
  p_description TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_change_reason TEXT DEFAULT NULL
)
RETURNS TABLE (
  policy_id UUID,
  version INTEGER,
  is_new BOOLEAN
) AS $$
DECLARE
  v_policy_id UUID;
  v_version INTEGER;
  v_is_new BOOLEAN;
BEGIN
  -- Check if policy exists
  SELECT id, version INTO v_policy_id, v_version
  FROM permission_policies
  WHERE issuer_id = p_issuer_id AND name = p_name;

  IF FOUND THEN
    -- Update existing policy
    v_version := v_version + 1;
    v_is_new := false;

    UPDATE permission_policies
    SET
      permissions = p_permissions,
      description = COALESCE(p_description, description),
      version = v_version,
      updated_at = now()
    WHERE id = v_policy_id;

    -- Record version history
    INSERT INTO policy_versions (policy_id, version, permissions, changed_by, change_reason, change_type)
    VALUES (v_policy_id, v_version, p_permissions, p_user_id, p_change_reason, 'updated');
  ELSE
    -- Create new policy
    v_version := 1;
    v_is_new := true;

    INSERT INTO permission_policies (issuer_id, name, description, permissions)
    VALUES (p_issuer_id, p_name, p_description, p_permissions)
    RETURNING id INTO v_policy_id;

    -- Record version history
    INSERT INTO policy_versions (policy_id, version, permissions, changed_by, change_reason, change_type)
    VALUES (v_policy_id, v_version, p_permissions, p_user_id, p_change_reason, 'created');
  END IF;

  RETURN QUERY SELECT v_policy_id, v_version, v_is_new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Assign policy to credential
CREATE OR REPLACE FUNCTION assign_policy_to_credential(
  p_credential_id UUID,
  p_policy_id UUID,
  p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
) AS $$
DECLARE
  v_credential RECORD;
  v_policy RECORD;
BEGIN
  -- Verify credential exists and get issuer
  SELECT id, issuer_id INTO v_credential
  FROM credentials
  WHERE id = p_credential_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Credential not found'::TEXT;
    RETURN;
  END IF;

  -- Verify policy exists and belongs to same issuer
  SELECT id, issuer_id INTO v_policy
  FROM permission_policies
  WHERE id = p_policy_id AND is_active = true;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Policy not found or inactive'::TEXT;
    RETURN;
  END IF;

  IF v_credential.issuer_id != v_policy.issuer_id THEN
    RETURN QUERY SELECT false, 'Policy belongs to different issuer'::TEXT;
    RETURN;
  END IF;

  -- Verify user owns the issuer
  IF p_user_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM issuers WHERE id = v_credential.issuer_id AND user_id = p_user_id
    ) THEN
      RETURN QUERY SELECT false, 'Not authorized'::TEXT;
      RETURN;
    END IF;
  END IF;

  -- Assign policy
  UPDATE credentials
  SET permission_policy_id = p_policy_id, updated_at = now()
  WHERE id = p_credential_id;

  RETURN QUERY SELECT true, 'Policy assigned successfully'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove policy from credential (revert to static permissions)
CREATE OR REPLACE FUNCTION remove_policy_from_credential(
  p_credential_id UUID,
  p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
) AS $$
DECLARE
  v_credential RECORD;
BEGIN
  -- Verify credential exists
  SELECT id, issuer_id INTO v_credential
  FROM credentials
  WHERE id = p_credential_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Credential not found'::TEXT;
    RETURN;
  END IF;

  -- Verify user owns the issuer
  IF p_user_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM issuers WHERE id = v_credential.issuer_id AND user_id = p_user_id
    ) THEN
      RETURN QUERY SELECT false, 'Not authorized'::TEXT;
      RETURN;
    END IF;
  END IF;

  -- Remove policy
  UPDATE credentials
  SET permission_policy_id = NULL, updated_at = now()
  WHERE id = p_credential_id;

  RETURN QUERY SELECT true, 'Policy removed successfully'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- POLICY CHANGE STREAM (for real-time updates)
-- =============================================================================

CREATE TABLE policy_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Policy reference
  policy_id UUID NOT NULL REFERENCES permission_policies(id) ON DELETE CASCADE,

  -- Change details
  change_type TEXT NOT NULL CHECK (change_type IN ('permissions_updated', 'activated', 'deactivated')),
  new_version INTEGER NOT NULL,

  -- Affected credentials count
  affected_credentials INTEGER NOT NULL DEFAULT 0,

  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_policy_changes_created ON policy_changes(created_at DESC);
CREATE INDEX idx_policy_changes_policy ON policy_changes(policy_id);

-- Enable Realtime on policy changes
ALTER PUBLICATION supabase_realtime ADD TABLE policy_changes;

-- Trigger to broadcast policy changes
CREATE OR REPLACE FUNCTION broadcast_policy_change()
RETURNS TRIGGER AS $$
DECLARE
  v_affected_count INTEGER;
BEGIN
  -- Count affected credentials
  SELECT COUNT(*) INTO v_affected_count
  FROM credentials
  WHERE permission_policy_id = NEW.id AND status = 'active';

  -- Insert change event (triggers Realtime broadcast)
  INSERT INTO policy_changes (policy_id, change_type, new_version, affected_credentials)
  VALUES (
    NEW.id,
    CASE
      WHEN OLD.permissions IS DISTINCT FROM NEW.permissions THEN 'permissions_updated'
      WHEN OLD.is_active = false AND NEW.is_active = true THEN 'activated'
      WHEN OLD.is_active = true AND NEW.is_active = false THEN 'deactivated'
      ELSE 'permissions_updated'
    END,
    NEW.version,
    v_affected_count
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_policy_change_broadcast
  AFTER UPDATE ON permission_policies
  FOR EACH ROW
  WHEN (OLD.permissions IS DISTINCT FROM NEW.permissions OR OLD.is_active IS DISTINCT FROM NEW.is_active)
  EXECUTE FUNCTION broadcast_policy_change();

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

ALTER TABLE permission_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_changes ENABLE ROW LEVEL SECURITY;

-- Issuers can manage their own policies
CREATE POLICY "Issuers can manage own policies"
  ON permission_policies
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM issuers
      WHERE id = permission_policies.issuer_id
      AND user_id = auth.uid()
    )
  );

-- Verifiers can read active policies (for verification)
CREATE POLICY "Anyone can read active policies"
  ON permission_policies
  FOR SELECT
  USING (is_active = true);

-- Policy versions: issuers can read their own
CREATE POLICY "Issuers can read own policy versions"
  ON policy_versions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM permission_policies p
      JOIN issuers i ON i.id = p.issuer_id
      WHERE p.id = policy_versions.policy_id
      AND i.user_id = auth.uid()
    )
  );

-- Policy changes: anyone can read (for real-time updates)
CREATE POLICY "Anyone can read policy changes"
  ON policy_changes
  FOR SELECT
  USING (true);

-- =============================================================================
-- VIEWS
-- =============================================================================

-- Credentials with their effective permissions
CREATE OR REPLACE VIEW v_credentials_with_permissions AS
SELECT
  c.id,
  c.agent_id,
  c.agent_name,
  c.issuer_id,
  c.status,
  c.permission_policy_id,
  pp.name as policy_name,
  pp.version as policy_version,
  COALESCE(pp.permissions, c.permissions) as effective_permissions,
  c.created_at,
  c.valid_until
FROM credentials c
LEFT JOIN permission_policies pp ON pp.id = c.permission_policy_id AND pp.is_active = true;

-- Policy usage stats
CREATE VIEW v_policy_usage AS
SELECT
  p.id,
  p.name,
  p.issuer_id,
  p.version,
  p.is_active,
  COUNT(c.id) as credential_count,
  COUNT(c.id) FILTER (WHERE c.status = 'active') as active_credential_count,
  p.created_at,
  p.updated_at
FROM permission_policies p
LEFT JOIN credentials c ON c.permission_policy_id = p.id
GROUP BY p.id;

-- =============================================================================
-- UPDATED_AT TRIGGER
-- =============================================================================

CREATE TRIGGER update_permission_policies_updated_at
  BEFORE UPDATE ON permission_policies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
