/**
 * 會員管理 E2E 測試
 */

import { test, expect } from '@playwright/test'

test.describe('會員管理', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/customers')
  })

  test('應該顯示會員列表頁面', async ({ page }) => {
    // 驗證頁面標題
    await expect(page.getByRole('heading', { name: '會員管理' })).toBeVisible()

    // 驗證新增按鈕
    await expect(page.getByRole('link', { name: /新增會員/ })).toBeVisible()
  })

  test('應該可以搜尋會員', async ({ page }) => {
    // 輸入搜尋關鍵字
    await page.getByPlaceholder(/搜尋/).fill('王')
    await page.getByRole('button', { name: '搜尋' }).click()

    // 等待搜尋結果
    await page.waitForLoadState('networkidle')

    // URL 應該包含搜尋參數
    await expect(page).toHaveURL(/search=王/)
  })

  test('應該可以進入新增會員頁面', async ({ page }) => {
    await page.getByRole('link', { name: /新增會員/ }).click()

    // 驗證導向新增會員頁面
    await expect(page).toHaveURL(/\/customers\/new/)
    await expect(page.getByRole('heading', { name: '新增會員' })).toBeVisible()
  })

  test('應該驗證必填欄位', async ({ page }) => {
    await page.goto('/customers/new')

    // 直接點擊提交（不填任何資料）
    await page.getByRole('button', { name: /儲存|建立/ }).click()

    // 應該顯示錯誤訊息
    await expect(page.getByText(/請輸入|必填/)).toBeVisible()
  })
})

test.describe('會員 CRUD 操作', () => {
  const testCustomer = {
    name: `測試會員_${Date.now()}`,
    phone: '0912345678',
    email: 'test@example.com',
  }

  test('應該可以建立新會員', async ({ page }) => {
    await page.goto('/customers/new')

    // 填寫表單
    await page.getByLabel(/姓名/).fill(testCustomer.name)
    await page.getByLabel(/電話/).fill(testCustomer.phone)
    await page.getByLabel(/Email/).fill(testCustomer.email)

    // 提交表單
    await page.getByRole('button', { name: /儲存|建立/ }).click()

    // 等待導向
    await page.waitForURL(/\/customers($|\?)/)

    // 驗證成功訊息
    await expect(page.getByText(/成功/)).toBeVisible()
  })
})
