/**
 * Price Rules Server Actions 測試
 * 測試價格規則相關的 Server Actions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getProductPriceRules,
  getPriceRule,
  createPriceRule,
  updatePriceRule,
  deletePriceRule,
  calculateProductPrice,
} from '@/actions/price-rules'
import prisma from '@/lib/prisma'

// Mock revalidatePath
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

describe('Price Rules Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===== getProductPriceRules 測試 =====
  describe('getProductPriceRules', () => {
    it('應回傳商品的價格規則列表', async () => {
      const mockRules = [
        {
          id: '1',
          productId: 'p1',
          ruleType: 'QUANTITY',
          minQuantity: 10,
          price: 90,
          isActive: true,
          memberLevel: null,
        },
        {
          id: '2',
          productId: 'p1',
          ruleType: 'MEMBER_LEVEL',
          memberLevelId: 'ml1',
          price: 85,
          isActive: true,
          memberLevel: { id: 'ml1', code: 'VIP', name: 'VIP會員' },
        },
      ]

      vi.mocked(prisma.priceRule.findMany).mockResolvedValue(mockRules as never)

      const result = await getProductPriceRules('p1')

      expect(result).toHaveLength(2)
      expect(result[0].ruleType).toBe('QUANTITY')
      expect(result[1].memberLevel?.name).toBe('VIP會員')
    })

    it('無價格規則時應回傳空陣列', async () => {
      vi.mocked(prisma.priceRule.findMany).mockResolvedValue([])

      const result = await getProductPriceRules('p1')

      expect(result).toHaveLength(0)
    })
  })

  // ===== getPriceRule 測試 =====
  describe('getPriceRule', () => {
    it('應回傳價格規則詳情', async () => {
      const mockRule = {
        id: '1',
        productId: 'p1',
        ruleType: 'QUANTITY',
        minQuantity: 10,
        price: 90,
        isActive: true,
        product: { id: 'p1', name: '商品1', sku: 'SKU001' },
        memberLevel: null,
      }

      vi.mocked(prisma.priceRule.findUnique).mockResolvedValue(mockRule as never)

      const result = await getPriceRule('1')

      expect(result?.ruleType).toBe('QUANTITY')
      expect(result?.product?.name).toBe('商品1')
    })

    it('價格規則不存在時應回傳 null', async () => {
      vi.mocked(prisma.priceRule.findUnique).mockResolvedValue(null)

      const result = await getPriceRule('nonexistent')

      expect(result).toBeNull()
    })
  })

  // ===== createPriceRule 測試 =====
  describe('createPriceRule', () => {
    const validQuantityRule = {
      productId: 'p1',
      ruleType: 'QUANTITY' as const,
      minQuantity: 10,
      price: 90,
      isActive: true,
    }

    const validMemberLevelRule = {
      productId: 'p1',
      ruleType: 'MEMBER_LEVEL' as const,
      memberLevelId: 'ml1',
      price: 85,
      isActive: true,
    }

    const validPromotionRule = {
      productId: 'p1',
      ruleType: 'PROMOTION' as const,
      price: 80,
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      isActive: true,
    }

    it('應成功建立數量價格規則', async () => {
      vi.mocked(prisma.priceRule.create).mockResolvedValue({ id: 'new-id' } as never)

      const result = await createPriceRule(validQuantityRule)

      expect(result.success).toBe(true)
      expect(result.message).toBe('價格規則建立成功')
      expect((result.data as { id: string })?.id).toBe('new-id')
    })

    it('應成功建立會員等級價格規則', async () => {
      vi.mocked(prisma.priceRule.create).mockResolvedValue({ id: 'new-id' } as never)

      const result = await createPriceRule(validMemberLevelRule)

      expect(result.success).toBe(true)
      expect(result.message).toBe('價格規則建立成功')
    })

    it('應成功建立促銷價格規則', async () => {
      vi.mocked(prisma.priceRule.create).mockResolvedValue({ id: 'new-id' } as never)

      const result = await createPriceRule(validPromotionRule)

      expect(result.success).toBe(true)
      expect(result.message).toBe('價格規則建立成功')
    })

    it('驗證失敗時應回傳錯誤 - 缺少商品ID', async () => {
      const result = await createPriceRule({
        productId: '',
        ruleType: 'QUANTITY',
        price: 90,
        isActive: true,
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('驗證失敗')
      expect(result.errors).toBeDefined()
    })

    it('驗證失敗時應回傳錯誤 - 無效規則類型', async () => {
      const result = await createPriceRule({
        productId: 'p1',
        ruleType: 'INVALID' as never,
        price: 90,
        isActive: true,
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('驗證失敗')
    })

    it('驗證失敗時應回傳錯誤 - 價格小於0', async () => {
      const result = await createPriceRule({
        ...validQuantityRule,
        price: -10,
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('驗證失敗')
    })

    it('資料庫錯誤時應回傳失敗訊息', async () => {
      vi.mocked(prisma.priceRule.create).mockRejectedValue(new Error('DB Error'))

      const result = await createPriceRule(validQuantityRule)

      expect(result.success).toBe(false)
      expect(result.message).toBe('建立價格規則失敗')
    })
  })

  // ===== updatePriceRule 測試 =====
  describe('updatePriceRule', () => {
    const validUpdateData = {
      ruleType: 'QUANTITY' as const,
      minQuantity: 20,
      price: 85,
      isActive: true,
    }

    it('應成功更新價格規則', async () => {
      vi.mocked(prisma.priceRule.findUnique).mockResolvedValue({
        id: '1',
        productId: 'p1',
      } as never)
      vi.mocked(prisma.priceRule.update).mockResolvedValue({ id: '1' } as never)

      const result = await updatePriceRule('1', validUpdateData)

      expect(result.success).toBe(true)
      expect(result.message).toBe('價格規則更新成功')
    })

    it('價格規則不存在時應回傳錯誤', async () => {
      vi.mocked(prisma.priceRule.findUnique).mockResolvedValue(null)

      const result = await updatePriceRule('nonexistent', validUpdateData)

      expect(result.success).toBe(false)
      expect(result.message).toBe('價格規則不存在')
    })

    it('驗證失敗時應回傳錯誤', async () => {
      const result = await updatePriceRule('1', {
        ruleType: 'INVALID' as never,
        price: -10,
        isActive: true,
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('驗證失敗')
      expect(result.errors).toBeDefined()
    })

    it('應正確處理日期欄位', async () => {
      vi.mocked(prisma.priceRule.findUnique).mockResolvedValue({
        id: '1',
        productId: 'p1',
      } as never)
      vi.mocked(prisma.priceRule.update).mockResolvedValue({ id: '1' } as never)

      await updatePriceRule('1', {
        ...validUpdateData,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      })

      expect(prisma.priceRule.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            startDate: expect.any(Date),
            endDate: expect.any(Date),
          }),
        })
      )
    })

    it('資料庫錯誤時應回傳失敗訊息', async () => {
      vi.mocked(prisma.priceRule.findUnique).mockResolvedValue({
        id: '1',
        productId: 'p1',
      } as never)
      vi.mocked(prisma.priceRule.update).mockRejectedValue(new Error('DB Error'))

      const result = await updatePriceRule('1', validUpdateData)

      expect(result.success).toBe(false)
      expect(result.message).toBe('更新價格規則失敗')
    })
  })

  // ===== deletePriceRule 測試 =====
  describe('deletePriceRule', () => {
    it('應成功刪除價格規則', async () => {
      vi.mocked(prisma.priceRule.findUnique).mockResolvedValue({
        id: '1',
        productId: 'p1',
      } as never)
      vi.mocked(prisma.priceRule.delete).mockResolvedValue({ id: '1' } as never)

      const result = await deletePriceRule('1')

      expect(result.success).toBe(true)
      expect(result.message).toBe('價格規則刪除成功')
    })

    it('價格規則不存在時應回傳錯誤', async () => {
      vi.mocked(prisma.priceRule.findUnique).mockResolvedValue(null)

      const result = await deletePriceRule('nonexistent')

      expect(result.success).toBe(false)
      expect(result.message).toBe('價格規則不存在')
    })

    it('資料庫錯誤時應回傳失敗訊息', async () => {
      vi.mocked(prisma.priceRule.findUnique).mockResolvedValue({
        id: '1',
        productId: 'p1',
      } as never)
      vi.mocked(prisma.priceRule.delete).mockRejectedValue(new Error('DB Error'))

      const result = await deletePriceRule('1')

      expect(result.success).toBe(false)
      expect(result.message).toBe('刪除價格規則失敗')
    })
  })

  // ===== calculateProductPrice 測試 =====
  describe('calculateProductPrice', () => {
    const mockProduct = {
      id: 'p1',
      sellingPrice: 100,
    }

    it('無價格規則時應回傳原價', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as never)
      vi.mocked(prisma.priceRule.findMany).mockResolvedValue([])

      const result = await calculateProductPrice('p1', 1)

      expect(result).toBe(100)
    })

    it('商品不存在時應拋出錯誤', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue(null)

      await expect(calculateProductPrice('nonexistent', 1)).rejects.toThrow('商品不存在')
    })

    it('應正確套用數量價格規則', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as never)
      vi.mocked(prisma.priceRule.findMany).mockResolvedValue([
        {
          id: '1',
          ruleType: 'QUANTITY',
          minQuantity: 10,
          price: 90,
          memberLevelId: null,
        },
      ] as never)

      const result = await calculateProductPrice('p1', 10)

      expect(result).toBe(90)
    })

    it('數量未達門檻時不應套用數量規則', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as never)
      vi.mocked(prisma.priceRule.findMany).mockResolvedValue([
        {
          id: '1',
          ruleType: 'QUANTITY',
          minQuantity: 10,
          price: 90,
          memberLevelId: null,
        },
      ] as never)

      const result = await calculateProductPrice('p1', 5)

      expect(result).toBe(100)
    })

    it('應正確套用會員等級價格規則', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as never)
      vi.mocked(prisma.priceRule.findMany).mockResolvedValue([
        {
          id: '1',
          ruleType: 'MEMBER_LEVEL',
          memberLevelId: 'ml1',
          price: 85,
          minQuantity: null,
        },
      ] as never)

      const result = await calculateProductPrice('p1', 1, 'ml1')

      expect(result).toBe(85)
    })

    it('會員等級不匹配時不應套用會員規則', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as never)
      vi.mocked(prisma.priceRule.findMany).mockResolvedValue([
        {
          id: '1',
          ruleType: 'MEMBER_LEVEL',
          memberLevelId: 'ml1',
          price: 85,
          minQuantity: null,
        },
      ] as never)

      const result = await calculateProductPrice('p1', 1, 'ml2')

      expect(result).toBe(100)
    })

    it('應正確套用促銷價格規則', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as never)
      vi.mocked(prisma.priceRule.findMany).mockResolvedValue([
        {
          id: '1',
          ruleType: 'PROMOTION',
          price: 80,
          minQuantity: null,
          memberLevelId: null,
        },
      ] as never)

      const result = await calculateProductPrice('p1', 1)

      expect(result).toBe(80)
    })

    it('應取最低價格 - 多個規則都適用', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as never)
      vi.mocked(prisma.priceRule.findMany).mockResolvedValue([
        {
          id: '1',
          ruleType: 'QUANTITY',
          minQuantity: 10,
          price: 90,
          memberLevelId: null,
        },
        {
          id: '2',
          ruleType: 'MEMBER_LEVEL',
          memberLevelId: 'ml1',
          price: 85,
          minQuantity: null,
        },
        {
          id: '3',
          ruleType: 'PROMOTION',
          price: 75,
          minQuantity: null,
          memberLevelId: null,
        },
      ] as never)

      const result = await calculateProductPrice('p1', 10, 'ml1')

      expect(result).toBe(75)
    })

    it('規則價格高於原價時應回傳原價', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as never)
      vi.mocked(prisma.priceRule.findMany).mockResolvedValue([
        {
          id: '1',
          ruleType: 'PROMOTION',
          price: 120,
          minQuantity: null,
          memberLevelId: null,
        },
      ] as never)

      const result = await calculateProductPrice('p1', 1)

      expect(result).toBe(100)
    })

    it('預設數量為 1', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as never)
      vi.mocked(prisma.priceRule.findMany).mockResolvedValue([])

      const result = await calculateProductPrice('p1')

      expect(result).toBe(100)
    })
  })
})
