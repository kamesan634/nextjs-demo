/**
 * Purchase Orders Server Actions 測試
 * 測試採購單管理相關的 Server Actions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getPurchaseOrders,
  getPurchaseOrder,
  generatePurchaseOrderNo,
  createPurchaseOrder,
  updatePurchaseOrder,
  updatePurchaseOrderStatus,
  deletePurchaseOrder,
  createPurchaseReceipt,
  completePurchaseReceipt,
  getPurchaseStats,
  getPurchaseOrderStats,
} from '@/actions/purchase-orders'
import prisma from '@/lib/prisma'

// Mock revalidatePath
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

describe('Purchase Orders Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getPurchaseOrders', () => {
    it('應回傳分頁的採購單列表', async () => {
      const mockOrders = [
        {
          id: '1',
          orderNo: 'PO202401010001',
          status: 'PENDING',
          supplier: { id: 's1', name: '供應商A' },
          _count: { items: 5, receipts: 0 },
        },
      ]

      vi.mocked(prisma.purchaseOrder.findMany).mockResolvedValue(mockOrders as never)
      vi.mocked(prisma.purchaseOrder.count).mockResolvedValue(1)

      const result = await getPurchaseOrders({ page: 1, pageSize: 10 })

      expect(result.data).toHaveLength(1)
      expect(result.pagination.total).toBe(1)
    })

    it('應支援搜尋功能', async () => {
      vi.mocked(prisma.purchaseOrder.findMany).mockResolvedValue([])
      vi.mocked(prisma.purchaseOrder.count).mockResolvedValue(0)

      await getPurchaseOrders({ search: 'PO2024' })

      expect(prisma.purchaseOrder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
          }),
        })
      )
    })

    it('應支援狀態篩選', async () => {
      vi.mocked(prisma.purchaseOrder.findMany).mockResolvedValue([])
      vi.mocked(prisma.purchaseOrder.count).mockResolvedValue(0)

      await getPurchaseOrders({ status: 'PENDING' })

      expect(prisma.purchaseOrder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'PENDING' }),
        })
      )
    })

    it('應支援供應商篩選', async () => {
      vi.mocked(prisma.purchaseOrder.findMany).mockResolvedValue([])
      vi.mocked(prisma.purchaseOrder.count).mockResolvedValue(0)

      await getPurchaseOrders({ supplierId: 'supplier-1' })

      expect(prisma.purchaseOrder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ supplierId: 'supplier-1' }),
        })
      )
    })

    it('應支援日期範圍篩選', async () => {
      vi.mocked(prisma.purchaseOrder.findMany).mockResolvedValue([])
      vi.mocked(prisma.purchaseOrder.count).mockResolvedValue(0)

      await getPurchaseOrders({
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      })

      expect(prisma.purchaseOrder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            orderDate: expect.any(Object),
          }),
        })
      )
    })
  })

  describe('getPurchaseOrder', () => {
    it('應回傳採購單詳情', async () => {
      const mockOrder = {
        id: '1',
        orderNo: 'PO202401010001',
        supplier: { name: '供應商A' },
        items: [],
        receipts: [],
      }

      vi.mocked(prisma.purchaseOrder.findUnique).mockResolvedValue(mockOrder as never)

      const result = await getPurchaseOrder('1')

      expect(result?.orderNo).toBe('PO202401010001')
    })
  })

  describe('generatePurchaseOrderNo', () => {
    it('當天無採購單時應回傳序號 0001', async () => {
      vi.mocked(prisma.purchaseOrder.findFirst).mockResolvedValue(null)

      const result = await generatePurchaseOrderNo()

      expect(result).toMatch(/^PO\d{8}0001$/)
    })

    it('有採購單時應產生下一個序號', async () => {
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      vi.mocked(prisma.purchaseOrder.findFirst).mockResolvedValue({
        orderNo: `PO${today}0005`,
      } as never)

      const result = await generatePurchaseOrderNo()

      expect(result).toBe(`PO${today}0006`)
    })
  })

  describe('createPurchaseOrder', () => {
    it('應成功建立採購單', async () => {
      vi.mocked(prisma.purchaseOrder.findFirst).mockResolvedValue(null)
      vi.mocked(prisma.product.findUnique).mockResolvedValue({
        id: 'p1',
        sku: 'P001',
        name: '商品1',
      } as never)
      vi.mocked(prisma.purchaseOrder.create).mockResolvedValue({
        id: 'new-id',
        orderNo: 'PO202401010001',
      } as never)

      const result = await createPurchaseOrder({
        supplierId: 'supplier-1',
        items: [{ productId: 'p1', quantity: 10, unitPrice: 100 }],
      })

      expect(result.success).toBe(true)
      expect(result.message).toBe('採購單建立成功')
      expect(result.data?.orderNo).toBe('PO202401010001')
    })

    it('商品不存在時應回傳錯誤', async () => {
      vi.mocked(prisma.purchaseOrder.findFirst).mockResolvedValue(null)
      vi.mocked(prisma.product.findUnique).mockResolvedValue(null)

      const result = await createPurchaseOrder({
        supplierId: 'supplier-1',
        items: [{ productId: 'nonexistent', quantity: 10, unitPrice: 100 }],
      })

      expect(result.success).toBe(false)
      expect(result.message).toContain('商品不存在')
    })

    it('應正確計算金額和稅額', async () => {
      vi.mocked(prisma.purchaseOrder.findFirst).mockResolvedValue(null)
      vi.mocked(prisma.product.findUnique).mockResolvedValue({
        id: 'p1',
        sku: 'P001',
        name: '商品1',
      } as never)
      vi.mocked(prisma.purchaseOrder.create).mockResolvedValue({
        id: 'new-id',
        orderNo: 'PO202401010001',
      } as never)

      await createPurchaseOrder({
        supplierId: 'supplier-1',
        items: [{ productId: 'p1', quantity: 10, unitPrice: 100 }],
      })

      expect(prisma.purchaseOrder.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            subtotal: 1000,
            taxAmount: 50, // 5% 稅
            totalAmount: 1050,
          }),
        })
      )
    })
  })

  describe('updatePurchaseOrder', () => {
    it('應成功更新草稿狀態的採購單', async () => {
      vi.mocked(prisma.purchaseOrder.findUnique).mockResolvedValue({
        id: '1',
        status: 'DRAFT',
      } as never)
      vi.mocked(prisma.purchaseOrder.update).mockResolvedValue({ id: '1' } as never)

      const result = await updatePurchaseOrder('1', {
        notes: '更新備註',
      })

      expect(result.success).toBe(true)
      expect(result.message).toBe('採購單更新成功')
    })

    it('採購單不存在時應回傳錯誤', async () => {
      vi.mocked(prisma.purchaseOrder.findUnique).mockResolvedValue(null)

      const result = await updatePurchaseOrder('nonexistent', {
        notes: '更新備註',
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('採購單不存在')
    })

    it('非草稿狀態不能編輯', async () => {
      vi.mocked(prisma.purchaseOrder.findUnique).mockResolvedValue({
        id: '1',
        status: 'APPROVED',
      } as never)

      const result = await updatePurchaseOrder('1', {
        notes: '更新備註',
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('只能編輯草稿狀態的採購單')
    })
  })

  describe('updatePurchaseOrderStatus', () => {
    it('應成功更新採購單狀態', async () => {
      vi.mocked(prisma.purchaseOrder.findUnique).mockResolvedValue({ id: '1' } as never)
      vi.mocked(prisma.purchaseOrder.update).mockResolvedValue({ id: '1' } as never)

      const result = await updatePurchaseOrderStatus('1', 'APPROVED')

      expect(result.success).toBe(true)
      expect(result.message).toBe('採購單狀態更新成功')
    })

    it('核准時應記錄核准時間', async () => {
      vi.mocked(prisma.purchaseOrder.findUnique).mockResolvedValue({ id: '1' } as never)
      vi.mocked(prisma.purchaseOrder.update).mockResolvedValue({ id: '1' } as never)

      await updatePurchaseOrderStatus('1', 'APPROVED')

      expect(prisma.purchaseOrder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'APPROVED',
            approvedAt: expect.any(Date),
          }),
        })
      )
    })

    it('採購單不存在時應回傳錯誤', async () => {
      vi.mocked(prisma.purchaseOrder.findUnique).mockResolvedValue(null)

      const result = await updatePurchaseOrderStatus('nonexistent', 'APPROVED')

      expect(result.success).toBe(false)
      expect(result.message).toBe('採購單不存在')
    })
  })

  describe('deletePurchaseOrder', () => {
    it('應成功刪除草稿採購單', async () => {
      vi.mocked(prisma.purchaseOrder.findUnique).mockResolvedValue({
        id: '1',
        status: 'DRAFT',
        _count: { receipts: 0 },
      } as never)
      vi.mocked(prisma.$transaction).mockResolvedValue([{}, {}] as never)

      const result = await deletePurchaseOrder('1')

      expect(result.success).toBe(true)
      expect(result.message).toBe('採購單刪除成功')
    })

    it('已取消的採購單也可以刪除', async () => {
      vi.mocked(prisma.purchaseOrder.findUnique).mockResolvedValue({
        id: '1',
        status: 'CANCELLED',
        _count: { receipts: 0 },
      } as never)
      vi.mocked(prisma.$transaction).mockResolvedValue([{}, {}] as never)

      const result = await deletePurchaseOrder('1')

      expect(result.success).toBe(true)
    })

    it('非草稿或取消狀態不能刪除', async () => {
      vi.mocked(prisma.purchaseOrder.findUnique).mockResolvedValue({
        id: '1',
        status: 'APPROVED',
        _count: { receipts: 0 },
      } as never)

      const result = await deletePurchaseOrder('1')

      expect(result.success).toBe(false)
      expect(result.message).toBe('只能刪除草稿或已取消的採購單')
    })

    it('有驗收紀錄時不能刪除', async () => {
      vi.mocked(prisma.purchaseOrder.findUnique).mockResolvedValue({
        id: '1',
        status: 'DRAFT',
        _count: { receipts: 2 },
      } as never)

      const result = await deletePurchaseOrder('1')

      expect(result.success).toBe(false)
      expect(result.message).toBe('此採購單已有驗收紀錄，無法刪除')
    })
  })

  describe('createPurchaseReceipt', () => {
    it('應成功建立驗收單', async () => {
      vi.mocked(prisma.purchaseOrder.findUnique).mockResolvedValue({
        id: '1',
        items: [],
      } as never)
      vi.mocked(prisma.purchaseReceipt.create).mockResolvedValue({
        id: 'receipt-1',
        receiptNo: 'PR123',
      } as never)

      const result = await createPurchaseReceipt({
        purchaseOrderId: '1',
        warehouseId: 'w1',
        items: [
          {
            productId: 'p1',
            expectedQty: 10,
            receivedQty: 10,
            acceptedQty: 9,
            rejectedQty: 1,
          },
        ],
      })

      expect(result.success).toBe(true)
      expect(result.message).toBe('驗收單建立成功')
    })

    it('採購單不存在時應回傳錯誤', async () => {
      vi.mocked(prisma.purchaseOrder.findUnique).mockResolvedValue(null)

      const result = await createPurchaseReceipt({
        purchaseOrderId: 'nonexistent',
        warehouseId: 'w1',
        items: [],
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('採購單不存在')
    })
  })

  describe('completePurchaseReceipt', () => {
    it('應成功完成驗收並更新庫存', async () => {
      vi.mocked(prisma.purchaseReceipt.findUnique).mockResolvedValue({
        id: '1',
        status: 'PENDING',
        warehouseId: 'w1',
        items: [{ productId: 'p1', acceptedQty: 10 }],
        purchaseOrder: {
          items: [{ id: 'item-1', productId: 'p1', quantity: 10, receivedQty: 0 }],
        },
      } as never)
      vi.mocked(prisma.inventory.findFirst).mockResolvedValue({
        id: 'inv-1',
        quantity: 100,
      } as never)
      vi.mocked(prisma.$transaction).mockResolvedValue([{}] as never)

      const result = await completePurchaseReceipt('1')

      expect(result.success).toBe(true)
      expect(result.message).toBe('驗收完成，庫存已更新')
    })

    it('驗收單不存在時應回傳錯誤', async () => {
      vi.mocked(prisma.purchaseReceipt.findUnique).mockResolvedValue(null)

      const result = await completePurchaseReceipt('nonexistent')

      expect(result.success).toBe(false)
      expect(result.message).toBe('驗收單不存在')
    })

    it('已完成的驗收單不能重複完成', async () => {
      vi.mocked(prisma.purchaseReceipt.findUnique).mockResolvedValue({
        id: '1',
        status: 'COMPLETED',
        items: [],
        purchaseOrder: { items: [] },
      } as never)

      const result = await completePurchaseReceipt('1')

      expect(result.success).toBe(false)
      expect(result.message).toBe('此驗收單已完成')
    })
  })

  describe('getPurchaseStats', () => {
    it('應回傳採購統計資料', async () => {
      vi.mocked(prisma.purchaseOrder.count)
        .mockResolvedValueOnce(100) // totalOrders
        .mockResolvedValueOnce(80) // completedOrders
        .mockResolvedValueOnce(15) // pendingOrders
      vi.mocked(prisma.purchaseOrder.aggregate).mockResolvedValue({
        _sum: { totalAmount: 1000000 },
      } as never)

      const result = await getPurchaseStats({
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      })

      expect(result.totalOrders).toBe(100)
      expect(result.completedOrders).toBe(80)
      expect(result.pendingOrders).toBe(15)
      expect(result.totalAmount).toBe(1000000)
    })
  })

  describe('getPurchaseOrderStats', () => {
    it('應回傳採購單狀態統計', async () => {
      vi.mocked(prisma.purchaseOrder.count)
        .mockResolvedValueOnce(100) // totalOrders
        .mockResolvedValueOnce(10) // pendingOrders
        .mockResolvedValueOnce(20) // approvedOrders
        .mockResolvedValueOnce(70) // completedOrders

      const result = await getPurchaseOrderStats()

      expect(result.totalOrders).toBe(100)
      expect(result.pendingOrders).toBe(10)
      expect(result.approvedOrders).toBe(20)
      expect(result.completedOrders).toBe(70)
    })
  })
})
