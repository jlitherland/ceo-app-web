-- =====================================================
-- Add created_by column to teams table
-- =====================================================
-- This adds the missing created_by column that tracks
-- which user created each team.
--
-- Run this in your Supabase SQL Editor FIRST, then run
-- the database-setup.sql file for RLS policies.
-- =====================================================

-- Check if the column already exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'teams'
        AND column_name = 'created_by'
    ) THEN
        -- Add the created_by column
        ALTER TABLE teams
        ADD COLUMN created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE;

        -- Add an index for better query performance
        CREATE INDEX IF NOT EXISTS idx_teams_created_by ON teams(created_by);

        RAISE NOTICE 'Column created_by added to teams table';
    ELSE
        RAISE NOTICE 'Column created_by already exists in teams table';
    END IF;
END $$;

-- If you have existing teams without a created_by value,
-- you'll need to set them manually or use a default user.
-- Uncomment and modify the following line if needed:
-- UPDATE teams SET created_by = 'YOUR_USER_UUID' WHERE created_by IS NULL;

-- =====================================================
-- DONE!
-- =====================================================
-- The created_by column has been added.
-- Now you can run the database-setup.sql file to add
-- the RLS policies.
-- =====================================================
