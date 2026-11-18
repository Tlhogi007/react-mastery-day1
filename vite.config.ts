import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Ensure all exercise files are included
  server: {
    watch: {
      usePolling: true,
    }
  }
})