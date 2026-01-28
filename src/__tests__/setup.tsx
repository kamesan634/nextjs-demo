/**
 * Vitest 測試環境設定
 * 在每次測試前執行的初始化設定
 */

import React from 'react'
import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Polyfill for Radix UI components in jsdom
if (typeof Element !== 'undefined') {
  Element.prototype.hasPointerCapture = () => false
  Element.prototype.setPointerCapture = () => {}
  Element.prototype.releasePointerCapture = () => {}
  Element.prototype.scrollIntoView = vi.fn()
}

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}))

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}))

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  },
  Toaster: () => null,
}))

// 建立完整的 Mock Prisma Client
const createMockModel = () => ({
  findUnique: vi.fn(),
  findFirst: vi.fn(),
  findMany: vi.fn(),
  create: vi.fn(),
  createMany: vi.fn(),
  update: vi.fn(),
  updateMany: vi.fn(),
  upsert: vi.fn(),
  delete: vi.fn(),
  deleteMany: vi.fn(),
  count: vi.fn(),
  aggregate: vi.fn(),
  groupBy: vi.fn(),
})

export const mockPrisma = {
  user: createMockModel(),
  customer: createMockModel(),
  customerLevel: createMockModel(),
  product: createMockModel(),
  order: createMockModel(),
  orderItem: createMockModel(),
  supplier: createMockModel(),
  supplierPrice: createMockModel(),
  inventory: createMockModel(),
  inventoryMovement: createMockModel(),
  promotion: createMockModel(),
  promotionProduct: createMockModel(),
  coupon: createMockModel(),
  couponUsage: createMockModel(),
  purchaseOrder: createMockModel(),
  purchaseOrderItem: createMockModel(),
  purchaseReceipt: createMockModel(),
  purchaseReceiptItem: createMockModel(),
  category: createMockModel(),
  store: createMockModel(),
  warehouse: createMockModel(),
  role: createMockModel(),
  permission: createMockModel(),
  paymentMethod: createMockModel(),
  unit: createMockModel(),
  taxType: createMockModel(),
  pointsLog: createMockModel(),
  payment: createMockModel(),
  numberingRule: createMockModel(),
  auditLog: createMockModel(),
  pOSSession: createMockModel(),
  cashierShift: createMockModel(),
  holdOrder: createMockModel(),
  invoice: createMockModel(),
  goodsIssue: createMockModel(),
  goodsIssueItem: createMockModel(),
  refund: createMockModel(),
  refundItem: createMockModel(),
  systemParameter: createMockModel(),
  customReport: createMockModel(),
  scheduledReport: createMockModel(),
  productBundle: createMockModel(),
  productBundleItem: createMockModel(),
  priceRule: createMockModel(),
  $transaction: vi.fn((callback) => {
    if (typeof callback === 'function') {
      return callback(mockPrisma)
    }
    return Promise.all(callback)
  }),
  $queryRaw: vi.fn(),
  $executeRaw: vi.fn(),
  $connect: vi.fn(),
  $disconnect: vi.fn(),
}

// Mock Prisma Client
vi.mock('@/lib/prisma', () => ({
  default: mockPrisma,
}))
