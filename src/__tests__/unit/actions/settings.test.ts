/**
 * Settings Server Actions 測試
 * 測試系統設定相關的 Server Actions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getPaymentMethods,
  getPaymentMethod,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  getUnits,
  createUnit,
  updateUnit,
  deleteUnit,
  getTaxTypes,
  createTaxType,
  updateTaxType,
  deleteTaxType,
} from '@/actions/settings'
import prisma from '@/lib/prisma'

// Mock revalidatePath
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

describe('Settings Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===== 付款方式測試 =====
  describe('PaymentMethod Actions', () => {
    describe('getPaymentMethods', () => {
      it('應回傳分頁的付款方式列表', async () => {
        const mockMethods = [
          { id: '1', code: 'CASH', name: '現金' },
          { id: '2', code: 'CREDIT', name: '信用卡' },
        ]

        vi.mocked(prisma.paymentMethod.findMany).mockResolvedValue(mockMethods as never)
        vi.mocked(prisma.paymentMethod.count).mockResolvedValue(2)

        const result = await getPaymentMethods({ page: 1, pageSize: 10 })

        expect(result.data).toHaveLength(2)
        expect(result.pagination.total).toBe(2)
      })

      it('應支援搜尋功能', async () => {
        vi.mocked(prisma.paymentMethod.findMany).mockResolvedValue([])
        vi.mocked(prisma.paymentMethod.count).mockResolvedValue(0)

        await getPaymentMethods({ search: '現金' })

        expect(prisma.paymentMethod.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              OR: expect.any(Array),
            }),
          })
        )
      })
    })

    describe('getPaymentMethod', () => {
      it('應回傳付款方式詳情', async () => {
        vi.mocked(prisma.paymentMethod.findUnique).mockResolvedValue({
          id: '1',
          code: 'CASH',
          name: '現金',
        } as never)

        const result = await getPaymentMethod('1')

        expect(result?.name).toBe('現金')
      })
    })

    describe('createPaymentMethod', () => {
      it('應成功建立付款方式', async () => {
        vi.mocked(prisma.paymentMethod.findUnique).mockResolvedValue(null)
        vi.mocked(prisma.paymentMethod.create).mockResolvedValue({ id: 'new-id' } as never)

        const result = await createPaymentMethod({
          code: 'CASH',
          name: '現金',
        })

        expect(result.success).toBe(true)
        expect(result.message).toBe('付款方式建立成功')
      })

      it('代碼重複時應回傳錯誤', async () => {
        vi.mocked(prisma.paymentMethod.findUnique).mockResolvedValue({ id: 'existing' } as never)

        const result = await createPaymentMethod({
          code: 'CASH',
          name: '現金',
        })

        expect(result.success).toBe(false)
        expect(result.message).toBe('此付款方式代碼已被使用')
      })
    })

    describe('updatePaymentMethod', () => {
      it('應成功更新付款方式', async () => {
        vi.mocked(prisma.paymentMethod.findUnique).mockResolvedValue({ id: '1' } as never)
        vi.mocked(prisma.paymentMethod.update).mockResolvedValue({ id: '1' } as never)

        const result = await updatePaymentMethod('1', {
          name: '更新現金',
        })

        expect(result.success).toBe(true)
        expect(result.message).toBe('付款方式更新成功')
      })

      it('付款方式不存在時應回傳錯誤', async () => {
        vi.mocked(prisma.paymentMethod.findUnique).mockResolvedValue(null)

        const result = await updatePaymentMethod('nonexistent', {
          name: '更新',
        })

        expect(result.success).toBe(false)
        expect(result.message).toBe('付款方式不存在')
      })
    })

    describe('deletePaymentMethod', () => {
      it('應成功刪除付款方式', async () => {
        vi.mocked(prisma.paymentMethod.findUnique).mockResolvedValue({
          id: '1',
          _count: { payments: 0 },
        } as never)
        vi.mocked(prisma.paymentMethod.delete).mockResolvedValue({ id: '1' } as never)

        const result = await deletePaymentMethod('1')

        expect(result.success).toBe(true)
        expect(result.message).toBe('付款方式刪除成功')
      })

      it('有付款紀錄時不能刪除', async () => {
        vi.mocked(prisma.paymentMethod.findUnique).mockResolvedValue({
          id: '1',
          _count: { payments: 10 },
        } as never)

        const result = await deletePaymentMethod('1')

        expect(result.success).toBe(false)
        expect(result.message).toContain('10 筆付款紀錄')
      })
    })
  })

  // ===== 計量單位測試 =====
  describe('Unit Actions', () => {
    describe('getUnits', () => {
      it('應回傳分頁的計量單位列表', async () => {
        const mockUnits = [
          { id: '1', code: 'PCS', name: '個' },
          { id: '2', code: 'BOX', name: '箱' },
        ]

        vi.mocked(prisma.unit.findMany).mockResolvedValue(mockUnits as never)
        vi.mocked(prisma.unit.count).mockResolvedValue(2)

        const result = await getUnits({ page: 1, pageSize: 10 })

        expect(result.data).toHaveLength(2)
        expect(result.pagination.total).toBe(2)
      })
    })

    describe('createUnit', () => {
      it('應成功建立計量單位', async () => {
        vi.mocked(prisma.unit.findUnique).mockResolvedValue(null)
        vi.mocked(prisma.unit.create).mockResolvedValue({ id: 'new-id' } as never)

        const result = await createUnit({
          code: 'PCS',
          name: '個',
        })

        expect(result.success).toBe(true)
        expect(result.message).toBe('計量單位建立成功')
      })

      it('代碼重複時應回傳錯誤', async () => {
        vi.mocked(prisma.unit.findUnique).mockResolvedValue({ id: 'existing' } as never)

        const result = await createUnit({
          code: 'PCS',
          name: '個',
        })

        expect(result.success).toBe(false)
        expect(result.message).toBe('此單位代碼已被使用')
      })
    })

    describe('updateUnit', () => {
      it('應成功更新計量單位', async () => {
        vi.mocked(prisma.unit.update).mockResolvedValue({ id: '1' } as never)

        const result = await updateUnit('1', {
          name: '更新單位',
        })

        expect(result.success).toBe(true)
        expect(result.message).toBe('計量單位更新成功')
      })
    })

    describe('deleteUnit', () => {
      it('應成功刪除計量單位', async () => {
        vi.mocked(prisma.unit.findUnique).mockResolvedValue({
          id: '1',
          _count: { products: 0 },
        } as never)
        vi.mocked(prisma.unit.delete).mockResolvedValue({ id: '1' } as never)

        const result = await deleteUnit('1')

        expect(result.success).toBe(true)
        expect(result.message).toBe('計量單位刪除成功')
      })

      it('單位不存在時應回傳錯誤', async () => {
        vi.mocked(prisma.unit.findUnique).mockResolvedValue(null)

        const result = await deleteUnit('nonexistent')

        expect(result.success).toBe(false)
        expect(result.message).toBe('計量單位不存在')
      })

      it('有商品使用時不能刪除', async () => {
        vi.mocked(prisma.unit.findUnique).mockResolvedValue({
          id: '1',
          _count: { products: 5 },
        } as never)

        const result = await deleteUnit('1')

        expect(result.success).toBe(false)
        expect(result.message).toContain('5 個商品')
      })
    })
  })

  // ===== 稅別測試 =====
  describe('TaxType Actions', () => {
    describe('getTaxTypes', () => {
      it('應回傳分頁的稅別列表', async () => {
        const mockTaxTypes = [
          { id: '1', code: 'TAX', name: '應稅', rate: 0.05 },
          { id: '2', code: 'NOTAX', name: '免稅', rate: 0 },
        ]

        vi.mocked(prisma.taxType.findMany).mockResolvedValue(mockTaxTypes as never)
        vi.mocked(prisma.taxType.count).mockResolvedValue(2)

        const result = await getTaxTypes({ page: 1, pageSize: 10 })

        expect(result.data).toHaveLength(2)
        expect(result.pagination.total).toBe(2)
      })
    })

    describe('createTaxType', () => {
      it('應成功建立稅別', async () => {
        vi.mocked(prisma.taxType.findUnique).mockResolvedValue(null)
        vi.mocked(prisma.taxType.create).mockResolvedValue({ id: 'new-id' } as never)

        const result = await createTaxType({
          code: 'TAX',
          name: '應稅',
          rate: 0.05,
        })

        expect(result.success).toBe(true)
        expect(result.message).toBe('稅別建立成功')
      })

      it('代碼重複時應回傳錯誤', async () => {
        vi.mocked(prisma.taxType.findUnique).mockResolvedValue({ id: 'existing' } as never)

        const result = await createTaxType({
          code: 'TAX',
          name: '應稅',
          rate: 0.05,
        })

        expect(result.success).toBe(false)
        expect(result.message).toBe('此稅別代碼已被使用')
      })
    })

    describe('updateTaxType', () => {
      it('應成功更新稅別', async () => {
        vi.mocked(prisma.taxType.update).mockResolvedValue({ id: '1' } as never)

        const result = await updateTaxType('1', {
          name: '更新稅別',
          rate: 0.08,
        })

        expect(result.success).toBe(true)
        expect(result.message).toBe('稅別更新成功')
      })
    })

    describe('deleteTaxType', () => {
      it('應成功刪除稅別', async () => {
        vi.mocked(prisma.taxType.findUnique).mockResolvedValue({
          id: '1',
          _count: { products: 0 },
        } as never)
        vi.mocked(prisma.taxType.delete).mockResolvedValue({ id: '1' } as never)

        const result = await deleteTaxType('1')

        expect(result.success).toBe(true)
        expect(result.message).toBe('稅別刪除成功')
      })

      it('稅別不存在時應回傳錯誤', async () => {
        vi.mocked(prisma.taxType.findUnique).mockResolvedValue(null)

        const result = await deleteTaxType('nonexistent')

        expect(result.success).toBe(false)
        expect(result.message).toBe('稅別不存在')
      })

      it('有商品使用時不能刪除', async () => {
        vi.mocked(prisma.taxType.findUnique).mockResolvedValue({
          id: '1',
          _count: { products: 10 },
        } as never)

        const result = await deleteTaxType('1')

        expect(result.success).toBe(false)
        expect(result.message).toContain('10 個商品')
      })
    })
  })
})
