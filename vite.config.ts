import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import contactEmail from './server/contact'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'RESEND_')
  return { plugins: [react(), contactEmail(env.RESEND_API_KEY, env.RESEND_FROM || undefined)] }
})
