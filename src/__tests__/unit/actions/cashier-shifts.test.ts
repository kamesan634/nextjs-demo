/**
 * Cashier Shifts Server Actions 測試
 * 測試收銀班別管理相關的 Server Actions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  openShift,
  closeShift,
  getCurrentShift,
  getShifts,
  getShift,
} from '@/actions/cashier-shifts'
import prisma from '@/lib/prisma'

// Mock revalidatePath
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

describe('Cashier Shifts Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('openShift', () => {
    const validShiftData = {
      userId: 'user-1',
      storeId: 'store-1',
      openingCash: 10000,
      notes: '開班備註',
    }

    it('應成功開啟收銀班別', async () => {
      // Mock 檢查是否有開啟中的班別
      vi.mocked(prisma.cashierShift.findFirst).mockResolvedValueOnce(null)
      // Mock 檢查是否有 POS Session
      vi.mocked(prisma.pOSSession.findFirst).mockResolvedValueOnce(null)
      // Mock 創建 POS Session
      vi.mocked(prisma.pOSSession.create).mockResolvedValue({
        id: 'session-1',
        sessionNo: 'POS-20240115-abc',
      } as never)
      // Mock 生成班別編號
      vi.mocked(prisma.cashierShift.findFirst).mockResolvedValueOnce(null)
      // Mock 創建班別
      vi.mocked(prisma.cashierShift.create).mockResolvedValue({
        id: 'shift-1',
        shiftNo: 'SHIFT-20240115-001',
        status: 'OPEN',
        user: { id: 'user-1', username: 'cashier1', email: 'cashier@example.com' },
        store: { id: 'store-1', name: '台北店' },
      } as never)

      const result = await openShift(validShiftData)

      expect(result.success).toBe(true)
      expect(result.message).toBe('收銀班別已開啟')
      expect(result.data).toBeDefined()
    })

    it('已有開啟中的班別時應回傳錯誤', async () => {
      vi.mocked(prisma.cashierShift.findFirst).mockResolvedValueOnce({
        id: 'existing-shift',
        status: 'OPEN',
      } as never)

      const result = await openShift(validShiftData)

      expect(result.success).toBe(false)
      expect(result.message).toBe('您已有一個開啟中的收銀班別')
    })

    it('應重用現有的 POS Session', async () => {
      vi.mocked(prisma.cashierShift.findFirst).mockResolvedValueOnce(null)
      vi.mocked(prisma.pOSSession.findFirst).mockResolvedValueOnce({
        id: 'existing-session',
        status: 'OPEN',
      } as never)
      vi.mocked(prisma.cashierShift.findFirst).mockResolvedValueOnce(null)
      vi.mocked(prisma.cashierShift.create).mockResolvedValue({
        id: 'shift-1',
        shiftNo: 'SHIFT-20240115-001',
        sessionId: 'existing-session',
      } as never)

      const result = await openShift(validShiftData)

      expect(result.success).toBe(true)
      expect(prisma.pOSSession.create).not.toHaveBeenCalled()
    })

    it('資料庫錯誤時應回傳失敗', async () => {
      vi.mocked(prisma.cashierShift.findFirst).mockResolvedValueOnce(null)
      vi.mocked(prisma.pOSSession.findFirst).mockResolvedValueOnce(null)
      vi.mocked(prisma.pOSSession.create).mockRejectedValue(new Error('DB Error'))

      const result = await openShift(validShiftData)

      expect(result.success).toBe(false)
      expect(result.message).toBe('開啟收銀班別失敗')
    })

    it('應生成正確格式的班別編號', async () => {
      vi.mocked(prisma.cashierShift.findFirst).mockResolvedValueOnce(null)
      vi.mocked(prisma.pOSSession.findFirst).mockResolvedValueOnce({
        id: 'session-1',
      } as never)
      vi.mocked(prisma.cashierShift.findFirst).mockResolvedValueOnce({
        shiftNo: 'SHIFT-20240115-005',
      } as never)
      vi.mocked(prisma.cashierShift.create).mockResolvedValue({
        id: 'shift-1',
        shiftNo: 'SHIFT-20240115-006',
      } as never)

      const result = await openShift(validShiftData)

      expect(result.success).toBe(true)
      expect(prisma.cashierShift.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            shiftNo: expect.stringMatching(/^SHIFT-\d{8}-\d{3}$/),
          }),
        })
      )
    })
  })

  describe('closeShift', () => {
    const closeData = {
      closingCash: 15000,
      notes: '關班備註',
    }

    it('應成功關閉收銀班別', async () => {
      vi.mocked(prisma.cashierShift.findUnique).mockResolvedValue({
        id: 'shift-1',
        status: 'OPEN',
        openingCash: 10000,
        salesTotal: 5000,
        notes: '',
      } as never)
      vi.mocked(prisma.cashierShift.update).mockResolvedValue({
        id: 'shift-1',
        status: 'CLOSED',
        closingCash: 15000,
        expectedCash: 15000,
        difference: 0,
        user: { id: 'user-1', username: 'cashier1', email: 'test@example.com' },
        store: { id: 'store-1', name: '台北店' },
      } as never)

      const result = await closeShift('shift-1', closeData)

      expect(result.success).toBe(true)
      expect(result.message).toBe('收銀班別已關閉')
    })

    it('班別不存在時應回傳錯誤', async () => {
      vi.mocked(prisma.cashierShift.findUnique).mockResolvedValue(null)

      const result = await closeShift('nonexistent', closeData)

      expect(result.success).toBe(false)
      expect(result.message).toBe('收銀班別不存在')
    })

    it('班別已關閉時應回傳錯誤', async () => {
      vi.mocked(prisma.cashierShift.findUnique).mockResolvedValue({
        id: 'shift-1',
        status: 'CLOSED',
      } as never)

      const result = await closeShift('shift-1', closeData)

      expect(result.success).toBe(false)
      expect(result.message).toBe('收銀班別已經關閉')
    })

    it('應正確計算預期現金和差異', async () => {
      vi.mocked(prisma.cashierShift.findUnique).mockResolvedValue({
        id: 'shift-1',
        status: 'OPEN',
        openingCash: 10000,
        salesTotal: 5000,
        notes: '',
      } as never)
      vi.mocked(prisma.cashierShift.update).mockResolvedValue({} as never)

      await closeShift('shift-1', { closingCash: 14500 })

      expect(prisma.cashierShift.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            expectedCash: 15000, // 10000 + 5000
            difference: -500, // 14500 - 15000
          }),
        })
      )
    })

    it('應合併備註', async () => {
      vi.mocked(prisma.cashierShift.findUnique).mockResolvedValue({
        id: 'shift-1',
        status: 'OPEN',
        openingCash: 10000,
        salesTotal: 5000,
        notes: '開班備註',
      } as never)
      vi.mocked(prisma.cashierShift.update).mockResolvedValue({} as never)

      await closeShift('shift-1', { closingCash: 15000, notes: '關班備註' })

      expect(prisma.cashierShift.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            notes: '開班備註\n關班備註',
          }),
        })
      )
    })

    it('資料庫錯誤時應回傳失敗', async () => {
      vi.mocked(prisma.cashierShift.findUnique).mockResolvedValue({
        id: 'shift-1',
        status: 'OPEN',
        openingCash: 10000,
        salesTotal: 0,
      } as never)
      vi.mocked(prisma.cashierShift.update).mockRejectedValue(new Error('DB Error'))

      const result = await closeShift('shift-1', closeData)

      expect(result.success).toBe(false)
      expect(result.message).toBe('關閉收銀班別失敗')
    })
  })

  describe('getCurrentShift', () => {
    it('應回傳使用者目前的班別', async () => {
      const mockShift = {
        id: 'shift-1',
        shiftNo: 'SHIFT-20240115-001',
        status: 'OPEN',
        user: { id: 'user-1', username: 'cashier1', email: 'test@example.com' },
        store: { id: 'store-1', name: '台北店' },
      }

      vi.mocked(prisma.cashierShift.findFirst).mockResolvedValue(mockShift as never)

      const result = await getCurrentShift('user-1')

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockShift)
      expect(prisma.cashierShift.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: 'user-1',
            status: 'OPEN',
          },
        })
      )
    })

    it('無開啟中的班別時應回傳 null data', async () => {
      vi.mocked(prisma.cashierShift.findFirst).mockResolvedValue(null)

      const result = await getCurrentShift('user-1')

      expect(result.success).toBe(true)
      expect(result.data).toBeNull()
    })

    it('資料庫錯誤時應回傳失敗', async () => {
      vi.mocked(prisma.cashierShift.findFirst).mockRejectedValue(new Error('DB Error'))

      const result = await getCurrentShift('user-1')

      expect(result.success).toBe(false)
      expect(result.message).toBe('取得目前班別失敗')
    })
  })

  describe('getShifts', () => {
    it('應回傳分頁的班別列表', async () => {
      const mockShifts = [
        {
          id: 'shift-1',
          shiftNo: 'SHIFT-20240115-001',
          status: 'CLOSED',
          user: { id: 'user-1', username: 'cashier1', email: 'test@example.com' },
          store: { id: 'store-1', name: '台北店' },
        },
      ]

      vi.mocked(prisma.cashierShift.findMany).mockResolvedValue(mockShifts as never)
      vi.mocked(prisma.cashierShift.count).mockResolvedValue(1)

      const result = await getShifts({ page: 1, pageSize: 20 })

      expect(result.success).toBe(true)
      expect(result.data?.shifts).toHaveLength(1)
      expect(result.data?.pagination).toEqual({
        page: 1,
        pageSize: 20,
        total: 1,
        totalPages: 1,
      })
    })

    it('應支援依店舖篩選', async () => {
      vi.mocked(prisma.cashierShift.findMany).mockResolvedValue([])
      vi.mocked(prisma.cashierShift.count).mockResolvedValue(0)

      await getShifts({ storeId: 'store-1' })

      expect(prisma.cashierShift.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ storeId: 'store-1' }),
        })
      )
    })

    it('應支援依使用者篩選', async () => {
      vi.mocked(prisma.cashierShift.findMany).mockResolvedValue([])
      vi.mocked(prisma.cashierShift.count).mockResolvedValue(0)

      await getShifts({ userId: 'user-1' })

      expect(prisma.cashierShift.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: 'user-1' }),
        })
      )
    })

    it('應支援依狀態篩選', async () => {
      vi.mocked(prisma.cashierShift.findMany).mockResolvedValue([])
      vi.mocked(prisma.cashierShift.count).mockResolvedValue(0)

      await getShifts({ status: 'CLOSED' })

      expect(prisma.cashierShift.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'CLOSED' }),
        })
      )
    })

    it('應支援日期範圍篩選', async () => {
      vi.mocked(prisma.cashierShift.findMany).mockResolvedValue([])
      vi.mocked(prisma.cashierShift.count).mockResolvedValue(0)

      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-31')

      await getShifts({ startDate, endDate })

      expect(prisma.cashierShift.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            startTime: {
              gte: startDate,
              lte: endDate,
            },
          }),
        })
      )
    })

    it('應使用預設分頁參數', async () => {
      vi.mocked(prisma.cashierShift.findMany).mockResolvedValue([])
      vi.mocked(prisma.cashierShift.count).mockResolvedValue(0)

      const result = await getShifts()

      expect(result.data?.pagination.page).toBe(1)
      expect(result.data?.pagination.pageSize).toBe(20)
    })

    it('應正確計算分頁資訊', async () => {
      vi.mocked(prisma.cashierShift.findMany).mockResolvedValue([])
      vi.mocked(prisma.cashierShift.count).mockResolvedValue(50)

      const result = await getShifts({ page: 2, pageSize: 20 })

      expect(result.data?.pagination.totalPages).toBe(3)
    })

    it('資料庫錯誤時應回傳失敗', async () => {
      vi.mocked(prisma.cashierShift.findMany).mockRejectedValue(new Error('DB Error'))

      const result = await getShifts()

      expect(result.success).toBe(false)
      expect(result.message).toBe('取得班別列表失敗')
    })
  })

  describe('getShift', () => {
    it('應回傳班別詳情', async () => {
      const mockShift = {
        id: 'shift-1',
        shiftNo: 'SHIFT-20240115-001',
        status: 'CLOSED',
        user: { id: 'user-1', username: 'cashier1', email: 'test@example.com', name: '收銀員1' },
        store: { id: 'store-1', name: '台北店', code: 'TPE' },
      }

      vi.mocked(prisma.cashierShift.findUnique).mockResolvedValue(mockShift as never)

      const result = await getShift('shift-1')

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockShift)
    })

    it('班別不存在時應回傳錯誤', async () => {
      vi.mocked(prisma.cashierShift.findUnique).mockResolvedValue(null)

      const result = await getShift('nonexistent')

      expect(result.success).toBe(false)
      expect(result.message).toBe('班別不存在')
    })

    it('資料庫錯誤時應回傳失敗', async () => {
      vi.mocked(prisma.cashierShift.findUnique).mockRejectedValue(new Error('DB Error'))

      const result = await getShift('shift-1')

      expect(result.success).toBe(false)
      expect(result.message).toBe('取得班別詳情失敗')
    })
  })
})
