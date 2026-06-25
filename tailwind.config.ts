import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts}',
  ],
  safelist: [
    'bg-violet-500/20', 'border-violet-500/30',
    'bg-cyan-500/20',   'border-cyan-500/30',
    'bg-amber-500/20',  'border-amber-500/30',
    'bg-red-500/20',    'border-red-500/30',
    'bg-purple-500/20', 'border-purple-500/30',
    'bg-rose-500/20',    'border-rose-500/30',
    'bg-teal-500/20',    'border-teal-500/30',
    'bg-fuchsia-500/20', 'border-fuchsia-500/30',
    'bg-sky-500/20',     'border-sky-500/30',
    'bg-lime-500/20',    'border-lime-500/30',
    'bg-slate-400/20',   'border-slate-400/30',
  ],
  theme: {
    extend: {
      colors: {
        background: '#1c1c1e',
        primary: '#ff5500',
        success: '#8cc63f',
        'secondary-text': '#8e8e93',
        card: '#3a3a3c',
        border: '#525254',
      },
    },
  },
  plugins: [],
}

export default config
