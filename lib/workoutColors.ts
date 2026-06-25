const COLORS = {
  full_body_a: { bg: 'bg-violet-500/20', border: 'border-violet-500/30' },
  full_body_b: { bg: 'bg-cyan-500/20',   border: 'border-cyan-500/30'   },
  upper:       { bg: 'bg-amber-500/20',  border: 'border-amber-500/30'  },
  lower:       { bg: 'bg-red-500/20',    border: 'border-red-500/30'    },
  recovery:    { bg: 'bg-purple-500/20', border: 'border-purple-500/30' },
} as const

const NAME_TO_FOCUS: Record<string, keyof typeof COLORS> = {
  'Full Body A':    'full_body_a',
  'Full Body B':    'full_body_b',
  'Upper Body':     'upper',
  'Lower Body':     'lower',
  'Active Recovery':'recovery',
}

const CUSTOM = { bg: 'bg-rose-500/20', border: 'border-rose-500/30' }

export function workoutColors(key: string) {
  const focus = (NAME_TO_FOCUS[key] ?? key) as keyof typeof COLORS
  return COLORS[focus] ?? CUSTOM // unknown name = custom workout = rose
}
