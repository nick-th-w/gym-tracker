'use client'

import { useState } from 'react'
import { QUOTES } from '@/lib/quotes'
import type { Quote } from '@/lib/quotes'

export default function QuoteCard({ initial }: { initial: Quote }) {
  const [quote, setQuote] = useState(initial)

  function refresh() {
    const others = QUOTES.filter(q => q.text !== quote.text)
    setQuote(others[Math.floor(Math.random() * others.length)])
  }

  return (
    <div className="relative rounded-2xl px-5 py-5" style={{ backgroundColor: '#fb923c' }}>
      <button
        onClick={refresh}
        aria-label="Show another quote"
        className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 active:scale-90 transition-all"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
          <path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 12a9 9 0 0 1-15 6.7L3 16" />
          <polyline points="21 8 21 3 16 3" />
          <polyline points="3 16 3 21 8 21" />
        </svg>
      </button>
      <p className="text-white font-bold text-2xl leading-snug pr-8">&ldquo;{quote.text}&rdquo;</p>
      <p className="text-white/70 text-sm mt-3 font-medium">— {quote.author}</p>
    </div>
  )
}
