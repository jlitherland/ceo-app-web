-- Safe migration for track versions
-- This version uses DROP POLICY IF EXISTS to avoid errors

-- Create track_versions table
CREATE TABLE IF NOT EXISTS track_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES team_wall_posts(id) ON DELETE CASCADE,
  version_number INT NOT NULL DEFAULT 1,
  parent_version_id UUID REFERENCES track_versions(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  audio_url TEXT NOT NULL,
  file_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Add unique constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'track_versions_post_id_version_number_key'
  ) THEN
    ALTER TABLE track_versions ADD CONSTRAINT track_versions_post_id_version_number_key UNIQUE(post_id, version_number);
  END IF;
END $$;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_track_versions_post_id ON track_versions(post_id);
CREATE INDEX IF NOT EXISTS idx_track_versions_parent ON track_versions(parent_version_id);
CREATE INDEX IF NOT EXISTS idx_track_versions_active ON track_versions(post_id, is_active);

-- Add version fields to team_wall_posts
ALTER TABLE team_wall_posts
ADD COLUMN IF NOT EXISTS active_version_id UUID REFERENCES track_versions(id) ON DELETE SET NULL;

ALTER TABLE team_wall_posts
ADD COLUMN IF NOT EXISTS version_count INT DEFAULT 1;

-- Enable RLS
ALTER TABLE track_versions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read track versions" ON track_versions;
DROP POLICY IF EXISTS "Users can insert track versions" ON track_versions;
DROP POLICY IF EXISTS "Users can update their own track versions" ON track_versions;
DROP POLICY IF EXISTS "Users can delete their own track versions" ON track_versions;

-- Create policies
CREATE POLICY "Users can read track versions"
  ON track_versions FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert track versions"
  ON track_versions FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = created_by);

CREATE POLICY "Users can update their own track versions"
  ON track_versions FOR UPDATE
  USING (auth.role() = 'authenticated' AND auth.uid() = created_by);

CREATE POLICY "Users can delete their own track versions"
  ON track_versions FOR DELETE
  USING (auth.role() = 'authenticated' AND auth.uid() = created_by);

-- Functions and triggers
CREATE OR REPLACE FUNCTION update_track_versions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS track_versions_updated_at_trigger ON track_versions;
CREATE TRIGGER track_versions_updated_at_trigger
  BEFORE UPDATE ON track_versions
  FOR EACH ROW
  EXECUTE FUNCTION update_track_versions_updated_at();

CREATE OR REPLACE FUNCTION update_post_version_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE team_wall_posts
    SET version_count = (SELECT COUNT(*) FROM track_versions WHERE post_id = NEW.post_id)
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE team_wall_posts
    SET version_count = (SELECT COUNT(*) FROM track_versions WHERE post_id = OLD.post_id)
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS track_versions_count_trigger ON track_versions;
CREATE TRIGGER track_versions_count_trigger
  AFTER INSERT OR DELETE ON track_versions
  FOR EACH ROW
  EXECUTE FUNCTION update_post_version_count();
