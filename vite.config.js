
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],

  resolve: {
    dedupe: ['react', 'react-dom'],
  },

  server: {
    host: '0.0.0.0',
    port: 5173,

    // Allow external hosts such as ngrok
    allowedHosts: true,

    proxy: {
      '/api': {
        target: 'http://192.168.1.8:8081',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
