import { GoalType } from './types'

interface PriorSet {
  weight_kg: number
  reps: number
}

export interface Recommendation {
  weight_kg: number
  reps_min: number
  reps_max: number
  note: string
}

function estimate1RM(weight: number, reps: number): number {
  if (reps <= 1) return weight
  return weight * (1 + reps / 30)
}

const INTENSITY: Record<GoalType, number> = {
  strength: 0.83,
  hypertrophy: 0.72,
  accessory: 0.65,
}

// Calibrated for: male ~38yo, 75–80kg, returning to training, targeting 75th percentile
// Dumbbell weights are per-hand
const EXERCISE_STARTERS: Record<string, number> = {
  'Barbell Back Squat':      65,
  'Conventional Deadlift':   85,
  'Barbell Bench Press':     55,
  'Barbell Overhead Press':  37.5,
  'Bent Over Barbell Row':   55,
  'Romanian Deadlift':       57.5,
  'Incline Dumbbell Press':  16,
  'Dumbbell Bench Press':    16,
  'Lat Pulldown':            45,
  'Cable Row':               40,
  'Dumbbell Row':            18,
  'Dumbbell Overhead Press': 14,
  'Bulgarian Split Squat':   12,
  'Leg Press':               80,
  'Pull-up':                 0,
  'Leg Curl':                35,
  'Leg Extension':           40,
  'Standing Calf Raise':     45,
  'Dumbbell Lateral Raise':  8,
  'Barbell Bicep Curl':      30,
  'Dumbbell Bicep Curl':     12,
  'Tricep Pushdown':         22.5,
  'Tricep Dips':             0,
  'Face Pull':               17.5,
  'Goblet Squat':            16,
  'Cable Crunch':            27.5,
  'Arnold Press':            12,
  'Hip Hinge':               0,
  'Plank':                   0,
  'Dead Bug':                0,
}

const GOAL_FALLBACK: Record<GoalType, number> = {
  strength: 60,
  hypertrophy: 20,
  accessory: 10,
}

function roundToNearest(value: number, step: number): number {
  return Math.round(value / step) * step
}

export function getRecommendation(
  priorSets: PriorSet[],
  lastRating: number | null,
  targetRepsMin: number,
  targetRepsMax: number,
  goalType: GoalType,
  exerciseName?: string,
): Recommendation {
  if (priorSets.length === 0) {
    const starterWeight = exerciseName !== undefined && exerciseName in EXERCISE_STARTERS
      ? EXERCISE_STARTERS[exerciseName]
      : GOAL_FALLBACK[goalType]

    return {
      weight_kg: starterWeight,
      reps_min: targetRepsMin,
      reps_max: targetRepsMax,
      note: 'Starting weight — adjust to feel like 7–8/10 effort on your last rep',
    }
  }

  const best1RM = Math.max(...priorSets.map(s => estimate1RM(s.weight_kg, s.reps)))
  let weight = roundToNearest(best1RM * INTENSITY[goalType], 2.5)
  let note = 'Based on your recent performance'

  if (lastRating !== null) {
    if (lastRating <= 2) {
      weight += 5
      note = 'Felt easy last time — pushing the weight up'
    } else if (lastRating === 3) {
      weight += 2.5
      note = 'Right on target last session — small progressive increase'
    } else if (lastRating === 4) {
      note = 'Tough last time — hold weight and nail the reps'
    } else {
      weight = roundToNearest(weight * 0.95, 2.5)
      note = 'Max effort last session — slight drop to keep quality high'
    }
  }

  return {
    weight_kg: Math.max(weight, 0),
    reps_min: targetRepsMin,
    reps_max: targetRepsMax,
    note,
  }
}
