-- Run this in the Supabase SQL Editor (Database → SQL Editor → New query)
-- Adds group leaderboard feature: groups, membership, RLS, and query functions.

CREATE TABLE groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  invite_code TEXT NOT NULL UNIQUE DEFAULT substr(md5(random()::text), 1, 8),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE group_members (
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id),
  UNIQUE (user_id) -- enforces one group at a time per user
);

CREATE INDEX idx_group_members_group_id ON group_members(group_id);

ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own membership" ON group_members
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "members read their group" ON groups
  FOR SELECT USING (
    id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
  );

CREATE POLICY "admin manages group" ON groups
  FOR ALL USING (auth.uid() = created_by);

-- Join a group by invite code. SECURITY DEFINER because a user can't SELECT
-- a group they aren't yet a member of (by RLS design above).
CREATE OR REPLACE FUNCTION join_group_by_code(p_code TEXT)
RETURNS UUID
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_group_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT id INTO v_group_id FROM groups WHERE invite_code = p_code;
  IF v_group_id IS NULL THEN
    RAISE EXCEPTION 'Invalid invite code';
  END IF;

  DELETE FROM group_members WHERE user_id = auth.uid();
  INSERT INTO group_members (group_id, user_id, role) VALUES (v_group_id, auth.uid(), 'member');

  RETURN v_group_id;
END;
$$ LANGUAGE plpgsql;

-- Create a group and join it as admin in one step.
CREATE OR REPLACE FUNCTION create_group(p_name TEXT)
RETURNS UUID
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_group_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  DELETE FROM group_members WHERE user_id = auth.uid();

  INSERT INTO groups (name, created_by) VALUES (p_name, auth.uid()) RETURNING id INTO v_group_id;
  INSERT INTO group_members (group_id, user_id, role) VALUES (v_group_id, auth.uid(), 'admin');

  RETURN v_group_id;
END;
$$ LANGUAGE plpgsql;

-- Admin removes a member from the group. SECURITY DEFINER because the
-- "own membership" RLS policy only lets a user delete their own row.
CREATE OR REPLACE FUNCTION remove_group_member(p_group_id UUID, p_user_id UUID)
RETURNS VOID
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM groups WHERE id = p_group_id AND created_by = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Only the group admin can remove members';
  END IF;

  DELETE FROM group_members WHERE group_id = p_group_id AND user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Leaderboard for a group: rank by all-time and weekly completed workout counts.
-- Display name sourced from auth.users metadata (the live source the rest of
-- the app writes to via supabase.auth.updateUser), not user_profiles, which
-- can go stale after a name edit.
CREATE OR REPLACE FUNCTION get_group_leaderboard(p_group_id UUID)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  all_time_count BIGINT,
  weekly_count BIGINT
)
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    gm.user_id,
    COALESCE(au.raw_user_meta_data->>'display_name', split_part(au.email, '@', 1)) AS display_name,
    COUNT(w.id) FILTER (WHERE w.completed) AS all_time_count,
    COUNT(w.id) FILTER (WHERE w.completed AND w.date >= date_trunc('week', CURRENT_DATE)) AS weekly_count
  FROM group_members gm
  JOIN auth.users au ON au.id = gm.user_id
  LEFT JOIN workouts w ON w.user_id = gm.user_id
  WHERE gm.group_id = p_group_id
    AND p_group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
  GROUP BY gm.user_id, au.raw_user_meta_data, au.email;
$$ LANGUAGE sql STABLE;
