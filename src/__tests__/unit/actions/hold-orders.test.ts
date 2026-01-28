/**
 * Hold Orders Server Actions 測試
 * 測試掛單管理相關的 Server Actions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createHoldOrder,
  getHoldOrders,
  resumeHoldOrder,
  voidHoldOrder,
  getHoldOrder,
} from '@/actions/hold-orders'
import prisma from '@/lib/prisma'

// Mock revalidatePath
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

describe('Hold Orders Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createHoldOrder', () => {
    const validHoldOrderData = {
      storeId: 'store-1',
      userId: 'user-1',
      items: [
        {
          productId: 'product-1',
          productName: '測試商品',
          sku: 'SKU001',
          quantity: 2,
          unitPrice: 100,
        },
      ],
      reason: '客戶臨時離開',
    }

    it('應成功建立掛單', async () => {
      vi.mocked(prisma.holdOrder.findFirst).mockResolvedValueOnce(null) // generateHoldNo
      vi.mocked(prisma.holdOrder.create).mockResolvedValue({
        id: 'hold-1',
        holdNo: 'HOLD-20240115-0001',
        status: 'HOLD',
        subtotal: 200,
        totalAmount: 200,
        customer: null,
        user: { id: 'user-1', username: 'cashier1', name: '收銀員' },
        store: { id: 'store-1', name: '台北店' },
      } as never)

      const result = await createHoldOrder(validHoldOrderData)

      expect(result.success).toBe(true)
      expect(result.message).toBe('掛單建立成功')
      expect(result.data).toBeDefined()
    })

    it('無商品時應回傳錯誤', async () => {
      const result = await createHoldOrder({
        ...validHoldOrderData,
        items: [],
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('掛單必須包含至少一個商品')
    })

    it('items 為 undefined 時應回傳錯誤', async () => {
      const result = await createHoldOrder({
        storeId: 'store-1',
        userId: 'user-1',
        items: undefined as never,
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('掛單必須包含至少一個商品')
    })

    it('應正確計算小計', async () => {
      vi.mocked(prisma.holdOrder.findFirst).mockResolvedValueOnce(null)
      vi.mocked(prisma.holdOrder.create).mockResolvedValue({
        id: 'hold-1',
        holdNo: 'HOLD-20240115-0001',
      } as never)

      const multiItemHoldOrder = {
        ...validHoldOrderData,
        items: [
          { productId: 'p1', productName: '商品1', sku: 'S1', quantity: 2, unitPrice: 100 }, // 200
          { productId: 'p2', productName: '商品2', sku: 'S2', quantity: 3, unitPrice: 50 }, // 150
        ],
      }

      await createHoldOrder(multiItemHoldOrder)

      expect(prisma.holdOrder.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            subtotal: 350, // 200 + 150
            totalAmount: 350,
          }),
        })
      )
    })

    it('應設定 24 小時後過期', async () => {
      vi.mocked(prisma.holdOrder.findFirst).mockResolvedValueOnce(null)
      vi.mocked(prisma.holdOrder.create).mockResolvedValue({
        id: 'hold-1',
        holdNo: 'HOLD-20240115-0001',
      } as never)

      await createHoldOrder(validHoldOrderData)

      expect(prisma.holdOrder.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            expiresAt: expect.any(Date),
          }),
        })
      )
    })

    it('應支援會員關聯', async () => {
      vi.mocked(prisma.holdOrder.findFirst).mockResolvedValueOnce(null)
      vi.mocked(prisma.holdOrder.create).mockResolvedValue({
        id: 'hold-1',
        customer: { id: 'customer-1', name: '張三' },
      } as never)

      const holdOrderWithCustomer = {
        ...validHoldOrderData,
        customerId: 'customer-1',
      }

      await createHoldOrder(holdOrderWithCustomer)

      expect(prisma.holdOrder.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            customerId: 'customer-1',
          }),
        })
      )
    })

    it('資料庫錯誤時應回傳失敗', async () => {
      vi.mocked(prisma.holdOrder.findFirst).mockResolvedValueOnce(null)
      vi.mocked(prisma.holdOrder.create).mockRejectedValue(new Error('DB Error'))

      const result = await createHoldOrder(validHoldOrderData)

      expect(result.success).toBe(false)
      expect(result.message).toBe('建立掛單失敗')
    })

    it('應生成正確格式的掛單編號', async () => {
      vi.mocked(prisma.holdOrder.findFirst).mockResolvedValueOnce({
        holdNo: 'HOLD-20240115-0005',
      } as never)
      vi.mocked(prisma.holdOrder.create).mockResolvedValue({
        id: 'hold-1',
        holdNo: 'HOLD-20240115-0006',
      } as never)

      await createHoldOrder(validHoldOrderData)

      expect(prisma.holdOrder.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            holdNo: expect.stringMatching(/^HOLD-\d{8}-\d{4}$/),
          }),
        })
      )
    })
  })

  describe('getHoldOrders', () => {
    it('應回傳分頁的掛單列表', async () => {
      const mockHoldOrders = [
        {
          id: 'hold-1',
          holdNo: 'HOLD-20240115-0001',
          status: 'HOLD',
          customer: { id: 'c1', name: '張三' },
          user: { id: 'u1', username: 'cashier1', name: '收銀員' },
          store: { id: 's1', name: '台北店' },
        },
      ]

      vi.mocked(prisma.holdOrder.findMany).mockResolvedValue(mockHoldOrders as never)
      vi.mocked(prisma.holdOrder.count).mockResolvedValue(1)

      const result = await getHoldOrders({ page: 1, pageSize: 20 })

      expect(result.success).toBe(true)
      expect(result.data?.holdOrders).toHaveLength(1)
      expect(result.data?.pagination).toEqual({
        page: 1,
        pageSize: 20,
        total: 1,
        totalPages: 1,
      })
    })

    it('應支援依店舖篩選', async () => {
      vi.mocked(prisma.holdOrder.findMany).mockResolvedValue([])
      vi.mocked(prisma.holdOrder.count).mockResolvedValue(0)

      await getHoldOrders({ storeId: 'store-1' })

      expect(prisma.holdOrder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ storeId: 'store-1' }),
        })
      )
    })

    it('應支援依使用者篩選', async () => {
      vi.mocked(prisma.holdOrder.findMany).mockResolvedValue([])
      vi.mocked(prisma.holdOrder.count).mockResolvedValue(0)

      await getHoldOrders({ userId: 'user-1' })

      expect(prisma.holdOrder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: 'user-1' }),
        })
      )
    })

    it('應支援依狀態篩選', async () => {
      vi.mocked(prisma.holdOrder.findMany).mockResolvedValue([])
      vi.mocked(prisma.holdOrder.count).mockResolvedValue(0)

      await getHoldOrders({ status: 'HOLD' })

      expect(prisma.holdOrder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'HOLD' }),
        })
      )
    })

    it('應使用預設分頁參數', async () => {
      vi.mocked(prisma.holdOrder.findMany).mockResolvedValue([])
      vi.mocked(prisma.holdOrder.count).mockResolvedValue(0)

      const result = await getHoldOrders()

      expect(result.data?.pagination.page).toBe(1)
      expect(result.data?.pagination.pageSize).toBe(20)
    })

    it('應正確計算分頁資訊', async () => {
      vi.mocked(prisma.holdOrder.findMany).mockResolvedValue([])
      vi.mocked(prisma.holdOrder.count).mockResolvedValue(50)

      const result = await getHoldOrders({ page: 2, pageSize: 20 })

      expect(result.data?.pagination.totalPages).toBe(3)
    })

    it('資料庫錯誤時應回傳失敗', async () => {
      vi.mocked(prisma.holdOrder.findMany).mockRejectedValue(new Error('DB Error'))

      const result = await getHoldOrders()

      expect(result.success).toBe(false)
      expect(result.message).toBe('取得掛單列表失敗')
    })
  })

  describe('resumeHoldOrder', () => {
    it('應成功恢復掛單', async () => {
      vi.mocked(prisma.holdOrder.findUnique).mockResolvedValue({
        id: 'hold-1',
        status: 'HOLD',
        expiresAt: new Date(Date.now() + 10000), // 未過期
        items: [{ productId: 'p1', productName: '商品1', sku: 'S1', quantity: 1, unitPrice: 100 }],
        customer: null,
      } as never)
      vi.mocked(prisma.holdOrder.update).mockResolvedValue({
        id: 'hold-1',
        status: 'RESUMED',
        items: [{ productId: 'p1', productName: '商品1', sku: 'S1', quantity: 1, unitPrice: 100 }],
        customer: null,
      } as never)

      const result = await resumeHoldOrder('hold-1')

      expect(result.success).toBe(true)
      expect(result.message).toBe('掛單已恢復')
      expect(result.data).toBeDefined()
    })

    it('掛單不存在時應回傳錯誤', async () => {
      vi.mocked(prisma.holdOrder.findUnique).mockResolvedValue(null)

      const result = await resumeHoldOrder('nonexistent')

      expect(result.success).toBe(false)
      expect(result.message).toBe('掛單不存在')
    })

    it('掛單狀態非 HOLD 時應回傳錯誤', async () => {
      vi.mocked(prisma.holdOrder.findUnique).mockResolvedValue({
        id: 'hold-1',
        status: 'RESUMED',
      } as never)

      const result = await resumeHoldOrder('hold-1')

      expect(result.success).toBe(false)
      expect(result.message).toBe('無法恢復此掛單，目前狀態：RESUMED')
    })

    it('掛單已過期時應更新狀態並回傳錯誤', async () => {
      vi.mocked(prisma.holdOrder.findUnique).mockResolvedValue({
        id: 'hold-1',
        status: 'HOLD',
        expiresAt: new Date(Date.now() - 10000), // 已過期
      } as never)
      vi.mocked(prisma.holdOrder.update).mockResolvedValue({} as never)

      const result = await resumeHoldOrder('hold-1')

      expect(result.success).toBe(false)
      expect(result.message).toBe('掛單已過期')
      expect(prisma.holdOrder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'hold-1' },
          data: { status: 'EXPIRED' },
        })
      )
    })

    it('應設定恢復時間', async () => {
      vi.mocked(prisma.holdOrder.findUnique).mockResolvedValue({
        id: 'hold-1',
        status: 'HOLD',
        expiresAt: new Date(Date.now() + 10000),
        items: [],
        customer: null,
      } as never)
      vi.mocked(prisma.holdOrder.update).mockResolvedValue({
        id: 'hold-1',
        items: [],
        customer: null,
      } as never)

      await resumeHoldOrder('hold-1')

      expect(prisma.holdOrder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'RESUMED',
            resumedAt: expect.any(Date),
          }),
        })
      )
    })

    it('資料庫錯誤時應回傳失敗', async () => {
      vi.mocked(prisma.holdOrder.findUnique).mockResolvedValue({
        id: 'hold-1',
        status: 'HOLD',
        expiresAt: new Date(Date.now() + 10000),
      } as never)
      vi.mocked(prisma.holdOrder.update).mockRejectedValue(new Error('DB Error'))

      const result = await resumeHoldOrder('hold-1')

      expect(result.success).toBe(false)
      expect(result.message).toBe('恢復掛單失敗')
    })
  })

  describe('voidHoldOrder', () => {
    it('應成功作廢掛單', async () => {
      vi.mocked(prisma.holdOrder.findUnique).mockResolvedValue({
        id: 'hold-1',
        status: 'HOLD',
      } as never)
      vi.mocked(prisma.holdOrder.update).mockResolvedValue({
        id: 'hold-1',
        status: 'VOIDED',
      } as never)

      const result = await voidHoldOrder('hold-1')

      expect(result.success).toBe(true)
      expect(result.message).toBe('掛單已作廢')
    })

    it('掛單不存在時應回傳錯誤', async () => {
      vi.mocked(prisma.holdOrder.findUnique).mockResolvedValue(null)

      const result = await voidHoldOrder('nonexistent')

      expect(result.success).toBe(false)
      expect(result.message).toBe('掛單不存在')
    })

    it('掛單狀態非 HOLD 時應回傳錯誤', async () => {
      vi.mocked(prisma.holdOrder.findUnique).mockResolvedValue({
        id: 'hold-1',
        status: 'VOIDED',
      } as never)

      const result = await voidHoldOrder('hold-1')

      expect(result.success).toBe(false)
      expect(result.message).toBe('無法作廢此掛單，目前狀態：VOIDED')
    })

    it('資料庫錯誤時應回傳失敗', async () => {
      vi.mocked(prisma.holdOrder.findUnique).mockResolvedValue({
        id: 'hold-1',
        status: 'HOLD',
      } as never)
      vi.mocked(prisma.holdOrder.update).mockRejectedValue(new Error('DB Error'))

      const result = await voidHoldOrder('hold-1')

      expect(result.success).toBe(false)
      expect(result.message).toBe('作廢掛單失敗')
    })
  })

  describe('getHoldOrder', () => {
    it('應回傳掛單詳情', async () => {
      const mockHoldOrder = {
        id: 'hold-1',
        holdNo: 'HOLD-20240115-0001',
        status: 'HOLD',
        items: [{ productId: 'p1', productName: '商品1', sku: 'S1', quantity: 1, unitPrice: 100 }],
        customer: { id: 'c1', name: '張三', email: 'customer@example.com', phone: '0912345678' },
        user: { id: 'u1', username: 'cashier1', email: 'cashier@example.com', name: '收銀員' },
        store: { id: 's1', name: '台北店' },
      }

      vi.mocked(prisma.holdOrder.findUnique).mockResolvedValue(mockHoldOrder as never)

      const result = await getHoldOrder('hold-1')

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data?.items).toHaveLength(1)
    })

    it('掛單不存在時應回傳錯誤', async () => {
      vi.mocked(prisma.holdOrder.findUnique).mockResolvedValue(null)

      const result = await getHoldOrder('nonexistent')

      expect(result.success).toBe(false)
      expect(result.message).toBe('掛單不存在')
    })

    it('資料庫錯誤時應回傳失敗', async () => {
      vi.mocked(prisma.holdOrder.findUnique).mockRejectedValue(new Error('DB Error'))

      const result = await getHoldOrder('hold-1')

      expect(result.success).toBe(false)
      expect(result.message).toBe('取得掛單失敗')
    })
  })
})
