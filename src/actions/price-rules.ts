'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { createPriceRuleSchema, updatePriceRuleSchema } from '@/lib/validations/price-rules'
import type { ActionResult } from '@/types'

/**
 * 取得商品的價格規則
 */
export async function getProductPriceRules(productId: string) {
  return prisma.priceRule.findMany({
    where: { productId },
    include: {
      memberLevel: {
        select: { id: true, code: true, name: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}

/**
 * 取得單一價格規則
 */
export async function getPriceRule(id: string) {
  return prisma.priceRule.findUnique({
    where: { id },
    include: {
      product: { select: { id: true, name: true, sku: true } },
      memberLevel: { select: { id: true, code: true, name: true } },
    },
  })
}

/**
 * 建立價格規則
 */
export async function createPriceRule(
  data: Parameters<typeof createPriceRuleSchema.parse>[0]
): Promise<ActionResult> {
  try {
    const validated = createPriceRuleSchema.safeParse(data)
    if (!validated.success) {
      return {
        success: false,
        message: '驗證失敗',
        errors: validated.error.flatten().fieldErrors as Record<string, string[]>,
      }
    }

    const rule = await prisma.priceRule.create({
      data: {
        productId: validated.data.productId,
        ruleType: validated.data.ruleType,
        minQuantity: validated.data.minQuantity,
        memberLevelId: validated.data.memberLevelId,
        price: validated.data.price,
        startDate: validated.data.startDate ? new Date(validated.data.startDate) : null,
        endDate: validated.data.endDate ? new Date(validated.data.endDate) : null,
        isActive: validated.data.isActive,
      },
    })

    revalidatePath(`/products/${validated.data.productId}/prices`)

    return {
      success: true,
      message: '價格規則建立成功',
      data: { id: rule.id },
    }
  } catch (error) {
    console.error('Create price rule error:', error)
    return { success: false, message: '建立價格規則失敗' }
  }
}

/**
 * 更新價格規則
 */
export async function updatePriceRule(
  id: string,
  data: Parameters<typeof updatePriceRuleSchema.parse>[0]
): Promise<ActionResult> {
  try {
    const validated = updatePriceRuleSchema.safeParse(data)
    if (!validated.success) {
      return {
        success: false,
        message: '驗證失敗',
        errors: validated.error.flatten().fieldErrors as Record<string, string[]>,
      }
    }

    const existing = await prisma.priceRule.findUnique({ where: { id } })
    if (!existing) {
      return { success: false, message: '價格規則不存在' }
    }

    await prisma.priceRule.update({
      where: { id },
      data: {
        ruleType: validated.data.ruleType,
        minQuantity: validated.data.minQuantity,
        memberLevelId: validated.data.memberLevelId,
        price: validated.data.price,
        startDate: validated.data.startDate ? new Date(validated.data.startDate) : null,
        endDate: validated.data.endDate ? new Date(validated.data.endDate) : null,
        isActive: validated.data.isActive,
      },
    })

    revalidatePath(`/products/${existing.productId}/prices`)

    return { success: true, message: '價格規則更新成功' }
  } catch (error) {
    console.error('Update price rule error:', error)
    return { success: false, message: '更新價格規則失敗' }
  }
}

/**
 * 刪除價格規則
 */
export async function deletePriceRule(id: string): Promise<ActionResult> {
  try {
    const rule = await prisma.priceRule.findUnique({ where: { id } })
    if (!rule) {
      return { success: false, message: '價格規則不存在' }
    }

    await prisma.priceRule.delete({ where: { id } })

    revalidatePath(`/products/${rule.productId}/prices`)

    return { success: true, message: '價格規則刪除成功' }
  } catch (error) {
    console.error('Delete price rule error:', error)
    return { success: false, message: '刪除價格規則失敗' }
  }
}

/**
 * 計算商品的最終價格
 */
export async function calculateProductPrice(
  productId: string,
  quantity: number = 1,
  memberLevelId?: string
): Promise<number> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { sellingPrice: true },
  })

  if (!product) {
    throw new Error('商品不存在')
  }

  const now = new Date()

  // 取得所有有效的價格規則
  const rules = await prisma.priceRule.findMany({
    where: {
      productId,
      isActive: true,
      OR: [
        { startDate: null, endDate: null },
        { startDate: { lte: now }, endDate: null },
        { startDate: null, endDate: { gte: now } },
        { startDate: { lte: now }, endDate: { gte: now } },
      ],
    },
    orderBy: { price: 'asc' },
  })

  let bestPrice = Number(product.sellingPrice)

  for (const rule of rules) {
    let applicable = false

    switch (rule.ruleType) {
      case 'QUANTITY':
        if (rule.minQuantity && quantity >= rule.minQuantity) {
          applicable = true
        }
        break
      case 'MEMBER_LEVEL':
        if (rule.memberLevelId && rule.memberLevelId === memberLevelId) {
          applicable = true
        }
        break
      case 'PROMOTION':
        applicable = true
        break
    }

    if (applicable && Number(rule.price) < bestPrice) {
      bestPrice = Number(rule.price)
    }
  }

  return bestPrice
}
