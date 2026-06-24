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

// Epley formula: estimated 1RM
function estimate1RM(weight: number, reps: number): number {
  if (reps <= 1) return weight
  return weight * (1 + reps / 30)
}

const INTENSITY: Record<GoalType, number> = {
  strength: 0.83,
  hypertrophy: 0.72,
  accessory: 0.65,
}

const STARTER_WEIGHTS: Record<GoalType, { weight: number; note: string }> = {
  strength:    { weight: 60, note: 'First session — start here and adjust to what feels like 8/10 effort' },
  hypertrophy: { weight: 20, note: 'First session — last rep of each set should feel like 7–8/10 effort' },
  accessory:   { weight: 10, note: 'First session — focus on form, weight is secondary' },
}

function roundToNearest(value: number, step: number): number {
  return Math.round(value / step) * step
}

export function getRecommendation(
  priorSets: PriorSet[],
  lastRating: number | null,
  targetRepsMin: number,
  targetRepsMax: number,
  goalType: GoalType
): Recommendation {
  if (priorSets.length === 0) {
    const starter = STARTER_WEIGHTS[goalType]
    return {
      weight_kg: starter.weight,
      reps_min: targetRepsMin,
      reps_max: targetRepsMax,
      note: starter.note,
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
    weight_kg: Math.max(weight, 2.5),
    reps_min: targetRepsMin,
    reps_max: targetRepsMax,
    note,
  }
}
