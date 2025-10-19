-- Add team customization fields
-- Adds tagline and background_image_url to teams table

-- Add tagline column (short description/slogan)
ALTER TABLE teams
ADD COLUMN IF NOT EXISTS tagline TEXT;

-- Add background_image_url column (for custom background)
ALTER TABLE teams
ADD COLUMN IF NOT EXISTS background_image_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN teams.tagline IS 'Short tagline/slogan displayed under team name (max ~100 chars)';
COMMENT ON COLUMN teams.background_image_url IS 'URL to custom background image (displayed with translucent overlay)';
