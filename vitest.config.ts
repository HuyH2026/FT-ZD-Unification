import { defineConfig, configDefaults } from 'vitest/config'
import path from 'path'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // Playwright specs in e2e/ run under `pnpm e2e`, not vitest.
    exclude: [...configDefaults.exclude, 'e2e/**'],
  },
})
