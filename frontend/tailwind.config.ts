import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx,css}'],
  theme: {
    extend: {
      colors: {
        primary: '#8b5cf6',      // violet-500
        secondary: '#06b6d4',    // cyan-500
        accent: '#f59e0b',       // amber-500
        background: '#0a0b12',   // near-black
        surface: '#11131e',
        foreground: '#e2e8f0',   // slate-200
        destructive: '#ef4444',
        muted: '#64748b',        // slate-500
        'muted-foreground': '#94a3b8',
        border: '#272b41',
        success: '#10b981',      // emerald-500
        warning: '#f59e0b',
        error: '#ef4444',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
      },
    },
  },
  plugins: [],
}

export default config
