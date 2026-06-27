'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
      <p className="text-4xl mb-4">⚠️</p>
      <h1 className="text-xl font-bold text-white mb-2">Something went wrong</h1>
      <p className="text-secondary-text text-sm mb-8">
        A temporary error occurred. Your data is safe.
      </p>
      <button
        onClick={reset}
        className="bg-success text-white font-semibold px-6 py-3 rounded-2xl active:scale-95 transition-all"
      >
        Try again
      </button>
    </div>
  )
}
