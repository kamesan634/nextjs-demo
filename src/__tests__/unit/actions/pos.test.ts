/**
 * POS Server Actions 測試
 * 測試 POS Session 管理相關的 Server Actions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { openSession, closeSession, getCurrentSession, getSessionHistory } from '@/actions/pos'
import prisma from '@/lib/prisma'

// Mock revalidatePath
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

describe('POS Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('openSession', () => {
    const validSessionData = {
      userId: 'user-1',
      storeId: 'store-1',
      openingCash: 10000,
    }

    it('應成功開啟 POS Session', async () => {
      vi.mocked(prisma.pOSSession.findFirst).mockResolvedValueOnce(null) // 無開啟中的 session
      vi.mocked(prisma.pOSSession.findFirst).mockResolvedValueOnce(null) // 無今日 session (generateSessionNo)
      vi.mocked(prisma.pOSSession.create).mockResolvedValue({
        id: 'session-1',
        sessionNo: 'POS-20240115-001',
        userId: 'user-1',
        storeId: 'store-1',
        openingCash: 10000,
        status: 'OPEN',
      } as never)

      const result = await openSession(validSessionData)

      expect(result.success).toBe(true)
      expect(result.message).toBe('POS Session 已開啟')
      expect(result.data).toBeDefined()
    })

    it('已有開啟中的 Session 時應回傳錯誤', async () => {
      vi.mocked(prisma.pOSSession.findFirst).mockResolvedValueOnce({
        id: 'existing-session',
        status: 'OPEN',
      } as never)

      const result = await openSession(validSessionData)

      expect(result.success).toBe(false)
      expect(result.message).toBe('您已有一個開啟中的 POS Session')
    })

    it('資料庫錯誤時應回傳失敗', async () => {
      vi.mocked(prisma.pOSSession.findFirst).mockResolvedValueOnce(null)
      vi.mocked(prisma.pOSSession.findFirst).mockResolvedValueOnce(null)
      vi.mocked(prisma.pOSSession.create).mockRejectedValue(new Error('DB Error'))

      const result = await openSession(validSessionData)

      expect(result.success).toBe(false)
      expect(result.message).toBe('開啟 POS Session 失敗')
    })

    it('應生成正確格式的 session 編號', async () => {
      vi.mocked(prisma.pOSSession.findFirst).mockResolvedValueOnce(null)
      vi.mocked(prisma.pOSSession.findFirst).mockResolvedValueOnce({
        sessionNo: 'POS-20240115-005',
      } as never)
      vi.mocked(prisma.pOSSession.create).mockResolvedValue({
        id: 'session-1',
        sessionNo: 'POS-20240115-006',
      } as never)

      const result = await openSession(validSessionData)

      expect(result.success).toBe(true)
      expect(prisma.pOSSession.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            sessionNo: expect.stringMatching(/^POS-\d{8}-\d{3}$/),
          }),
        })
      )
    })
  })

  describe('closeSession', () => {
    it('應成功關閉 POS Session', async () => {
      vi.mocked(prisma.pOSSession.findUnique).mockResolvedValue({
        id: 'session-1',
        status: 'OPEN',
      } as never)
      vi.mocked(prisma.pOSSession.update).mockResolvedValue({
        id: 'session-1',
        status: 'CLOSED',
        closingCash: 15000,
      } as never)

      const result = await closeSession('session-1', 15000)

      expect(result.success).toBe(true)
      expect(result.message).toBe('POS Session 已關閉')
      expect(prisma.pOSSession.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'session-1' },
          data: expect.objectContaining({
            status: 'CLOSED',
            closingCash: 15000,
            closedAt: expect.any(Date),
          }),
        })
      )
    })

    it('Session 不存在時應回傳錯誤', async () => {
      vi.mocked(prisma.pOSSession.findUnique).mockResolvedValue(null)

      const result = await closeSession('nonexistent', 15000)

      expect(result.success).toBe(false)
      expect(result.message).toBe('POS Session 不存在')
    })

    it('Session 已關閉時應回傳錯誤', async () => {
      vi.mocked(prisma.pOSSession.findUnique).mockResolvedValue({
        id: 'session-1',
        status: 'CLOSED',
      } as never)

      const result = await closeSession('session-1', 15000)

      expect(result.success).toBe(false)
      expect(result.message).toBe('POS Session 已經關閉')
    })

    it('資料庫錯誤時應回傳失敗', async () => {
      vi.mocked(prisma.pOSSession.findUnique).mockResolvedValue({
        id: 'session-1',
        status: 'OPEN',
      } as never)
      vi.mocked(prisma.pOSSession.update).mockRejectedValue(new Error('DB Error'))

      const result = await closeSession('session-1', 15000)

      expect(result.success).toBe(false)
      expect(result.message).toBe('關閉 POS Session 失敗')
    })
  })

  describe('getCurrentSession', () => {
    it('應回傳使用者目前開啟的 Session', async () => {
      const mockSession = {
        id: 'session-1',
        sessionNo: 'POS-20240115-001',
        status: 'OPEN',
        user: { id: 'user-1', username: 'cashier1', email: 'cashier@example.com' },
        store: { id: 'store-1', name: '台北店' },
      }

      vi.mocked(prisma.pOSSession.findFirst).mockResolvedValue(mockSession as never)

      const result = await getCurrentSession('user-1')

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockSession)
      expect(prisma.pOSSession.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: 'user-1',
            status: 'OPEN',
          },
        })
      )
    })

    it('無開啟中的 Session 時應回傳 null data', async () => {
      vi.mocked(prisma.pOSSession.findFirst).mockResolvedValue(null)

      const result = await getCurrentSession('user-1')

      expect(result.success).toBe(true)
      expect(result.data).toBeNull()
    })

    it('資料庫錯誤時應回傳失敗', async () => {
      vi.mocked(prisma.pOSSession.findFirst).mockRejectedValue(new Error('DB Error'))

      const result = await getCurrentSession('user-1')

      expect(result.success).toBe(false)
      expect(result.message).toBe('取得目前 Session 失敗')
    })
  })

  describe('getSessionHistory', () => {
    it('應回傳分頁的 Session 歷史列表', async () => {
      const mockSessions = [
        {
          id: 'session-1',
          sessionNo: 'POS-20240115-001',
          status: 'CLOSED',
          user: { id: 'user-1', username: 'cashier1', email: 'test@example.com' },
          store: { id: 'store-1', name: '台北店' },
        },
      ]

      vi.mocked(prisma.pOSSession.findMany).mockResolvedValue(mockSessions as never)
      vi.mocked(prisma.pOSSession.count).mockResolvedValue(1)

      const result = await getSessionHistory({ page: 1, pageSize: 20 })

      expect(result.success).toBe(true)
      expect(result.data?.sessions).toHaveLength(1)
      expect(result.data?.pagination).toEqual({
        page: 1,
        pageSize: 20,
        total: 1,
        totalPages: 1,
      })
    })

    it('應支援依店舖篩選', async () => {
      vi.mocked(prisma.pOSSession.findMany).mockResolvedValue([])
      vi.mocked(prisma.pOSSession.count).mockResolvedValue(0)

      await getSessionHistory({ storeId: 'store-1' })

      expect(prisma.pOSSession.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ storeId: 'store-1' }),
        })
      )
    })

    it('應支援依使用者篩選', async () => {
      vi.mocked(prisma.pOSSession.findMany).mockResolvedValue([])
      vi.mocked(prisma.pOSSession.count).mockResolvedValue(0)

      await getSessionHistory({ userId: 'user-1' })

      expect(prisma.pOSSession.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: 'user-1' }),
        })
      )
    })

    it('應支援依狀態篩選', async () => {
      vi.mocked(prisma.pOSSession.findMany).mockResolvedValue([])
      vi.mocked(prisma.pOSSession.count).mockResolvedValue(0)

      await getSessionHistory({ status: 'CLOSED' })

      expect(prisma.pOSSession.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'CLOSED' }),
        })
      )
    })

    it('應使用預設分頁參數', async () => {
      vi.mocked(prisma.pOSSession.findMany).mockResolvedValue([])
      vi.mocked(prisma.pOSSession.count).mockResolvedValue(0)

      const result = await getSessionHistory()

      expect(result.data?.pagination.page).toBe(1)
      expect(result.data?.pagination.pageSize).toBe(20)
    })

    it('應正確計算分頁資訊', async () => {
      vi.mocked(prisma.pOSSession.findMany).mockResolvedValue([])
      vi.mocked(prisma.pOSSession.count).mockResolvedValue(50)

      const result = await getSessionHistory({ page: 2, pageSize: 20 })

      expect(result.data?.pagination.totalPages).toBe(3)
    })

    it('資料庫錯誤時應回傳失敗', async () => {
      vi.mocked(prisma.pOSSession.findMany).mockRejectedValue(new Error('DB Error'))

      const result = await getSessionHistory()

      expect(result.success).toBe(false)
      expect(result.message).toBe('取得 Session 歷史失敗')
    })
  })
})
