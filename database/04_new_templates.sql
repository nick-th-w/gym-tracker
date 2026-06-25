-- 5 new workout templates
INSERT INTO workout_templates (id, name, description, focus, estimated_duration_minutes, goals) VALUES
('b1000000-0000-0000-0000-000000000006', 'Back & Biceps',     'Pull-focused upper body. Lats, rhomboids and biceps in one hit.',                 'back_biceps',    40, ARRAY['Hypertrophy','Back','Pull']),
('b1000000-0000-0000-0000-000000000007', 'Chest & Triceps',   'Push-focused upper body. Chest strength and tricep volume.',                       'chest_triceps',  40, ARRAY['Hypertrophy','Chest','Push']),
('b1000000-0000-0000-0000-000000000008', 'Shoulders & Arms',  'Isolated shoulder and arm work. Great as a third upper-body day.',                 'shoulders_arms', 35, ARRAY['Hypertrophy','Shoulders','Arms']),
('b1000000-0000-0000-0000-000000000009', 'Legs & Glutes',     'Lower body with a glute emphasis. Squats, hinges and single-leg work.',            'legs_glutes',    45, ARRAY['Strength','Legs','Glutes']),
('b1000000-0000-0000-0000-000000000010', 'Core & Mobility',   'Anti-rotation, stability and hip mobility. Foundation work for everything else.', 'core_mobility',  25, ARRAY['Core','Mobility','Recovery'])
ON CONFLICT (id) DO NOTHING;

-- Back & Biceps
INSERT INTO template_exercises (id, template_id, exercise_id, order_index, target_sets, target_reps_min, target_reps_max, goal_type, reps_unit)
SELECT 'c1000000-0000-0000-0000-000000000027','b1000000-0000-0000-0000-000000000006',e.id,1,3,8,10,'hypertrophy','reps' FROM exercises e WHERE e.name='Bent Over Barbell Row' LIMIT 1 ON CONFLICT (id) DO NOTHING;
INSERT INTO template_exercises (id, template_id, exercise_id, order_index, target_sets, target_reps_min, target_reps_max, goal_type, reps_unit)
SELECT 'c1000000-0000-0000-0000-000000000028','b1000000-0000-0000-0000-000000000006',e.id,2,3,10,12,'hypertrophy','reps' FROM exercises e WHERE e.name='Lat Pulldown' LIMIT 1 ON CONFLICT (id) DO NOTHING;
INSERT INTO template_exercises (id, template_id, exercise_id, order_index, target_sets, target_reps_min, target_reps_max, goal_type, reps_unit)
SELECT 'c1000000-0000-0000-0000-000000000029','b1000000-0000-0000-0000-000000000006',e.id,3,3,10,12,'hypertrophy','reps' FROM exercises e WHERE e.name='Cable Row' LIMIT 1 ON CONFLICT (id) DO NOTHING;
INSERT INTO template_exercises (id, template_id, exercise_id, order_index, target_sets, target_reps_min, target_reps_max, goal_type, reps_unit)
SELECT 'c1000000-0000-0000-0000-000000000030','b1000000-0000-0000-0000-000000000006',e.id,4,3,10,12,'hypertrophy','reps' FROM exercises e WHERE e.name='Dumbbell Row' LIMIT 1 ON CONFLICT (id) DO NOTHING;
INSERT INTO template_exercises (id, template_id, exercise_id, order_index, target_sets, target_reps_min, target_reps_max, goal_type, reps_unit)
SELECT 'c1000000-0000-0000-0000-000000000031','b1000000-0000-0000-0000-000000000006',e.id,5,3,10,12,'accessory','reps' FROM exercises e WHERE e.name='Barbell Bicep Curl' LIMIT 1 ON CONFLICT (id) DO NOTHING;
INSERT INTO template_exercises (id, template_id, exercise_id, order_index, target_sets, target_reps_min, target_reps_max, goal_type, reps_unit)
SELECT 'c1000000-0000-0000-0000-000000000032','b1000000-0000-0000-0000-000000000006',e.id,6,3,12,15,'accessory','reps' FROM exercises e WHERE e.name='Dumbbell Bicep Curl' LIMIT 1 ON CONFLICT (id) DO NOTHING;

-- Chest & Triceps
INSERT INTO template_exercises (id, template_id, exercise_id, order_index, target_sets, target_reps_min, target_reps_max, goal_type, reps_unit)
SELECT 'c1000000-0000-0000-0000-000000000033','b1000000-0000-0000-0000-000000000007',e.id,1,3,6,8,'strength','reps' FROM exercises e WHERE e.name='Barbell Bench Press' LIMIT 1 ON CONFLICT (id) DO NOTHING;
INSERT INTO template_exercises (id, template_id, exercise_id, order_index, target_sets, target_reps_min, target_reps_max, goal_type, reps_unit)
SELECT 'c1000000-0000-0000-0000-000000000034','b1000000-0000-0000-0000-000000000007',e.id,2,3,10,12,'hypertrophy','reps' FROM exercises e WHERE e.name='Incline Dumbbell Press' LIMIT 1 ON CONFLICT (id) DO NOTHING;
INSERT INTO template_exercises (id, template_id, exercise_id, order_index, target_sets, target_reps_min, target_reps_max, goal_type, reps_unit)
SELECT 'c1000000-0000-0000-0000-000000000035','b1000000-0000-0000-0000-000000000007',e.id,3,3,10,12,'hypertrophy','reps' FROM exercises e WHERE e.name='Dumbbell Bench Press' LIMIT 1 ON CONFLICT (id) DO NOTHING;
INSERT INTO template_exercises (id, template_id, exercise_id, order_index, target_sets, target_reps_min, target_reps_max, goal_type, reps_unit)
SELECT 'c1000000-0000-0000-0000-000000000036','b1000000-0000-0000-0000-000000000007',e.id,4,3,12,15,'accessory','reps' FROM exercises e WHERE e.name='Tricep Pushdown' LIMIT 1 ON CONFLICT (id) DO NOTHING;
INSERT INTO template_exercises (id, template_id, exercise_id, order_index, target_sets, target_reps_min, target_reps_max, goal_type, reps_unit)
SELECT 'c1000000-0000-0000-0000-000000000037','b1000000-0000-0000-0000-000000000007',e.id,5,3,10,12,'accessory','reps' FROM exercises e WHERE e.name='Tricep Dips' LIMIT 1 ON CONFLICT (id) DO NOTHING;

-- Shoulders & Arms
INSERT INTO template_exercises (id, template_id, exercise_id, order_index, target_sets, target_reps_min, target_reps_max, goal_type, reps_unit)
SELECT 'c1000000-0000-0000-0000-000000000038','b1000000-0000-0000-0000-000000000008',e.id,1,3,6,8,'strength','reps' FROM exercises e WHERE e.name='Barbell Overhead Press' LIMIT 1 ON CONFLICT (id) DO NOTHING;
INSERT INTO template_exercises (id, template_id, exercise_id, order_index, target_sets, target_reps_min, target_reps_max, goal_type, reps_unit)
SELECT 'c1000000-0000-0000-0000-000000000039','b1000000-0000-0000-0000-000000000008',e.id,2,3,12,15,'accessory','reps' FROM exercises e WHERE e.name='Dumbbell Lateral Raise' LIMIT 1 ON CONFLICT (id) DO NOTHING;
INSERT INTO template_exercises (id, template_id, exercise_id, order_index, target_sets, target_reps_min, target_reps_max, goal_type, reps_unit)
SELECT 'c1000000-0000-0000-0000-000000000040','b1000000-0000-0000-0000-000000000008',e.id,3,3,10,12,'hypertrophy','reps' FROM exercises e WHERE e.name='Arnold Press' LIMIT 1 ON CONFLICT (id) DO NOTHING;
INSERT INTO template_exercises (id, template_id, exercise_id, order_index, target_sets, target_reps_min, target_reps_max, goal_type, reps_unit)
SELECT 'c1000000-0000-0000-0000-000000000041','b1000000-0000-0000-0000-000000000008',e.id,4,3,15,20,'accessory','reps' FROM exercises e WHERE e.name='Face Pull' LIMIT 1 ON CONFLICT (id) DO NOTHING;
INSERT INTO template_exercises (id, template_id, exercise_id, order_index, target_sets, target_reps_min, target_reps_max, goal_type, reps_unit)
SELECT 'c1000000-0000-0000-0000-000000000042','b1000000-0000-0000-0000-000000000008',e.id,5,3,10,12,'accessory','reps' FROM exercises e WHERE e.name='Barbell Bicep Curl' LIMIT 1 ON CONFLICT (id) DO NOTHING;
INSERT INTO template_exercises (id, template_id, exercise_id, order_index, target_sets, target_reps_min, target_reps_max, goal_type, reps_unit)
SELECT 'c1000000-0000-0000-0000-000000000043','b1000000-0000-0000-0000-000000000008',e.id,6,3,12,15,'accessory','reps' FROM exercises e WHERE e.name='Tricep Pushdown' LIMIT 1 ON CONFLICT (id) DO NOTHING;

-- Legs & Glutes
INSERT INTO template_exercises (id, template_id, exercise_id, order_index, target_sets, target_reps_min, target_reps_max, goal_type, reps_unit)
SELECT 'c1000000-0000-0000-0000-000000000044','b1000000-0000-0000-0000-000000000009',e.id,1,3,5,6,'strength','reps' FROM exercises e WHERE e.name='Barbell Back Squat' LIMIT 1 ON CONFLICT (id) DO NOTHING;
INSERT INTO template_exercises (id, template_id, exercise_id, order_index, target_sets, target_reps_min, target_reps_max, goal_type, reps_unit)
SELECT 'c1000000-0000-0000-0000-000000000045','b1000000-0000-0000-0000-000000000009',e.id,2,3,10,12,'hypertrophy','reps' FROM exercises e WHERE e.name='Romanian Deadlift' LIMIT 1 ON CONFLICT (id) DO NOTHING;
INSERT INTO template_exercises (id, template_id, exercise_id, order_index, target_sets, target_reps_min, target_reps_max, goal_type, reps_unit)
SELECT 'c1000000-0000-0000-0000-000000000046','b1000000-0000-0000-0000-000000000009',e.id,3,3,10,12,'hypertrophy','reps' FROM exercises e WHERE e.name='Bulgarian Split Squat' LIMIT 1 ON CONFLICT (id) DO NOTHING;
INSERT INTO template_exercises (id, template_id, exercise_id, order_index, target_sets, target_reps_min, target_reps_max, goal_type, reps_unit)
SELECT 'c1000000-0000-0000-0000-000000000047','b1000000-0000-0000-0000-000000000009',e.id,4,3,10,12,'hypertrophy','reps' FROM exercises e WHERE e.name='Leg Press' LIMIT 1 ON CONFLICT (id) DO NOTHING;
INSERT INTO template_exercises (id, template_id, exercise_id, order_index, target_sets, target_reps_min, target_reps_max, goal_type, reps_unit)
SELECT 'c1000000-0000-0000-0000-000000000048','b1000000-0000-0000-0000-000000000009',e.id,5,3,12,15,'accessory','reps' FROM exercises e WHERE e.name='Leg Curl' LIMIT 1 ON CONFLICT (id) DO NOTHING;
INSERT INTO template_exercises (id, template_id, exercise_id, order_index, target_sets, target_reps_min, target_reps_max, goal_type, reps_unit)
SELECT 'c1000000-0000-0000-0000-000000000049','b1000000-0000-0000-0000-000000000009',e.id,6,3,15,15,'accessory','reps' FROM exercises e WHERE e.name='Standing Calf Raise' LIMIT 1 ON CONFLICT (id) DO NOTHING;

-- Core & Mobility
INSERT INTO template_exercises (id, template_id, exercise_id, order_index, target_sets, target_reps_min, target_reps_max, goal_type, reps_unit)
SELECT 'c1000000-0000-0000-0000-000000000050','b1000000-0000-0000-0000-000000000010',e.id,1,3,10,10,'accessory','reps' FROM exercises e WHERE e.name='Dead Bug' LIMIT 1 ON CONFLICT (id) DO NOTHING;
INSERT INTO template_exercises (id, template_id, exercise_id, order_index, target_sets, target_reps_min, target_reps_max, goal_type, reps_unit)
SELECT 'c1000000-0000-0000-0000-000000000051','b1000000-0000-0000-0000-000000000010',e.id,2,3,30,45,'accessory','sec' FROM exercises e WHERE e.name='Plank' LIMIT 1 ON CONFLICT (id) DO NOTHING;
INSERT INTO template_exercises (id, template_id, exercise_id, order_index, target_sets, target_reps_min, target_reps_max, goal_type, reps_unit)
SELECT 'c1000000-0000-0000-0000-000000000052','b1000000-0000-0000-0000-000000000010',e.id,3,3,15,15,'accessory','reps' FROM exercises e WHERE e.name='Hip Hinge' LIMIT 1 ON CONFLICT (id) DO NOTHING;
INSERT INTO template_exercises (id, template_id, exercise_id, order_index, target_sets, target_reps_min, target_reps_max, goal_type, reps_unit)
SELECT 'c1000000-0000-0000-0000-000000000053','b1000000-0000-0000-0000-000000000010',e.id,4,3,12,15,'accessory','reps' FROM exercises e WHERE e.name='Cable Crunch' LIMIT 1 ON CONFLICT (id) DO NOTHING;
INSERT INTO template_exercises (id, template_id, exercise_id, order_index, target_sets, target_reps_min, target_reps_max, goal_type, reps_unit)
SELECT 'c1000000-0000-0000-0000-000000000054','b1000000-0000-0000-0000-000000000010',e.id,5,3,12,15,'accessory','reps' FROM exercises e WHERE e.name='Goblet Squat' LIMIT 1 ON CONFLICT (id) DO NOTHING;
