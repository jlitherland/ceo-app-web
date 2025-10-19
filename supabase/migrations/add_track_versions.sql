-- Add track versions system
-- Enables Samply-style version stacking for audio files
-- Allows multiple alternative versions of the same track

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
  metadata JSONB DEFAULT '{}',
  UNIQUE(post_id, version_number)
);

-- Add indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_track_versions_post_id ON track_versions(post_id);
CREATE INDEX IF NOT EXISTS idx_track_versions_parent ON track_versions(parent_version_id);
CREATE INDEX IF NOT EXISTS idx_track_versions_active ON track_versions(post_id, is_active);

-- Add version tracking fields to team_wall_posts
ALTER TABLE team_wall_posts
ADD COLUMN IF NOT EXISTS active_version_id UUID REFERENCES track_versions(id) ON DELETE SET NULL;

ALTER TABLE team_wall_posts
ADD COLUMN IF NOT EXISTS version_count INT DEFAULT 1;

-- Add comments to document the fields
COMMENT ON TABLE track_versions IS 'Version history for audio tracks - Samply-style alternative versions';
COMMENT ON COLUMN track_versions.version_number IS 'Sequential version number (1, 2, 3, etc.)';
COMMENT ON COLUMN track_versions.parent_version_id IS 'Previous version this was based on (for stack reveal UI)';
COMMENT ON COLUMN track_versions.is_active IS 'Whether this version is currently active/visible';
COMMENT ON COLUMN track_versions.metadata IS 'Additional metadata (BPM, key, duration, etc.)';
COMMENT ON COLUMN team_wall_posts.active_version_id IS 'Currently active version being displayed';
COMMENT ON COLUMN team_wall_posts.version_count IS 'Total number of versions for this track';

-- Enable Row Level Security
ALTER TABLE track_versions ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read versions on posts they can access
CREATE POLICY "Users can read track versions"
  ON track_versions FOR SELECT
  USING (
    auth.role() = 'authenticated'
  );

-- Policy: Authenticated users can insert versions
CREATE POLICY "Users can insert track versions"
  ON track_versions FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND auth.uid() = created_by
  );

-- Policy: Users can update their own versions
CREATE POLICY "Users can update their own track versions"
  ON track_versions FOR UPDATE
  USING (
    auth.role() = 'authenticated'
    AND auth.uid() = created_by
  );

-- Policy: Users can delete their own versions
CREATE POLICY "Users can delete their own track versions"
  ON track_versions FOR DELETE
  USING (
    auth.role() = 'authenticated'
    AND auth.uid() = created_by
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_track_versions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER track_versions_updated_at_trigger
  BEFORE UPDATE ON track_versions
  FOR EACH ROW
  EXECUTE FUNCTION update_track_versions_updated_at();

-- Function to automatically update version_count on team_wall_posts
CREATE OR REPLACE FUNCTION update_post_version_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE team_wall_posts
    SET version_count = (
      SELECT COUNT(*) FROM track_versions WHERE post_id = NEW.post_id
    )
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE team_wall_posts
    SET version_count = (
      SELECT COUNT(*) FROM track_versions WHERE post_id = OLD.post_id
    )
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update version count
CREATE TRIGGER track_versions_count_trigger
  AFTER INSERT OR DELETE ON track_versions
  FOR EACH ROW
  EXECUTE FUNCTION update_post_version_count();
