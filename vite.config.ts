import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // KaTeX ships an ESM bundle. Serve it directly when the equations panel loads.
  optimizeDeps: { exclude: ['katex'] },
})
