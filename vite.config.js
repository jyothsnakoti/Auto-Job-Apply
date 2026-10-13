
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],

  server: {
    host: '0.0.0.0',
    port: 5173,

    // Allow external hosts such as ngrok
    allowedHosts: true,

    hmr: {
      host: '192.168.165.188',
      port: 5173,
    },

    proxy: {
      '/api': {
        target: 'http://192.168.1.13:8081',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
