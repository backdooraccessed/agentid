-- Migration: 010_audit_logs_and_teams.sql
-- Description: Add audit logs table and team management

-- =============================================================================
-- AUDIT LOGS
-- =============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issuer_id UUID NOT NULL REFERENCES issuers(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for querying by issuer and time
CREATE INDEX IF NOT EXISTS idx_audit_logs_issuer_created
  ON audit_logs(issuer_id, created_at DESC);

-- Index for querying by action type
CREATE INDEX IF NOT EXISTS idx_audit_logs_action
  ON audit_logs(action, created_at DESC);

-- Index for querying by resource
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource
  ON audit_logs(resource_type, resource_id);

-- =============================================================================
-- TEAM MANAGEMENT
-- =============================================================================

-- Team members table
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issuer_id UUID NOT NULL REFERENCES issuers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_email TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(issuer_id, user_id)
);

-- Index for querying team by issuer
CREATE INDEX IF NOT EXISTS idx_team_members_issuer
  ON team_members(issuer_id, status);

-- Index for querying teams by user
CREATE INDEX IF NOT EXISTS idx_team_members_user
  ON team_members(user_id, status);

-- Team invitations table
CREATE TABLE IF NOT EXISTS team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issuer_id UUID NOT NULL REFERENCES issuers(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')),
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for invitation lookup
CREATE INDEX IF NOT EXISTS idx_team_invitations_token
  ON team_invitations(token) WHERE accepted_at IS NULL;

-- Index for invitations by issuer
CREATE INDEX IF NOT EXISTS idx_team_invitations_issuer
  ON team_invitations(issuer_id, created_at DESC);

-- =============================================================================
-- NOTIFICATION PREFERENCES
-- =============================================================================

CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issuer_id UUID NOT NULL REFERENCES issuers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_credential_issued BOOLEAN NOT NULL DEFAULT false,
  email_credential_revoked BOOLEAN NOT NULL DEFAULT true,
  email_credential_expiring BOOLEAN NOT NULL DEFAULT true,
  email_verification_failed BOOLEAN NOT NULL DEFAULT false,
  email_weekly_digest BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(issuer_id, user_id)
);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

-- Audit logs: Users can view logs for their issuer
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view audit logs for their issuer"
  ON audit_logs FOR SELECT
  USING (
    issuer_id IN (
      SELECT id FROM issuers WHERE user_id = auth.uid()
      UNION
      SELECT issuer_id FROM team_members WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can insert audit logs for their issuer"
  ON audit_logs FOR INSERT
  WITH CHECK (
    issuer_id IN (
      SELECT id FROM issuers WHERE user_id = auth.uid()
      UNION
      SELECT issuer_id FROM team_members WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Team members: Members can view their team
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view team members for their issuer"
  ON team_members FOR SELECT
  USING (
    issuer_id IN (
      SELECT id FROM issuers WHERE user_id = auth.uid()
      UNION
      SELECT issuer_id FROM team_members WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Owners and admins can manage team members"
  ON team_members FOR ALL
  USING (
    issuer_id IN (
      SELECT id FROM issuers WHERE user_id = auth.uid()
      UNION
      SELECT issuer_id FROM team_members
      WHERE user_id = auth.uid() AND status = 'active' AND role IN ('owner', 'admin')
    )
  );

-- Team invitations: Similar to team members
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view invitations for their issuer"
  ON team_invitations FOR SELECT
  USING (
    issuer_id IN (
      SELECT id FROM issuers WHERE user_id = auth.uid()
      UNION
      SELECT issuer_id FROM team_members
      WHERE user_id = auth.uid() AND status = 'active' AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Owners and admins can manage invitations"
  ON team_invitations FOR ALL
  USING (
    issuer_id IN (
      SELECT id FROM issuers WHERE user_id = auth.uid()
      UNION
      SELECT issuer_id FROM team_members
      WHERE user_id = auth.uid() AND status = 'active' AND role IN ('owner', 'admin')
    )
  );

-- Notification preferences
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their notification preferences"
  ON notification_preferences FOR ALL
  USING (user_id = auth.uid());

-- =============================================================================
-- ADD OWNER TO EXISTING ISSUERS
-- =============================================================================

-- When an issuer is created, automatically add the user as owner
CREATE OR REPLACE FUNCTION add_issuer_owner()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO team_members (issuer_id, user_id, role, status)
  VALUES (NEW.id, NEW.user_id, 'owner', 'active')
  ON CONFLICT (issuer_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_add_issuer_owner
  AFTER INSERT ON issuers
  FOR EACH ROW
  EXECUTE FUNCTION add_issuer_owner();

-- Add owners for existing issuers
INSERT INTO team_members (issuer_id, user_id, role, status)
SELECT id, user_id, 'owner', 'active'
FROM issuers
ON CONFLICT (issuer_id, user_id) DO NOTHING;
