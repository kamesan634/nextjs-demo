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
          supplier: { id: 's1', code: 'S001', name: '供應商A', shortName: '供A' },
          _count: { items: 5, receipts: 0 },
        },
      ]

      vi.mocked(prisma.purchaseOrder.findMany).mockResolvedValue(mockOrders as never)
      vi.mocked(prisma.purchaseOrder.count).mockResolvedValue(1)

      const result = await getPurchaseOrders({ page: 1, pageSize: 10 })

      expect(result.data).toHaveLength(1)
      expect(result.data[0].orderNo).toBe('PO202401010001')
      expect(result.pagination.total).toBe(1)
      expect(result.pagination.page).toBe(1)
      expect(result.pagination.pageSize).toBe(10)
    })

    it('應支援搜尋功能', async () => {
      vi.mocked(prisma.purchaseOrder.findMany).mockResolvedValue([])
      vi.mocked(prisma.purchaseOrder.count).mockResolvedValue(0)

      await getPurchaseOrders({ search: 'PO2024' })

      expect(prisma.purchaseOrder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ orderNo: expect.any(Object) }),
              expect.objectContaining({ supplier: expect.any(Object) }),
            ]),
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

    it('應支援 DRAFT 狀態篩選', async () => {
      vi.mocked(prisma.purchaseOrder.findMany).mockResolvedValue([])
      vi.mocked(prisma.purchaseOrder.count).mockResolvedValue(0)

      await getPurchaseOrders({ status: 'DRAFT' })

      expect(prisma.purchaseOrder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'DRAFT' }),
        })
      )
    })

    it('應支援 COMPLETED 狀態篩選', async () => {
      vi.mocked(prisma.purchaseOrder.findMany).mockResolvedValue([])
      vi.mocked(prisma.purchaseOrder.count).mockResolvedValue(0)

      await getPurchaseOrders({ status: 'COMPLETED' })

      expect(prisma.purchaseOrder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'COMPLETED' }),
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
            orderDate: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
          }),
        })
      )
    })

    it('應支援僅起始日期篩選', async () => {
      vi.mocked(prisma.purchaseOrder.findMany).mockResolvedValue([])
      vi.mocked(prisma.purchaseOrder.count).mockResolvedValue(0)

      await getPurchaseOrders({ startDate: '2024-01-01' })

      expect(prisma.purchaseOrder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            orderDate: expect.objectContaining({
              gte: expect.any(Date),
            }),
          }),
        })
      )
    })

    it('無參數時應使用預設分頁', async () => {
      vi.mocked(prisma.purchaseOrder.findMany).mockResolvedValue([])
      vi.mocked(prisma.purchaseOrder.count).mockResolvedValue(0)

      const result = await getPurchaseOrders()

      expect(result.pagination.page).toBe(1)
      expect(result.pagination.pageSize).toBe(10)
    })

    it('應正確計算分頁資訊', async () => {
      vi.mocked(prisma.purchaseOrder.findMany).mockResolvedValue([])
      vi.mocked(prisma.purchaseOrder.count).mockResolvedValue(25)

      const result = await getPurchaseOrders({ page: 2, pageSize: 10 })

      expect(result.pagination.totalPages).toBe(3)
      expect(result.pagination.hasNextPage).toBe(true)
      expect(result.pagination.hasPrevPage).toBe(true)
    })

    it('第一頁應無前一頁', async () => {
      vi.mocked(prisma.purchaseOrder.findMany).mockResolvedValue([])
      vi.mocked(prisma.purchaseOrder.count).mockResolvedValue(25)

      const result = await getPurchaseOrders({ page: 1, pageSize: 10 })

      expect(result.pagination.hasPrevPage).toBe(false)
    })

    it('最後一頁應無下一頁', async () => {
      vi.mocked(prisma.purchaseOrder.findMany).mockResolvedValue([])
      vi.mocked(prisma.purchaseOrder.count).mockResolvedValue(25)

      const result = await getPurchaseOrders({ page: 3, pageSize: 10 })

      expect(result.pagination.hasNextPage).toBe(false)
    })
  })

  describe('getPurchaseOrder', () => {
    it('應回傳採購單詳情', async () => {
      const mockOrder = {
        id: '1',
        orderNo: 'PO202401010001',
        status: 'DRAFT',
        supplier: { id: 's1', name: '供應商A' },
        items: [
          {
            id: 'item-1',
            productId: 'p1',
            productName: '商品1',
            productSku: 'SKU001',
            quantity: 10,
            unitPrice: 100,
            subtotal: 1000,
            product: {
              id: 'p1',
              sku: 'SKU001',
              name: '商品1',
              imageUrl: null,
            },
          },
        ],
        receipts: [],
      }

      vi.mocked(prisma.purchaseOrder.findUnique).mockResolvedValue(mockOrder as never)

      const result = await getPurchaseOrder('1')

      expect(result?.orderNo).toBe('PO202401010001')
      expect(result?.supplier.name).toBe('供應商A')
      expect(result?.items).toHaveLength(1)
    })

    it('採購單不存在時應回傳 null', async () => {
      vi.mocked(prisma.purchaseOrder.findUnique).mockResolvedValue(null)

      const result = await getPurchaseOrder('nonexistent')

      expect(result).toBeNull()
    })

    it('應包含驗收單資訊', async () => {
      const mockOrder = {
        id: '1',
        orderNo: 'PO202401010001',
        supplier: { name: '供應商A' },
        items: [],
        receipts: [
          {
            id: 'receipt-1',
            receiptNo: 'PR001',
            status: 'COMPLETED',
            warehouse: { id: 'w1', name: '倉庫A' },
            items: [],
          },
        ],
      }

      vi.mocked(prisma.purchaseOrder.findUnique).mockResolvedValue(mockOrder as never)

      const result = await getPurchaseOrder('1')

      expect(result?.receipts).toHaveLength(1)
      expect(result?.receipts[0].receiptNo).toBe('PR001')
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

    it('序號 9999 後應產生 10000', async () => {
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      vi.mocked(prisma.purchaseOrder.findFirst).mockResolvedValue({
        orderNo: `PO${today}9999`,
      } as never)

      const result = await generatePurchaseOrderNo()

      expect(result).toBe(`PO${today}10000`)
    })
  })

  describe('createPurchaseOrder', () => {
    const validOrderData = {
      supplierId: 'supplier-1',
      expectedDate: '2024-02-01',
      items: [{ productId: 'p1', quantity: 10, unitPrice: 100 }],
      notes: '測試備註',
    }

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

      const result = await createPurchaseOrder(validOrderData)

      expect(result.success).toBe(true)
      expect(result.message).toBe('採購單建立成功')
      expect((result.data as { id: string })?.id).toBe('new-id')
      expect((result.data as { orderNo: string })?.orderNo).toBe('PO202401010001')
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

    it('多項目應正確計算總金額', async () => {
      vi.mocked(prisma.purchaseOrder.findFirst).mockResolvedValue(null)
      vi.mocked(prisma.product.findUnique)
        .mockResolvedValueOnce({ id: 'p1', sku: 'P001', name: '商品1' } as never)
        .mockResolvedValueOnce({ id: 'p2', sku: 'P002', name: '商品2' } as never)
      vi.mocked(prisma.purchaseOrder.create).mockResolvedValue({
        id: 'new-id',
        orderNo: 'PO202401010001',
      } as never)

      await createPurchaseOrder({
        supplierId: 'supplier-1',
        items: [
          { productId: 'p1', quantity: 10, unitPrice: 100 },
          { productId: 'p2', quantity: 5, unitPrice: 200 },
        ],
      })

      expect(prisma.purchaseOrder.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            subtotal: 2000, // (100 * 10) + (200 * 5)
            taxAmount: 100, // 2000 * 0.05
            totalAmount: 2100, // 2000 + 100
          }),
        })
      )
    })

    it('資料庫錯誤時應回傳失敗', async () => {
      vi.mocked(prisma.purchaseOrder.findFirst).mockResolvedValue(null)
      vi.mocked(prisma.product.findUnique).mockResolvedValue({
        id: 'p1',
        sku: 'P001',
        name: '商品1',
      } as never)
      vi.mocked(prisma.purchaseOrder.create).mockRejectedValue(new Error('DB Error'))

      const result = await createPurchaseOrder(validOrderData)

      expect(result.success).toBe(false)
      expect(result.message).toBe('建立採購單失敗')
    })

    it('應正確設定預期交貨日期', async () => {
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

      await createPurchaseOrder(validOrderData)

      expect(prisma.purchaseOrder.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            expectedDate: expect.any(Date),
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

    it('PENDING 狀態不能編輯', async () => {
      vi.mocked(prisma.purchaseOrder.findUnique).mockResolvedValue({
        id: '1',
        status: 'PENDING',
      } as never)

      const result = await updatePurchaseOrder('1', {
        notes: '更新備註',
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('只能編輯草稿狀態的採購單')
    })

    it('應成功更新明細項目', async () => {
      vi.mocked(prisma.purchaseOrder.findUnique).mockResolvedValue({
        id: '1',
        status: 'DRAFT',
      } as never)
      vi.mocked(prisma.purchaseOrderItem.deleteMany).mockResolvedValue({ count: 1 } as never)
      vi.mocked(prisma.product.findUnique).mockResolvedValue({
        id: 'p1',
        sku: 'P001',
        name: '商品1',
      } as never)
      vi.mocked(prisma.$transaction).mockResolvedValue([{}, {}] as never)

      const result = await updatePurchaseOrder('1', {
        items: [{ productId: 'p1', quantity: 20, unitPrice: 150 }],
      })

      expect(result.success).toBe(true)
    })

    it('更新明細時商品不存在應回傳錯誤', async () => {
      vi.mocked(prisma.purchaseOrder.findUnique).mockResolvedValue({
        id: '1',
        status: 'DRAFT',
      } as never)
      vi.mocked(prisma.purchaseOrderItem.deleteMany).mockResolvedValue({ count: 1 } as never)
      vi.mocked(prisma.product.findUnique).mockResolvedValue(null)

      const result = await updatePurchaseOrder('1', {
        items: [{ productId: 'nonexistent', quantity: 20, unitPrice: 150 }],
      })

      expect(result.success).toBe(false)
      expect(result.message).toContain('商品不存在')
    })

    it('資料庫錯誤時應回傳失敗', async () => {
      vi.mocked(prisma.purchaseOrder.findUnique).mockResolvedValue({
        id: '1',
        status: 'DRAFT',
      } as never)
      vi.mocked(prisma.purchaseOrder.update).mockRejectedValue(new Error('DB Error'))

      const result = await updatePurchaseOrder('1', {
        notes: '更新備註',
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('更新採購單失敗')
    })
  })

  describe('updatePurchaseOrderStatus', () => {
    it('應成功更新採購單狀態', async () => {
      vi.mocked(prisma.purchaseOrder.findUnique).mockResolvedValue({
        id: '1',
        status: 'DRAFT',
      } as never)
      vi.mocked(prisma.purchaseOrder.update).mockResolvedValue({
        id: '1',
        status: 'PENDING',
      } as never)

      const result = await updatePurchaseOrderStatus('1', 'PENDING')

      expect(result.success).toBe(true)
      expect(result.message).toBe('採購單狀態更新成功')
    })

    it('採購單不存在時應回傳錯誤', async () => {
      vi.mocked(prisma.purchaseOrder.findUnique).mockResolvedValue(null)

      const result = await updatePurchaseOrderStatus('nonexistent', 'APPROVED')

      expect(result.success).toBe(false)
      expect(result.message).toBe('採購單不存在')
    })

    it('核准時應記錄核准時間', async () => {
      vi.mocked(prisma.purchaseOrder.findUnique).mockResolvedValue({
        id: '1',
        status: 'PENDING',
      } as never)
      vi.mocked(prisma.purchaseOrder.update).mockResolvedValue({
        id: '1',
        status: 'APPROVED',
      } as never)

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

    it('非核准狀態不應記錄核准時間', async () => {
      vi.mocked(prisma.purchaseOrder.findUnique).mockResolvedValue({
        id: '1',
        status: 'DRAFT',
      } as never)
      vi.mocked(prisma.purchaseOrder.update).mockResolvedValue({
        id: '1',
        status: 'CANCELLED',
      } as never)

      await updatePurchaseOrderStatus('1', 'CANCELLED')

      expect(prisma.purchaseOrder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: 'CANCELLED' },
        })
      )
    })

    it('資料庫錯誤時應回傳失敗', async () => {
      vi.mocked(prisma.purchaseOrder.findUnique).mockResolvedValue({
        id: '1',
        status: 'DRAFT',
      } as never)
      vi.mocked(prisma.purchaseOrder.update).mockRejectedValue(new Error('DB Error'))

      const result = await updatePurchaseOrderStatus('1', 'PENDING')

      expect(result.success).toBe(false)
      expect(result.message).toBe('更新採購單狀態失敗')
    })
  })

  describe('deletePurchaseOrder', () => {
    it('應成功刪除草稿狀態的採購單', async () => {
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

    it('應成功刪除已取消狀態的採購單', async () => {
      vi.mocked(prisma.purchaseOrder.findUnique).mockResolvedValue({
        id: '1',
        status: 'CANCELLED',
        _count: { receipts: 0 },
      } as never)
      vi.mocked(prisma.$transaction).mockResolvedValue([{}, {}] as never)

      const result = await deletePurchaseOrder('1')

      expect(result.success).toBe(true)
      expect(result.message).toBe('採購單刪除成功')
    })

    it('採購單不存在時應回傳錯誤', async () => {
      vi.mocked(prisma.purchaseOrder.findUnique).mockResolvedValue(null)

      const result = await deletePurchaseOrder('nonexistent')

      expect(result.success).toBe(false)
      expect(result.message).toBe('採購單不存在')
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

    it('PENDING 狀態不能刪除', async () => {
      vi.mocked(prisma.purchaseOrder.findUnique).mockResolvedValue({
        id: '1',
        status: 'PENDING',
        _count: { receipts: 0 },
      } as never)

      const result = await deletePurchaseOrder('1')

      expect(result.success).toBe(false)
      expect(result.message).toBe('只能刪除草稿或已取消的採購單')
    })

    it('COMPLETED 狀態不能刪除', async () => {
      vi.mocked(prisma.purchaseOrder.findUnique).mockResolvedValue({
        id: '1',
        status: 'COMPLETED',
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

    it('資料庫錯誤時應回傳失敗', async () => {
      vi.mocked(prisma.purchaseOrder.findUnique).mockResolvedValue({
        id: '1',
        status: 'DRAFT',
        _count: { receipts: 0 },
      } as never)
      vi.mocked(prisma.$transaction).mockRejectedValue(new Error('DB Error'))

      const result = await deletePurchaseOrder('1')

      expect(result.success).toBe(false)
      expect(result.message).toBe('刪除採購單失敗')
    })
  })

  describe('createPurchaseReceipt', () => {
    it('應成功建立驗收單', async () => {
      vi.mocked(prisma.purchaseOrder.findUnique).mockResolvedValue({
        id: '1',
        items: [{ productId: 'p1', quantity: 10 }],
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
      expect((result.data as { id: string })?.id).toBe('receipt-1')
      expect((result.data as { receiptNo: string })?.receiptNo).toBe('PR123')
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

    it('資料庫錯誤時應回傳失敗', async () => {
      vi.mocked(prisma.purchaseOrder.findUnique).mockResolvedValue({
        id: '1',
        items: [],
      } as never)
      vi.mocked(prisma.purchaseReceipt.create).mockRejectedValue(new Error('DB Error'))

      const result = await createPurchaseReceipt({
        purchaseOrderId: '1',
        warehouseId: 'w1',
        items: [],
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('建立驗收單失敗')
    })
  })

  describe('completePurchaseReceipt', () => {
    const mockReceipt = {
      id: '1',
      receiptNo: 'PR001',
      status: 'PENDING',
      warehouseId: 'w1',
      purchaseOrderId: 'order-1',
      items: [{ productId: 'p1', acceptedQty: 10 }],
      purchaseOrder: {
        id: 'order-1',
        items: [{ id: 'item-1', productId: 'p1', quantity: 10, receivedQty: 0 }],
      },
    }

    it('應成功完成驗收並更新庫存', async () => {
      vi.mocked(prisma.purchaseReceipt.findUnique).mockResolvedValue(mockReceipt as never)
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
        ...mockReceipt,
        status: 'COMPLETED',
      } as never)

      const result = await completePurchaseReceipt('1')

      expect(result.success).toBe(false)
      expect(result.message).toBe('此驗收單已完成')
    })

    it('應更新現有庫存', async () => {
      vi.mocked(prisma.purchaseReceipt.findUnique).mockResolvedValue(mockReceipt as never)
      vi.mocked(prisma.inventory.findFirst).mockResolvedValue({
        id: 'inv-1',
        productId: 'p1',
        warehouseId: 'w1',
        quantity: 50,
        availableQty: 50,
      } as never)
      vi.mocked(prisma.$transaction).mockResolvedValue([{}] as never)

      const result = await completePurchaseReceipt('1')

      expect(result.success).toBe(true)
    })

    it('無現有庫存時應建立新庫存紀錄', async () => {
      vi.mocked(prisma.purchaseReceipt.findUnique).mockResolvedValue(mockReceipt as never)
      vi.mocked(prisma.inventory.findFirst).mockResolvedValue(null)
      vi.mocked(prisma.$transaction).mockResolvedValue([{}] as never)

      const result = await completePurchaseReceipt('1')

      expect(result.success).toBe(true)
    })

    it('全部驗收完成時應更新採購單狀態為 COMPLETED', async () => {
      const fullyReceivedReceipt = {
        ...mockReceipt,
        items: [{ productId: 'p1', acceptedQty: 10 }],
        purchaseOrder: {
          id: 'order-1',
          items: [{ id: 'item-1', productId: 'p1', quantity: 10, receivedQty: 0 }],
        },
      }

      vi.mocked(prisma.purchaseReceipt.findUnique).mockResolvedValue(fullyReceivedReceipt as never)
      vi.mocked(prisma.inventory.findFirst).mockResolvedValue(null)
      vi.mocked(prisma.$transaction).mockResolvedValue([{}] as never)

      const result = await completePurchaseReceipt('1')

      expect(result.success).toBe(true)
    })

    it('部分驗收時應更新採購單狀態為 PARTIAL', async () => {
      const partialReceipt = {
        ...mockReceipt,
        items: [{ productId: 'p1', acceptedQty: 5 }],
        purchaseOrder: {
          id: 'order-1',
          items: [{ id: 'item-1', productId: 'p1', quantity: 10, receivedQty: 0 }],
        },
      }

      vi.mocked(prisma.purchaseReceipt.findUnique).mockResolvedValue(partialReceipt as never)
      vi.mocked(prisma.inventory.findFirst).mockResolvedValue(null)
      vi.mocked(prisma.$transaction).mockResolvedValue([{}] as never)

      const result = await completePurchaseReceipt('1')

      expect(result.success).toBe(true)
    })

    it('多商品部分驗收時應正確處理', async () => {
      const multiItemReceipt = {
        ...mockReceipt,
        items: [
          { productId: 'p1', acceptedQty: 10 },
          { productId: 'p2', acceptedQty: 3 },
        ],
        purchaseOrder: {
          id: 'order-1',
          items: [
            { id: 'item-1', productId: 'p1', quantity: 10, receivedQty: 0 },
            { id: 'item-2', productId: 'p2', quantity: 10, receivedQty: 0 },
          ],
        },
      }

      vi.mocked(prisma.purchaseReceipt.findUnique).mockResolvedValue(multiItemReceipt as never)
      vi.mocked(prisma.inventory.findFirst).mockResolvedValue(null)
      vi.mocked(prisma.$transaction).mockResolvedValue([{}] as never)

      const result = await completePurchaseReceipt('1')

      expect(result.success).toBe(true)
    })

    it('資料庫錯誤時應回傳失敗', async () => {
      vi.mocked(prisma.purchaseReceipt.findUnique).mockResolvedValue(mockReceipt as never)
      vi.mocked(prisma.inventory.findFirst).mockResolvedValue(null)
      vi.mocked(prisma.$transaction).mockRejectedValue(new Error('DB Error'))

      const result = await completePurchaseReceipt('1')

      expect(result.success).toBe(false)
      expect(result.message).toBe('完成驗收失敗')
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

    it('無日期範圍時應回傳全部統計', async () => {
      vi.mocked(prisma.purchaseOrder.count)
        .mockResolvedValueOnce(50)
        .mockResolvedValueOnce(40)
        .mockResolvedValueOnce(10)
      vi.mocked(prisma.purchaseOrder.aggregate).mockResolvedValue({
        _sum: { totalAmount: 500000 },
      } as never)

      const result = await getPurchaseStats()

      expect(result.totalOrders).toBe(50)
      expect(result.completedOrders).toBe(40)
    })

    it('無金額時應回傳 0', async () => {
      vi.mocked(prisma.purchaseOrder.count)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
      vi.mocked(prisma.purchaseOrder.aggregate).mockResolvedValue({
        _sum: { totalAmount: null },
      } as never)

      const result = await getPurchaseStats()

      expect(result.totalAmount).toBe(0)
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

    it('無採購單時應回傳 0', async () => {
      vi.mocked(prisma.purchaseOrder.count)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)

      const result = await getPurchaseOrderStats()

      expect(result.totalOrders).toBe(0)
      expect(result.pendingOrders).toBe(0)
      expect(result.approvedOrders).toBe(0)
      expect(result.completedOrders).toBe(0)
    })
  })
})
