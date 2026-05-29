import type { Config } from 'tailwindcss'

export default {
  content: [
    './index.html',
    './src/**/*.{vue,ts,tsx}',
  ],
  theme: {
    extend: {},
  },
  safelist: [
    { pattern: /^grid-cols-[1-4]$/, variants: ['md'] },
    { pattern: /^gap-\d+$/ },
  ],
  plugins: [],
} satisfies Config
