import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env

export default defineConfig({
  base: env?.GITHUB_PAGES === 'true' ? '/Page-Forge/' : '/',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})
