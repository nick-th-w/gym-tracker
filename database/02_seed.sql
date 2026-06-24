-- Run this second in Supabase SQL Editor (after 01_migrations.sql)

-- ============================================================
-- EXERCISES (30 total)
-- ============================================================

INSERT INTO exercises (id, name, muscle_groups, equipment, difficulty, tips) VALUES

-- Primary compounds
('a1000000-0000-0000-0000-000000000001', 'Barbell Back Squat',       ARRAY['Quads','Glutes','Hamstrings'],        'Barbell',         'intermediate', 'Keep chest tall, drive knees out, aim to break parallel'),
('a1000000-0000-0000-0000-000000000002', 'Conventional Deadlift',    ARRAY['Back','Glutes','Hamstrings'],          'Barbell',         'intermediate', 'Hinge at hips, bar over mid-foot, brace hard before pulling'),
('a1000000-0000-0000-0000-000000000003', 'Barbell Bench Press',      ARRAY['Chest','Shoulders','Triceps'],         'Barbell',         'intermediate', 'Retract shoulder blades, lower bar to lower chest, drive feet into floor'),
('a1000000-0000-0000-0000-000000000004', 'Barbell Overhead Press',   ARRAY['Shoulders','Triceps'],                 'Barbell',         'intermediate', 'Brace core, press directly overhead, squeeze glutes'),
('a1000000-0000-0000-0000-000000000005', 'Bent Over Barbell Row',    ARRAY['Back','Biceps'],                       'Barbell',         'intermediate', 'Hinge to 45°, pull bar to lower chest, squeeze shoulder blades together'),

-- Alternative compounds
('a1000000-0000-0000-0000-000000000006', 'Goblet Squat',             ARRAY['Quads','Glutes'],                      'Dumbbell',        'beginner',     'Hold dumbbell at chest, elbows in, squat deep with upright torso'),
('a1000000-0000-0000-0000-000000000007', 'Romanian Deadlift',        ARRAY['Hamstrings','Glutes'],                 'Barbell',         'intermediate', 'Soft knees, push hips back, feel hamstring stretch, return tall'),
('a1000000-0000-0000-0000-000000000008', 'Incline Dumbbell Press',   ARRAY['Chest','Shoulders'],                   'Dumbbell',        'beginner',     'Bench at 30–45°, press from lower chest, control the lowering'),
('a1000000-0000-0000-0000-000000000009', 'Dumbbell Bench Press',     ARRAY['Chest','Shoulders','Triceps'],         'Dumbbell',        'beginner',     'Touch dumbbells at top, lower slowly, elbows at 45° to torso'),
('a1000000-0000-0000-0000-000000000010', 'Lat Pulldown',             ARRAY['Back','Biceps'],                       'Cable Machine',   'beginner',     'Pull to upper chest, lean back slightly, squeeze lats at bottom'),
('a1000000-0000-0000-0000-000000000011', 'Cable Row',                ARRAY['Back','Biceps'],                       'Cable Machine',   'beginner',     'Sit tall, pull to lower chest, hold the squeeze for 1 second'),
('a1000000-0000-0000-0000-000000000012', 'Dumbbell Row',             ARRAY['Back','Biceps'],                       'Dumbbell',        'beginner',     'Brace on bench, pull elbow to hip, keep back flat'),
('a1000000-0000-0000-0000-000000000013', 'Dumbbell Overhead Press',  ARRAY['Shoulders','Triceps'],                 'Dumbbell',        'beginner',     'Press directly up, avoid flaring elbows, brace core throughout'),
('a1000000-0000-0000-0000-000000000014', 'Bulgarian Split Squat',    ARRAY['Quads','Glutes','Hamstrings'],         'Dumbbell',        'intermediate', 'Rear foot elevated, front foot forward, drop knee toward floor'),
('a1000000-0000-0000-0000-000000000015', 'Leg Press',                ARRAY['Quads','Glutes'],                      'Machine',         'beginner',     'Feet hip-width, don''t lock knees at top, control the descent'),
('a1000000-0000-0000-0000-000000000016', 'Pull-up',                  ARRAY['Back','Biceps'],                       'Bodyweight',      'intermediate', 'Dead hang start, pull chest to bar, lower with control'),

-- Isolation
('a1000000-0000-0000-0000-000000000017', 'Leg Curl',                 ARRAY['Hamstrings'],                          'Machine',         'beginner',     'Control the return, hold squeeze at top briefly'),
('a1000000-0000-0000-0000-000000000018', 'Leg Extension',            ARRAY['Quads'],                               'Machine',         'beginner',     'Full extension, slow lowering, avoid swinging'),
('a1000000-0000-0000-0000-000000000019', 'Standing Calf Raise',      ARRAY['Calves'],                              'Machine',         'beginner',     'Full range of motion, pause at top, slow controlled lowering'),
('a1000000-0000-0000-0000-000000000020', 'Dumbbell Lateral Raise',   ARRAY['Shoulders'],                           'Dumbbell',        'beginner',     'Lead with elbows, slight lean forward, raise to shoulder height only'),
('a1000000-0000-0000-0000-000000000021', 'Barbell Bicep Curl',       ARRAY['Biceps'],                              'Barbell',         'beginner',     'Elbows pinned at sides, full extension at bottom, squeeze at top'),
('a1000000-0000-0000-0000-000000000022', 'Dumbbell Bicep Curl',      ARRAY['Biceps'],                              'Dumbbell',        'beginner',     'Supinate wrist at top, elbows stay pinned, alternate or together'),
('a1000000-0000-0000-0000-000000000023', 'Tricep Pushdown',          ARRAY['Triceps'],                             'Cable Machine',   'beginner',     'Elbows at sides, extend fully, control the return'),
('a1000000-0000-0000-0000-000000000024', 'Tricep Dips',              ARRAY['Triceps','Chest'],                     'Bodyweight',      'beginner',     'Slight forward lean, lower to 90°, press fully'),
('a1000000-0000-0000-0000-000000000025', 'Face Pull',                ARRAY['Rear Delts','Upper Back'],             'Cable Machine',   'beginner',     'Pull to face height, rotate hands outward at end, pause briefly'),

-- Core & recovery
('a1000000-0000-0000-0000-000000000026', 'Plank',                    ARRAY['Core'],                                'Bodyweight',      'beginner',     'Straight line head to heels, breathe steadily, don''t let hips sag'),
('a1000000-0000-0000-0000-000000000027', 'Cable Crunch',             ARRAY['Core'],                                'Cable Machine',   'beginner',     'Round spine down, pull to knees, don''t use hip flexors'),
('a1000000-0000-0000-0000-000000000028', 'Dead Bug',                 ARRAY['Core'],                                'Bodyweight',      'beginner',     'Lower back pressed to floor throughout, slow and controlled'),
('a1000000-0000-0000-0000-000000000029', 'Hip Hinge',                ARRAY['Hamstrings','Glutes'],                 'Resistance Band', 'beginner',     'Soft knees, push hips back, feel hamstring tension, return tall'),
('a1000000-0000-0000-0000-000000000030', 'Arnold Press',             ARRAY['Shoulders'],                           'Dumbbell',        'beginner',     'Start with palms facing you, rotate out as you press overhead')

ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- WORKOUT TEMPLATES (5 presets)
-- ============================================================

INSERT INTO workout_templates (id, name, description, focus, estimated_duration_minutes, goals) VALUES
('b1000000-0000-0000-0000-000000000001', 'Full Body A',      'Strength-led full body. Big compound movements hit everything in one session.',         'full_body_a', 35, ARRAY['Strength','Full Body','Compound']),
('b1000000-0000-0000-0000-000000000002', 'Full Body B',      'Posterior chain and pull focus. Deadlift-led for balanced upper and lower development.', 'full_body_b', 40, ARRAY['Strength','Full Body','Posterior Chain']),
('b1000000-0000-0000-0000-000000000003', 'Upper Body',       'Chest, back, shoulders and arms. Higher volume for muscle development.',                 'upper',       40, ARRAY['Hypertrophy','Upper Body','Balanced']),
('b1000000-0000-0000-0000-000000000004', 'Lower Body',       'Quads, hamstrings and glutes. Leg-focused strength and size.',                           'lower',       35, ARRAY['Strength','Lower Body','Legs']),
('b1000000-0000-0000-0000-000000000005', 'Active Recovery',  'Light loading with mobility focus. Ideal for a third session or movement on rest days.', 'recovery',    25, ARRAY['Recovery','Mobility','Core'])
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- TEMPLATE EXERCISES (which exercises are in each template)
-- ============================================================

INSERT INTO template_exercises (id, template_id, exercise_id, order_index, target_sets, target_reps_min, target_reps_max, goal_type, reps_unit) VALUES

-- Full Body A
('c1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 1, 3,  5,  5,  'strength',    'reps'),
('c1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000003', 2, 3,  8,  10, 'hypertrophy', 'reps'),
('c1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000005', 3, 3,  8,  10, 'hypertrophy', 'reps'),
('c1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000004', 4, 3,  8,  10, 'hypertrophy', 'reps'),
('c1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000026', 5, 3, 30,  60, 'accessory',   'sec'),

-- Full Body B
('c1000000-0000-0000-0000-000000000006', 'b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002', 1, 3,  5,  5,  'strength',    'reps'),
('c1000000-0000-0000-0000-000000000007', 'b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000008', 2, 3, 10,  12, 'hypertrophy', 'reps'),
('c1000000-0000-0000-0000-000000000008', 'b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000010', 3, 3, 10,  12, 'hypertrophy', 'reps'),
('c1000000-0000-0000-0000-000000000009', 'b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000007', 4, 3, 10,  12, 'hypertrophy', 'reps'),
('c1000000-0000-0000-0000-000000000010', 'b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000028', 5, 3, 10,  10, 'accessory',   'reps'),

-- Upper Body
('c1000000-0000-0000-0000-000000000011', 'b1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000009', 1, 3, 10,  12, 'hypertrophy', 'reps'),
('c1000000-0000-0000-0000-000000000012', 'b1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000010', 2, 3, 10,  12, 'hypertrophy', 'reps'),
('c1000000-0000-0000-0000-000000000013', 'b1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000013', 3, 3, 10,  12, 'hypertrophy', 'reps'),
('c1000000-0000-0000-0000-000000000014', 'b1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000011', 4, 3, 12,  15, 'hypertrophy', 'reps'),
('c1000000-0000-0000-0000-000000000015', 'b1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000020', 5, 3, 12,  15, 'accessory',   'reps'),
('c1000000-0000-0000-0000-000000000016', 'b1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000023', 6, 3, 12,  15, 'accessory',   'reps'),

-- Lower Body
('c1000000-0000-0000-0000-000000000017', 'b1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000015', 1, 3, 10,  12, 'hypertrophy', 'reps'),
('c1000000-0000-0000-0000-000000000018', 'b1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000007', 2, 3, 10,  12, 'hypertrophy', 'reps'),
('c1000000-0000-0000-0000-000000000019', 'b1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000014', 3, 3, 10,  12, 'hypertrophy', 'reps'),
('c1000000-0000-0000-0000-000000000020', 'b1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000017', 4, 3, 12,  15, 'accessory',   'reps'),
('c1000000-0000-0000-0000-000000000021', 'b1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000019', 5, 3, 15,  15, 'accessory',   'reps'),

-- Active Recovery
('c1000000-0000-0000-0000-000000000022', 'b1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000006', 1, 3, 12,  15, 'accessory',   'reps'),
('c1000000-0000-0000-0000-000000000023', 'b1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000025', 2, 3, 15,  20, 'accessory',   'reps'),
('c1000000-0000-0000-0000-000000000024', 'b1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000029', 3, 3, 15,  15, 'accessory',   'reps'),
('c1000000-0000-0000-0000-000000000025', 'b1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000028', 4, 3, 10,  10, 'accessory',   'reps'),
('c1000000-0000-0000-0000-000000000026', 'b1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000026', 5, 3, 30,  45, 'accessory',   'sec')

ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- EXERCISE ALTERNATIVES (swap options per slot)
-- ============================================================

INSERT INTO exercise_alternatives (exercise_id, alternative_exercise_id) VALUES
-- Squat alternatives
('a1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000006'),
('a1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000014'),
('a1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000015'),
-- Deadlift alternatives
('a1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000007'),
('a1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000029'),
-- Barbell Bench alternatives
('a1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000009'),
('a1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000008'),
-- Overhead Press alternatives
('a1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000013'),
('a1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000030'),
-- Bent Over Row alternatives
('a1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000011'),
('a1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000012'),
-- Lat Pulldown alternatives
('a1000000-0000-0000-0000-000000000010', 'a1000000-0000-0000-0000-000000000016'),
('a1000000-0000-0000-0000-000000000010', 'a1000000-0000-0000-0000-000000000011'),
-- Romanian Deadlift alternatives
('a1000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000017'),
('a1000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000029'),
-- Leg Press alternatives
('a1000000-0000-0000-0000-000000000015', 'a1000000-0000-0000-0000-000000000001'),
('a1000000-0000-0000-0000-000000000015', 'a1000000-0000-0000-0000-000000000014'),
-- Incline DB Press alternatives
('a1000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000003'),
('a1000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000009'),
-- DB Bench alternatives
('a1000000-0000-0000-0000-000000000009', 'a1000000-0000-0000-0000-000000000003'),
('a1000000-0000-0000-0000-000000000009', 'a1000000-0000-0000-0000-000000000008'),
-- DB OHP alternatives
('a1000000-0000-0000-0000-000000000013', 'a1000000-0000-0000-0000-000000000004'),
('a1000000-0000-0000-0000-000000000013', 'a1000000-0000-0000-0000-000000000030'),
-- Bulgarian Split Squat alternatives
('a1000000-0000-0000-0000-000000000014', 'a1000000-0000-0000-0000-000000000001'),
('a1000000-0000-0000-0000-000000000014', 'a1000000-0000-0000-0000-000000000006')

ON CONFLICT (exercise_id, alternative_exercise_id) DO NOTHING;
