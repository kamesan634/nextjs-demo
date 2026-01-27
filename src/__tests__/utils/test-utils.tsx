/**
 * 測試工具函數
 * 提供測試時共用的 render 函數和 mock 資料
 */

import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

/**
 * 自訂 render 函數 - 包含所有 Provider
 */
function customRender(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  const user = userEvent.setup()

  return {
    user,
    ...render(ui, {
      wrapper: ({ children }) => <>{children}</>,
      ...options,
    }),
  }
}

// 重新匯出 testing-library 的所有功能
export * from '@testing-library/react'
export { customRender as render }

/**
 * Mock 資料生成器
 */
export const mockData = {
  user: (overrides = {}) => ({
    id: 'user-1',
    username: 'testuser',
    name: '測試使用者',
    email: 'test@example.com',
    role: { code: 'ADMIN', name: '系統管理員' },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  customer: (overrides = {}) => ({
    id: 'customer-1',
    code: 'C001',
    name: '測試會員',
    phone: '0912345678',
    email: 'customer@example.com',
    totalPoints: 100,
    level: { name: '一般會員', discountRate: 0 },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  product: (overrides = {}) => ({
    id: 'product-1',
    code: 'P001',
    name: '測試商品',
    description: '測試商品描述',
    sellingPrice: 100,
    costPrice: 50,
    category: { name: '測試分類' },
    unit: { name: '個' },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  order: (overrides = {}) => ({
    id: 'order-1',
    orderNo: 'ORD-20240101-001',
    status: 'PENDING',
    paymentStatus: 'UNPAID',
    totalAmount: 1000,
    paidAmount: 0,
    customer: mockData.customer(),
    items: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  supplier: (overrides = {}) => ({
    id: 'supplier-1',
    code: 'S001',
    name: '測試供應商',
    contactName: '聯絡人',
    phone: '0223456789',
    email: 'supplier@example.com',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  inventory: (overrides = {}) => ({
    id: 'inventory-1',
    productId: 'product-1',
    warehouseId: 'warehouse-1',
    quantity: 100,
    safetyStock: 10,
    product: mockData.product(),
    warehouse: { name: '主倉庫' },
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),
}
