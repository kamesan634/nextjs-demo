/**
 * Audit Logs Server Actions 測試
 * 測試操作日誌相關的 Server Actions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getAuditLogs,
  getAuditLog,
  getUserAuditLogs,
  getModuleAuditLogs,
  getTargetAuditLogs,
  getAvailableModules,
  getAuditLogStats,
} from '@/actions/audit-logs'
import prisma from '@/lib/prisma'

// Mock revalidatePath
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

describe('Audit Logs Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===== 取得操作日誌列表測試 =====
  describe('getAuditLogs', () => {
    const mockLogs = [
      {
        id: '1',
        userId: 'user-1',
        action: 'CREATE',
        module: 'products',
        targetId: 'product-1',
        targetType: 'Product',
        description: '建立商品',
        createdAt: new Date('2024-01-15'),
        user: { id: 'user-1', name: '管理員', username: 'admin' },
      },
      {
        id: '2',
        userId: 'user-2',
        action: 'UPDATE',
        module: 'orders',
        targetId: 'order-1',
        targetType: 'Order',
        description: '更新訂單',
        createdAt: new Date('2024-01-14'),
        user: { id: 'user-2', name: '收銀員', username: 'cashier' },
      },
    ]

    it('應回傳分頁的操作日誌列表', async () => {
      vi.mocked(prisma.auditLog.findMany).mockResolvedValue(mockLogs as never)
      vi.mocked(prisma.auditLog.count).mockResolvedValue(2)

      const result = await getAuditLogs({ page: 1, pageSize: 10 })

      expect(result.data).toHaveLength(2)
      expect(result.pagination.total).toBe(2)
      expect(result.pagination.page).toBe(1)
      expect(result.pagination.pageSize).toBe(10)
    })

    it('應包含使用者資訊', async () => {
      vi.mocked(prisma.auditLog.findMany).mockResolvedValue(mockLogs as never)
      vi.mocked(prisma.auditLog.count).mockResolvedValue(2)

      const result = await getAuditLogs()

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            user: expect.objectContaining({
              select: expect.objectContaining({
                id: true,
                name: true,
                username: true,
              }),
            }),
          }),
        })
      )
      expect(result.data[0].user?.name).toBe('管理員')
    })

    it('應支援搜尋功能', async () => {
      vi.mocked(prisma.auditLog.findMany).mockResolvedValue([])
      vi.mocked(prisma.auditLog.count).mockResolvedValue(0)

      await getAuditLogs({ search: '建立' })

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
          }),
        })
      )
    })

    it('應支援使用者篩選', async () => {
      vi.mocked(prisma.auditLog.findMany).mockResolvedValue([])
      vi.mocked(prisma.auditLog.count).mockResolvedValue(0)

      await getAuditLogs({ userId: 'user-1' })

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user-1',
          }),
        })
      )
    })

    it('應支援操作類型篩選', async () => {
      vi.mocked(prisma.auditLog.findMany).mockResolvedValue([])
      vi.mocked(prisma.auditLog.count).mockResolvedValue(0)

      await getAuditLogs({ action: 'CREATE' })

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            action: 'CREATE',
          }),
        })
      )
    })

    it('應支援模組篩選', async () => {
      vi.mocked(prisma.auditLog.findMany).mockResolvedValue([])
      vi.mocked(prisma.auditLog.count).mockResolvedValue(0)

      await getAuditLogs({ module: 'products' })

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            module: 'products',
          }),
        })
      )
    })

    it('應支援日期範圍篩選', async () => {
      vi.mocked(prisma.auditLog.findMany).mockResolvedValue([])
      vi.mocked(prisma.auditLog.count).mockResolvedValue(0)

      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-31')

      await getAuditLogs({ startDate, endDate })

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.objectContaining({
              gte: startDate,
              lte: endDate,
            }),
          }),
        })
      )
    })

    it('應支援只有開始日期的篩選', async () => {
      vi.mocked(prisma.auditLog.findMany).mockResolvedValue([])
      vi.mocked(prisma.auditLog.count).mockResolvedValue(0)

      const startDate = new Date('2024-01-01')

      await getAuditLogs({ startDate })

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.objectContaining({
              gte: startDate,
            }),
          }),
        })
      )
    })

    it('應支援只有結束日期的篩選', async () => {
      vi.mocked(prisma.auditLog.findMany).mockResolvedValue([])
      vi.mocked(prisma.auditLog.count).mockResolvedValue(0)

      const endDate = new Date('2024-01-31')

      await getAuditLogs({ endDate })

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.objectContaining({
              lte: endDate,
            }),
          }),
        })
      )
    })

    it('應使用預設分頁參數', async () => {
      vi.mocked(prisma.auditLog.findMany).mockResolvedValue([])
      vi.mocked(prisma.auditLog.count).mockResolvedValue(0)

      const result = await getAuditLogs()

      expect(result.pagination.page).toBe(1)
      expect(result.pagination.pageSize).toBe(20)
    })

    it('應按建立時間降序排序', async () => {
      vi.mocked(prisma.auditLog.findMany).mockResolvedValue([])
      vi.mocked(prisma.auditLog.count).mockResolvedValue(0)

      await getAuditLogs()

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        })
      )
    })

    it('應正確計算分頁資訊', async () => {
      vi.mocked(prisma.auditLog.findMany).mockResolvedValue([])
      vi.mocked(prisma.auditLog.count).mockResolvedValue(50)

      const result = await getAuditLogs({ page: 2, pageSize: 10 })

      expect(result.pagination.totalPages).toBe(5)
      expect(result.pagination.hasNextPage).toBe(true)
      expect(result.pagination.hasPrevPage).toBe(true)
    })
  })

  // ===== 取得單一操作日誌測試 =====
  describe('getAuditLog', () => {
    it('應回傳操作日誌詳情', async () => {
      const mockLog = {
        id: '1',
        userId: 'user-1',
        action: 'CREATE',
        module: 'products',
        targetId: 'product-1',
        targetType: 'Product',
        description: '建立商品',
        createdAt: new Date('2024-01-15'),
        user: { id: 'user-1', name: '管理員', username: 'admin' },
      }

      vi.mocked(prisma.auditLog.findUnique).mockResolvedValue(mockLog as never)

      const result = await getAuditLog('1')

      expect(result?.action).toBe('CREATE')
      expect(result?.module).toBe('products')
      expect(result?.user?.name).toBe('管理員')
    })

    it('應包含使用者資訊', async () => {
      vi.mocked(prisma.auditLog.findUnique).mockResolvedValue(null)

      await getAuditLog('1')

      expect(prisma.auditLog.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            user: expect.objectContaining({
              select: expect.objectContaining({
                id: true,
                name: true,
                username: true,
              }),
            }),
          }),
        })
      )
    })

    it('日誌不存在時應回傳 null', async () => {
      vi.mocked(prisma.auditLog.findUnique).mockResolvedValue(null)

      const result = await getAuditLog('nonexistent')

      expect(result).toBeNull()
    })
  })

  // ===== 取得使用者操作日誌測試 =====
  describe('getUserAuditLogs', () => {
    it('應回傳指定使用者的操作日誌', async () => {
      const mockLogs = [
        { id: '1', userId: 'user-1', action: 'CREATE' },
        { id: '2', userId: 'user-1', action: 'UPDATE' },
      ]

      vi.mocked(prisma.auditLog.findMany).mockResolvedValue(mockLogs as never)

      const result = await getUserAuditLogs('user-1')

      expect(result).toHaveLength(2)
      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1' },
        })
      )
    })

    it('應使用預設限制數量', async () => {
      vi.mocked(prisma.auditLog.findMany).mockResolvedValue([])

      await getUserAuditLogs('user-1')

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
        })
      )
    })

    it('應支援自訂限制數量', async () => {
      vi.mocked(prisma.auditLog.findMany).mockResolvedValue([])

      await getUserAuditLogs('user-1', 5)

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
        })
      )
    })

    it('應按建立時間降序排序', async () => {
      vi.mocked(prisma.auditLog.findMany).mockResolvedValue([])

      await getUserAuditLogs('user-1')

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        })
      )
    })
  })

  // ===== 取得模組操作日誌測試 =====
  describe('getModuleAuditLogs', () => {
    it('應回傳指定模組的操作日誌', async () => {
      const mockLogs = [
        {
          id: '1',
          module: 'products',
          action: 'CREATE',
          user: { id: 'user-1', name: '管理員', username: 'admin' },
        },
        {
          id: '2',
          module: 'products',
          action: 'UPDATE',
          user: { id: 'user-2', name: '收銀員', username: 'cashier' },
        },
      ]

      vi.mocked(prisma.auditLog.findMany).mockResolvedValue(mockLogs as never)

      const result = await getModuleAuditLogs('products')

      expect(result).toHaveLength(2)
      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { module: 'products' },
        })
      )
    })

    it('應包含使用者資訊', async () => {
      vi.mocked(prisma.auditLog.findMany).mockResolvedValue([])

      await getModuleAuditLogs('products')

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            user: expect.objectContaining({
              select: expect.objectContaining({
                id: true,
                name: true,
                username: true,
              }),
            }),
          }),
        })
      )
    })

    it('應使用預設限制數量', async () => {
      vi.mocked(prisma.auditLog.findMany).mockResolvedValue([])

      await getModuleAuditLogs('products')

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
        })
      )
    })

    it('應支援自訂限制數量', async () => {
      vi.mocked(prisma.auditLog.findMany).mockResolvedValue([])

      await getModuleAuditLogs('products', 20)

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 20,
        })
      )
    })
  })

  // ===== 取得特定對象操作日誌測試 =====
  describe('getTargetAuditLogs', () => {
    it('應回傳指定對象的操作日誌', async () => {
      const mockLogs = [
        {
          id: '1',
          targetId: 'product-1',
          targetType: 'Product',
          action: 'CREATE',
          user: { id: 'user-1', name: '管理員', username: 'admin' },
        },
        {
          id: '2',
          targetId: 'product-1',
          targetType: 'Product',
          action: 'UPDATE',
          user: { id: 'user-2', name: '收銀員', username: 'cashier' },
        },
      ]

      vi.mocked(prisma.auditLog.findMany).mockResolvedValue(mockLogs as never)

      const result = await getTargetAuditLogs('product-1', 'Product')

      expect(result).toHaveLength(2)
      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { targetId: 'product-1', targetType: 'Product' },
        })
      )
    })

    it('應包含使用者資訊', async () => {
      vi.mocked(prisma.auditLog.findMany).mockResolvedValue([])

      await getTargetAuditLogs('product-1', 'Product')

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            user: expect.objectContaining({
              select: expect.objectContaining({
                id: true,
                name: true,
                username: true,
              }),
            }),
          }),
        })
      )
    })

    it('應按建立時間降序排序', async () => {
      vi.mocked(prisma.auditLog.findMany).mockResolvedValue([])

      await getTargetAuditLogs('product-1', 'Product')

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        })
      )
    })
  })

  // ===== 取得可用模組列表測試 =====
  describe('getAvailableModules', () => {
    it('應回傳所有可用模組', async () => {
      const mockModules = [{ module: 'products' }, { module: 'orders' }, { module: 'customers' }]

      vi.mocked(prisma.auditLog.findMany).mockResolvedValue(mockModules as never)

      const result = await getAvailableModules()

      expect(result).toEqual(['products', 'orders', 'customers'])
    })

    it('應使用 distinct 取得唯一模組', async () => {
      vi.mocked(prisma.auditLog.findMany).mockResolvedValue([])

      await getAvailableModules()

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          select: { module: true },
          distinct: ['module'],
        })
      )
    })

    it('應按模組名稱排序', async () => {
      vi.mocked(prisma.auditLog.findMany).mockResolvedValue([])

      await getAvailableModules()

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { module: 'asc' },
        })
      )
    })

    it('無日誌時應回傳空陣列', async () => {
      vi.mocked(prisma.auditLog.findMany).mockResolvedValue([])

      const result = await getAvailableModules()

      expect(result).toEqual([])
    })
  })

  // ===== 取得操作日誌統計測試 =====
  describe('getAuditLogStats', () => {
    it('應回傳統計資訊', async () => {
      const mockActionCounts = [
        { action: 'CREATE', _count: { action: 10 } },
        { action: 'UPDATE', _count: { action: 20 } },
        { action: 'DELETE', _count: { action: 5 } },
      ]

      const mockModuleCounts = [
        { module: 'products', _count: { module: 15 } },
        { module: 'orders', _count: { module: 20 } },
      ]

      vi.mocked(prisma.auditLog.groupBy).mockResolvedValueOnce(mockActionCounts as never)
      vi.mocked(prisma.auditLog.groupBy).mockResolvedValueOnce(mockModuleCounts as never)
      vi.mocked(prisma.auditLog.count).mockResolvedValue(35)

      const result = await getAuditLogStats()

      expect(result.total).toBe(35)
      expect(result.byAction).toHaveLength(3)
      expect(result.byModule).toHaveLength(2)
    })

    it('應正確格式化操作統計', async () => {
      const mockActionCounts = [{ action: 'CREATE', _count: { action: 10 } }]

      vi.mocked(prisma.auditLog.groupBy).mockResolvedValueOnce(mockActionCounts as never)
      vi.mocked(prisma.auditLog.groupBy).mockResolvedValueOnce([] as never)
      vi.mocked(prisma.auditLog.count).mockResolvedValue(10)

      const result = await getAuditLogStats()

      expect(result.byAction[0]).toEqual({
        action: 'CREATE',
        count: 10,
      })
    })

    it('應正確格式化模組統計', async () => {
      const mockModuleCounts = [{ module: 'products', _count: { module: 15 } }]

      vi.mocked(prisma.auditLog.groupBy).mockResolvedValueOnce([] as never)
      vi.mocked(prisma.auditLog.groupBy).mockResolvedValueOnce(mockModuleCounts as never)
      vi.mocked(prisma.auditLog.count).mockResolvedValue(15)

      const result = await getAuditLogStats()

      expect(result.byModule[0]).toEqual({
        module: 'products',
        count: 15,
      })
    })

    it('應支援日期範圍篩選', async () => {
      vi.mocked(prisma.auditLog.groupBy).mockResolvedValue([] as never)
      vi.mocked(prisma.auditLog.count).mockResolvedValue(0)

      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-31')

      await getAuditLogStats(startDate, endDate)

      expect(prisma.auditLog.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.objectContaining({
              gte: startDate,
              lte: endDate,
            }),
          }),
        })
      )
    })

    it('應支援只有開始日期的篩選', async () => {
      vi.mocked(prisma.auditLog.groupBy).mockResolvedValue([] as never)
      vi.mocked(prisma.auditLog.count).mockResolvedValue(0)

      const startDate = new Date('2024-01-01')

      await getAuditLogStats(startDate)

      expect(prisma.auditLog.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.objectContaining({
              gte: startDate,
            }),
          }),
        })
      )
    })

    it('應支援只有結束日期的篩選', async () => {
      vi.mocked(prisma.auditLog.groupBy).mockResolvedValue([] as never)
      vi.mocked(prisma.auditLog.count).mockResolvedValue(0)

      const endDate = new Date('2024-01-31')

      await getAuditLogStats(undefined, endDate)

      expect(prisma.auditLog.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.objectContaining({
              lte: endDate,
            }),
          }),
        })
      )
    })

    it('無日期篩選時應不加日期條件', async () => {
      vi.mocked(prisma.auditLog.groupBy).mockResolvedValue([] as never)
      vi.mocked(prisma.auditLog.count).mockResolvedValue(0)

      await getAuditLogStats()

      expect(prisma.auditLog.count).toHaveBeenCalledWith({
        where: {},
      })
    })
  })
})
