import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // three.js and all that comes with it lands in one lazy chunk, so the title paints first
    chunkSizeWarningLimit: 1300,
  },
})
