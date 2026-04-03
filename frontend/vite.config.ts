import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import eslint from 'vite-plugin-eslint'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss(), eslint()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@map-drafter': path.resolve(__dirname, './src/features/map-drafter'),
    },
  },
})
