// Templates blend "who/when" with the group's daily momentum. {name} and
// {time} describe the most recent logged workout; {countPhrase} is a
// pre-pluralized phrase like "3 workouts logged today" or "1 workout logged today".
const ACTIVITY_LINE_TEMPLATES: string[] = [
  '⚡ {name} just trained, {time} — {countPhrase}',
  '🔥 {countPhrase}, last one by {name} {time}',
  '{name} kept the streak alive {time}. {countPhrase}',
  'Group pulse: {countPhrase}, most recently {name} {time}',
  '👀 {name} showed up {time} — {countPhrase}',
  'Keep up: {countPhrase}, last move from {name} {time}',
  '{name} just logged one {time}. Squad total: {countPhrase}',
  '💪 {countPhrase} so far — {name} leading the charge {time}',
  'Fresh off the floor: {name}, {time}. {countPhrase}',
  'The grind continues — {name} {time}, {countPhrase}',
  '🏋️ {name} clocked in {time}. {countPhrase}',
  'Squad check-in: {countPhrase}, latest from {name} {time}',
  "{name} isn't slowing down — {time}. {countPhrase}",
  'Activity alert: {name}, {time} — {countPhrase}',
  '🚀 {countPhrase}, momentum from {name} {time}',
  'Last seen grinding: {name}, {time}. {countPhrase}',
  'Group total: {countPhrase}, {name} put in work {time}',
  'Eyes up — {name} just moved, {time}. {countPhrase}',
  '📈 {countPhrase}, thanks to {name} {time}',
  '{name} answered the call {time}. {countPhrase}',
  'Crew update: {countPhrase}, freshest from {name} {time}',
  '🔔 {name} logged in {time} — {countPhrase}',
  'No days off: {name}, {time}. {countPhrase}',
  "The board's moving — {name} {time}, {countPhrase}",
  '✅ {countPhrase}, capped off by {name} {time}',
]

export function getDailyActivityLine(vars: { name: string; time: string; todayCount: number }): string {
  const dayIndex = Math.floor(Date.now() / 86_400_000)
  const template = ACTIVITY_LINE_TEMPLATES[dayIndex % ACTIVITY_LINE_TEMPLATES.length]
  const countPhrase = `${vars.todayCount} workout${vars.todayCount === 1 ? '' : 's'} logged today`

  return template
    .replace('{name}', vars.name)
    .replace('{time}', vars.time)
    .replace('{countPhrase}', countPhrase)
}

export function formatTimeAgo(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime()
  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}
