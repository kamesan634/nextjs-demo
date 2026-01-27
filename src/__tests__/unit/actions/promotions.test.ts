/**
 * Promotions Server Actions 測試
 * 測試促銷活動和優惠券相關的 Server Actions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getPromotions,
  getPromotion,
  getActivePromotions,
  createPromotion,
  updatePromotion,
  deletePromotion,
  getCoupons,
  getCoupon,
  getCouponByCode,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateAndUseCoupon,
} from '@/actions/promotions'
import prisma from '@/lib/prisma'

// Mock revalidatePath
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

describe('Promotions Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===== 促銷活動測試 =====
  describe('Promotion Actions', () => {
    describe('getPromotions', () => {
      it('應回傳分頁的促銷活動列表', async () => {
        const mockPromotions = [
          { id: '1', code: 'SALE2024', name: '新年特賣', _count: { products: 10, orders: 50 } },
        ]

        vi.mocked(prisma.promotion.findMany).mockResolvedValue(mockPromotions as never)
        vi.mocked(prisma.promotion.count).mockResolvedValue(1)

        const result = await getPromotions({ page: 1, pageSize: 10 })

        expect(result.data).toHaveLength(1)
        expect(result.pagination.total).toBe(1)
      })

      it('應支援搜尋功能', async () => {
        vi.mocked(prisma.promotion.findMany).mockResolvedValue([])
        vi.mocked(prisma.promotion.count).mockResolvedValue(0)

        await getPromotions({ search: '特賣' })

        expect(prisma.promotion.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              OR: expect.any(Array),
            }),
          })
        )
      })

      it('應支援類型篩選', async () => {
        vi.mocked(prisma.promotion.findMany).mockResolvedValue([])
        vi.mocked(prisma.promotion.count).mockResolvedValue(0)

        await getPromotions({ type: 'DISCOUNT' })

        expect(prisma.promotion.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({ type: 'DISCOUNT' }),
          })
        )
      })
    })

    describe('getPromotion', () => {
      it('應回傳促銷活動詳情', async () => {
        const mockPromotion = {
          id: '1',
          code: 'SALE2024',
          name: '新年特賣',
          products: [],
          _count: { orders: 50 },
        }

        vi.mocked(prisma.promotion.findUnique).mockResolvedValue(mockPromotion as never)

        const result = await getPromotion('1')

        expect(result?.name).toBe('新年特賣')
      })
    })

    describe('getActivePromotions', () => {
      it('應回傳進行中的促銷活動', async () => {
        vi.mocked(prisma.promotion.findMany).mockResolvedValue([])

        await getActivePromotions()

        expect(prisma.promotion.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              isActive: true,
              startDate: expect.any(Object),
              endDate: expect.any(Object),
            }),
          })
        )
      })
    })

    describe('createPromotion', () => {
      const validPromotionData = {
        code: 'SALE2024',
        name: '新年特賣',
        type: 'DISCOUNT',
        discountType: 'PERCENTAGE',
        discountValue: 20,
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      }

      it('應成功建立促銷活動', async () => {
        vi.mocked(prisma.promotion.findUnique).mockResolvedValue(null)
        vi.mocked(prisma.promotion.create).mockResolvedValue({ id: 'new-id' } as never)

        const result = await createPromotion(validPromotionData)

        expect(result.success).toBe(true)
        expect(result.message).toBe('促銷活動建立成功')
      })

      it('代碼重複時應回傳錯誤', async () => {
        vi.mocked(prisma.promotion.findUnique).mockResolvedValue({ id: 'existing' } as never)

        const result = await createPromotion(validPromotionData)

        expect(result.success).toBe(false)
        expect(result.message).toBe('此促銷代碼已被使用')
      })

      it('應支援關聯商品', async () => {
        vi.mocked(prisma.promotion.findUnique).mockResolvedValue(null)
        vi.mocked(prisma.promotion.create).mockResolvedValue({ id: 'new-id' } as never)

        await createPromotion({
          ...validPromotionData,
          productIds: ['p1', 'p2'],
        })

        expect(prisma.promotion.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              products: expect.objectContaining({
                create: expect.arrayContaining([
                  expect.objectContaining({ productId: 'p1' }),
                  expect.objectContaining({ productId: 'p2' }),
                ]),
              }),
            }),
          })
        )
      })
    })

    describe('updatePromotion', () => {
      it('應成功更新促銷活動', async () => {
        vi.mocked(prisma.promotion.findUnique).mockResolvedValue({ id: '1' } as never)
        vi.mocked(prisma.promotion.update).mockResolvedValue({ id: '1' } as never)

        const result = await updatePromotion('1', {
          name: '更新特賣',
        })

        expect(result.success).toBe(true)
        expect(result.message).toBe('促銷活動更新成功')
      })

      it('促銷活動不存在時應回傳錯誤', async () => {
        vi.mocked(prisma.promotion.findUnique).mockResolvedValue(null)

        const result = await updatePromotion('nonexistent', {
          name: '更新',
        })

        expect(result.success).toBe(false)
        expect(result.message).toBe('促銷活動不存在')
      })

      it('更新商品關聯時應先刪除舊的', async () => {
        vi.mocked(prisma.promotion.findUnique).mockResolvedValue({ id: '1' } as never)
        vi.mocked(prisma.promotionProduct.deleteMany).mockResolvedValue({ count: 2 } as never)
        vi.mocked(prisma.promotionProduct.createMany).mockResolvedValue({ count: 2 } as never)
        vi.mocked(prisma.promotion.update).mockResolvedValue({ id: '1' } as never)

        await updatePromotion('1', {
          productIds: ['p3', 'p4'],
        })

        expect(prisma.promotionProduct.deleteMany).toHaveBeenCalled()
        expect(prisma.promotionProduct.createMany).toHaveBeenCalled()
      })
    })

    describe('deletePromotion', () => {
      it('應成功刪除促銷活動', async () => {
        vi.mocked(prisma.promotion.findUnique).mockResolvedValue({
          id: '1',
          _count: { orders: 0 },
        } as never)
        vi.mocked(prisma.$transaction).mockResolvedValue([{}, {}] as never)

        const result = await deletePromotion('1')

        expect(result.success).toBe(true)
        expect(result.message).toBe('促銷活動刪除成功')
      })

      it('有訂單使用時不能刪除', async () => {
        vi.mocked(prisma.promotion.findUnique).mockResolvedValue({
          id: '1',
          _count: { orders: 10 },
        } as never)

        const result = await deletePromotion('1')

        expect(result.success).toBe(false)
        expect(result.message).toContain('10 筆訂單')
      })
    })
  })

  // ===== 優惠券測試 =====
  describe('Coupon Actions', () => {
    describe('getCoupons', () => {
      it('應回傳分頁的優惠券列表', async () => {
        const mockCoupons = [
          { id: '1', code: 'SAVE100', name: '折100元', _count: { usages: 50, orders: 45 } },
        ]

        vi.mocked(prisma.coupon.findMany).mockResolvedValue(mockCoupons as never)
        vi.mocked(prisma.coupon.count).mockResolvedValue(1)

        const result = await getCoupons({ page: 1, pageSize: 10 })

        expect(result.data).toHaveLength(1)
        expect(result.pagination.total).toBe(1)
      })
    })

    describe('getCoupon', () => {
      it('應回傳優惠券詳情', async () => {
        const mockCoupon = {
          id: '1',
          code: 'SAVE100',
          name: '折100元',
          usages: [],
          _count: { usages: 50, orders: 45 },
        }

        vi.mocked(prisma.coupon.findUnique).mockResolvedValue(mockCoupon as never)

        const result = await getCoupon('1')

        expect(result?.code).toBe('SAVE100')
      })
    })

    describe('getCouponByCode', () => {
      it('應依代碼查詢有效的優惠券', async () => {
        vi.mocked(prisma.coupon.findFirst).mockResolvedValue({
          id: '1',
          code: 'SAVE100',
        } as never)

        const result = await getCouponByCode('SAVE100')

        expect(result?.code).toBe('SAVE100')
        expect(prisma.coupon.findFirst).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              code: 'SAVE100',
              isActive: true,
            }),
          })
        )
      })
    })

    describe('createCoupon', () => {
      const validCouponData = {
        code: 'SAVE100',
        name: '折100元',
        discountType: 'FIXED',
        discountValue: 100,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      }

      it('應成功建立優惠券', async () => {
        vi.mocked(prisma.coupon.findUnique).mockResolvedValue(null)
        vi.mocked(prisma.coupon.create).mockResolvedValue({ id: 'new-id' } as never)

        const result = await createCoupon(validCouponData)

        expect(result.success).toBe(true)
        expect(result.message).toBe('優惠券建立成功')
      })

      it('代碼重複時應回傳錯誤', async () => {
        vi.mocked(prisma.coupon.findUnique).mockResolvedValue({ id: 'existing' } as never)

        const result = await createCoupon(validCouponData)

        expect(result.success).toBe(false)
        expect(result.message).toBe('此優惠券代碼已被使用')
      })
    })

    describe('updateCoupon', () => {
      it('應成功更新優惠券', async () => {
        vi.mocked(prisma.coupon.findUnique).mockResolvedValue({ id: '1' } as never)
        vi.mocked(prisma.coupon.update).mockResolvedValue({ id: '1' } as never)

        const result = await updateCoupon('1', {
          name: '折200元',
          discountValue: 200,
        })

        expect(result.success).toBe(true)
        expect(result.message).toBe('優惠券更新成功')
      })

      it('優惠券不存在時應回傳錯誤', async () => {
        vi.mocked(prisma.coupon.findUnique).mockResolvedValue(null)

        const result = await updateCoupon('nonexistent', {
          name: '更新',
        })

        expect(result.success).toBe(false)
        expect(result.message).toBe('優惠券不存在')
      })
    })

    describe('deleteCoupon', () => {
      it('應成功刪除優惠券', async () => {
        vi.mocked(prisma.coupon.findUnique).mockResolvedValue({
          id: '1',
          _count: { usages: 0 },
        } as never)
        vi.mocked(prisma.coupon.delete).mockResolvedValue({ id: '1' } as never)

        const result = await deleteCoupon('1')

        expect(result.success).toBe(true)
        expect(result.message).toBe('優惠券刪除成功')
      })

      it('已被使用時不能刪除', async () => {
        vi.mocked(prisma.coupon.findUnique).mockResolvedValue({
          id: '1',
          _count: { usages: 10 },
        } as never)

        const result = await deleteCoupon('1')

        expect(result.success).toBe(false)
        expect(result.message).toContain('10 次')
      })
    })

    describe('validateAndUseCoupon', () => {
      const mockValidCoupon = {
        id: '1',
        code: 'SAVE100',
        discountType: 'FIXED',
        discountValue: 100,
        minPurchase: 500,
        maxDiscount: null,
        usageLimit: 100,
        usedCount: 50,
        perUserLimit: 1,
        isActive: true,
      }

      it('應成功驗證有效優惠券', async () => {
        vi.mocked(prisma.coupon.findFirst).mockResolvedValue(mockValidCoupon as never)
        vi.mocked(prisma.couponUsage.count).mockResolvedValue(0)

        const result = await validateAndUseCoupon('SAVE100', 'customer-1', 1000)

        expect(result.success).toBe(true)
        expect(result.data?.discount).toBe(100)
      })

      it('優惠券不存在或過期時應回傳錯誤', async () => {
        vi.mocked(prisma.coupon.findFirst).mockResolvedValue(null)

        const result = await validateAndUseCoupon('INVALID', 'customer-1', 1000)

        expect(result.success).toBe(false)
        expect(result.message).toBe('優惠券不存在或已過期')
      })

      it('達到使用上限時應回傳錯誤', async () => {
        vi.mocked(prisma.coupon.findFirst).mockResolvedValue({
          ...mockValidCoupon,
          usedCount: 100,
        } as never)

        const result = await validateAndUseCoupon('SAVE100', 'customer-1', 1000)

        expect(result.success).toBe(false)
        expect(result.message).toBe('此優惠券已達使用上限')
      })

      it('用戶達到個人使用上限時應回傳錯誤', async () => {
        vi.mocked(prisma.coupon.findFirst).mockResolvedValue(mockValidCoupon as never)
        vi.mocked(prisma.couponUsage.count).mockResolvedValue(1)

        const result = await validateAndUseCoupon('SAVE100', 'customer-1', 1000)

        expect(result.success).toBe(false)
        expect(result.message).toBe('您已達此優惠券的使用上限')
      })

      it('訂單金額未達最低消費時應回傳錯誤', async () => {
        vi.mocked(prisma.coupon.findFirst).mockResolvedValue(mockValidCoupon as never)
        vi.mocked(prisma.couponUsage.count).mockResolvedValue(0)

        const result = await validateAndUseCoupon('SAVE100', 'customer-1', 300)

        expect(result.success).toBe(false)
        expect(result.message).toContain('500')
      })

      it('應正確計算百分比折扣', async () => {
        vi.mocked(prisma.coupon.findFirst).mockResolvedValue({
          ...mockValidCoupon,
          discountType: 'PERCENTAGE',
          discountValue: 10,
          minPurchase: null,
        } as never)
        vi.mocked(prisma.couponUsage.count).mockResolvedValue(0)

        const result = await validateAndUseCoupon('SAVE10P', 'customer-1', 1000)

        expect(result.success).toBe(true)
        expect(result.data?.discount).toBe(100) // 1000 * 10%
      })

      it('應遵守最高折扣限制', async () => {
        vi.mocked(prisma.coupon.findFirst).mockResolvedValue({
          ...mockValidCoupon,
          discountType: 'PERCENTAGE',
          discountValue: 50,
          minPurchase: null,
          maxDiscount: 200,
        } as never)
        vi.mocked(prisma.couponUsage.count).mockResolvedValue(0)

        const result = await validateAndUseCoupon('SAVE50P', 'customer-1', 1000)

        expect(result.success).toBe(true)
        expect(result.data?.discount).toBe(200) // 最高限制 200，而非 500
      })
    })
  })
})
