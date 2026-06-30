export type GoalType = 'strength' | 'hypertrophy' | 'accessory'

export interface Group {
  id: string
  name: string
  invite_code: string
  created_by: string
}

export interface GroupMember {
  group_id: string
  user_id: string
  role: 'admin' | 'member'
}

export interface LeaderboardEntry {
  user_id: string
  display_name: string
  all_time_count: number
  weekly_count: number
}

export interface UserProfile {
  user_id: string
  display_name: string | null
  sex: 'male' | 'female' | 'other' | null
  body_weight_kg: number | null
  units: 'kg' | 'lbs'
  experience: 'beginner' | 'intermediate' | 'advanced' | null
  primary_goal: 'strength' | 'hypertrophy' | 'fitness' | 'fat_loss' | null
}

export interface Exercise {
  id: string
  name: string
  muscle_groups: string[]
  equipment: string
  difficulty: string
  tips: string
}

export interface WorkoutTemplate {
  id: string
  name: string
  description: string
  focus: string
  estimated_duration_minutes: number
  goals: string[]
}

export interface TemplateExercise {
  id: string
  template_id: string
  exercise_id: string
  order_index: number
  target_sets: number
  target_reps_min: number
  target_reps_max: number
  goal_type: GoalType
  reps_unit: 'reps' | 'sec'
  exercise: Exercise
  alternatives?: Exercise[]
}

export interface SetLog {
  set_number: number
  weight_kg: number | null
  reps: number | null
  completed: boolean
}

export interface ActiveExercise {
  templateExercise: TemplateExercise
  sets: SetLog[]
  rating: number | null
}
