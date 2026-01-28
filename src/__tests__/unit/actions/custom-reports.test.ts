/**
 * Custom Reports Server Actions 測試
 * 測試自訂報表相關的 Server Actions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getCustomReports,
  getCustomReport,
  createCustomReport,
  updateCustomReport,
  deleteCustomReport,
} from '@/actions/custom-reports'
import prisma from '@/lib/prisma'

// Mock revalidatePath
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

describe('Custom Reports Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===== getCustomReports 測試 =====
  describe('getCustomReports', () => {
    it('應回傳分頁的自訂報表列表', async () => {
      const mockReports = [
        {
          id: '1',
          name: '銷售報表',
          description: '每日銷售統計',
          user: { id: 'u1', name: '管理員' },
          _count: { schedules: 2 },
        },
        {
          id: '2',
          name: '庫存報表',
          description: '庫存分析',
          user: { id: 'u1', name: '管理員' },
          _count: { schedules: 0 },
        },
      ]

      vi.mocked(prisma.customReport.findMany).mockResolvedValue(mockReports as never)
      vi.mocked(prisma.customReport.count).mockResolvedValue(2)

      const result = await getCustomReports({ page: 1, pageSize: 10 })

      expect(result.data).toHaveLength(2)
      expect(result.pagination.total).toBe(2)
      expect(result.pagination.page).toBe(1)
      expect(result.pagination.pageSize).toBe(10)
    })

    it('應支援搜尋功能', async () => {
      vi.mocked(prisma.customReport.findMany).mockResolvedValue([])
      vi.mocked(prisma.customReport.count).mockResolvedValue(0)

      await getCustomReports({ search: '銷售' })

      expect(prisma.customReport.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ name: expect.any(Object) }),
              expect.objectContaining({ description: expect.any(Object) }),
            ]),
          }),
        })
      )
    })

    it('應支援依建立者篩選', async () => {
      vi.mocked(prisma.customReport.findMany).mockResolvedValue([])
      vi.mocked(prisma.customReport.count).mockResolvedValue(0)

      await getCustomReports({ createdBy: 'user-1' })

      expect(prisma.customReport.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ createdBy: 'user-1' }),
        })
      )
    })

    it('應使用預設分頁參數', async () => {
      vi.mocked(prisma.customReport.findMany).mockResolvedValue([])
      vi.mocked(prisma.customReport.count).mockResolvedValue(0)

      const result = await getCustomReports()

      expect(result.pagination.page).toBe(1)
      expect(result.pagination.pageSize).toBe(10)
    })

    it('應正確計算分頁資訊', async () => {
      vi.mocked(prisma.customReport.findMany).mockResolvedValue([])
      vi.mocked(prisma.customReport.count).mockResolvedValue(25)

      const result = await getCustomReports({ page: 2, pageSize: 10 })

      expect(result.pagination.totalPages).toBe(3)
      expect(result.pagination.hasNextPage).toBe(true)
      expect(result.pagination.hasPrevPage).toBe(true)
    })

    it('最後一頁應正確計算 hasNextPage', async () => {
      vi.mocked(prisma.customReport.findMany).mockResolvedValue([])
      vi.mocked(prisma.customReport.count).mockResolvedValue(25)

      const result = await getCustomReports({ page: 3, pageSize: 10 })

      expect(result.pagination.hasNextPage).toBe(false)
      expect(result.pagination.hasPrevPage).toBe(true)
    })
  })

  // ===== getCustomReport 測試 =====
  describe('getCustomReport', () => {
    it('應回傳單一自訂報表詳情', async () => {
      const mockReport = {
        id: '1',
        name: '銷售報表',
        description: '每日銷售統計',
        queryDefinition: { dataSource: 'orders', fields: ['totalAmount'] },
        chartConfig: { type: 'bar' },
        isPublic: true,
        user: { id: 'u1', name: '管理員' },
        schedules: [],
      }

      vi.mocked(prisma.customReport.findUnique).mockResolvedValue(mockReport as never)

      const result = await getCustomReport('1')

      expect(result).toBeDefined()
      expect(result?.name).toBe('銷售報表')
      expect(result?.user.name).toBe('管理員')
    })

    it('報表不存在時應回傳 null', async () => {
      vi.mocked(prisma.customReport.findUnique).mockResolvedValue(null)

      const result = await getCustomReport('nonexistent')

      expect(result).toBeNull()
    })
  })

  // ===== createCustomReport 測試 =====
  describe('createCustomReport', () => {
    const validReportData = {
      name: '新報表',
      description: '測試報表描述',
      queryDefinition: {
        dataSource: 'orders' as const,
        fields: ['totalAmount', 'orderDate'],
        filters: [],
      },
      chartConfig: {
        type: 'bar' as const,
        xField: 'orderDate',
        yField: 'totalAmount',
      },
      isPublic: false,
    }

    it('應成功建立自訂報表', async () => {
      vi.mocked(prisma.customReport.create).mockResolvedValue({ id: 'new-id' } as never)

      const result = await createCustomReport(validReportData, 'user-1')

      expect(result.success).toBe(true)
      expect(result.message).toBe('自訂報表建立成功')
      expect((result.data as { id: string })?.id).toBe('new-id')
    })

    it('應正確處理沒有 chartConfig 的情況', async () => {
      vi.mocked(prisma.customReport.create).mockResolvedValue({ id: 'new-id' } as never)

      const dataWithoutChart = {
        ...validReportData,
        chartConfig: null,
      }

      const result = await createCustomReport(dataWithoutChart, 'user-1')

      expect(result.success).toBe(true)
    })

    it('驗證失敗時應回傳錯誤 - 缺少名稱', async () => {
      const invalidData = {
        ...validReportData,
        name: '',
      }

      const result = await createCustomReport(invalidData, 'user-1')

      expect(result.success).toBe(false)
      expect(result.message).toBe('驗證失敗')
      expect(result.errors).toBeDefined()
    })

    it('驗證失敗時應回傳錯誤 - 缺少欄位', async () => {
      const invalidData = {
        ...validReportData,
        queryDefinition: {
          dataSource: 'orders' as const,
          fields: [],
          filters: [],
        },
      }

      const result = await createCustomReport(invalidData, 'user-1')

      expect(result.success).toBe(false)
      expect(result.message).toBe('驗證失敗')
    })

    it('驗證失敗時應回傳錯誤 - 名稱過長', async () => {
      const invalidData = {
        ...validReportData,
        name: 'a'.repeat(101),
      }

      const result = await createCustomReport(invalidData, 'user-1')

      expect(result.success).toBe(false)
      expect(result.message).toBe('驗證失敗')
    })

    it('資料庫錯誤時應回傳失敗', async () => {
      vi.mocked(prisma.customReport.create).mockRejectedValue(new Error('DB Error'))

      const result = await createCustomReport(validReportData, 'user-1')

      expect(result.success).toBe(false)
      expect(result.message).toBe('建立自訂報表失敗')
    })
  })

  // ===== updateCustomReport 測試 =====
  describe('updateCustomReport', () => {
    const validReportData = {
      name: '更新報表',
      description: '更新後的描述',
      queryDefinition: {
        dataSource: 'orders' as const,
        fields: ['totalAmount'],
        filters: [],
      },
      chartConfig: {
        type: 'line' as const,
        xField: 'date',
        yField: 'amount',
      },
      isPublic: true,
    }

    it('應成功更新自訂報表', async () => {
      vi.mocked(prisma.customReport.findUnique).mockResolvedValue({ id: '1' } as never)
      vi.mocked(prisma.customReport.update).mockResolvedValue({ id: '1' } as never)

      const result = await updateCustomReport('1', validReportData)

      expect(result.success).toBe(true)
      expect(result.message).toBe('自訂報表更新成功')
    })

    it('報表不存在時應回傳錯誤', async () => {
      vi.mocked(prisma.customReport.findUnique).mockResolvedValue(null)

      const result = await updateCustomReport('nonexistent', validReportData)

      expect(result.success).toBe(false)
      expect(result.message).toBe('報表不存在')
    })

    it('驗證失敗時應回傳錯誤', async () => {
      const invalidData = {
        ...validReportData,
        name: '',
      }

      const result = await updateCustomReport('1', invalidData)

      expect(result.success).toBe(false)
      expect(result.message).toBe('驗證失敗')
      expect(result.errors).toBeDefined()
    })

    it('應正確處理沒有 chartConfig 的情況', async () => {
      vi.mocked(prisma.customReport.findUnique).mockResolvedValue({ id: '1' } as never)
      vi.mocked(prisma.customReport.update).mockResolvedValue({ id: '1' } as never)

      const dataWithoutChart = {
        ...validReportData,
        chartConfig: null,
      }

      const result = await updateCustomReport('1', dataWithoutChart)

      expect(result.success).toBe(true)
    })

    it('資料庫錯誤時應回傳失敗', async () => {
      vi.mocked(prisma.customReport.findUnique).mockResolvedValue({ id: '1' } as never)
      vi.mocked(prisma.customReport.update).mockRejectedValue(new Error('DB Error'))

      const result = await updateCustomReport('1', validReportData)

      expect(result.success).toBe(false)
      expect(result.message).toBe('更新自訂報表失敗')
    })
  })

  // ===== deleteCustomReport 測試 =====
  describe('deleteCustomReport', () => {
    it('應成功刪除自訂報表', async () => {
      vi.mocked(prisma.customReport.findUnique).mockResolvedValue({ id: '1' } as never)
      vi.mocked(prisma.customReport.delete).mockResolvedValue({ id: '1' } as never)

      const result = await deleteCustomReport('1')

      expect(result.success).toBe(true)
      expect(result.message).toBe('自訂報表刪除成功')
    })

    it('報表不存在時應回傳錯誤', async () => {
      vi.mocked(prisma.customReport.findUnique).mockResolvedValue(null)

      const result = await deleteCustomReport('nonexistent')

      expect(result.success).toBe(false)
      expect(result.message).toBe('報表不存在')
    })

    it('資料庫錯誤時應回傳失敗', async () => {
      vi.mocked(prisma.customReport.findUnique).mockResolvedValue({ id: '1' } as never)
      vi.mocked(prisma.customReport.delete).mockRejectedValue(new Error('DB Error'))

      const result = await deleteCustomReport('1')

      expect(result.success).toBe(false)
      expect(result.message).toBe('刪除自訂報表失敗')
    })
  })
})
