/**
 * Dashboard E2E 測試
 */

import { test, expect } from '@playwright/test'

test.describe('Dashboard 儀表板', () => {
  test('應該顯示儀表板頁面', async ({ page }) => {
    await page.goto('/')

    // 驗證頁面標題
    await expect(page).toHaveTitle(/儀表板|Dashboard/)

    // 驗證統計卡片存在
    await expect(page.getByText('今日營收')).toBeVisible()
    await expect(page.getByText('今日訂單')).toBeVisible()
  })

  test('應該顯示側邊欄導航', async ({ page }) => {
    await page.goto('/')

    // 驗證主要導航項目
    await expect(page.getByRole('link', { name: /商品管理/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /訂單管理/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /庫存管理/ })).toBeVisible()
  })

  test('應該可以導航到各個模組', async ({ page }) => {
    await page.goto('/')

    // 點擊商品管理
    await page.getByRole('link', { name: /商品管理/ }).click()
    await expect(page).toHaveURL(/\/products/)

    // 返回並點擊訂單管理
    await page.goto('/')
    await page.getByRole('link', { name: /訂單管理/ }).click()
    await expect(page).toHaveURL(/\/orders/)
  })
})
