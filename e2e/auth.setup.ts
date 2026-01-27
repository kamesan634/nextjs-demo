/**
 * Playwright 認證設定
 * 在測試前先登入，並保存認證狀態供其他測試使用
 */

import { test as setup, expect } from '@playwright/test'

const authFile = 'e2e/.auth/user.json'

setup('authenticate', async ({ page }) => {
  // 前往登入頁面
  await page.goto('/login')

  // 填寫登入表單
  await page.getByLabel('帳號').fill('admin')
  await page.getByLabel('密碼').fill('password123')

  // 點擊登入按鈕
  await page.getByRole('button', { name: '登入' }).click()

  // 等待導向到 Dashboard
  await page.waitForURL('/')

  // 驗證登入成功
  await expect(page.getByText('儀表板')).toBeVisible()

  // 保存認證狀態
  await page.context().storageState({ path: authFile })
})
