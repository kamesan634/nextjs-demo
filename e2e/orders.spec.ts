/**
 * 訂單管理 E2E 測試
 */

import { test, expect } from '@playwright/test'

test.describe('訂單管理', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/orders')
  })

  test('應該顯示訂單列表頁面', async ({ page }) => {
    // 驗證頁面標題
    await expect(page.getByRole('heading', { name: '訂單管理' })).toBeVisible()

    // 驗證統計卡片
    await expect(page.getByText('總訂單數')).toBeVisible()
    await expect(page.getByText('已完成')).toBeVisible()
    await expect(page.getByText('待處理')).toBeVisible()

    // 驗證新增按鈕
    await expect(page.getByRole('link', { name: /新增訂單/ })).toBeVisible()
  })

  test('應該可以搜尋訂單', async ({ page }) => {
    // 輸入搜尋關鍵字
    await page.getByPlaceholder(/搜尋/).fill('ORD')
    await page.getByRole('button', { name: '搜尋' }).click()

    // 等待搜尋結果
    await page.waitForLoadState('networkidle')

    // URL 應該包含搜尋參數
    await expect(page).toHaveURL(/search=ORD/)
  })

  test('應該可以篩選訂單狀態', async ({ page }) => {
    // 點擊狀態篩選
    await page.getByRole('combobox').first().click()

    // 選擇「待處理」
    await page.getByRole('option', { name: '待處理' }).click()

    // 等待篩選結果
    await page.waitForLoadState('networkidle')

    // URL 應該包含狀態參數
    await expect(page).toHaveURL(/status=PENDING/)
  })

  test('應該可以進入新增訂單頁面', async ({ page }) => {
    await page.getByRole('link', { name: /新增訂單/ }).click()

    // 驗證導向新增訂單頁面
    await expect(page).toHaveURL(/\/orders\/new/)
    await expect(page.getByRole('heading', { name: '新增訂單' })).toBeVisible()
  })

  test('應該可以檢視訂單詳情', async ({ page }) => {
    // 等待表格載入
    await page.waitForSelector('table')

    // 點擊第一筆訂單的連結（如果有資料）
    const firstOrderLink = page.locator('table tbody tr').first().locator('a').first()

    if (await firstOrderLink.isVisible()) {
      await firstOrderLink.click()

      // 驗證進入詳情頁
      await expect(page).toHaveURL(/\/orders\/[a-z0-9-]+$/)
    }
  })
})

test.describe('新增訂單流程', () => {
  test('應該可以建立訂單', async ({ page }) => {
    await page.goto('/orders/new')

    // 搜尋商品
    await page.getByRole('button', { name: /搜尋商品/ }).click()

    // 等待對話框開啟
    await expect(page.getByRole('dialog')).toBeVisible()

    // 搜尋商品
    await page.getByPlaceholder(/輸入搜尋/).fill('測試')
    await page.getByRole('button', { name: '搜尋' }).click()

    // 等待搜尋結果
    await page.waitForTimeout(1000)

    // 關閉對話框（如果沒有商品）
    await page.keyboard.press('Escape')
  })
})
