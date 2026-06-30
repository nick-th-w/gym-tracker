-- Run this in the Supabase SQL Editor after 06_leaderboard_windows.sql.
-- Returns the most recent completed workout logged by anyone in the group,
-- plus how many the group has logged today. SECURITY DEFINER because the
-- "own workouts" RLS policy only lets a user read their own workout rows.

CREATE OR REPLACE FUNCTION get_group_activity(p_group_id UUID)
RETURNS TABLE (
  last_user_id UUID,
  last_display_name TEXT,
  last_logged_at TIMESTAMPTZ,
  today_count BIGINT
)
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    w.user_id,
    COALESCE(au.raw_user_meta_data->>'display_name', split_part(au.email, '@', 1)),
    w.created_at,
    (
      SELECT COUNT(*)
      FROM workouts w2
      JOIN group_members gm2 ON gm2.user_id = w2.user_id
      WHERE gm2.group_id = p_group_id AND w2.completed AND w2.date = CURRENT_DATE
    ) AS today_count
  FROM workouts w
  JOIN group_members gm ON gm.user_id = w.user_id
  JOIN auth.users au ON au.id = w.user_id
  WHERE gm.group_id = p_group_id
    AND w.completed
    AND p_group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
  ORDER BY w.created_at DESC
  LIMIT 1;
$$ LANGUAGE sql STABLE;
