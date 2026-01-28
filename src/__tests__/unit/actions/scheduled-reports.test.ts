/**
 * Scheduled Reports Server Actions 測試
 * 測試排程報表相關的 Server Actions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getScheduledReports,
  createScheduledReport,
  updateScheduledReport,
  deleteScheduledReport,
  toggleScheduledReport,
} from '@/actions/scheduled-reports'
import prisma from '@/lib/prisma'

// Mock revalidatePath
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

describe('Scheduled Reports Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===== getScheduledReports 測試 =====
  describe('getScheduledReports', () => {
    it('應回傳分頁的排程報表列表', async () => {
      const mockSchedules = [
        {
          id: '1',
          reportId: 'r1',
          schedule: '0 9 * * *',
          recipients: ['admin@example.com'],
          format: 'EXCEL',
          isActive: true,
          report: { id: 'r1', name: '銷售報表' },
        },
        {
          id: '2',
          reportId: 'r2',
          schedule: '0 18 * * *',
          recipients: ['manager@example.com'],
          format: 'PDF',
          isActive: false,
          report: { id: 'r2', name: '庫存報表' },
        },
      ]

      vi.mocked(prisma.scheduledReport.findMany).mockResolvedValue(mockSchedules as never)
      vi.mocked(prisma.scheduledReport.count).mockResolvedValue(2)

      const result = await getScheduledReports({ page: 1, pageSize: 10 })

      expect(result.data).toHaveLength(2)
      expect(result.pagination.total).toBe(2)
      expect(result.pagination.page).toBe(1)
      expect(result.pagination.pageSize).toBe(10)
    })

    it('應支援依報表篩選', async () => {
      vi.mocked(prisma.scheduledReport.findMany).mockResolvedValue([])
      vi.mocked(prisma.scheduledReport.count).mockResolvedValue(0)

      await getScheduledReports({ reportId: 'report-1' })

      expect(prisma.scheduledReport.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ reportId: 'report-1' }),
        })
      )
    })

    it('應使用預設分頁參數', async () => {
      vi.mocked(prisma.scheduledReport.findMany).mockResolvedValue([])
      vi.mocked(prisma.scheduledReport.count).mockResolvedValue(0)

      const result = await getScheduledReports()

      expect(result.pagination.page).toBe(1)
      expect(result.pagination.pageSize).toBe(10)
    })

    it('應正確計算分頁資訊', async () => {
      vi.mocked(prisma.scheduledReport.findMany).mockResolvedValue([])
      vi.mocked(prisma.scheduledReport.count).mockResolvedValue(25)

      const result = await getScheduledReports({ page: 2, pageSize: 10 })

      expect(result.pagination.totalPages).toBe(3)
      expect(result.pagination.hasNextPage).toBe(true)
      expect(result.pagination.hasPrevPage).toBe(true)
    })

    it('第一頁時 hasPrevPage 應為 false', async () => {
      vi.mocked(prisma.scheduledReport.findMany).mockResolvedValue([])
      vi.mocked(prisma.scheduledReport.count).mockResolvedValue(25)

      const result = await getScheduledReports({ page: 1, pageSize: 10 })

      expect(result.pagination.hasPrevPage).toBe(false)
    })
  })

  // ===== createScheduledReport 測試 =====
  describe('createScheduledReport', () => {
    const validScheduleData = {
      reportId: 'report-1',
      schedule: '0 9 * * *',
      recipients: ['admin@example.com', 'manager@example.com'],
      format: 'EXCEL' as const,
      isActive: true,
    }

    it('應成功建立排程報表', async () => {
      vi.mocked(prisma.scheduledReport.create).mockResolvedValue({ id: 'new-id' } as never)

      const result = await createScheduledReport(validScheduleData)

      expect(result.success).toBe(true)
      expect(result.message).toBe('排程報表建立成功')
      expect((result.data as { id: string })?.id).toBe('new-id')
    })

    it('應計算並設定 nextRunAt', async () => {
      vi.mocked(prisma.scheduledReport.create).mockResolvedValue({ id: 'new-id' } as never)

      await createScheduledReport(validScheduleData)

      expect(prisma.scheduledReport.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            nextRunAt: expect.any(Date),
          }),
        })
      )
    })

    it('驗證失敗時應回傳錯誤 - 缺少 reportId', async () => {
      const invalidData = {
        ...validScheduleData,
        reportId: '',
      }

      const result = await createScheduledReport(invalidData)

      expect(result.success).toBe(false)
      expect(result.message).toBe('驗證失敗')
      expect(result.errors).toBeDefined()
    })

    it('驗證失敗時應回傳錯誤 - 無效的 cron 格式', async () => {
      const invalidData = {
        ...validScheduleData,
        schedule: 'invalid-cron',
      }

      const result = await createScheduledReport(invalidData)

      expect(result.success).toBe(false)
      expect(result.message).toBe('驗證失敗')
    })

    it('驗證失敗時應回傳錯誤 - 空的收件者列表', async () => {
      const invalidData = {
        ...validScheduleData,
        recipients: [],
      }

      const result = await createScheduledReport(invalidData)

      expect(result.success).toBe(false)
      expect(result.message).toBe('驗證失敗')
    })

    it('驗證失敗時應回傳錯誤 - 無效的 email', async () => {
      const invalidData = {
        ...validScheduleData,
        recipients: ['invalid-email'],
      }

      const result = await createScheduledReport(invalidData)

      expect(result.success).toBe(false)
      expect(result.message).toBe('驗證失敗')
    })

    it('資料庫錯誤時應回傳失敗', async () => {
      vi.mocked(prisma.scheduledReport.create).mockRejectedValue(new Error('DB Error'))

      const result = await createScheduledReport(validScheduleData)

      expect(result.success).toBe(false)
      expect(result.message).toBe('建立排程報表失敗')
    })
  })

  // ===== updateScheduledReport 測試 =====
  describe('updateScheduledReport', () => {
    const validUpdateData = {
      schedule: '0 18 * * *',
      recipients: ['updated@example.com'],
      format: 'PDF' as const,
      isActive: false,
    }

    it('應成功更新排程報表', async () => {
      vi.mocked(prisma.scheduledReport.findUnique).mockResolvedValue({ id: '1' } as never)
      vi.mocked(prisma.scheduledReport.update).mockResolvedValue({ id: '1' } as never)

      const result = await updateScheduledReport('1', validUpdateData)

      expect(result.success).toBe(true)
      expect(result.message).toBe('排程報表更新成功')
    })

    it('更新 schedule 時應重新計算 nextRunAt', async () => {
      vi.mocked(prisma.scheduledReport.findUnique).mockResolvedValue({ id: '1' } as never)
      vi.mocked(prisma.scheduledReport.update).mockResolvedValue({ id: '1' } as never)

      await updateScheduledReport('1', { schedule: '30 10 * * *' })

      expect(prisma.scheduledReport.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            nextRunAt: expect.any(Date),
          }),
        })
      )
    })

    it('排程不存在時應回傳錯誤', async () => {
      vi.mocked(prisma.scheduledReport.findUnique).mockResolvedValue(null)

      const result = await updateScheduledReport('nonexistent', validUpdateData)

      expect(result.success).toBe(false)
      expect(result.message).toBe('排程不存在')
    })

    it('應支援只更新部分欄位', async () => {
      vi.mocked(prisma.scheduledReport.findUnique).mockResolvedValue({ id: '1' } as never)
      vi.mocked(prisma.scheduledReport.update).mockResolvedValue({ id: '1' } as never)

      const result = await updateScheduledReport('1', { isActive: false })

      expect(result.success).toBe(true)
    })

    it('資料庫錯誤時應回傳失敗', async () => {
      vi.mocked(prisma.scheduledReport.findUnique).mockResolvedValue({ id: '1' } as never)
      vi.mocked(prisma.scheduledReport.update).mockRejectedValue(new Error('DB Error'))

      const result = await updateScheduledReport('1', validUpdateData)

      expect(result.success).toBe(false)
      expect(result.message).toBe('更新排程報表失敗')
    })
  })

  // ===== deleteScheduledReport 測試 =====
  describe('deleteScheduledReport', () => {
    it('應成功刪除排程報表', async () => {
      vi.mocked(prisma.scheduledReport.delete).mockResolvedValue({ id: '1' } as never)

      const result = await deleteScheduledReport('1')

      expect(result.success).toBe(true)
      expect(result.message).toBe('排程報表刪除成功')
    })

    it('資料庫錯誤時應回傳失敗', async () => {
      vi.mocked(prisma.scheduledReport.delete).mockRejectedValue(new Error('DB Error'))

      const result = await deleteScheduledReport('1')

      expect(result.success).toBe(false)
      expect(result.message).toBe('刪除排程報表失敗')
    })
  })

  // ===== toggleScheduledReport 測試 =====
  describe('toggleScheduledReport', () => {
    it('應成功停用已啟用的排程', async () => {
      vi.mocked(prisma.scheduledReport.findUnique).mockResolvedValue({
        id: '1',
        isActive: true,
      } as never)
      vi.mocked(prisma.scheduledReport.update).mockResolvedValue({ id: '1' } as never)

      const result = await toggleScheduledReport('1')

      expect(result.success).toBe(true)
      expect(result.message).toBe('排程已停用')
      expect(prisma.scheduledReport.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { isActive: false },
        })
      )
    })

    it('應成功啟用已停用的排程', async () => {
      vi.mocked(prisma.scheduledReport.findUnique).mockResolvedValue({
        id: '1',
        isActive: false,
      } as never)
      vi.mocked(prisma.scheduledReport.update).mockResolvedValue({ id: '1' } as never)

      const result = await toggleScheduledReport('1')

      expect(result.success).toBe(true)
      expect(result.message).toBe('排程已啟用')
      expect(prisma.scheduledReport.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { isActive: true },
        })
      )
    })

    it('排程不存在時應回傳錯誤', async () => {
      vi.mocked(prisma.scheduledReport.findUnique).mockResolvedValue(null)

      const result = await toggleScheduledReport('nonexistent')

      expect(result.success).toBe(false)
      expect(result.message).toBe('排程不存在')
    })

    it('資料庫錯誤時應回傳失敗', async () => {
      vi.mocked(prisma.scheduledReport.findUnique).mockResolvedValue({
        id: '1',
        isActive: true,
      } as never)
      vi.mocked(prisma.scheduledReport.update).mockRejectedValue(new Error('DB Error'))

      const result = await toggleScheduledReport('1')

      expect(result.success).toBe(false)
      expect(result.message).toBe('切換排程狀態失敗')
    })
  })
})
