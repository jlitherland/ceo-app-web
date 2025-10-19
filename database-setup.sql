-- =====================================================
-- CEO App Database Setup - Teams and Team Members
-- =====================================================
-- This script sets up Row Level Security (RLS) policies
-- for teams and related tables.
--
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/YOUR_PROJECT/sql
-- =====================================================

-- Enable Row Level Security on teams table
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Enable Row Level Security on team_members table
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Enable Row Level Security on team_wall_posts table
ALTER TABLE team_wall_posts ENABLE ROW LEVEL SECURITY;

-- Enable Row Level Security on wall_post_likes table
ALTER TABLE wall_post_likes ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- TEAMS TABLE POLICIES
-- =====================================================

-- Policy: Users can view teams they created
CREATE POLICY "Users can view their own teams"
ON teams FOR SELECT
TO authenticated
USING (auth.uid() = owner_id);

-- Policy: Users can view teams they are members of
CREATE POLICY "Users can view teams they are members of"
ON teams FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM team_members
    WHERE team_members.team_id = teams.id
    AND team_members.user_id = auth.uid()
    AND team_members.status = 'active'
  )
);

-- Policy: Users can create teams
CREATE POLICY "Users can create teams"
ON teams FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_id);

-- Policy: Team creators can update their teams
CREATE POLICY "Team creators can update their teams"
ON teams FOR UPDATE
TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- Policy: Team creators can delete their teams
CREATE POLICY "Team creators can delete their teams"
ON teams FOR DELETE
TO authenticated
USING (auth.uid() = owner_id);

-- =====================================================
-- TEAM_MEMBERS TABLE POLICIES
-- =====================================================

-- Policy: Users can view members of teams they belong to
CREATE POLICY "Users can view team members"
ON team_members FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM teams
    WHERE teams.id = team_members.team_id
    AND (teams.owner_id = auth.uid() OR
         EXISTS (
           SELECT 1 FROM team_members tm
           WHERE tm.team_id = teams.id
           AND tm.user_id = auth.uid()
           AND tm.status = 'active'
         ))
  )
);

-- Policy: Team creators can add members
CREATE POLICY "Team creators can add members"
ON team_members FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM teams
    WHERE teams.id = team_members.team_id
    AND teams.owner_id = auth.uid()
  )
);

-- Policy: Team creators can update members
CREATE POLICY "Team creators can update members"
ON team_members FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM teams
    WHERE teams.id = team_members.team_id
    AND teams.owner_id = auth.uid()
  )
);

-- Policy: Team creators can remove members
CREATE POLICY "Team creators can remove members"
ON team_members FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM teams
    WHERE teams.id = team_members.team_id
    AND teams.owner_id = auth.uid()
  )
);

-- =====================================================
-- TEAM_WALL_POSTS TABLE POLICIES
-- =====================================================

-- Policy: Team members can view wall posts
CREATE POLICY "Team members can view wall posts"
ON team_wall_posts FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM teams
    WHERE teams.id = team_wall_posts.team_id
    AND (teams.owner_id = auth.uid() OR
         EXISTS (
           SELECT 1 FROM team_members
           WHERE team_members.team_id = teams.id
           AND team_members.user_id = auth.uid()
           AND team_members.status = 'active'
         ))
  )
);

-- Policy: Team members can create wall posts
CREATE POLICY "Team members can create wall posts"
ON team_wall_posts FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = author_id AND
  EXISTS (
    SELECT 1 FROM teams
    WHERE teams.id = team_wall_posts.team_id
    AND (teams.owner_id = auth.uid() OR
         EXISTS (
           SELECT 1 FROM team_members
           WHERE team_members.team_id = teams.id
           AND team_members.user_id = auth.uid()
           AND team_members.status = 'active'
         ))
  )
);

-- Policy: Post authors can update their posts
CREATE POLICY "Post authors can update their posts"
ON team_wall_posts FOR UPDATE
TO authenticated
USING (auth.uid() = author_id)
WITH CHECK (auth.uid() = author_id);

-- Policy: Post authors and team creators can delete posts
CREATE POLICY "Post authors and team creators can delete posts"
ON team_wall_posts FOR DELETE
TO authenticated
USING (
  auth.uid() = author_id OR
  EXISTS (
    SELECT 1 FROM teams
    WHERE teams.id = team_wall_posts.team_id
    AND teams.owner_id = auth.uid()
  )
);

-- =====================================================
-- WALL_POST_LIKES TABLE POLICIES
-- =====================================================

-- Policy: Team members can view likes
CREATE POLICY "Team members can view likes"
ON wall_post_likes FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM team_wall_posts
    JOIN teams ON teams.id = team_wall_posts.team_id
    WHERE team_wall_posts.id = wall_post_likes.post_id
    AND (teams.owner_id = auth.uid() OR
         EXISTS (
           SELECT 1 FROM team_members
           WHERE team_members.team_id = teams.id
           AND team_members.user_id = auth.uid()
           AND team_members.status = 'active'
         ))
  )
);

-- Policy: Users can create likes
CREATE POLICY "Users can create likes"
ON wall_post_likes FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM team_wall_posts
    JOIN teams ON teams.id = team_wall_posts.team_id
    WHERE team_wall_posts.id = wall_post_likes.post_id
    AND (teams.owner_id = auth.uid() OR
         EXISTS (
           SELECT 1 FROM team_members
           WHERE team_members.team_id = teams.id
           AND team_members.user_id = auth.uid()
           AND team_members.status = 'active'
         ))
  )
);

-- Policy: Users can delete their own likes
CREATE POLICY "Users can delete their own likes"
ON wall_post_likes FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- =====================================================
-- DONE!
-- =====================================================
-- All RLS policies have been set up.
-- Users can now:
-- - Create teams
-- - View teams they created or are members of
-- - Post to team walls
-- - Like posts
-- - Manage team members (if they created the team)
-- =====================================================
