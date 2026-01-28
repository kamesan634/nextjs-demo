/**
 * Numbering Rules Server Actions 測試
 * 測試編號規則相關的 Server Actions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getNumberingRules,
  getNumberingRule,
  getNumberingRuleByCode,
  createNumberingRule,
  updateNumberingRule,
  deleteNumberingRule,
  resetNumberingRuleSequence,
} from '@/actions/numbering-rules'
import prisma from '@/lib/prisma'

// Mock revalidatePath
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

describe('Numbering Rules Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===== 取得編號規則列表測試 =====
  describe('getNumberingRules', () => {
    it('應回傳分頁的編號規則列表', async () => {
      const mockRules = [
        {
          id: '1',
          code: 'ORDER_NO',
          name: '訂單編號',
          prefix: 'SO',
          dateFormat: 'YYYYMMDD',
          sequenceLength: 4,
          isActive: true,
        },
        {
          id: '2',
          code: 'PO_NO',
          name: '採購單編號',
          prefix: 'PO',
          dateFormat: 'YYYYMM',
          sequenceLength: 5,
          isActive: true,
        },
      ]

      vi.mocked(prisma.numberingRule.findMany).mockResolvedValue(mockRules as never)
      vi.mocked(prisma.numberingRule.count).mockResolvedValue(2)

      const result = await getNumberingRules({ page: 1, pageSize: 10 })

      expect(result.data).toHaveLength(2)
      expect(result.pagination.total).toBe(2)
      expect(result.pagination.page).toBe(1)
      expect(result.pagination.pageSize).toBe(10)
    })

    it('應支援搜尋功能', async () => {
      vi.mocked(prisma.numberingRule.findMany).mockResolvedValue([])
      vi.mocked(prisma.numberingRule.count).mockResolvedValue(0)

      await getNumberingRules({ search: '訂單' })

      expect(prisma.numberingRule.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
          }),
        })
      )
    })

    it('應支援啟用狀態篩選', async () => {
      vi.mocked(prisma.numberingRule.findMany).mockResolvedValue([])
      vi.mocked(prisma.numberingRule.count).mockResolvedValue(0)

      await getNumberingRules({ isActive: true })

      expect(prisma.numberingRule.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: true,
          }),
        })
      )
    })

    it('應使用預設分頁參數', async () => {
      vi.mocked(prisma.numberingRule.findMany).mockResolvedValue([])
      vi.mocked(prisma.numberingRule.count).mockResolvedValue(0)

      const result = await getNumberingRules()

      expect(result.pagination.page).toBe(1)
      expect(result.pagination.pageSize).toBe(20)
    })

    it('應正確計算分頁資訊', async () => {
      vi.mocked(prisma.numberingRule.findMany).mockResolvedValue([])
      vi.mocked(prisma.numberingRule.count).mockResolvedValue(35)

      const result = await getNumberingRules({ page: 2, pageSize: 10 })

      expect(result.pagination.totalPages).toBe(4)
      expect(result.pagination.hasNextPage).toBe(true)
      expect(result.pagination.hasPrevPage).toBe(true)
    })

    it('第一頁時 hasPrevPage 應為 false', async () => {
      vi.mocked(prisma.numberingRule.findMany).mockResolvedValue([])
      vi.mocked(prisma.numberingRule.count).mockResolvedValue(30)

      const result = await getNumberingRules({ page: 1, pageSize: 10 })

      expect(result.pagination.hasPrevPage).toBe(false)
    })

    it('最後一頁時 hasNextPage 應為 false', async () => {
      vi.mocked(prisma.numberingRule.findMany).mockResolvedValue([])
      vi.mocked(prisma.numberingRule.count).mockResolvedValue(30)

      const result = await getNumberingRules({ page: 3, pageSize: 10 })

      expect(result.pagination.hasNextPage).toBe(false)
    })
  })

  // ===== 取得單一編號規則測試 =====
  describe('getNumberingRule', () => {
    it('應回傳編號規則詳情', async () => {
      const mockRule = {
        id: '1',
        code: 'ORDER_NO',
        name: '訂單編號',
        prefix: 'SO',
        dateFormat: 'YYYYMMDD',
        sequenceLength: 4,
        currentSequence: 100,
        isActive: true,
      }

      vi.mocked(prisma.numberingRule.findUnique).mockResolvedValue(mockRule as never)

      const result = await getNumberingRule('1')

      expect(result?.code).toBe('ORDER_NO')
      expect(result?.name).toBe('訂單編號')
      expect(result?.currentSequence).toBe(100)
    })

    it('規則不存在時應回傳 null', async () => {
      vi.mocked(prisma.numberingRule.findUnique).mockResolvedValue(null)

      const result = await getNumberingRule('nonexistent')

      expect(result).toBeNull()
    })
  })

  // ===== 依代碼取得編號規則測試 =====
  describe('getNumberingRuleByCode', () => {
    it('應依代碼回傳編號規則', async () => {
      const mockRule = {
        id: '1',
        code: 'ORDER_NO',
        name: '訂單編號',
      }

      vi.mocked(prisma.numberingRule.findUnique).mockResolvedValue(mockRule as never)

      const result = await getNumberingRuleByCode('ORDER_NO')

      expect(result?.code).toBe('ORDER_NO')
      expect(prisma.numberingRule.findUnique).toHaveBeenCalledWith({
        where: { code: 'ORDER_NO' },
      })
    })

    it('規則不存在時應回傳 null', async () => {
      vi.mocked(prisma.numberingRule.findUnique).mockResolvedValue(null)

      const result = await getNumberingRuleByCode('NONEXISTENT')

      expect(result).toBeNull()
    })
  })

  // ===== 建立編號規則測試 =====
  describe('createNumberingRule', () => {
    const validRuleData = {
      code: 'NEW_RULE',
      name: '新編號規則',
      prefix: 'NR',
      dateFormat: 'YYYYMMDD',
      sequenceLength: 4,
      resetPeriod: 'DAILY' as const,
      isActive: true,
    }

    it('應成功建立編號規則', async () => {
      vi.mocked(prisma.numberingRule.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.numberingRule.create).mockResolvedValue({
        id: 'new-id',
        ...validRuleData,
        currentSequence: 0,
      } as never)

      const result = await createNumberingRule(validRuleData)

      expect(result.success).toBe(true)
      expect(result.message).toBe('編號規則建立成功')
      expect((result.data as { id: string })?.id).toBe('new-id')
    })

    it('應建立時初始化序號為 0', async () => {
      vi.mocked(prisma.numberingRule.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.numberingRule.create).mockResolvedValue({ id: 'new-id' } as never)

      await createNumberingRule(validRuleData)

      expect(prisma.numberingRule.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            currentSequence: 0,
          }),
        })
      )
    })

    it('代碼重複時應回傳錯誤', async () => {
      vi.mocked(prisma.numberingRule.findUnique).mockResolvedValue({ id: 'existing' } as never)

      const result = await createNumberingRule(validRuleData)

      expect(result.success).toBe(false)
      expect(result.message).toBe('此規則代碼已存在')
    })

    it('驗證失敗時應回傳錯誤（空代碼）', async () => {
      const result = await createNumberingRule({
        ...validRuleData,
        code: '',
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('驗證失敗')
    })

    it('驗證失敗時應回傳錯誤（代碼格式錯誤）', async () => {
      const result = await createNumberingRule({
        ...validRuleData,
        code: 'invalid-code', // 應該是大寫字母、數字和底線
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('驗證失敗')
    })

    it('驗證失敗時應回傳錯誤（空名稱）', async () => {
      const result = await createNumberingRule({
        ...validRuleData,
        name: '',
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('驗證失敗')
    })

    it('驗證失敗時應回傳錯誤（前綴格式錯誤）', async () => {
      const result = await createNumberingRule({
        ...validRuleData,
        prefix: 'invalid_prefix', // 只能包含大寫字母、數字和連字號
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('驗證失敗')
    })

    it('驗證失敗時應回傳錯誤（序號長度太小）', async () => {
      const result = await createNumberingRule({
        ...validRuleData,
        sequenceLength: 0,
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('驗證失敗')
    })

    it('驗證失敗時應回傳錯誤（序號長度太大）', async () => {
      const result = await createNumberingRule({
        ...validRuleData,
        sequenceLength: 11,
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('驗證失敗')
    })

    it('應接受無日期格式的規則', async () => {
      vi.mocked(prisma.numberingRule.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.numberingRule.create).mockResolvedValue({ id: 'new-id' } as never)

      const result = await createNumberingRule({
        ...validRuleData,
        dateFormat: null,
      })

      expect(result.success).toBe(true)
    })

    it('應接受無重設週期的規則', async () => {
      vi.mocked(prisma.numberingRule.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.numberingRule.create).mockResolvedValue({ id: 'new-id' } as never)

      const result = await createNumberingRule({
        ...validRuleData,
        resetPeriod: null,
      })

      expect(result.success).toBe(true)
    })

    it('資料庫錯誤時應回傳失敗', async () => {
      vi.mocked(prisma.numberingRule.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.numberingRule.create).mockRejectedValue(new Error('Database error'))

      const result = await createNumberingRule(validRuleData)

      expect(result.success).toBe(false)
      expect(result.message).toBe('建立編號規則失敗')
    })
  })

  // ===== 更新編號規則測試 =====
  describe('updateNumberingRule', () => {
    const validUpdateData = {
      name: '更新的規則名稱',
      prefix: 'UPD',
      dateFormat: 'YYYYMM',
      sequenceLength: 5,
      resetPeriod: 'MONTHLY' as const,
      isActive: true,
    }

    it('應成功更新編號規則', async () => {
      vi.mocked(prisma.numberingRule.findUnique).mockResolvedValue({ id: '1' } as never)
      vi.mocked(prisma.numberingRule.update).mockResolvedValue({ id: '1' } as never)

      const result = await updateNumberingRule('1', validUpdateData)

      expect(result.success).toBe(true)
      expect(result.message).toBe('編號規則更新成功')
    })

    it('規則不存在時應回傳錯誤', async () => {
      vi.mocked(prisma.numberingRule.findUnique).mockResolvedValue(null)

      const result = await updateNumberingRule('nonexistent', validUpdateData)

      expect(result.success).toBe(false)
      expect(result.message).toBe('編號規則不存在')
    })

    it('驗證失敗時應回傳錯誤', async () => {
      const result = await updateNumberingRule('1', {
        ...validUpdateData,
        name: '',
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('驗證失敗')
    })

    it('驗證失敗時應回傳錯誤（前綴格式錯誤）', async () => {
      const result = await updateNumberingRule('1', {
        ...validUpdateData,
        prefix: 'invalid_prefix',
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('驗證失敗')
    })

    it('應正確傳遞更新資料', async () => {
      vi.mocked(prisma.numberingRule.findUnique).mockResolvedValue({ id: '1' } as never)
      vi.mocked(prisma.numberingRule.update).mockResolvedValue({ id: '1' } as never)

      await updateNumberingRule('1', validUpdateData)

      expect(prisma.numberingRule.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: '1' },
          data: expect.objectContaining({
            name: '更新的規則名稱',
            prefix: 'UPD',
            sequenceLength: 5,
          }),
        })
      )
    })

    it('資料庫錯誤時應回傳失敗', async () => {
      vi.mocked(prisma.numberingRule.findUnique).mockResolvedValue({ id: '1' } as never)
      vi.mocked(prisma.numberingRule.update).mockRejectedValue(new Error('Database error'))

      const result = await updateNumberingRule('1', validUpdateData)

      expect(result.success).toBe(false)
      expect(result.message).toBe('更新編號規則失敗')
    })
  })

  // ===== 刪除編號規則測試 =====
  describe('deleteNumberingRule', () => {
    it('應成功刪除編號規則', async () => {
      vi.mocked(prisma.numberingRule.findUnique).mockResolvedValue({ id: '1' } as never)
      vi.mocked(prisma.numberingRule.delete).mockResolvedValue({ id: '1' } as never)

      const result = await deleteNumberingRule('1')

      expect(result.success).toBe(true)
      expect(result.message).toBe('編號規則刪除成功')
    })

    it('規則不存在時應回傳錯誤', async () => {
      vi.mocked(prisma.numberingRule.findUnique).mockResolvedValue(null)

      const result = await deleteNumberingRule('nonexistent')

      expect(result.success).toBe(false)
      expect(result.message).toBe('編號規則不存在')
    })

    it('資料庫錯誤時應回傳失敗', async () => {
      vi.mocked(prisma.numberingRule.findUnique).mockResolvedValue({ id: '1' } as never)
      vi.mocked(prisma.numberingRule.delete).mockRejectedValue(new Error('Database error'))

      const result = await deleteNumberingRule('1')

      expect(result.success).toBe(false)
      expect(result.message).toBe('刪除編號規則失敗')
    })
  })

  // ===== 重設編號規則序號測試 =====
  describe('resetNumberingRuleSequence', () => {
    it('應成功重設編號規則序號', async () => {
      vi.mocked(prisma.numberingRule.findUnique).mockResolvedValue({
        id: '1',
        currentSequence: 100,
      } as never)
      vi.mocked(prisma.numberingRule.update).mockResolvedValue({
        id: '1',
        currentSequence: 0,
      } as never)

      const result = await resetNumberingRuleSequence('1')

      expect(result.success).toBe(true)
      expect(result.message).toBe('編號規則序號已重設')
    })

    it('應將序號重設為 0 並更新重設時間', async () => {
      vi.mocked(prisma.numberingRule.findUnique).mockResolvedValue({
        id: '1',
        currentSequence: 100,
      } as never)
      vi.mocked(prisma.numberingRule.update).mockResolvedValue({ id: '1' } as never)

      await resetNumberingRuleSequence('1')

      expect(prisma.numberingRule.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: '1' },
          data: expect.objectContaining({
            currentSequence: 0,
            lastResetAt: expect.any(Date),
          }),
        })
      )
    })

    it('規則不存在時應回傳錯誤', async () => {
      vi.mocked(prisma.numberingRule.findUnique).mockResolvedValue(null)

      const result = await resetNumberingRuleSequence('nonexistent')

      expect(result.success).toBe(false)
      expect(result.message).toBe('編號規則不存在')
    })

    it('資料庫錯誤時應回傳失敗', async () => {
      vi.mocked(prisma.numberingRule.findUnique).mockResolvedValue({ id: '1' } as never)
      vi.mocked(prisma.numberingRule.update).mockRejectedValue(new Error('Database error'))

      const result = await resetNumberingRuleSequence('1')

      expect(result.success).toBe(false)
      expect(result.message).toBe('重設編號規則序號失敗')
    })
  })
})
