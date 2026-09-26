import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
  ],

  server: {
    host: '0.0.0.0',
    port: 5173,

    hmr: {
      host: '192.168.165.188',
      port: 5173,
    },

    proxy: {
      '/api': {
        target: 'http://192.168.33.82:8081',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})