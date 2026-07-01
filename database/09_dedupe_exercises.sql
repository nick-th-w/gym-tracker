-- Remove exercise name duplicates introduced by singular/plural and capitalisation
-- mismatches between seed exercises and the free-exercise-db import.
--
-- Strategy: keep the seeded record (fixed UUID), reassign any references from
-- the imported duplicate to the seeded one, then delete the imported duplicate.
-- Runs safely on a clean DB (CTEs return nothing if duplicates don't exist).

DO $$
DECLARE
  -- Pairs: (seed_name, imported_name)
  pairs TEXT[][] := ARRAY[
    ARRAY['Leg Extension',      'Leg Extensions'],
    ARRAY['Standing Calf Raise','Standing Calf Raises'],
    ARRAY['Tricep Pushdown',    'Triceps Pushdown']
  ];
  pair TEXT[];
  seed_id   UUID;
  import_id UUID;
BEGIN
  FOREACH pair SLICE 1 IN ARRAY pairs LOOP
    SELECT id INTO seed_id   FROM exercises WHERE name = pair[1] LIMIT 1;
    SELECT id INTO import_id FROM exercises WHERE name = pair[2] LIMIT 1;

    IF seed_id IS NOT NULL AND import_id IS NOT NULL THEN
      -- Reassign workout_exercises rows
      UPDATE workout_exercises SET exercise_id = seed_id   WHERE exercise_id = import_id;
      -- Reassign exercise_alternatives rows
      UPDATE exercise_alternatives SET exercise_id             = seed_id WHERE exercise_id             = import_id;
      UPDATE exercise_alternatives SET alternative_exercise_id = seed_id WHERE alternative_exercise_id = import_id;
      -- Remove the duplicate
      DELETE FROM exercises WHERE id = import_id;
      RAISE NOTICE 'Merged "%" into "%"', pair[2], pair[1];
    ELSE
      RAISE NOTICE 'Skipping pair "%" / "%" — one or both not found', pair[1], pair[2];
    END IF;
  END LOOP;

  -- Handle the import-only duplicate: keep the first-inserted one
  DECLARE
    keep_id   UUID;
    remove_id UUID;
  BEGIN
    SELECT id INTO keep_id   FROM exercises WHERE name = 'Squat with Bands'    LIMIT 1;
    SELECT id INTO remove_id FROM exercises WHERE name = 'Squats - With Bands' LIMIT 1;

    IF keep_id IS NOT NULL AND remove_id IS NOT NULL THEN
      UPDATE workout_exercises  SET exercise_id             = keep_id WHERE exercise_id             = remove_id;
      UPDATE exercise_alternatives SET exercise_id          = keep_id WHERE exercise_id             = remove_id;
      UPDATE exercise_alternatives SET alternative_exercise_id = keep_id WHERE alternative_exercise_id = remove_id;
      DELETE FROM exercises WHERE id = remove_id;
      RAISE NOTICE 'Merged "Squats - With Bands" into "Squat with Bands"';
    ELSE
      RAISE NOTICE 'Skipping Squat with Bands pair — one or both not found';
    END IF;
  END;
END $$;
