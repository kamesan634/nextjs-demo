/**
 * Refunds Server Actions 測試
 * 測試退貨單管理相關的 Server Actions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createRefund, getRefunds, getRefund, approveRefund, deleteRefund } from '@/actions/refunds'
import prisma from '@/lib/prisma'

// Mock revalidatePath
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

describe('Refunds Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createRefund', () => {
    const validData = {
      orderId: 'order-1',
      reason: '商品瑕疵',
      items: [
        {
          productId: 'p1',
          productName: '商品1',
          quantity: 2,
          unitPrice: 100,
        },
      ],
    }

    it('應成功建立退貨單', async () => {
      const mockOrder = {
        id: 'order-1',
        orderNo: 'ORD-20240115-001',
        items: [{ productId: 'p1', quantity: 5 }],
      }

      const mockRefund = {
        id: 'refund-1',
        refundNo: 'RF-20240115-0001',
        orderId: 'order-1',
        status: 'PENDING',
        subtotal: 200,
        refundAmount: 200,
        items: [],
        order: mockOrder,
      }

      vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder as never)
      vi.mocked(prisma.refund.findFirst).mockResolvedValue(null)
      vi.mocked(prisma.refund.create).mockResolvedValue(mockRefund as never)

      const result = await createRefund(validData)

      expect(result.success).toBe(true)
      expect(result.message).toBe('退貨單建立成功')
      expect(result.data).toBeDefined()
    })

    it('驗證失敗 - 空項目', async () => {
      const result = await createRefund({
        orderId: 'order-1',
        reason: '商品瑕疵',
        items: [],
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('退貨單必須包含至少一個商品')
    })

    it('訂單不存在時應回傳錯誤', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue(null)

      const result = await createRefund(validData)

      expect(result.success).toBe(false)
      expect(result.message).toBe('訂單不存在')
    })

    it('應正確計算退貨金額', async () => {
      const mockOrder = {
        id: 'order-1',
        items: [],
      }

      vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder as never)
      vi.mocked(prisma.refund.findFirst).mockResolvedValue(null)
      vi.mocked(prisma.refund.create).mockResolvedValue({
        id: 'refund-1',
        refundNo: 'RF-20240115-0001',
        subtotal: 500,
        refundAmount: 500,
      } as never)

      await createRefund({
        orderId: 'order-1',
        reason: '退貨',
        items: [
          { productId: 'p1', productName: '商品1', quantity: 2, unitPrice: 100 },
          { productId: 'p2', productName: '商品2', quantity: 3, unitPrice: 100 },
        ],
      })

      expect(prisma.refund.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            subtotal: 500,
            refundAmount: 500,
          }),
        })
      )
    })

    it('應支援換貨類型', async () => {
      const mockOrder = {
        id: 'order-1',
        items: [],
      }

      vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder as never)
      vi.mocked(prisma.refund.findFirst).mockResolvedValue(null)
      vi.mocked(prisma.refund.create).mockResolvedValue({
        id: 'refund-1',
        type: 'EXCHANGE',
      } as never)

      await createRefund({
        ...validData,
        type: 'EXCHANGE',
      })

      expect(prisma.refund.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'EXCHANGE',
          }),
        })
      )
    })

    it('資料庫錯誤時應回傳失敗', async () => {
      const mockOrder = {
        id: 'order-1',
        items: [],
      }

      vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder as never)
      vi.mocked(prisma.refund.findFirst).mockResolvedValue(null)
      vi.mocked(prisma.refund.create).mockRejectedValue(new Error('DB Error'))

      const result = await createRefund(validData)

      expect(result.success).toBe(false)
      expect(result.message).toBe('建立退貨單失敗')
    })
  })

  describe('getRefunds', () => {
    it('應回傳分頁的退貨單列表', async () => {
      const mockRefunds = [
        {
          id: 'refund-1',
          refundNo: 'RF-20240115-0001',
          status: 'PENDING',
          items: [],
          order: {
            id: 'order-1',
            orderNo: 'ORD-20240115-001',
            orderDate: new Date(),
            customer: { id: 'c1', name: '客戶A' },
          },
        },
      ]

      vi.mocked(prisma.refund.findMany).mockResolvedValue(mockRefunds as never)
      vi.mocked(prisma.refund.count).mockResolvedValue(1)

      const result = await getRefunds({ page: 1, pageSize: 20 })

      expect(result.success).toBe(true)
      expect(result.data?.refunds).toHaveLength(1)
      expect(result.data?.pagination.total).toBe(1)
    })

    it('應支援訂單篩選', async () => {
      vi.mocked(prisma.refund.findMany).mockResolvedValue([])
      vi.mocked(prisma.refund.count).mockResolvedValue(0)

      await getRefunds({ orderId: 'order-1' })

      expect(prisma.refund.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ orderId: 'order-1' }),
        })
      )
    })

    it('應支援狀態篩選', async () => {
      vi.mocked(prisma.refund.findMany).mockResolvedValue([])
      vi.mocked(prisma.refund.count).mockResolvedValue(0)

      await getRefunds({ status: 'PENDING' })

      expect(prisma.refund.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'PENDING' }),
        })
      )
    })

    it('應支援類型篩選', async () => {
      vi.mocked(prisma.refund.findMany).mockResolvedValue([])
      vi.mocked(prisma.refund.count).mockResolvedValue(0)

      await getRefunds({ type: 'REFUND' })

      expect(prisma.refund.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: 'REFUND' }),
        })
      )
    })

    it('應支援搜尋功能', async () => {
      vi.mocked(prisma.refund.findMany).mockResolvedValue([])
      vi.mocked(prisma.refund.count).mockResolvedValue(0)

      await getRefunds({ search: 'RF-2024' })

      expect(prisma.refund.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ refundNo: expect.any(Object) }),
              expect.objectContaining({ reason: expect.any(Object) }),
            ]),
          }),
        })
      )
    })

    it('無參數時應使用預設分頁', async () => {
      vi.mocked(prisma.refund.findMany).mockResolvedValue([])
      vi.mocked(prisma.refund.count).mockResolvedValue(0)

      const result = await getRefunds()

      expect(result.data?.pagination.page).toBe(1)
      expect(result.data?.pagination.pageSize).toBe(20)
    })

    it('應正確計算分頁資訊', async () => {
      vi.mocked(prisma.refund.findMany).mockResolvedValue([])
      vi.mocked(prisma.refund.count).mockResolvedValue(50)

      const result = await getRefunds({ page: 2, pageSize: 20 })

      expect(result.data?.pagination.totalPages).toBe(3)
    })

    it('資料庫錯誤時應回傳失敗', async () => {
      vi.mocked(prisma.refund.findMany).mockRejectedValue(new Error('DB Error'))

      const result = await getRefunds()

      expect(result.success).toBe(false)
      expect(result.message).toBe('取得退貨單列表失敗')
    })
  })

  describe('getRefund', () => {
    it('應回傳退貨單詳情', async () => {
      const mockRefund = {
        id: 'refund-1',
        refundNo: 'RF-20240115-0001',
        status: 'PENDING',
        items: [
          {
            id: 'item-1',
            productId: 'p1',
            quantity: 2,
            unitPrice: 100,
            product: { id: 'p1', name: '商品1', sku: 'P001', imageUrl: null },
          },
        ],
        order: {
          id: 'order-1',
          orderNo: 'ORD-20240115-001',
          items: [],
          customer: { id: 'c1', name: '客戶A' },
          store: { id: 's1', name: '門市A' },
          user: { id: 'u1', username: 'admin' },
        },
      }

      vi.mocked(prisma.refund.findUnique).mockResolvedValue(mockRefund as never)

      const result = await getRefund('refund-1')

      expect(result.success).toBe(true)
      expect(result.data?.refundNo).toBe('RF-20240115-0001')
      expect(result.data?.items).toHaveLength(1)
    })

    it('退貨單不存在時應回傳錯誤', async () => {
      vi.mocked(prisma.refund.findUnique).mockResolvedValue(null)

      const result = await getRefund('nonexistent')

      expect(result.success).toBe(false)
      expect(result.message).toBe('退貨單不存在')
    })

    it('資料庫錯誤時應回傳失敗', async () => {
      vi.mocked(prisma.refund.findUnique).mockRejectedValue(new Error('DB Error'))

      const result = await getRefund('refund-1')

      expect(result.success).toBe(false)
      expect(result.message).toBe('取得退貨單失敗')
    })
  })

  describe('approveRefund', () => {
    it('應成功核准退貨單', async () => {
      const mockRefund = {
        id: 'refund-1',
        status: 'PENDING',
        notes: '原始備註',
      }

      vi.mocked(prisma.refund.findUnique).mockResolvedValue(mockRefund as never)
      vi.mocked(prisma.refund.update).mockResolvedValue({
        id: 'refund-1',
        status: 'APPROVED',
        approvalStatus: 'APPROVED',
        items: [],
        order: {},
      } as never)

      const result = await approveRefund('refund-1', {
        status: 'APPROVED',
        approvedBy: 'admin',
      })

      expect(result.success).toBe(true)
      expect(result.message).toBe('退貨單已核准')
    })

    it('應成功駁回退貨單', async () => {
      const mockRefund = {
        id: 'refund-1',
        status: 'PENDING',
      }

      vi.mocked(prisma.refund.findUnique).mockResolvedValue(mockRefund as never)
      vi.mocked(prisma.refund.update).mockResolvedValue({
        id: 'refund-1',
        status: 'REJECTED',
        items: [],
        order: {},
      } as never)

      const result = await approveRefund('refund-1', {
        status: 'REJECTED',
        approvedBy: 'admin',
        notes: '商品無法確認瑕疵',
      })

      expect(result.success).toBe(true)
      expect(result.message).toBe('退貨單已駁回')
    })

    it('退貨單不存在時應回傳錯誤', async () => {
      vi.mocked(prisma.refund.findUnique).mockResolvedValue(null)

      const result = await approveRefund('nonexistent', {
        status: 'APPROVED',
        approvedBy: 'admin',
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('退貨單不存在')
    })

    it('非待處理狀態不能核准', async () => {
      const mockRefund = {
        id: 'refund-1',
        status: 'APPROVED',
      }

      vi.mocked(prisma.refund.findUnique).mockResolvedValue(mockRefund as never)

      const result = await approveRefund('refund-1', {
        status: 'APPROVED',
        approvedBy: 'admin',
      })

      expect(result.success).toBe(false)
      expect(result.message).toContain('無法處理此退貨單')
    })

    it('已駁回狀態不能再處理', async () => {
      const mockRefund = {
        id: 'refund-1',
        status: 'REJECTED',
      }

      vi.mocked(prisma.refund.findUnique).mockResolvedValue(mockRefund as never)

      const result = await approveRefund('refund-1', {
        status: 'APPROVED',
        approvedBy: 'admin',
      })

      expect(result.success).toBe(false)
      expect(result.message).toContain('無法處理此退貨單')
    })

    it('應正確追加備註', async () => {
      const mockRefund = {
        id: 'refund-1',
        status: 'PENDING',
        notes: '原始備註',
      }

      vi.mocked(prisma.refund.findUnique).mockResolvedValue(mockRefund as never)
      vi.mocked(prisma.refund.update).mockResolvedValue({
        id: 'refund-1',
        status: 'APPROVED',
        items: [],
        order: {},
      } as never)

      await approveRefund('refund-1', {
        status: 'APPROVED',
        approvedBy: 'admin',
        notes: '核准備註',
      })

      expect(prisma.refund.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            notes: '原始備註\n核准備註',
          }),
        })
      )
    })

    it('資料庫錯誤時應回傳失敗', async () => {
      const mockRefund = {
        id: 'refund-1',
        status: 'PENDING',
      }

      vi.mocked(prisma.refund.findUnique).mockResolvedValue(mockRefund as never)
      vi.mocked(prisma.refund.update).mockRejectedValue(new Error('DB Error'))

      const result = await approveRefund('refund-1', {
        status: 'APPROVED',
        approvedBy: 'admin',
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('處理退貨單失敗')
    })
  })

  describe('deleteRefund', () => {
    it('應成功刪除待處理的退貨單', async () => {
      const mockRefund = {
        id: 'refund-1',
        status: 'PENDING',
      }

      vi.mocked(prisma.refund.findUnique).mockResolvedValue(mockRefund as never)
      vi.mocked(prisma.refund.delete).mockResolvedValue({ id: 'refund-1' } as never)

      const result = await deleteRefund('refund-1')

      expect(result.success).toBe(true)
      expect(result.message).toBe('退貨單已刪除')
    })

    it('退貨單不存在時應回傳錯誤', async () => {
      vi.mocked(prisma.refund.findUnique).mockResolvedValue(null)

      const result = await deleteRefund('nonexistent')

      expect(result.success).toBe(false)
      expect(result.message).toBe('退貨單不存在')
    })

    it('非待處理狀態不能刪除', async () => {
      const mockRefund = {
        id: 'refund-1',
        status: 'APPROVED',
      }

      vi.mocked(prisma.refund.findUnique).mockResolvedValue(mockRefund as never)

      const result = await deleteRefund('refund-1')

      expect(result.success).toBe(false)
      expect(result.message).toBe('只能刪除待處理的退貨單')
    })

    it('已駁回狀態不能刪除', async () => {
      const mockRefund = {
        id: 'refund-1',
        status: 'REJECTED',
      }

      vi.mocked(prisma.refund.findUnique).mockResolvedValue(mockRefund as never)

      const result = await deleteRefund('refund-1')

      expect(result.success).toBe(false)
      expect(result.message).toBe('只能刪除待處理的退貨單')
    })

    it('已完成狀態不能刪除', async () => {
      const mockRefund = {
        id: 'refund-1',
        status: 'COMPLETED',
      }

      vi.mocked(prisma.refund.findUnique).mockResolvedValue(mockRefund as never)

      const result = await deleteRefund('refund-1')

      expect(result.success).toBe(false)
      expect(result.message).toBe('只能刪除待處理的退貨單')
    })

    it('資料庫錯誤時應回傳失敗', async () => {
      const mockRefund = {
        id: 'refund-1',
        status: 'PENDING',
      }

      vi.mocked(prisma.refund.findUnique).mockResolvedValue(mockRefund as never)
      vi.mocked(prisma.refund.delete).mockRejectedValue(new Error('DB Error'))

      const result = await deleteRefund('refund-1')

      expect(result.success).toBe(false)
      expect(result.message).toBe('刪除退貨單失敗')
    })
  })
})
