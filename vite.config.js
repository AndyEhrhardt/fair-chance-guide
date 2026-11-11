import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Relative asset paths let the same build work at a GitHub Pages project URL.
  base: './',
  plugins: [react()],
})
