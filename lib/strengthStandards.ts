// Per-user strength rankings based on 1RM ÷ body weight.
// Thresholds from Symmetric Strength population data (tens of thousands of lifters).
// Only covers exercises with well-established external benchmarks.
// Accessories (cable rows, dumbbells, machines) are intentionally excluded.

export type StrengthRank = 'beginner' | 'intermediate' | 'advanced'

interface Thresholds {
  intermediate: number  // ratio above this → intermediate
  advanced: number      // ratio above this → advanced
}

const STANDARDS: Record<string, { male: Thresholds; female: Thresholds }> = {
  'Barbell Back Squat': {
    male:   { intermediate: 0.75, advanced: 1.50 },
    female: { intermediate: 0.50, advanced: 1.00 },
  },
  'Barbell Bench Press': {
    male:   { intermediate: 0.50, advanced: 1.00 },
    female: { intermediate: 0.30, advanced: 0.65 },
  },
  'Conventional Deadlift': {
    male:   { intermediate: 1.00, advanced: 1.75 },
    female: { intermediate: 0.65, advanced: 1.20 },
  },
  'Barbell Overhead Press': {
    male:   { intermediate: 0.35, advanced: 0.70 },
    female: { intermediate: 0.22, advanced: 0.45 },
  },
  'Bent Over Barbell Row': {
    male:   { intermediate: 0.50, advanced: 1.00 },
    female: { intermediate: 0.32, advanced: 0.65 },
  },
  'Romanian Deadlift': {
    male:   { intermediate: 0.75, advanced: 1.40 },
    female: { intermediate: 0.50, advanced: 0.90 },
  },
}

export const RANK_META: Record<StrengthRank, { label: string; colour: string; bg: string }> = {
  beginner:     { label: 'Beginner',     colour: 'text-success',  bg: 'bg-success/15 border-success/30'  },
  intermediate: { label: 'Intermediate', colour: 'text-primary',  bg: 'bg-primary/15 border-primary/30'  },
  advanced:     { label: 'Advanced',     colour: 'text-amber-400', bg: 'bg-amber-400/15 border-amber-400/30' },
}

export function getStrengthRank(
  exerciseName: string,
  oneRM: number,
  bodyWeightKg: number,
  sex: 'male' | 'female' | 'other' | null,
): StrengthRank | null {
  const standards = STANDARDS[exerciseName]
  if (!standards || !bodyWeightKg || bodyWeightKg <= 0) return null

  const thresholds: Thresholds = sex === 'female'
    ? standards.female
    : sex === 'male'
      ? standards.male
      : {
          intermediate: (standards.male.intermediate + standards.female.intermediate) / 2,
          advanced:     (standards.male.advanced     + standards.female.advanced)     / 2,
        }

  const ratio = oneRM / bodyWeightKg
  if (ratio >= thresholds.advanced)     return 'advanced'
  if (ratio >= thresholds.intermediate) return 'intermediate'
  return 'beginner'
}

export function hasStandards(exerciseName: string): boolean {
  return exerciseName in STANDARDS
}
