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
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: env?.VITE_API_TARGET ?? 'http://localhost:3000',
        changeOrigin: true,
        ws: false,
        configure(proxy) {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('X-Accel-Buffering', 'no')
            proxyReq.setHeader('Cache-Control', 'no-cache')
          })
          proxy.on('proxyRes', (proxyRes) => {
            proxyRes.headers['X-Accel-Buffering'] = 'no'
            proxyRes.headers['Cache-Control'] = 'no-cache, no-transform'
          })
        },
      },
    },
  },
})
