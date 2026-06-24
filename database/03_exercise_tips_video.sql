-- Step 1: Add video_url column
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Step 2: Update all 30 exercises with structured tips and video links
-- Tips format: Setup | Technique | Feel It (separated by chr(10) newlines)

UPDATE exercises SET
  tips = 'Stand with bar across upper traps, feet shoulder-width, toes slightly out. Brace core and breathe in before descending.' || chr(10) ||
         'Keep chest tall, drive knees out over toes, aim to break parallel. Exhale on the way up and drive through your heels.' || chr(10) ||
         'Quads leading the work, significant glute and hamstring engagement at the bottom of each rep.',
  video_url = 'https://www.youtube.com/results?search_query=barbell+back+squat+form+tutorial'
WHERE name = 'Barbell Back Squat';

UPDATE exercises SET
  tips = 'Bar over mid-foot, hip-width stance. Hinge down, grip just outside legs, arms vertical. Chest up, shoulders slightly over the bar.' || chr(10) ||
         'Push the floor away rather than pulling the bar up. Keep bar close to your body. Lock out by driving hips forward, not leaning back.' || chr(10) ||
         'Lower back, hamstrings and glutes working from the floor. Upper back bracing throughout the entire pull.',
  video_url = 'https://www.youtube.com/results?search_query=conventional+deadlift+form+tutorial'
WHERE name = 'Conventional Deadlift';

UPDATE exercises SET
  tips = 'Lie with eyes under the bar, feet flat on floor. Retract and depress shoulder blades. Grip just wider than shoulder-width.' || chr(10) ||
         'Lower bar to lower chest with elbows at 45°. Touch chest lightly then drive up. Keep wrists stacked over elbows throughout.' || chr(10) ||
         'Chest doing the primary work, with noticeable shoulder and tricep activation on the press.',
  video_url = 'https://www.youtube.com/results?search_query=barbell+bench+press+form+tutorial'
WHERE name = 'Barbell Bench Press';

UPDATE exercises SET
  tips = 'Bar at shoulder height in front rack. Feet hip-width, core and glutes braced tight. Wrists straight over elbows.' || chr(10) ||
         'Press directly overhead, move head back slightly as bar passes. At the top, shrug and push head through. Control the descent.' || chr(10) ||
         'Front and side delts doing most of the work, core actively engaged to prevent lower back arch.',
  video_url = 'https://www.youtube.com/results?search_query=barbell+overhead+press+OHP+form+tutorial'
WHERE name = 'Barbell Overhead Press';

UPDATE exercises SET
  tips = 'Hinge forward to 45°, slight knee bend, back flat. Overhand grip just wider than shoulder-width. Let bar hang from straight arms.' || chr(10) ||
         'Pull bar to lower chest/upper abdomen. Lead with elbows, squeeze shoulder blades together at the top. Lower with control.' || chr(10) ||
         'Mid and upper back (lats and rhomboids) contracting hard at the top. Biceps assisting throughout.',
  video_url = 'https://www.youtube.com/results?search_query=bent+over+barbell+row+form+tutorial'
WHERE name = 'Bent Over Barbell Row';

UPDATE exercises SET
  tips = 'Hold a dumbbell vertically at chest. Feet shoulder-width, toes slightly out. Stand tall before descending.' || chr(10) ||
         'Squat as deep as mobility allows keeping elbows inside knees at the bottom. Chest stays upright. Drive through heels to stand.' || chr(10) ||
         'Quads leading on the way up, glutes engaging noticeably at the top of each rep.',
  video_url = 'https://www.youtube.com/results?search_query=goblet+squat+form+tutorial'
WHERE name = 'Goblet Squat';

UPDATE exercises SET
  tips = 'Stand hip-width, bar at hip height. Soft knees throughout. Overhand grip just outside your hips.' || chr(10) ||
         'Push hips back as you lower the bar along your legs. Stop when you feel a strong hamstring stretch. Drive hips forward to return.' || chr(10) ||
         'Deep hamstring stretch on the way down, glutes squeezing hard to bring you back to standing.',
  video_url = 'https://www.youtube.com/results?search_query=romanian+deadlift+RDL+form+tutorial'
WHERE name = 'Romanian Deadlift';

UPDATE exercises SET
  tips = 'Set bench to 30-45°. Lie back with dumbbells at chest level, elbows at 45° to torso. Shoulder blades pinched back against the pad.' || chr(10) ||
         'Press dumbbells up and slightly together, don''t lock out to keep chest tension. Lower slowly back to starting position over 2-3 seconds.' || chr(10) ||
         'Upper chest doing the primary work, with shoulders noticeably active throughout the full range.',
  video_url = 'https://www.youtube.com/results?search_query=incline+dumbbell+press+form+tutorial'
WHERE name = 'Incline Dumbbell Press';

UPDATE exercises SET
  tips = 'Lie flat on bench, feet on floor. Dumbbells at chest level, elbows at 45°. Shoulder blades pinched back.' || chr(10) ||
         'Press straight up, dumbbells angle slightly inward at the top. Control the descent over 2-3 seconds back to chest level.' || chr(10) ||
         'Mid chest throughout with a greater stretch at the bottom compared to barbell due to wider range of motion.',
  video_url = 'https://www.youtube.com/results?search_query=dumbbell+bench+press+form+tutorial'
WHERE name = 'Dumbbell Bench Press';

UPDATE exercises SET
  tips = 'Sit with thighs under pads, lean back slightly at 75°. Wide overhand grip on the bar.' || chr(10) ||
         'Pull bar to upper chest leading with elbows not hands. Squeeze lats for 1 second. Let arms fully extend at the top.' || chr(10) ||
         'Lats (the wide muscles on the sides of your back) contracting hard as the bar reaches your chest.',
  video_url = 'https://www.youtube.com/results?search_query=lat+pulldown+form+tutorial'
WHERE name = 'Lat Pulldown';

UPDATE exercises SET
  tips = 'Sit tall, feet on platform, slight knee bend. Grab handles with neutral grip, arms fully extended to start.' || chr(10) ||
         'Pull handles to lower chest, drive elbows back. Hold the squeeze 1 second. Return to full extension with control, don''t rock your torso.' || chr(10) ||
         'Mid and upper back contracting. Rhomboids and lats are primary. If you feel it in your lower back, reduce the weight.',
  video_url = 'https://www.youtube.com/results?search_query=seated+cable+row+form+tutorial'
WHERE name = 'Cable Row';

UPDATE exercises SET
  tips = 'Place one hand and same knee on a bench. Hold dumbbell in the other hand, arm straight down, neutral grip.' || chr(10) ||
         'Pull the dumbbell to your hip leading with your elbow. Think elbow to pocket not hand to armpit. Lower with full control.' || chr(10) ||
         'Lat on the working side contracting hard at the top. Back should stay flat — avoid rotating to assist.',
  video_url = 'https://www.youtube.com/results?search_query=dumbbell+row+form+tutorial'
WHERE name = 'Dumbbell Row';

UPDATE exercises SET
  tips = 'Sit or stand with dumbbells at shoulder height, palms facing forward, elbows at 90°. Core braced, back in neutral.' || chr(10) ||
         'Press directly overhead until arms are nearly locked out. Lower back to shoulder height over 2 seconds. Avoid arching lower back.' || chr(10) ||
         'Front and side delts driving the movement, triceps assisting at lockout. Core actively stabilizing.',
  video_url = 'https://www.youtube.com/results?search_query=dumbbell+overhead+shoulder+press+form+tutorial'
WHERE name = 'Dumbbell Overhead Press';

UPDATE exercises SET
  tips = 'Rear foot on bench laces down. Front foot forward enough so shin stays vertical at the bottom. Dumbbells at sides.' || chr(10) ||
         'Drop straight down keeping front shin vertical. Don''t let front knee cave inward. Drive through front heel to stand. Control is everything.' || chr(10) ||
         'Deep quad stretch in the front leg at the bottom, glutes working hard on the way up.',
  video_url = 'https://www.youtube.com/results?search_query=bulgarian+split+squat+form+tutorial'
WHERE name = 'Bulgarian Split Squat';

UPDATE exercises SET
  tips = 'Sit with back against pad, feet hip-width on platform at a comfortable height. Toes slightly pointed out.' || chr(10) ||
         'Lower the platform slowly until knees reach 90°. Don''t let knees cave in. Press through full foot. Never lock out knees at the top.' || chr(10) ||
         'Quads working through the full range. Glutes engage more when feet are placed higher on the platform.',
  video_url = 'https://www.youtube.com/results?search_query=leg+press+machine+form+tutorial'
WHERE name = 'Leg Press';

UPDATE exercises SET
  tips = 'Grip bar just wider than shoulder-width, palms facing away. Start from a full dead hang with arms completely straight.' || chr(10) ||
         'Pull chest toward the bar by driving elbows down and back. Chin clears the bar at the top. Lower fully to dead hang each rep — no kipping.' || chr(10) ||
         'Lats working hard throughout. You should feel lats not traps doing the pulling.',
  video_url = 'https://www.youtube.com/results?search_query=pull+up+proper+form+tutorial'
WHERE name = 'Pull-up';

UPDATE exercises SET
  tips = 'Lie face down with the pad just above your heels. Hips flat against the bench throughout.' || chr(10) ||
         'Curl heels toward glutes in a smooth arc. Pause at the top for 1 second. Lower slowly over 3 seconds — the eccentric builds as much muscle as the lift.' || chr(10) ||
         'Hamstrings under full contraction at the top. Focus on the hard squeeze rather than just moving the weight.',
  video_url = 'https://www.youtube.com/results?search_query=lying+leg+curl+form+tutorial+hamstring'
WHERE name = 'Leg Curl';

UPDATE exercises SET
  tips = 'Sit with knees at the edge of the seat pad. Adjust so the pad sits just above your ankles.' || chr(10) ||
         'Extend legs to fully locked out, hold 1 second at the top. Lower slowly over 3 seconds. Don''t swing or use momentum.' || chr(10) ||
         'Quads (all four heads) contracting, especially the VMO teardrop muscle near the knee at full extension.',
  video_url = 'https://www.youtube.com/results?search_query=leg+extension+machine+form+tutorial'
WHERE name = 'Leg Extension';

UPDATE exercises SET
  tips = 'Stand on a step or calf raise machine, balls of feet on platform, heels hanging off. Hold rails lightly for balance only.' || chr(10) ||
         'Lower heels as far as possible for a full stretch. Rise to maximum height and hold 2 seconds. Slow and controlled — calves respond best to time under tension.' || chr(10) ||
         'Full gastrocnemius stretch at the bottom and hard contraction at the top. Avoid bouncing.',
  video_url = 'https://www.youtube.com/results?search_query=standing+calf+raise+form+tutorial'
WHERE name = 'Standing Calf Raise';

UPDATE exercises SET
  tips = 'Stand with dumbbells at sides, slight bend in elbows, palms facing inward. Slight 10° forward lean at hips.' || chr(10) ||
         'Raise arms out to side to shoulder height only — no higher. Lead with elbows not hands. Lower slowly over 3 seconds.' || chr(10) ||
         'Side (lateral) deltoid burning especially with the slow lowering. Traps should not be shrugging — keep shoulders down.',
  video_url = 'https://www.youtube.com/results?search_query=dumbbell+lateral+raise+side+delt+form+tutorial'
WHERE name = 'Dumbbell Lateral Raise';

UPDATE exercises SET
  tips = 'Stand feet hip-width, barbell with underhand grip shoulder-width. Arms fully extended, elbows pinned at sides to start.' || chr(10) ||
         'Curl the bar up by bending at the elbows only — elbows don''t move forward. Squeeze hard at the top. Lower slowly over 3 seconds.' || chr(10) ||
         'Biceps under full tension throughout, especially during the slow lowering. Avoid swinging the torso.',
  video_url = 'https://www.youtube.com/results?search_query=barbell+bicep+curl+form+tutorial'
WHERE name = 'Barbell Bicep Curl';

UPDATE exercises SET
  tips = 'Stand or sit with dumbbells at sides, palms facing forward. Elbows pinned to your sides throughout.' || chr(10) ||
         'Curl one or both dumbbells up, supinating your wrist so palm faces your shoulder at the top. Lower slowly with control.' || chr(10) ||
         'Peak bicep contraction at the top when fully supinated. The slow lowering creates more muscle tension than the lift.',
  video_url = 'https://www.youtube.com/results?search_query=dumbbell+bicep+curl+proper+form+tutorial'
WHERE name = 'Dumbbell Bicep Curl';

UPDATE exercises SET
  tips = 'Stand at cable machine with rope or bar at chest height. Elbows pinned to sides at 90°. Slight forward lean.' || chr(10) ||
         'Push attachment down to full arm extension. Squeeze triceps hard at the bottom for 1 second. Return to 90° — no higher.' || chr(10) ||
         'All three tricep heads working, especially the lateral head on the outside of the arm.',
  video_url = 'https://www.youtube.com/results?search_query=tricep+pushdown+cable+form+tutorial'
WHERE name = 'Tricep Pushdown';

UPDATE exercises SET
  tips = 'Grip parallel bars shoulder-width. Start with arms fully extended. Slight forward lean to target triceps.' || chr(10) ||
         'Lower until upper arms are parallel to floor (90° bend). Press back to full extension without locking out. Keep torso upright for tricep focus.' || chr(10) ||
         'Triceps driving the movement with chest assisting. Reduce depth if you feel shoulder discomfort.',
  video_url = 'https://www.youtube.com/results?search_query=tricep+dips+form+proper+tutorial'
WHERE name = 'Tricep Dips';

UPDATE exercises SET
  tips = 'Set cable to face height with a rope attachment. Stand back far enough for full arm extension. Grip rope with thumbs pointing toward you.' || chr(10) ||
         'Pull rope to your face, separating hands and rotating thumbs back at the end. Pause 1 second. Use light weight with perfect form — this is a technique exercise.' || chr(10) ||
         'Rear deltoids and upper back (rhomboids) contracting. This is as much corrective work as strength training.',
  video_url = 'https://www.youtube.com/results?search_query=face+pull+form+rear+delt+tutorial'
WHERE name = 'Face Pull';

UPDATE exercises SET
  tips = 'Forearms on the floor, elbows under shoulders, toes on floor. Body in a straight line from head to heels.' || chr(10) ||
         'Squeeze everything simultaneously — glutes, quads and abs all braced at once. Push the floor away with your forearms. Breathe steadily.' || chr(10) ||
         'Core working as one unit to resist gravity. Glutes and quads should be active, not just your abs.',
  video_url = 'https://www.youtube.com/results?search_query=plank+proper+form+core+tutorial'
WHERE name = 'Plank';

UPDATE exercises SET
  tips = 'Kneel facing cable machine with rope attachment. Hold rope at sides of your head. Start in upright kneeling position.' || chr(10) ||
         'Round your spine to crunch down toward your knees — this is NOT a hip hinge. Movement comes entirely from abs shortening. Hold 1 second at the bottom.' || chr(10) ||
         'Deep abdominal contraction from top to bottom. If you feel it in your hips, you are bending from the wrong place.',
  video_url = 'https://www.youtube.com/results?search_query=cable+crunch+abs+form+tutorial'
WHERE name = 'Cable Crunch';

UPDATE exercises SET
  tips = 'Lie on back, arms to ceiling, knees at 90° above hips. Lower back pressed firmly into the floor throughout.' || chr(10) ||
         'Slowly extend one arm overhead while lowering the opposite leg. Return and repeat other side. Move at half the speed you think you should.' || chr(10) ||
         'Deep core (transverse abdominis) keeping your lower back flat. If your back lifts off the floor, you have gone too far.',
  video_url = 'https://www.youtube.com/results?search_query=dead+bug+exercise+form+core+tutorial'
WHERE name = 'Dead Bug';

UPDATE exercises SET
  tips = 'Stand feet hip-width with resistance band anchored behind you. Slight knee bend, hands on hips. Find a neutral spine.' || chr(10) ||
         'Push hips back as if reaching for the wall behind you. Keep back flat, feel hamstrings load up. Drive hips forward to stand, squeeze glutes hard at the top.' || chr(10) ||
         'Hamstring tension building as you hinge back. Glutes firing hard to drive you upright. This is the foundation of every deadlift variation.',
  video_url = 'https://www.youtube.com/results?search_query=hip+hinge+pattern+form+tutorial'
WHERE name = 'Hip Hinge';

UPDATE exercises SET
  tips = 'Sit or stand with dumbbells in front of face, palms facing you, elbows at 90°. Elbows start close together.' || chr(10) ||
         'Press up while rotating palms outward so they face forward at full extension. Reverse the rotation as you lower. Control the full rotation.' || chr(10) ||
         'All three deltoid heads engaged at different phases. Front delts at the start, side delts as you rotate outward.',
  video_url = 'https://www.youtube.com/results?search_query=arnold+press+form+tutorial+shoulder'
WHERE name = 'Arnold Press';
