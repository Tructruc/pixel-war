import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    port: 5173,
    host: true, // allows for external device connection on local network
    cors: true,
    // allow all addresses to connect (not just localhost) - needed for testing on mobile devices
    allowedHosts: true,
    proxy: {
      // prevent CORS error in dev when backend and frontend servers run on different ports
      '^/socket.io/.*': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    }
  }
})
