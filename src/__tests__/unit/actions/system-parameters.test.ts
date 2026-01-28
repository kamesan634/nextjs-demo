/**
 * System Parameters Server Actions 測試
 * 測試系統參數相關的 Server Actions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getSystemParameters,
  getSystemParameter,
  getSystemParameterByCode,
  getSystemParametersByCategory,
  createSystemParameter,
  updateSystemParameter,
  deleteSystemParameter,
  getParameterValue,
} from '@/actions/system-parameters'
import prisma from '@/lib/prisma'

// Mock revalidatePath
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

describe('System Parameters Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===== 取得系統參數列表測試 =====
  describe('getSystemParameters', () => {
    it('應回傳分頁的系統參數列表', async () => {
      const mockParameters = [
        {
          id: '1',
          code: 'COMPANY_NAME',
          name: '公司名稱',
          value: 'Demo Corp',
          dataType: 'STRING',
          category: 'COMPANY',
        },
        {
          id: '2',
          code: 'TAX_RATE',
          name: '稅率',
          value: '0.05',
          dataType: 'NUMBER',
          category: 'TAX',
        },
      ]

      vi.mocked(prisma.systemParameter.findMany).mockResolvedValue(mockParameters as never)
      vi.mocked(prisma.systemParameter.count).mockResolvedValue(2)

      const result = await getSystemParameters({ page: 1, pageSize: 10 })

      expect(result.data).toHaveLength(2)
      expect(result.pagination.total).toBe(2)
      expect(result.pagination.page).toBe(1)
      expect(result.pagination.pageSize).toBe(10)
    })

    it('應支援搜尋功能', async () => {
      vi.mocked(prisma.systemParameter.findMany).mockResolvedValue([])
      vi.mocked(prisma.systemParameter.count).mockResolvedValue(0)

      await getSystemParameters({ search: '公司' })

      expect(prisma.systemParameter.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
          }),
        })
      )
    })

    it('應支援分類篩選', async () => {
      vi.mocked(prisma.systemParameter.findMany).mockResolvedValue([])
      vi.mocked(prisma.systemParameter.count).mockResolvedValue(0)

      await getSystemParameters({ category: 'COMPANY' })

      expect(prisma.systemParameter.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            category: 'COMPANY',
          }),
        })
      )
    })

    it('應使用預設分頁參數', async () => {
      vi.mocked(prisma.systemParameter.findMany).mockResolvedValue([])
      vi.mocked(prisma.systemParameter.count).mockResolvedValue(0)

      const result = await getSystemParameters()

      expect(result.pagination.page).toBe(1)
      expect(result.pagination.pageSize).toBe(20)
    })

    it('應正確計算分頁資訊', async () => {
      vi.mocked(prisma.systemParameter.findMany).mockResolvedValue([])
      vi.mocked(prisma.systemParameter.count).mockResolvedValue(45)

      const result = await getSystemParameters({ page: 2, pageSize: 10 })

      expect(result.pagination.totalPages).toBe(5)
      expect(result.pagination.hasNextPage).toBe(true)
      expect(result.pagination.hasPrevPage).toBe(true)
    })
  })

  // ===== 取得單一系統參數測試 =====
  describe('getSystemParameter', () => {
    it('應回傳系統參數詳情', async () => {
      const mockParameter = {
        id: '1',
        code: 'COMPANY_NAME',
        name: '公司名稱',
        value: 'Demo Corp',
        dataType: 'STRING',
        category: 'COMPANY',
      }

      vi.mocked(prisma.systemParameter.findUnique).mockResolvedValue(mockParameter as never)

      const result = await getSystemParameter('1')

      expect(result?.code).toBe('COMPANY_NAME')
      expect(result?.name).toBe('公司名稱')
    })

    it('參數不存在時應回傳 null', async () => {
      vi.mocked(prisma.systemParameter.findUnique).mockResolvedValue(null)

      const result = await getSystemParameter('nonexistent')

      expect(result).toBeNull()
    })
  })

  // ===== 依代碼取得系統參數測試 =====
  describe('getSystemParameterByCode', () => {
    it('應依代碼回傳系統參數', async () => {
      const mockParameter = {
        id: '1',
        code: 'COMPANY_NAME',
        name: '公司名稱',
        value: 'Demo Corp',
      }

      vi.mocked(prisma.systemParameter.findUnique).mockResolvedValue(mockParameter as never)

      const result = await getSystemParameterByCode('COMPANY_NAME')

      expect(result?.code).toBe('COMPANY_NAME')
      expect(prisma.systemParameter.findUnique).toHaveBeenCalledWith({
        where: { code: 'COMPANY_NAME' },
      })
    })
  })

  // ===== 取得分類下的所有參數測試 =====
  describe('getSystemParametersByCategory', () => {
    it('應回傳指定分類的所有參數', async () => {
      const mockParameters = [
        { id: '1', code: 'COMPANY_NAME', category: 'COMPANY' },
        { id: '2', code: 'COMPANY_ADDRESS', category: 'COMPANY' },
      ]

      vi.mocked(prisma.systemParameter.findMany).mockResolvedValue(mockParameters as never)

      const result = await getSystemParametersByCategory('COMPANY')

      expect(result).toHaveLength(2)
      expect(prisma.systemParameter.findMany).toHaveBeenCalledWith({
        where: { category: 'COMPANY' },
        orderBy: { code: 'asc' },
      })
    })
  })

  // ===== 建立系統參數測試 =====
  describe('createSystemParameter', () => {
    const validParameterData = {
      code: 'NEW_PARAM',
      name: '新參數',
      value: 'test_value',
      dataType: 'STRING' as const,
      category: 'COMPANY' as const,
      description: '測試用參數',
      isEditable: true,
    }

    it('應成功建立系統參數', async () => {
      vi.mocked(prisma.systemParameter.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.systemParameter.create).mockResolvedValue({
        id: 'new-id',
        ...validParameterData,
      } as never)

      const result = await createSystemParameter(validParameterData)

      expect(result.success).toBe(true)
      expect(result.message).toBe('系統參數建立成功')
      expect((result.data as { id: string })?.id).toBe('new-id')
    })

    it('代碼重複時應回傳錯誤', async () => {
      vi.mocked(prisma.systemParameter.findUnique).mockResolvedValue({ id: 'existing' } as never)

      const result = await createSystemParameter(validParameterData)

      expect(result.success).toBe(false)
      expect(result.message).toBe('此參數代碼已存在')
    })

    it('驗證失敗時應回傳錯誤（空代碼）', async () => {
      const result = await createSystemParameter({
        ...validParameterData,
        code: '',
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('驗證失敗')
    })

    it('驗證失敗時應回傳錯誤（代碼格式錯誤）', async () => {
      const result = await createSystemParameter({
        ...validParameterData,
        code: 'invalid-code', // 應該是大寫字母、數字和底線
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('驗證失敗')
    })

    it('驗證失敗時應回傳錯誤（空名稱）', async () => {
      const result = await createSystemParameter({
        ...validParameterData,
        name: '',
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('驗證失敗')
    })

    it('應驗證 NUMBER 類型的值格式', async () => {
      vi.mocked(prisma.systemParameter.findUnique).mockResolvedValue(null)

      const result = await createSystemParameter({
        ...validParameterData,
        dataType: 'NUMBER' as const,
        value: 'not-a-number',
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('參數值必須是有效的數字')
    })

    it('應驗證 BOOLEAN 類型的值格式', async () => {
      vi.mocked(prisma.systemParameter.findUnique).mockResolvedValue(null)

      const result = await createSystemParameter({
        ...validParameterData,
        dataType: 'BOOLEAN' as const,
        value: 'yes',
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('參數值必須是 true 或 false')
    })

    it('應驗證 JSON 類型的值格式', async () => {
      vi.mocked(prisma.systemParameter.findUnique).mockResolvedValue(null)

      const result = await createSystemParameter({
        ...validParameterData,
        dataType: 'JSON' as const,
        value: 'invalid-json',
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('參數值必須是有效的 JSON 格式')
    })

    it('應接受有效的 NUMBER 值', async () => {
      vi.mocked(prisma.systemParameter.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.systemParameter.create).mockResolvedValue({ id: 'new-id' } as never)

      const result = await createSystemParameter({
        ...validParameterData,
        dataType: 'NUMBER' as const,
        value: '123.45',
      })

      expect(result.success).toBe(true)
    })

    it('應接受有效的 BOOLEAN 值', async () => {
      vi.mocked(prisma.systemParameter.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.systemParameter.create).mockResolvedValue({ id: 'new-id' } as never)

      const result = await createSystemParameter({
        ...validParameterData,
        dataType: 'BOOLEAN' as const,
        value: 'true',
      })

      expect(result.success).toBe(true)
    })

    it('應接受有效的 JSON 值', async () => {
      vi.mocked(prisma.systemParameter.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.systemParameter.create).mockResolvedValue({ id: 'new-id' } as never)

      const result = await createSystemParameter({
        ...validParameterData,
        dataType: 'JSON' as const,
        value: '{"key": "value"}',
      })

      expect(result.success).toBe(true)
    })

    it('資料庫錯誤時應回傳失敗', async () => {
      vi.mocked(prisma.systemParameter.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.systemParameter.create).mockRejectedValue(new Error('Database error'))

      const result = await createSystemParameter(validParameterData)

      expect(result.success).toBe(false)
      expect(result.message).toBe('建立系統參數失敗')
    })
  })

  // ===== 更新系統參數測試 =====
  describe('updateSystemParameter', () => {
    const validUpdateData = {
      name: '更新的參數名稱',
      value: 'updated_value',
      dataType: 'STRING' as const,
      category: 'COMPANY' as const,
      description: '更新的描述',
      isEditable: true,
    }

    it('應成功更新系統參數', async () => {
      vi.mocked(prisma.systemParameter.findUnique).mockResolvedValue({
        id: '1',
        isEditable: true,
      } as never)
      vi.mocked(prisma.systemParameter.update).mockResolvedValue({ id: '1' } as never)

      const result = await updateSystemParameter('1', validUpdateData)

      expect(result.success).toBe(true)
      expect(result.message).toBe('系統參數更新成功')
    })

    it('參數不存在時應回傳錯誤', async () => {
      vi.mocked(prisma.systemParameter.findUnique).mockResolvedValue(null)

      const result = await updateSystemParameter('nonexistent', validUpdateData)

      expect(result.success).toBe(false)
      expect(result.message).toBe('系統參數不存在')
    })

    it('不可編輯的參數應回傳錯誤', async () => {
      vi.mocked(prisma.systemParameter.findUnique).mockResolvedValue({
        id: '1',
        isEditable: false,
      } as never)

      const result = await updateSystemParameter('1', validUpdateData)

      expect(result.success).toBe(false)
      expect(result.message).toBe('此參數不可編輯')
    })

    it('驗證失敗時應回傳錯誤', async () => {
      const result = await updateSystemParameter('1', {
        ...validUpdateData,
        name: '',
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('驗證失敗')
    })

    it('應驗證 NUMBER 類型的值格式', async () => {
      vi.mocked(prisma.systemParameter.findUnique).mockResolvedValue({
        id: '1',
        isEditable: true,
      } as never)

      const result = await updateSystemParameter('1', {
        ...validUpdateData,
        dataType: 'NUMBER' as const,
        value: 'not-a-number',
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('參數值必須是有效的數字')
    })

    it('資料庫錯誤時應回傳失敗', async () => {
      vi.mocked(prisma.systemParameter.findUnique).mockResolvedValue({
        id: '1',
        isEditable: true,
      } as never)
      vi.mocked(prisma.systemParameter.update).mockRejectedValue(new Error('Database error'))

      const result = await updateSystemParameter('1', validUpdateData)

      expect(result.success).toBe(false)
      expect(result.message).toBe('更新系統參數失敗')
    })
  })

  // ===== 刪除系統參數測試 =====
  describe('deleteSystemParameter', () => {
    it('應成功刪除系統參數', async () => {
      vi.mocked(prisma.systemParameter.findUnique).mockResolvedValue({
        id: '1',
        isEditable: true,
      } as never)
      vi.mocked(prisma.systemParameter.delete).mockResolvedValue({ id: '1' } as never)

      const result = await deleteSystemParameter('1')

      expect(result.success).toBe(true)
      expect(result.message).toBe('系統參數刪除成功')
    })

    it('參數不存在時應回傳錯誤', async () => {
      vi.mocked(prisma.systemParameter.findUnique).mockResolvedValue(null)

      const result = await deleteSystemParameter('nonexistent')

      expect(result.success).toBe(false)
      expect(result.message).toBe('系統參數不存在')
    })

    it('不可編輯的參數不能刪除', async () => {
      vi.mocked(prisma.systemParameter.findUnique).mockResolvedValue({
        id: '1',
        isEditable: false,
      } as never)

      const result = await deleteSystemParameter('1')

      expect(result.success).toBe(false)
      expect(result.message).toBe('此參數不可刪除')
    })

    it('資料庫錯誤時應回傳失敗', async () => {
      vi.mocked(prisma.systemParameter.findUnique).mockResolvedValue({
        id: '1',
        isEditable: true,
      } as never)
      vi.mocked(prisma.systemParameter.delete).mockRejectedValue(new Error('Database error'))

      const result = await deleteSystemParameter('1')

      expect(result.success).toBe(false)
      expect(result.message).toBe('刪除系統參數失敗')
    })
  })

  // ===== 取得參數值測試 =====
  describe('getParameterValue', () => {
    it('應回傳 STRING 類型的值', async () => {
      vi.mocked(prisma.systemParameter.findUnique).mockResolvedValue({
        code: 'COMPANY_NAME',
        value: 'Demo Corp',
        dataType: 'STRING',
      } as never)

      const result = await getParameterValue('COMPANY_NAME')

      expect(result).toBe('Demo Corp')
    })

    it('應回傳 NUMBER 類型的值', async () => {
      vi.mocked(prisma.systemParameter.findUnique).mockResolvedValue({
        code: 'TAX_RATE',
        value: '0.05',
        dataType: 'NUMBER',
      } as never)

      const result = await getParameterValue<number>('TAX_RATE')

      expect(result).toBe(0.05)
    })

    it('應回傳 BOOLEAN 類型的值 (true)', async () => {
      vi.mocked(prisma.systemParameter.findUnique).mockResolvedValue({
        code: 'ENABLE_FEATURE',
        value: 'true',
        dataType: 'BOOLEAN',
      } as never)

      const result = await getParameterValue<boolean>('ENABLE_FEATURE')

      expect(result).toBe(true)
    })

    it('應回傳 BOOLEAN 類型的值 (false)', async () => {
      vi.mocked(prisma.systemParameter.findUnique).mockResolvedValue({
        code: 'ENABLE_FEATURE',
        value: 'false',
        dataType: 'BOOLEAN',
      } as never)

      const result = await getParameterValue<boolean>('ENABLE_FEATURE')

      expect(result).toBe(false)
    })

    it('應回傳 JSON 類型的值', async () => {
      vi.mocked(prisma.systemParameter.findUnique).mockResolvedValue({
        code: 'CONFIG',
        value: '{"key": "value", "count": 10}',
        dataType: 'JSON',
      } as never)

      const result = await getParameterValue<{ key: string; count: number }>('CONFIG')

      expect(result).toEqual({ key: 'value', count: 10 })
    })

    it('參數不存在時應回傳預設值', async () => {
      vi.mocked(prisma.systemParameter.findUnique).mockResolvedValue(null)

      const result = await getParameterValue('NONEXISTENT', 'default_value')

      expect(result).toBe('default_value')
    })

    it('參數不存在且無預設值時應回傳 undefined', async () => {
      vi.mocked(prisma.systemParameter.findUnique).mockResolvedValue(null)

      const result = await getParameterValue('NONEXISTENT')

      expect(result).toBeUndefined()
    })
  })
})
