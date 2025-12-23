import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/v1/',
  plugins: [react()],
  build: {
    outDir: '../dist/v1',
    emptyOutDir: true
  }
})

