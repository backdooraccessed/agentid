-- Credential Templates
-- Allows issuers to define reusable templates for credentials

-- Create credential_templates table
CREATE TABLE IF NOT EXISTS credential_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issuer_id UUID NOT NULL REFERENCES issuers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  -- Template fields
  agent_type TEXT NOT NULL,
  permissions TEXT[] NOT NULL DEFAULT '{}',
  geographic_restrictions TEXT[] DEFAULT '{}',
  allowed_services TEXT[] DEFAULT '{}',
  -- Validity settings
  validity_days INTEGER, -- NULL means no expiration
  -- Metadata template
  metadata_schema JSONB DEFAULT '{}',
  default_metadata JSONB DEFAULT '{}',
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  usage_count INTEGER NOT NULL DEFAULT 0,
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Constraints
  CONSTRAINT template_name_length CHECK (char_length(name) <= 100),
  CONSTRAINT template_description_length CHECK (char_length(description) <= 500),
  CONSTRAINT unique_template_name_per_issuer UNIQUE (issuer_id, name)
);

-- Add template_id to credentials table for tracking
ALTER TABLE credentials ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES credential_templates(id) ON DELETE SET NULL;

-- Index for listing templates by issuer
CREATE INDEX IF NOT EXISTS idx_templates_issuer ON credential_templates(issuer_id);

-- Index for active templates
CREATE INDEX IF NOT EXISTS idx_templates_active ON credential_templates(issuer_id, is_active) WHERE is_active = true;

-- Update updated_at trigger
CREATE OR REPLACE FUNCTION update_template_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_template_timestamp
  BEFORE UPDATE ON credential_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_template_updated_at();

-- Function to increment template usage count
CREATE OR REPLACE FUNCTION increment_template_usage()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.template_id IS NOT NULL THEN
    UPDATE credential_templates
    SET usage_count = usage_count + 1
    WHERE id = NEW.template_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_credential_created_update_template
  AFTER INSERT ON credentials
  FOR EACH ROW
  EXECUTE FUNCTION increment_template_usage();

-- RLS Policies
ALTER TABLE credential_templates ENABLE ROW LEVEL SECURITY;

-- Issuers can read their own templates
CREATE POLICY "Issuers can read own templates"
  ON credential_templates FOR SELECT
  USING (
    issuer_id IN (
      SELECT id FROM issuers WHERE user_id = auth.uid()
    )
  );

-- Issuers can create templates
CREATE POLICY "Issuers can create templates"
  ON credential_templates FOR INSERT
  WITH CHECK (
    issuer_id IN (
      SELECT id FROM issuers WHERE user_id = auth.uid()
    )
  );

-- Issuers can update their own templates
CREATE POLICY "Issuers can update own templates"
  ON credential_templates FOR UPDATE
  USING (
    issuer_id IN (
      SELECT id FROM issuers WHERE user_id = auth.uid()
    )
  );

-- Issuers can delete their own templates
CREATE POLICY "Issuers can delete own templates"
  ON credential_templates FOR DELETE
  USING (
    issuer_id IN (
      SELECT id FROM issuers WHERE user_id = auth.uid()
    )
  );
