import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright E2E 測試設定
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // 測試目錄
  testDir: './e2e',

  // 測試檔案 pattern
  testMatch: '**/*.spec.ts',

  // 完全平行執行
  fullyParallel: true,

  // CI 環境禁止 test.only
  forbidOnly: !!process.env.CI,

  // CI 環境重試次數
  retries: process.env.CI ? 2 : 0,

  // CI 環境 worker 數量
  workers: process.env.CI ? 1 : undefined,

  // 報告器
  reporter: [['html', { outputFolder: 'playwright-report' }], ['list']],

  // 全域設定
  use: {
    // 基礎 URL
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',

    // 追蹤設定（失敗時收集）
    trace: 'on-first-retry',

    // 截圖設定
    screenshot: 'only-on-failure',

    // 影片設定
    video: 'on-first-retry',
  },

  // 專案設定（多瀏覽器測試）
  projects: [
    // 設定專案：登入狀態
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },

    // Chromium 測試
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },

    // Firefox 測試（可選）
    // {
    //   name: 'firefox',
    //   use: {
    //     ...devices['Desktop Firefox'],
    //     storageState: 'e2e/.auth/user.json',
    //   },
    //   dependencies: ['setup'],
    // },

    // WebKit 測試（可選）
    // {
    //   name: 'webkit',
    //   use: {
    //     ...devices['Desktop Safari'],
    //     storageState: 'e2e/.auth/user.json',
    //   },
    //   dependencies: ['setup'],
    // },

    // 手機測試（可選）
    // {
    //   name: 'Mobile Chrome',
    //   use: {
    //     ...devices['Pixel 5'],
    //     storageState: 'e2e/.auth/user.json',
    //   },
    //   dependencies: ['setup'],
    // },
  ],

  // 開發伺服器（測試前自動啟動）
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
})
