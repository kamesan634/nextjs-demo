/**
 * POS Cart Server Actions 測試
 * 測試 POS 購物車訂單相關的 Server Actions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPOSOrder } from '@/actions/pos-cart'
import prisma from '@/lib/prisma'

// Mock revalidatePath
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

describe('POS Cart Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createPOSOrder', () => {
    const validOrderData = {
      storeId: 'store-1',
      userId: 'user-1',
      items: [
        {
          productId: 'product-1',
          productName: '測試商品',
          productSku: 'SKU001',
          quantity: 2,
          unitPrice: 100,
          discount: 0,
        },
      ],
      payments: [
        {
          paymentMethodId: 'pm-cash',
          amount: 210,
        },
      ],
    }

    it('應成功建立 POS 訂單', async () => {
      // Mock 庫存檢查
      vi.mocked(prisma.inventory.findFirst).mockResolvedValue({
        productId: 'product-1',
        availableQty: 100,
      } as never)

      // Mock 生成訂單編號
      vi.mocked(prisma.order.findFirst).mockResolvedValue(null)

      // Mock transaction
      vi.mocked(prisma.$transaction).mockImplementation(
        async (callback: (tx: unknown) => Promise<unknown>) => {
          const txPrisma = {
            order: {
              create: vi.fn().mockResolvedValue({
                id: 'order-1',
                orderNo: 'ORD-20240115-0001',
              }),
              update: vi.fn().mockResolvedValue({}),
            },
            orderItem: {
              create: vi.fn().mockResolvedValue({}),
            },
            inventory: {
              updateMany: vi.fn().mockResolvedValue({ count: 1 }),
            },
            payment: {
              create: vi.fn().mockResolvedValue({}),
            },
            customer: {
              findUnique: vi.fn().mockResolvedValue(null),
              update: vi.fn().mockResolvedValue({}),
            },
            pointsLog: {
              create: vi.fn().mockResolvedValue({}),
            },
          }
          return callback(txPrisma)
        }
      )

      const result = await createPOSOrder(validOrderData)

      expect(result.success).toBe(true)
      expect(result.message).toBe('訂單建立成功')
      expect(result.data).toHaveProperty('orderId')
      expect(result.data).toHaveProperty('orderNo')
    })

    it('商品無庫存記錄時應回傳錯誤', async () => {
      vi.mocked(prisma.inventory.findFirst).mockResolvedValue(null)

      const result = await createPOSOrder(validOrderData)

      expect(result.success).toBe(false)
      expect(result.message).toBe('商品 測試商品 無庫存記錄')
    })

    it('商品庫存不足時應回傳錯誤', async () => {
      vi.mocked(prisma.inventory.findFirst).mockResolvedValue({
        productId: 'product-1',
        availableQty: 1, // 庫存只有 1，需求是 2
      } as never)

      const result = await createPOSOrder(validOrderData)

      expect(result.success).toBe(false)
      expect(result.message).toBe('商品 測試商品 庫存不足，可用數量：1')
    })

    it('付款金額不足時應回傳錯誤', async () => {
      vi.mocked(prisma.inventory.findFirst).mockResolvedValue({
        productId: 'product-1',
        availableQty: 100,
      } as never)

      const insufficientPaymentData = {
        ...validOrderData,
        payments: [
          {
            paymentMethodId: 'pm-cash',
            amount: 100, // 不足以支付 210 (200 + 5% 稅)
          },
        ],
      }

      const result = await createPOSOrder(insufficientPaymentData)

      expect(result.success).toBe(false)
      expect(result.message).toContain('付款金額不足')
    })

    it('應正確計算訂單金額（含稅）', async () => {
      vi.mocked(prisma.inventory.findFirst).mockResolvedValue({
        productId: 'product-1',
        availableQty: 100,
      } as never)
      vi.mocked(prisma.order.findFirst).mockResolvedValue(null)

      let capturedOrderData: Record<string, unknown> | null = null
      vi.mocked(prisma.$transaction).mockImplementation(
        async (callback: (tx: unknown) => Promise<unknown>) => {
          const txPrisma = {
            order: {
              create: vi.fn().mockImplementation((data: Record<string, unknown>) => {
                capturedOrderData = data.data
                return { id: 'order-1', orderNo: 'ORD-20240115-0001' }
              }),
              update: vi.fn().mockResolvedValue({}),
            },
            orderItem: { create: vi.fn().mockResolvedValue({}) },
            inventory: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
            payment: { create: vi.fn().mockResolvedValue({}) },
            customer: {
              findUnique: vi.fn().mockResolvedValue(null),
              update: vi.fn().mockResolvedValue({}),
            },
            pointsLog: { create: vi.fn().mockResolvedValue({}) },
          }
          return callback(txPrisma)
        }
      )

      await createPOSOrder(validOrderData)

      // 小計：2 * 100 = 200
      // 稅額：200 * 0.05 = 10
      // 總額：210
      expect(capturedOrderData?.subtotal).toBe(200)
      expect(capturedOrderData?.taxAmount).toBe(10)
      expect(capturedOrderData?.totalAmount).toBe(210)
    })

    it('應正確計算找零金額', async () => {
      vi.mocked(prisma.inventory.findFirst).mockResolvedValue({
        productId: 'product-1',
        availableQty: 100,
      } as never)
      vi.mocked(prisma.order.findFirst).mockResolvedValue(null)

      let capturedOrderData: Record<string, unknown> | null = null
      vi.mocked(prisma.$transaction).mockImplementation(
        async (callback: (tx: unknown) => Promise<unknown>) => {
          const txPrisma = {
            order: {
              create: vi.fn().mockImplementation((data: Record<string, unknown>) => {
                capturedOrderData = data.data
                return { id: 'order-1', orderNo: 'ORD-20240115-0001' }
              }),
              update: vi.fn().mockResolvedValue({}),
            },
            orderItem: { create: vi.fn().mockResolvedValue({}) },
            inventory: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
            payment: { create: vi.fn().mockResolvedValue({}) },
            customer: {
              findUnique: vi.fn().mockResolvedValue(null),
              update: vi.fn().mockResolvedValue({}),
            },
            pointsLog: { create: vi.fn().mockResolvedValue({}) },
          }
          return callback(txPrisma)
        }
      )

      const orderWithExtraPayment = {
        ...validOrderData,
        payments: [{ paymentMethodId: 'pm-cash', amount: 300 }], // 多付 90
      }

      await createPOSOrder(orderWithExtraPayment)

      expect(capturedOrderData?.changeAmount).toBe(90) // 300 - 210 = 90
    })

    it('應處理多商品訂單', async () => {
      vi.mocked(prisma.inventory.findFirst)
        .mockResolvedValueOnce({ productId: 'product-1', availableQty: 100 } as never)
        .mockResolvedValueOnce({ productId: 'product-2', availableQty: 50 } as never)
      vi.mocked(prisma.order.findFirst).mockResolvedValue(null)

      let orderItemCreateCount = 0
      vi.mocked(prisma.$transaction).mockImplementation(
        async (callback: (tx: unknown) => Promise<unknown>) => {
          const txPrisma = {
            order: {
              create: vi.fn().mockResolvedValue({ id: 'order-1', orderNo: 'ORD-20240115-0001' }),
              update: vi.fn().mockResolvedValue({}),
            },
            orderItem: {
              create: vi.fn().mockImplementation(() => {
                orderItemCreateCount++
                return {}
              }),
            },
            inventory: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
            payment: { create: vi.fn().mockResolvedValue({}) },
            customer: {
              findUnique: vi.fn().mockResolvedValue(null),
              update: vi.fn().mockResolvedValue({}),
            },
            pointsLog: { create: vi.fn().mockResolvedValue({}) },
          }
          return callback(txPrisma)
        }
      )

      const multiItemOrder = {
        ...validOrderData,
        items: [
          {
            productId: 'product-1',
            productName: '商品1',
            productSku: 'SKU001',
            quantity: 2,
            unitPrice: 100,
          },
          {
            productId: 'product-2',
            productName: '商品2',
            productSku: 'SKU002',
            quantity: 1,
            unitPrice: 200,
          },
        ],
        payments: [{ paymentMethodId: 'pm-cash', amount: 500 }],
      }

      const result = await createPOSOrder(multiItemOrder)

      expect(result.success).toBe(true)
      expect(orderItemCreateCount).toBe(2)
    })

    it('有會員時應增加點數', async () => {
      vi.mocked(prisma.inventory.findFirst).mockResolvedValue({
        productId: 'product-1',
        availableQty: 100,
      } as never)
      vi.mocked(prisma.order.findFirst).mockResolvedValue(null)

      let pointsLogCreated = false
      let customerUpdated = false
      vi.mocked(prisma.$transaction).mockImplementation(
        async (callback: (tx: unknown) => Promise<unknown>) => {
          const txPrisma = {
            order: {
              create: vi.fn().mockResolvedValue({ id: 'order-1', orderNo: 'ORD-20240115-0001' }),
              update: vi.fn().mockResolvedValue({}),
            },
            orderItem: { create: vi.fn().mockResolvedValue({}) },
            inventory: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
            payment: { create: vi.fn().mockResolvedValue({}) },
            customer: {
              findUnique: vi.fn().mockResolvedValue({ id: 'customer-1', availablePoints: 100 }),
              update: vi.fn().mockImplementation(() => {
                customerUpdated = true
                return {}
              }),
            },
            pointsLog: {
              create: vi.fn().mockImplementation(() => {
                pointsLogCreated = true
                return {}
              }),
            },
          }
          return callback(txPrisma)
        }
      )

      const orderWithCustomer = {
        ...validOrderData,
        customerId: 'customer-1',
      }

      await createPOSOrder(orderWithCustomer)

      expect(pointsLogCreated).toBe(true)
      expect(customerUpdated).toBe(true)
    })

    it('應支援多種付款方式', async () => {
      vi.mocked(prisma.inventory.findFirst).mockResolvedValue({
        productId: 'product-1',
        availableQty: 100,
      } as never)
      vi.mocked(prisma.order.findFirst).mockResolvedValue(null)

      let paymentCreateCount = 0
      vi.mocked(prisma.$transaction).mockImplementation(
        async (callback: (tx: unknown) => Promise<unknown>) => {
          const txPrisma = {
            order: {
              create: vi.fn().mockResolvedValue({ id: 'order-1', orderNo: 'ORD-20240115-0001' }),
              update: vi.fn().mockResolvedValue({}),
            },
            orderItem: { create: vi.fn().mockResolvedValue({}) },
            inventory: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
            payment: {
              create: vi.fn().mockImplementation(() => {
                paymentCreateCount++
                return {}
              }),
            },
            customer: {
              findUnique: vi.fn().mockResolvedValue(null),
              update: vi.fn().mockResolvedValue({}),
            },
            pointsLog: { create: vi.fn().mockResolvedValue({}) },
          }
          return callback(txPrisma)
        }
      )

      const multiPaymentOrder = {
        ...validOrderData,
        payments: [
          { paymentMethodId: 'pm-cash', amount: 110 },
          { paymentMethodId: 'pm-card', amount: 100 },
        ],
      }

      await createPOSOrder(multiPaymentOrder)

      expect(paymentCreateCount).toBe(2)
    })

    it('應處理商品折扣', async () => {
      vi.mocked(prisma.inventory.findFirst).mockResolvedValue({
        productId: 'product-1',
        availableQty: 100,
      } as never)
      vi.mocked(prisma.order.findFirst).mockResolvedValue(null)

      let capturedOrderData: Record<string, unknown> | null = null
      vi.mocked(prisma.$transaction).mockImplementation(
        async (callback: (tx: unknown) => Promise<unknown>) => {
          const txPrisma = {
            order: {
              create: vi.fn().mockImplementation((data: Record<string, unknown>) => {
                capturedOrderData = data.data
                return { id: 'order-1', orderNo: 'ORD-20240115-0001' }
              }),
              update: vi.fn().mockResolvedValue({}),
            },
            orderItem: { create: vi.fn().mockResolvedValue({}) },
            inventory: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
            payment: { create: vi.fn().mockResolvedValue({}) },
            customer: {
              findUnique: vi.fn().mockResolvedValue(null),
              update: vi.fn().mockResolvedValue({}),
            },
            pointsLog: { create: vi.fn().mockResolvedValue({}) },
          }
          return callback(txPrisma)
        }
      )

      const orderWithDiscount = {
        ...validOrderData,
        items: [
          {
            productId: 'product-1',
            productName: '測試商品',
            productSku: 'SKU001',
            quantity: 2,
            unitPrice: 100,
            discount: 20, // 折扣 20 元
          },
        ],
        payments: [{ paymentMethodId: 'pm-cash', amount: 200 }],
      }

      await createPOSOrder(orderWithDiscount)

      // 小計：(2 * 100) - 20 = 180
      // 稅額：180 * 0.05 = 9
      // 總額：189
      expect(capturedOrderData?.subtotal).toBe(180)
      expect(capturedOrderData?.taxAmount).toBe(9)
      expect(capturedOrderData?.totalAmount).toBe(189)
    })

    it('資料庫錯誤時應回傳失敗', async () => {
      vi.mocked(prisma.inventory.findFirst).mockResolvedValue({
        productId: 'product-1',
        availableQty: 100,
      } as never)
      vi.mocked(prisma.order.findFirst).mockResolvedValue(null)
      vi.mocked(prisma.$transaction).mockRejectedValue(new Error('DB Error'))

      const result = await createPOSOrder(validOrderData)

      expect(result.success).toBe(false)
      expect(result.message).toBe('建立訂單失敗')
    })
  })
})
