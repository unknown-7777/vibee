import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // './' makes asset URLs relative. In production, Electron loads index.html
  // from disk (file://), where absolute URLs like '/assets/x.js' would break.
  base: './',
  plugins: [vue(), tailwindcss()],
  server: {
    host: '127.0.0.1', // explicit IPv4, avoids "localhost" resolving to IPv6 ::1
    port: 5173,
    strictPort: true,  // fail loudly instead of silently picking another port
  },
})
