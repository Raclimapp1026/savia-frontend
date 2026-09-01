import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // Solo activar proxy en desarrollo
    proxy: mode === 'development' ? {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    } : undefined,
  },
}))
