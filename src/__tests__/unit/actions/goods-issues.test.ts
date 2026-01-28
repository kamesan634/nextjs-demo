/**
 * Goods Issues Server Actions 測試
 * 測試出庫單管理相關的 Server Actions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getGoodsIssues,
  getGoodsIssue,
  createGoodsIssue,
  completeGoodsIssue,
  cancelGoodsIssue,
} from '@/actions/goods-issues'
import prisma from '@/lib/prisma'

// Mock revalidatePath
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

describe('Goods Issues Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getGoodsIssues', () => {
    it('應回傳分頁的出庫單列表', async () => {
      const mockIssues = [
        {
          id: '1',
          issueNo: 'GI-20240115-0001',
          status: 'PENDING',
          warehouse: { id: 'w1', code: 'W001', name: '倉庫A' },
          items: [
            {
              id: 'item-1',
              productId: 'p1',
              quantity: 10,
              product: { id: 'p1', sku: 'P001', name: '商品1' },
            },
          ],
        },
      ]

      vi.mocked(prisma.goodsIssue.findMany).mockResolvedValue(mockIssues as never)
      vi.mocked(prisma.goodsIssue.count).mockResolvedValue(1)

      const result = await getGoodsIssues({ page: 1, pageSize: 10 })

      expect(result.data).toHaveLength(1)
      expect(result.data[0].issueNo).toBe('GI-20240115-0001')
      expect(result.pagination.total).toBe(1)
      expect(result.pagination.page).toBe(1)
      expect(result.pagination.pageSize).toBe(10)
    })

    it('應支援搜尋功能', async () => {
      vi.mocked(prisma.goodsIssue.findMany).mockResolvedValue([])
      vi.mocked(prisma.goodsIssue.count).mockResolvedValue(0)

      await getGoodsIssues({ search: 'GI-2024' })

      expect(prisma.goodsIssue.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([expect.objectContaining({ issueNo: expect.any(Object) })]),
          }),
        })
      )
    })

    it('應支援狀態篩選', async () => {
      vi.mocked(prisma.goodsIssue.findMany).mockResolvedValue([])
      vi.mocked(prisma.goodsIssue.count).mockResolvedValue(0)

      await getGoodsIssues({ status: 'PENDING' })

      expect(prisma.goodsIssue.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'PENDING' }),
        })
      )
    })

    it('應支援倉庫篩選', async () => {
      vi.mocked(prisma.goodsIssue.findMany).mockResolvedValue([])
      vi.mocked(prisma.goodsIssue.count).mockResolvedValue(0)

      await getGoodsIssues({ warehouseId: 'w1' })

      expect(prisma.goodsIssue.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ warehouseId: 'w1' }),
        })
      )
    })

    it('無參數時應使用預設分頁', async () => {
      vi.mocked(prisma.goodsIssue.findMany).mockResolvedValue([])
      vi.mocked(prisma.goodsIssue.count).mockResolvedValue(0)

      const result = await getGoodsIssues()

      expect(result.pagination.page).toBe(1)
      expect(result.pagination.pageSize).toBe(10)
    })

    it('應正確計算分頁資訊', async () => {
      vi.mocked(prisma.goodsIssue.findMany).mockResolvedValue([])
      vi.mocked(prisma.goodsIssue.count).mockResolvedValue(25)

      const result = await getGoodsIssues({ page: 2, pageSize: 10 })

      expect(result.pagination.totalPages).toBe(3)
      expect(result.pagination.hasNextPage).toBe(true)
      expect(result.pagination.hasPrevPage).toBe(true)
    })

    it('第一頁應無前一頁', async () => {
      vi.mocked(prisma.goodsIssue.findMany).mockResolvedValue([])
      vi.mocked(prisma.goodsIssue.count).mockResolvedValue(25)

      const result = await getGoodsIssues({ page: 1, pageSize: 10 })

      expect(result.pagination.hasPrevPage).toBe(false)
    })

    it('最後一頁應無下一頁', async () => {
      vi.mocked(prisma.goodsIssue.findMany).mockResolvedValue([])
      vi.mocked(prisma.goodsIssue.count).mockResolvedValue(25)

      const result = await getGoodsIssues({ page: 3, pageSize: 10 })

      expect(result.pagination.hasNextPage).toBe(false)
    })
  })

  describe('getGoodsIssue', () => {
    it('應回傳出庫單詳情', async () => {
      const mockIssue = {
        id: '1',
        issueNo: 'GI-20240115-0001',
        status: 'PENDING',
        warehouse: { id: 'w1', name: '倉庫A' },
        items: [
          {
            id: 'item-1',
            productId: 'p1',
            quantity: 10,
            product: { id: 'p1', sku: 'P001', name: '商品1' },
          },
        ],
      }

      vi.mocked(prisma.goodsIssue.findUnique).mockResolvedValue(mockIssue as never)

      const result = await getGoodsIssue('1')

      expect(result?.issueNo).toBe('GI-20240115-0001')
      expect(result?.warehouse.name).toBe('倉庫A')
      expect(result?.items).toHaveLength(1)
    })

    it('出庫單不存在時應回傳 null', async () => {
      vi.mocked(prisma.goodsIssue.findUnique).mockResolvedValue(null)

      const result = await getGoodsIssue('nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('createGoodsIssue', () => {
    const validData = {
      warehouseId: 'w1',
      type: 'SALES' as const,
      items: [{ productId: 'p1', quantity: 10 }],
    }

    it('應成功建立出庫單', async () => {
      vi.mocked(prisma.goodsIssue.count).mockResolvedValue(0)
      vi.mocked(prisma.goodsIssue.create).mockResolvedValue({
        id: 'new-id',
        issueNo: 'GI-20240115-0001',
      } as never)

      const result = await createGoodsIssue(validData)

      expect(result.success).toBe(true)
      expect(result.message).toBe('出庫單建立成功')
      expect((result.data as { id: string })?.id).toBe('new-id')
    })

    it('驗證失敗時應回傳錯誤 - 缺少倉庫', async () => {
      const result = await createGoodsIssue({
        warehouseId: '',
        type: 'SALES',
        items: [{ productId: 'p1', quantity: 10 }],
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('驗證失敗')
      expect(result.errors).toBeDefined()
    })

    it('驗證失敗時應回傳錯誤 - 無效的出庫類型', async () => {
      const result = await createGoodsIssue({
        warehouseId: 'w1',
        type: 'INVALID' as 'SALES',
        items: [{ productId: 'p1', quantity: 10 }],
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('驗證失敗')
    })

    it('驗證失敗時應回傳錯誤 - 空項目', async () => {
      const result = await createGoodsIssue({
        warehouseId: 'w1',
        type: 'SALES',
        items: [],
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('驗證失敗')
    })

    it('驗證失敗時應回傳錯誤 - 數量為零', async () => {
      const result = await createGoodsIssue({
        warehouseId: 'w1',
        type: 'SALES',
        items: [{ productId: 'p1', quantity: 0 }],
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('驗證失敗')
    })

    it('資料庫錯誤時應回傳失敗', async () => {
      vi.mocked(prisma.goodsIssue.count).mockResolvedValue(0)
      vi.mocked(prisma.goodsIssue.create).mockRejectedValue(new Error('DB Error'))

      const result = await createGoodsIssue(validData)

      expect(result.success).toBe(false)
      expect(result.message).toBe('建立出庫單失敗')
    })

    it('應正確產生出庫單號', async () => {
      vi.mocked(prisma.goodsIssue.count).mockResolvedValue(5)
      vi.mocked(prisma.goodsIssue.create).mockResolvedValue({
        id: 'new-id',
        issueNo: 'GI-20240115-0006',
      } as never)

      await createGoodsIssue(validData)

      expect(prisma.goodsIssue.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            issueNo: expect.stringMatching(/^GI-\d{8}-0006$/),
          }),
        })
      )
    })

    it('應支援可選參數', async () => {
      vi.mocked(prisma.goodsIssue.count).mockResolvedValue(0)
      vi.mocked(prisma.goodsIssue.create).mockResolvedValue({
        id: 'new-id',
        issueNo: 'GI-20240115-0001',
      } as never)

      const result = await createGoodsIssue({
        ...validData,
        referenceType: 'ORDER',
        referenceId: 'order-123',
        issueDate: '2024-01-15',
        notes: '測試備註',
      })

      expect(result.success).toBe(true)
    })
  })

  describe('completeGoodsIssue', () => {
    it('應成功完成出庫單並扣減庫存', async () => {
      const mockIssue = {
        id: '1',
        issueNo: 'GI-20240115-0001',
        status: 'PENDING',
        warehouseId: 'w1',
        items: [{ productId: 'p1', quantity: 10 }],
      }

      vi.mocked(prisma.goodsIssue.findUnique).mockResolvedValue(mockIssue as never)
      vi.mocked(prisma.$transaction).mockResolvedValue([{}] as never)

      const result = await completeGoodsIssue('1')

      expect(result.success).toBe(true)
      expect(result.message).toBe('出庫單已完成')
    })

    it('出庫單不存在時應回傳錯誤', async () => {
      vi.mocked(prisma.goodsIssue.findUnique).mockResolvedValue(null)

      const result = await completeGoodsIssue('nonexistent')

      expect(result.success).toBe(false)
      expect(result.message).toBe('出庫單不存在')
    })

    it('非待處理狀態不能完成', async () => {
      const mockIssue = {
        id: '1',
        status: 'COMPLETED',
        items: [],
      }

      vi.mocked(prisma.goodsIssue.findUnique).mockResolvedValue(mockIssue as never)

      const result = await completeGoodsIssue('1')

      expect(result.success).toBe(false)
      expect(result.message).toBe('出庫單狀態不正確')
    })

    it('已取消狀態不能完成', async () => {
      const mockIssue = {
        id: '1',
        status: 'CANCELLED',
        items: [],
      }

      vi.mocked(prisma.goodsIssue.findUnique).mockResolvedValue(mockIssue as never)

      const result = await completeGoodsIssue('1')

      expect(result.success).toBe(false)
      expect(result.message).toBe('出庫單狀態不正確')
    })

    it('資料庫錯誤時應回傳失敗', async () => {
      const mockIssue = {
        id: '1',
        status: 'PENDING',
        warehouseId: 'w1',
        items: [{ productId: 'p1', quantity: 10 }],
      }

      vi.mocked(prisma.goodsIssue.findUnique).mockResolvedValue(mockIssue as never)
      vi.mocked(prisma.$transaction).mockRejectedValue(new Error('DB Error'))

      const result = await completeGoodsIssue('1')

      expect(result.success).toBe(false)
      expect(result.message).toBe('完成出庫單失敗')
    })
  })

  describe('cancelGoodsIssue', () => {
    it('應成功取消出庫單', async () => {
      const mockIssue = {
        id: '1',
        status: 'PENDING',
      }

      vi.mocked(prisma.goodsIssue.findUnique).mockResolvedValue(mockIssue as never)
      vi.mocked(prisma.goodsIssue.update).mockResolvedValue({
        id: '1',
        status: 'CANCELLED',
      } as never)

      const result = await cancelGoodsIssue('1')

      expect(result.success).toBe(true)
      expect(result.message).toBe('出庫單已取消')
    })

    it('出庫單不存在時應回傳錯誤', async () => {
      vi.mocked(prisma.goodsIssue.findUnique).mockResolvedValue(null)

      const result = await cancelGoodsIssue('nonexistent')

      expect(result.success).toBe(false)
      expect(result.message).toBe('出庫單不存在')
    })

    it('非待處理狀態不能取消', async () => {
      const mockIssue = {
        id: '1',
        status: 'COMPLETED',
      }

      vi.mocked(prisma.goodsIssue.findUnique).mockResolvedValue(mockIssue as never)

      const result = await cancelGoodsIssue('1')

      expect(result.success).toBe(false)
      expect(result.message).toBe('只能取消待處理的出庫單')
    })

    it('已取消狀態不能重複取消', async () => {
      const mockIssue = {
        id: '1',
        status: 'CANCELLED',
      }

      vi.mocked(prisma.goodsIssue.findUnique).mockResolvedValue(mockIssue as never)

      const result = await cancelGoodsIssue('1')

      expect(result.success).toBe(false)
      expect(result.message).toBe('只能取消待處理的出庫單')
    })

    it('資料庫錯誤時應回傳失敗', async () => {
      const mockIssue = {
        id: '1',
        status: 'PENDING',
      }

      vi.mocked(prisma.goodsIssue.findUnique).mockResolvedValue(mockIssue as never)
      vi.mocked(prisma.goodsIssue.update).mockRejectedValue(new Error('DB Error'))

      const result = await cancelGoodsIssue('1')

      expect(result.success).toBe(false)
      expect(result.message).toBe('取消出庫單失敗')
    })
  })
})
