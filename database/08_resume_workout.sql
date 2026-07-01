-- Allow upsert on sets by (workout_exercise_id, set_number)
ALTER TABLE sets ADD CONSTRAINT sets_we_id_set_number_key
  UNIQUE (workout_exercise_id, set_number);
