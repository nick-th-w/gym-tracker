-- Run this in the Supabase SQL Editor after 05_leaderboard.sql.
-- Redefines the leaderboard windows: "this week" -> rolling last 7 days,
-- plus a new rolling last 30 days window. Return columns changed, so the
-- function must be dropped and recreated (CREATE OR REPLACE can't change
-- output columns).

DROP FUNCTION IF EXISTS get_group_leaderboard(UUID);

CREATE OR REPLACE FUNCTION get_group_leaderboard(p_group_id UUID)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  all_time_count BIGINT,
  last_7_days_count BIGINT,
  last_30_days_count BIGINT
)
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    gm.user_id,
    COALESCE(au.raw_user_meta_data->>'display_name', split_part(au.email, '@', 1)) AS display_name,
    COUNT(w.id) FILTER (WHERE w.completed) AS all_time_count,
    COUNT(w.id) FILTER (WHERE w.completed AND w.date >= CURRENT_DATE - INTERVAL '6 days') AS last_7_days_count,
    COUNT(w.id) FILTER (WHERE w.completed AND w.date >= CURRENT_DATE - INTERVAL '29 days') AS last_30_days_count
  FROM group_members gm
  JOIN auth.users au ON au.id = gm.user_id
  LEFT JOIN workouts w ON w.user_id = gm.user_id
  WHERE gm.group_id = p_group_id
    AND p_group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
  GROUP BY gm.user_id, au.raw_user_meta_data, au.email;
$$ LANGUAGE sql STABLE;
