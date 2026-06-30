type SoloStatsProps = {
  last7Days: number
  last30Days: number
  allTime: number
}

export default function SoloStats({ last7Days, last30Days, allTime }: SoloStatsProps) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 mb-6">
      <p className="text-secondary-text text-xs uppercase tracking-wide mb-3">Your workouts</p>
      <div className="flex justify-around text-center">
        <div>
          <p className="text-success text-2xl font-bold">{last7Days}</p>
          <p className="text-secondary-text text-xs mt-1">Last 7 days</p>
        </div>
        <div>
          <p className="text-success text-2xl font-bold">{last30Days}</p>
          <p className="text-secondary-text text-xs mt-1">Last 30 days</p>
        </div>
        <div>
          <p className="text-success text-2xl font-bold">{allTime}</p>
          <p className="text-secondary-text text-xs mt-1">All-time</p>
        </div>
      </div>
    </div>
  )
}
