'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import type { ActionResult } from '@/types'

// ===================================
// 促銷活動相關 Actions
// ===================================

/**
 * 取得促銷活動列表
 */
export async function getPromotions(params?: {
  page?: number
  pageSize?: number
  search?: string
  type?: string
  isActive?: boolean
}) {
  const page = params?.page || 1
  const pageSize = params?.pageSize || 10
  const skip = (page - 1) * pageSize

  const where = {
    ...(params?.search && {
      OR: [
        { code: { contains: params.search, mode: 'insensitive' as const } },
        { name: { contains: params.search, mode: 'insensitive' as const } },
      ],
    }),
    ...(params?.type && { type: params.type }),
    ...(params?.isActive !== undefined && { isActive: params.isActive }),
  }

  const [promotions, total] = await Promise.all([
    prisma.promotion.findMany({
      where,
      include: {
        _count: {
          select: { products: true, orders: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.promotion.count({ where }),
  ])

  return {
    data: promotions,
    pagination: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      hasNextPage: page < Math.ceil(total / pageSize),
      hasPrevPage: page > 1,
    },
  }
}

/**
 * 取得單一促銷活動
 */
export async function getPromotion(id: string) {
  return prisma.promotion.findUnique({
    where: { id },
    include: {
      products: {
        include: {
          product: {
            select: {
              id: true,
              sku: true,
              name: true,
              sellingPrice: true,
            },
          },
        },
      },
      _count: {
        select: { orders: true },
      },
    },
  })
}

/**
 * 取得進行中的促銷活動
 */
export async function getActivePromotions() {
  const now = new Date()
  return prisma.promotion.findMany({
    where: {
      isActive: true,
      startDate: { lte: now },
      endDate: { gte: now },
    },
    orderBy: { startDate: 'asc' },
  })
}

/**
 * 建立促銷活動
 */
export async function createPromotion(data: {
  code: string
  name: string
  description?: string
  type: string
  discountType?: string
  discountValue?: number
  minPurchase?: number
  maxDiscount?: number
  usageLimit?: number
  startDate: string
  endDate: string
  productIds?: string[]
  isActive?: boolean
}): Promise<ActionResult> {
  try {
    // 檢查代碼是否已存在
    const existing = await prisma.promotion.findUnique({
      where: { code: data.code },
    })

    if (existing) {
      return {
        success: false,
        message: '此促銷代碼已被使用',
      }
    }

    const promotion = await prisma.promotion.create({
      data: {
        code: data.code,
        name: data.name,
        description: data.description || null,
        type: data.type,
        discountType: data.discountType || null,
        discountValue: data.discountValue || null,
        minPurchase: data.minPurchase || null,
        maxDiscount: data.maxDiscount || null,
        usageLimit: data.usageLimit || null,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        isActive: data.isActive ?? true,
        ...(data.productIds && data.productIds.length > 0
          ? {
              products: {
                create: data.productIds.map((productId) => ({ productId })),
              },
            }
          : {}),
      },
    })

    revalidatePath('/promotions')

    return {
      success: true,
      message: '促銷活動建立成功',
      data: { id: promotion.id },
    }
  } catch (error) {
    console.error('Create promotion error:', error)
    return {
      success: false,
      message: '建立促銷活動失敗',
    }
  }
}

/**
 * 更新促銷活動
 */
export async function updatePromotion(
  id: string,
  data: {
    name?: string
    description?: string
    type?: string
    discountType?: string
    discountValue?: number
    minPurchase?: number
    maxDiscount?: number
    usageLimit?: number
    startDate?: string
    endDate?: string
    productIds?: string[]
    isActive?: boolean
  }
): Promise<ActionResult> {
  try {
    const existing = await prisma.promotion.findUnique({
      where: { id },
    })

    if (!existing) {
      return {
        success: false,
        message: '促銷活動不存在',
      }
    }

    // 如果有更新關聯商品
    if (data.productIds !== undefined) {
      // 先刪除舊的關聯
      await prisma.promotionProduct.deleteMany({
        where: { promotionId: id },
      })

      // 建立新的關聯
      if (data.productIds.length > 0) {
        await prisma.promotionProduct.createMany({
          data: data.productIds.map((productId) => ({
            promotionId: id,
            productId,
          })),
        })
      }
    }

    await prisma.promotion.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        type: data.type,
        discountType: data.discountType,
        discountValue: data.discountValue,
        minPurchase: data.minPurchase,
        maxDiscount: data.maxDiscount,
        usageLimit: data.usageLimit,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        isActive: data.isActive,
      },
    })

    revalidatePath('/promotions')

    return {
      success: true,
      message: '促銷活動更新成功',
    }
  } catch (error) {
    console.error('Update promotion error:', error)
    return {
      success: false,
      message: '更新促銷活動失敗',
    }
  }
}

/**
 * 刪除促銷活動
 */
export async function deletePromotion(id: string): Promise<ActionResult> {
  try {
    const promotion = await prisma.promotion.findUnique({
      where: { id },
      include: {
        _count: {
          select: { orders: true },
        },
      },
    })

    if (!promotion) {
      return {
        success: false,
        message: '促銷活動不存在',
      }
    }

    if (promotion._count.orders > 0) {
      return {
        success: false,
        message: `此促銷活動已被 ${promotion._count.orders} 筆訂單使用，無法刪除`,
      }
    }

    await prisma.$transaction([
      prisma.promotionProduct.deleteMany({
        where: { promotionId: id },
      }),
      prisma.promotion.delete({
        where: { id },
      }),
    ])

    revalidatePath('/promotions')

    return {
      success: true,
      message: '促銷活動刪除成功',
    }
  } catch (error) {
    console.error('Delete promotion error:', error)
    return {
      success: false,
      message: '刪除促銷活動失敗',
    }
  }
}

// ===================================
// 優惠券相關 Actions
// ===================================

/**
 * 取得優惠券列表
 */
export async function getCoupons(params?: {
  page?: number
  pageSize?: number
  search?: string
  isActive?: boolean
}) {
  const page = params?.page || 1
  const pageSize = params?.pageSize || 10
  const skip = (page - 1) * pageSize

  const where = {
    ...(params?.search && {
      OR: [
        { code: { contains: params.search, mode: 'insensitive' as const } },
        { name: { contains: params.search, mode: 'insensitive' as const } },
      ],
    }),
    ...(params?.isActive !== undefined && { isActive: params.isActive }),
  }

  const [coupons, total] = await Promise.all([
    prisma.coupon.findMany({
      where,
      include: {
        _count: {
          select: { usages: true, orders: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.coupon.count({ where }),
  ])

  return {
    data: coupons,
    pagination: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      hasNextPage: page < Math.ceil(total / pageSize),
      hasPrevPage: page > 1,
    },
  }
}

/**
 * 取得單一優惠券
 */
export async function getCoupon(id: string) {
  return prisma.coupon.findUnique({
    where: { id },
    include: {
      usages: {
        include: {
          customer: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
        },
        take: 20,
        orderBy: { usedAt: 'desc' },
      },
      _count: {
        select: { usages: true, orders: true },
      },
    },
  })
}

/**
 * 依代碼查詢優惠券
 */
export async function getCouponByCode(code: string) {
  const now = new Date()
  return prisma.coupon.findFirst({
    where: {
      code,
      isActive: true,
      startDate: { lte: now },
      endDate: { gte: now },
    },
  })
}

/**
 * 建立優惠券
 */
export async function createCoupon(data: {
  code: string
  name: string
  description?: string
  discountType: string
  discountValue: number
  minPurchase?: number
  maxDiscount?: number
  usageLimit?: number
  perUserLimit?: number
  startDate: string
  endDate: string
  isActive?: boolean
}): Promise<ActionResult> {
  try {
    // 檢查代碼是否已存在
    const existing = await prisma.coupon.findUnique({
      where: { code: data.code },
    })

    if (existing) {
      return {
        success: false,
        message: '此優惠券代碼已被使用',
      }
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: data.code,
        name: data.name,
        description: data.description || null,
        discountType: data.discountType,
        discountValue: data.discountValue,
        minPurchase: data.minPurchase || null,
        maxDiscount: data.maxDiscount || null,
        usageLimit: data.usageLimit || null,
        perUserLimit: data.perUserLimit || 1,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        isActive: data.isActive ?? true,
      },
    })

    revalidatePath('/promotions')

    return {
      success: true,
      message: '優惠券建立成功',
      data: { id: coupon.id },
    }
  } catch (error) {
    console.error('Create coupon error:', error)
    return {
      success: false,
      message: '建立優惠券失敗',
    }
  }
}

/**
 * 更新優惠券
 */
export async function updateCoupon(
  id: string,
  data: {
    name?: string
    description?: string
    discountType?: string
    discountValue?: number
    minPurchase?: number
    maxDiscount?: number
    usageLimit?: number
    perUserLimit?: number
    startDate?: string
    endDate?: string
    isActive?: boolean
  }
): Promise<ActionResult> {
  try {
    const existing = await prisma.coupon.findUnique({
      where: { id },
    })

    if (!existing) {
      return {
        success: false,
        message: '優惠券不存在',
      }
    }

    await prisma.coupon.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        discountType: data.discountType,
        discountValue: data.discountValue,
        minPurchase: data.minPurchase,
        maxDiscount: data.maxDiscount,
        usageLimit: data.usageLimit,
        perUserLimit: data.perUserLimit,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        isActive: data.isActive,
      },
    })

    revalidatePath('/promotions')

    return {
      success: true,
      message: '優惠券更新成功',
    }
  } catch (error) {
    console.error('Update coupon error:', error)
    return {
      success: false,
      message: '更新優惠券失敗',
    }
  }
}

/**
 * 刪除優惠券
 */
export async function deleteCoupon(id: string): Promise<ActionResult> {
  try {
    const coupon = await prisma.coupon.findUnique({
      where: { id },
      include: {
        _count: {
          select: { usages: true },
        },
      },
    })

    if (!coupon) {
      return {
        success: false,
        message: '優惠券不存在',
      }
    }

    if (coupon._count.usages > 0) {
      return {
        success: false,
        message: `此優惠券已被使用 ${coupon._count.usages} 次，無法刪除`,
      }
    }

    await prisma.coupon.delete({
      where: { id },
    })

    revalidatePath('/promotions')

    return {
      success: true,
      message: '優惠券刪除成功',
    }
  } catch (error) {
    console.error('Delete coupon error:', error)
    return {
      success: false,
      message: '刪除優惠券失敗',
    }
  }
}

/**
 * 驗證並使用優惠券
 */
export async function validateAndUseCoupon(
  couponCode: string,
  customerId: string,
  orderAmount: number
): Promise<ActionResult<{ discount: number }>> {
  try {
    const now = new Date()
    const coupon = await prisma.coupon.findFirst({
      where: {
        code: couponCode,
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
    })

    if (!coupon) {
      return {
        success: false,
        message: '優惠券不存在或已過期',
      }
    }

    // 檢查使用次數限制
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return {
        success: false,
        message: '此優惠券已達使用上限',
      }
    }

    // 檢查單人使用次數
    const userUsageCount = await prisma.couponUsage.count({
      where: {
        couponId: coupon.id,
        customerId,
      },
    })

    if (userUsageCount >= coupon.perUserLimit) {
      return {
        success: false,
        message: '您已達此優惠券的使用上限',
      }
    }

    // 檢查最低消費
    if (coupon.minPurchase && orderAmount < Number(coupon.minPurchase)) {
      return {
        success: false,
        message: `訂單金額需滿 ${coupon.minPurchase} 元才能使用此優惠券`,
      }
    }

    // 計算折扣金額
    let discount = 0
    if (coupon.discountType === 'PERCENTAGE') {
      discount = orderAmount * (Number(coupon.discountValue) / 100)
    } else {
      discount = Number(coupon.discountValue)
    }

    // 檢查最高折扣限制
    if (coupon.maxDiscount && discount > Number(coupon.maxDiscount)) {
      discount = Number(coupon.maxDiscount)
    }

    return {
      success: true,
      message: '優惠券有效',
      data: { discount: Math.floor(discount) },
    }
  } catch (error) {
    console.error('Validate coupon error:', error)
    return {
      success: false,
      message: '驗證優惠券失敗',
    }
  }
}
