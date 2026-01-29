import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    // 測試環境
    environment: 'jsdom',

    // 全域設定檔
    setupFiles: ['./src/__tests__/setup.tsx'],

    // 測試檔案 pattern
    include: ['src/**/*.{test,spec}.{ts,tsx}'],

    // 排除檔案
    exclude: ['node_modules', 'e2e'],

    // 覆蓋率設定
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/__tests__/**',
        'src/types/**',
        // Next.js 頁面組件和 API routes (需要 E2E 測試覆蓋)
        'src/app/**/*.tsx',
        'src/app/api/**/*.ts',
        'src/middleware.ts',
        // 第三方整合
        'src/lib/auth.ts',
        'src/lib/prisma.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },

    // 全域變數
    globals: true,

    // CSS 模組
    css: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
