import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#1c1c1e',
        primary: '#ff5500',
        success: '#8cc63f',
        'secondary-text': '#8e8e93',
        card: '#2c2c2e',
        border: '#3a3a3c',
      },
    },
  },
  plugins: [],
}

export default config
