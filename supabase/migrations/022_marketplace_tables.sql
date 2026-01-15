-- Marketplace Tables for AI App Discovery
-- Migration: 022_marketplace_tables.sql

-- App Categories (lookup table)
CREATE TABLE IF NOT EXISTS app_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Main Apps Table
CREATE TABLE IF NOT EXISTS apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Ownership
  issuer_id UUID NOT NULL REFERENCES issuers(id) ON DELETE CASCADE,
  credential_id UUID REFERENCES credentials(id) ON DELETE SET NULL,

  -- Basic Info
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  tagline TEXT NOT NULL,
  description TEXT NOT NULL,

  -- Media
  icon_url TEXT,
  demo_video_url TEXT,

  -- Links
  app_url TEXT NOT NULL,
  demo_url TEXT,
  github_url TEXT,
  docs_url TEXT,

  -- Pricing
  pricing_type TEXT NOT NULL DEFAULT 'free',
  pricing_amount DECIMAL(10,2),
  pricing_currency TEXT DEFAULT 'USD',

  -- Status
  status TEXT NOT NULL DEFAULT 'draft',
  featured BOOLEAN DEFAULT false,
  verified BOOLEAN DEFAULT false,

  -- Stats (denormalized)
  view_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  average_rating DECIMAL(2,1),

  -- Metadata
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  published_at TIMESTAMPTZ
);

-- App to Category (many-to-many)
CREATE TABLE IF NOT EXISTS app_category_links (
  app_id UUID NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES app_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (app_id, category_id)
);

-- App Screenshots
CREATE TABLE IF NOT EXISTS app_screenshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- App Reviews
CREATE TABLE IF NOT EXISTS app_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  content TEXT,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(app_id, user_id)
);

-- App Analytics Events
CREATE TABLE IF NOT EXISTS app_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  ip_hash TEXT,
  referrer TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_apps_issuer ON apps(issuer_id);
CREATE INDEX IF NOT EXISTS idx_apps_status ON apps(status) WHERE status = 'live';
CREATE INDEX IF NOT EXISTS idx_apps_featured ON apps(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_apps_slug ON apps(slug);
CREATE INDEX IF NOT EXISTS idx_app_category_links_category ON app_category_links(category_id);
CREATE INDEX IF NOT EXISTS idx_reviews_app ON app_reviews(app_id);
CREATE INDEX IF NOT EXISTS idx_analytics_app ON app_analytics(app_id, created_at);

-- RLS Policies
ALTER TABLE app_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_category_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_screenshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_analytics ENABLE ROW LEVEL SECURITY;

-- Categories: Public read
CREATE POLICY "Categories are publicly readable"
  ON app_categories FOR SELECT
  USING (true);

-- Apps: Public read for live apps, owners can manage their own
CREATE POLICY "Live apps are publicly readable"
  ON apps FOR SELECT
  USING (status = 'live' OR issuer_id IN (
    SELECT id FROM issuers WHERE user_id = auth.uid()
  ));

CREATE POLICY "Issuers can insert their own apps"
  ON apps FOR INSERT
  WITH CHECK (issuer_id IN (
    SELECT id FROM issuers WHERE user_id = auth.uid()
  ));

CREATE POLICY "Issuers can update their own apps"
  ON apps FOR UPDATE
  USING (issuer_id IN (
    SELECT id FROM issuers WHERE user_id = auth.uid()
  ));

CREATE POLICY "Issuers can delete their own apps"
  ON apps FOR DELETE
  USING (issuer_id IN (
    SELECT id FROM issuers WHERE user_id = auth.uid()
  ));

-- Category links: Public read, owners manage
CREATE POLICY "Category links are publicly readable"
  ON app_category_links FOR SELECT
  USING (true);

CREATE POLICY "Issuers can manage category links for their apps"
  ON app_category_links FOR ALL
  USING (app_id IN (
    SELECT id FROM apps WHERE issuer_id IN (
      SELECT id FROM issuers WHERE user_id = auth.uid()
    )
  ));

-- Screenshots: Public read for live apps, owners manage
CREATE POLICY "Screenshots are publicly readable for live apps"
  ON app_screenshots FOR SELECT
  USING (app_id IN (SELECT id FROM apps WHERE status = 'live') OR
         app_id IN (SELECT id FROM apps WHERE issuer_id IN (
           SELECT id FROM issuers WHERE user_id = auth.uid()
         )));

CREATE POLICY "Issuers can manage screenshots for their apps"
  ON app_screenshots FOR ALL
  USING (app_id IN (
    SELECT id FROM apps WHERE issuer_id IN (
      SELECT id FROM issuers WHERE user_id = auth.uid()
    )
  ));

-- Reviews: Public read, users can manage their own
CREATE POLICY "Reviews are publicly readable"
  ON app_reviews FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own reviews"
  ON app_reviews FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own reviews"
  ON app_reviews FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own reviews"
  ON app_reviews FOR DELETE
  USING (user_id = auth.uid());

-- Analytics: Insert only (service role for reads)
CREATE POLICY "Anyone can insert analytics"
  ON app_analytics FOR INSERT
  WITH CHECK (true);

-- Seed categories
INSERT INTO app_categories (name, slug, description, icon, display_order) VALUES
  ('Coding', 'coding', 'Code assistants, debugging, and development tools', 'code', 1),
  ('Writing', 'writing', 'Content creation, copywriting, and editing', 'pen-tool', 2),
  ('Research', 'research', 'Information gathering and analysis', 'search', 3),
  ('Automation', 'automation', 'Workflow automation and bots', 'zap', 4),
  ('Data & Analytics', 'data-analytics', 'Data processing and visualization', 'bar-chart-2', 5),
  ('Customer Service', 'customer-service', 'Support chatbots and service agents', 'headphones', 6),
  ('Creative', 'creative', 'Image, video, and music generation', 'palette', 7),
  ('Productivity', 'productivity', 'Task management and organization', 'check-square', 8),
  ('Developer Tools', 'developer-tools', 'CI/CD, monitoring, and testing', 'terminal', 9),
  ('Other', 'other', 'Other AI applications', 'grid', 10)
ON CONFLICT (slug) DO NOTHING;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_apps_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_apps_updated_at
  BEFORE UPDATE ON apps
  FOR EACH ROW
  EXECUTE FUNCTION update_apps_updated_at();

-- Function to generate unique slug
CREATE OR REPLACE FUNCTION generate_app_slug(app_name TEXT)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  base_slug := lower(regexp_replace(app_name, '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := regexp_replace(base_slug, '^-|-$', '', 'g');
  final_slug := base_slug;

  WHILE EXISTS (SELECT 1 FROM apps WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;

  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;
