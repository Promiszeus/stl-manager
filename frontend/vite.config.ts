import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    allowedHosts: true, // Allows all hosts like 'stl.lan' when using Traefik
    proxy: {
      '/api': 'http://127.0.0.1:8000',
      '/cache': 'http://127.0.0.1:8000'
    }
  }
})
