import path from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { dataApi } from './server/data-api.ts'

export default defineConfig(({ mode }) => ({
  // A demo é servida em https://m4rtinelli.github.io/financas-demo/
  base: mode === 'demo' ? '/financas-demo/' : '/',
  plugins: [react(), tailwindcss(), dataApi()],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, './src') },
  },
  server: { port: 5180, open: true },
}))
