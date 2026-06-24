import Link from 'next/link'

export default function TodayPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-5rem)] px-6 text-center">
      <h1 className="text-3xl font-bold text-white mb-2">Let&apos;s get to work.</h1>
      <p className="text-secondary-text text-sm mb-12">No workout in progress</p>
      <Link
        href="/workout"
        className="w-full max-w-sm bg-success hover:opacity-90 active:scale-95 text-white font-semibold py-4 rounded-2xl text-lg transition-all duration-150 block text-center"
      >
        Start Workout
      </Link>
    </div>
  )
}
