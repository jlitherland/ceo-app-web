-- Add timestamp comments and audio timestamp likes
-- Enables SoundCloud-style timestamped commenting on audio tracks

-- Create timestamp_comments table
CREATE TABLE IF NOT EXISTS timestamp_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES team_wall_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_name VARCHAR(255) NOT NULL,
  user_avatar TEXT DEFAULT '',
  timestamp DECIMAL(10,2) NOT NULL, -- TimeInterval in seconds (e.g., 125.50 for 2:05.5)
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for fast lookups by post_id
CREATE INDEX IF NOT EXISTS idx_timestamp_comments_post_id ON timestamp_comments(post_id);

-- Add index for sorting by timestamp
CREATE INDEX IF NOT EXISTS idx_timestamp_comments_timestamp ON timestamp_comments(post_id, timestamp);

-- Add timestamp_in_audio field to wall_post_likes for audio timestamp likes
ALTER TABLE wall_post_likes
ADD COLUMN IF NOT EXISTS timestamp_in_audio DECIMAL(10,2);

-- Add comment to document the field
COMMENT ON COLUMN wall_post_likes.timestamp_in_audio IS 'Optional timestamp in audio file (seconds) when like was created';
COMMENT ON TABLE timestamp_comments IS 'Timestamped comments on audio posts for SoundCloud-style annotation';

-- Enable Row Level Security
ALTER TABLE timestamp_comments ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read comments on posts they can access
CREATE POLICY "Users can read timestamp comments"
  ON timestamp_comments FOR SELECT
  USING (
    auth.role() = 'authenticated'
  );

-- Policy: Authenticated users can insert their own comments
CREATE POLICY "Users can insert their own timestamp comments"
  ON timestamp_comments FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND auth.uid() = user_id
  );

-- Policy: Users can update their own comments
CREATE POLICY "Users can update their own timestamp comments"
  ON timestamp_comments FOR UPDATE
  USING (
    auth.role() = 'authenticated'
    AND auth.uid() = user_id
  );

-- Policy: Users can delete their own comments
CREATE POLICY "Users can delete their own timestamp comments"
  ON timestamp_comments FOR DELETE
  USING (
    auth.role() = 'authenticated'
    AND auth.uid() = user_id
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_timestamp_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER timestamp_comments_updated_at_trigger
  BEFORE UPDATE ON timestamp_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp_comments_updated_at();
