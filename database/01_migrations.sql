-- Run this first in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS workout_templates (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  focus TEXT NOT NULL,
  estimated_duration_minutes INTEGER,
  goals TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS template_exercises (
  id UUID PRIMARY KEY,
  template_id UUID REFERENCES workout_templates(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id),
  order_index INTEGER NOT NULL,
  target_sets INTEGER DEFAULT 3,
  target_reps_min INTEGER,
  target_reps_max INTEGER,
  goal_type TEXT CHECK (goal_type IN ('strength', 'hypertrophy', 'accessory')),
  reps_unit TEXT DEFAULT 'reps',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS exercise_alternatives (
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
  alternative_exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
  PRIMARY KEY (exercise_id, alternative_exercise_id)
);
