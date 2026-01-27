'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import type { ActionResult } from '@/types'

// ===================================
// 付款方式相關 Actions
// ===================================

/**
 * 取得付款方式列表
 */
export async function getPaymentMethods(params?: {
  page?: number
  pageSize?: number
  search?: string
  isActive?: boolean
}) {
  const page = params?.page || 1
  const pageSize = params?.pageSize || 50
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

  const [methods, total] = await Promise.all([
    prisma.paymentMethod.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      skip,
      take: pageSize,
    }),
    prisma.paymentMethod.count({ where }),
  ])

  return {
    data: methods,
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
 * 取得單一付款方式
 */
export async function getPaymentMethod(id: string) {
  return prisma.paymentMethod.findUnique({
    where: { id },
  })
}

/**
 * 建立付款方式
 */
export async function createPaymentMethod(data: {
  code: string
  name: string
  description?: string
  sortOrder?: number
  isActive?: boolean
}): Promise<ActionResult> {
  try {
    // 檢查代碼是否已存在
    const existing = await prisma.paymentMethod.findUnique({
      where: { code: data.code },
    })

    if (existing) {
      return {
        success: false,
        message: '此付款方式代碼已被使用',
      }
    }

    const method = await prisma.paymentMethod.create({
      data: {
        code: data.code,
        name: data.name,
        description: data.description || null,
        sortOrder: data.sortOrder || 0,
        isActive: data.isActive ?? true,
      },
    })

    revalidatePath('/settings/payment-methods')

    return {
      success: true,
      message: '付款方式建立成功',
      data: { id: method.id },
    }
  } catch (error) {
    console.error('Create payment method error:', error)
    return {
      success: false,
      message: '建立付款方式失敗',
    }
  }
}

/**
 * 更新付款方式
 */
export async function updatePaymentMethod(
  id: string,
  data: {
    name?: string
    description?: string
    sortOrder?: number
    isActive?: boolean
  }
): Promise<ActionResult> {
  try {
    const existing = await prisma.paymentMethod.findUnique({
      where: { id },
    })

    if (!existing) {
      return {
        success: false,
        message: '付款方式不存在',
      }
    }

    await prisma.paymentMethod.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        sortOrder: data.sortOrder,
        isActive: data.isActive,
      },
    })

    revalidatePath('/settings/payment-methods')

    return {
      success: true,
      message: '付款方式更新成功',
    }
  } catch (error) {
    console.error('Update payment method error:', error)
    return {
      success: false,
      message: '更新付款方式失敗',
    }
  }
}

/**
 * 刪除付款方式
 */
export async function deletePaymentMethod(id: string): Promise<ActionResult> {
  try {
    const method = await prisma.paymentMethod.findUnique({
      where: { id },
      include: {
        _count: {
          select: { payments: true },
        },
      },
    })

    if (!method) {
      return {
        success: false,
        message: '付款方式不存在',
      }
    }

    if (method._count.payments > 0) {
      return {
        success: false,
        message: `此付款方式已有 ${method._count.payments} 筆付款紀錄，無法刪除`,
      }
    }

    await prisma.paymentMethod.delete({
      where: { id },
    })

    revalidatePath('/settings/payment-methods')

    return {
      success: true,
      message: '付款方式刪除成功',
    }
  } catch (error) {
    console.error('Delete payment method error:', error)
    return {
      success: false,
      message: '刪除付款方式失敗',
    }
  }
}

// ===================================
// 計量單位相關 Actions
// ===================================

/**
 * 取得計量單位列表
 */
export async function getUnits(params?: {
  page?: number
  pageSize?: number
  search?: string
  isActive?: boolean
}) {
  const page = params?.page || 1
  const pageSize = params?.pageSize || 50
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

  const [units, total] = await Promise.all([
    prisma.unit.findMany({
      where,
      orderBy: { name: 'asc' },
      skip,
      take: pageSize,
    }),
    prisma.unit.count({ where }),
  ])

  return {
    data: units,
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
 * 建立計量單位
 */
export async function createUnit(data: {
  code: string
  name: string
  description?: string
  isActive?: boolean
}): Promise<ActionResult> {
  try {
    const existing = await prisma.unit.findUnique({
      where: { code: data.code },
    })

    if (existing) {
      return {
        success: false,
        message: '此單位代碼已被使用',
      }
    }

    const unit = await prisma.unit.create({
      data: {
        code: data.code,
        name: data.name,
        description: data.description || null,
        isActive: data.isActive ?? true,
      },
    })

    revalidatePath('/settings/units')

    return {
      success: true,
      message: '計量單位建立成功',
      data: { id: unit.id },
    }
  } catch (error) {
    console.error('Create unit error:', error)
    return {
      success: false,
      message: '建立計量單位失敗',
    }
  }
}

/**
 * 更新計量單位
 */
export async function updateUnit(
  id: string,
  data: {
    name?: string
    description?: string
    isActive?: boolean
  }
): Promise<ActionResult> {
  try {
    await prisma.unit.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        isActive: data.isActive,
      },
    })

    revalidatePath('/settings/units')

    return {
      success: true,
      message: '計量單位更新成功',
    }
  } catch (error) {
    console.error('Update unit error:', error)
    return {
      success: false,
      message: '更新計量單位失敗',
    }
  }
}

/**
 * 刪除計量單位
 */
export async function deleteUnit(id: string): Promise<ActionResult> {
  try {
    const unit = await prisma.unit.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    })

    if (!unit) {
      return {
        success: false,
        message: '計量單位不存在',
      }
    }

    if (unit._count.products > 0) {
      return {
        success: false,
        message: `此單位已有 ${unit._count.products} 個商品使用，無法刪除`,
      }
    }

    await prisma.unit.delete({
      where: { id },
    })

    revalidatePath('/settings/units')

    return {
      success: true,
      message: '計量單位刪除成功',
    }
  } catch (error) {
    console.error('Delete unit error:', error)
    return {
      success: false,
      message: '刪除計量單位失敗',
    }
  }
}

// ===================================
// 稅別相關 Actions
// ===================================

/**
 * 取得稅別列表
 */
export async function getTaxTypes(params?: {
  page?: number
  pageSize?: number
  search?: string
  isActive?: boolean
}) {
  const page = params?.page || 1
  const pageSize = params?.pageSize || 50
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

  const [taxTypes, total] = await Promise.all([
    prisma.taxType.findMany({
      where,
      orderBy: { name: 'asc' },
      skip,
      take: pageSize,
    }),
    prisma.taxType.count({ where }),
  ])

  return {
    data: taxTypes,
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
 * 建立稅別
 */
export async function createTaxType(data: {
  code: string
  name: string
  rate: number
  description?: string
  isActive?: boolean
}): Promise<ActionResult> {
  try {
    const existing = await prisma.taxType.findUnique({
      where: { code: data.code },
    })

    if (existing) {
      return {
        success: false,
        message: '此稅別代碼已被使用',
      }
    }

    const taxType = await prisma.taxType.create({
      data: {
        code: data.code,
        name: data.name,
        rate: data.rate,
        description: data.description || null,
        isActive: data.isActive ?? true,
      },
    })

    revalidatePath('/settings/tax-types')

    return {
      success: true,
      message: '稅別建立成功',
      data: { id: taxType.id },
    }
  } catch (error) {
    console.error('Create tax type error:', error)
    return {
      success: false,
      message: '建立稅別失敗',
    }
  }
}

/**
 * 更新稅別
 */
export async function updateTaxType(
  id: string,
  data: {
    name?: string
    rate?: number
    description?: string
    isActive?: boolean
  }
): Promise<ActionResult> {
  try {
    await prisma.taxType.update({
      where: { id },
      data: {
        name: data.name,
        rate: data.rate,
        description: data.description,
        isActive: data.isActive,
      },
    })

    revalidatePath('/settings/tax-types')

    return {
      success: true,
      message: '稅別更新成功',
    }
  } catch (error) {
    console.error('Update tax type error:', error)
    return {
      success: false,
      message: '更新稅別失敗',
    }
  }
}

/**
 * 刪除稅別
 */
export async function deleteTaxType(id: string): Promise<ActionResult> {
  try {
    const taxType = await prisma.taxType.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    })

    if (!taxType) {
      return {
        success: false,
        message: '稅別不存在',
      }
    }

    if (taxType._count.products > 0) {
      return {
        success: false,
        message: `此稅別已有 ${taxType._count.products} 個商品使用，無法刪除`,
      }
    }

    await prisma.taxType.delete({
      where: { id },
    })

    revalidatePath('/settings/tax-types')

    return {
      success: true,
      message: '稅別刪除成功',
    }
  } catch (error) {
    console.error('Delete tax type error:', error)
    return {
      success: false,
      message: '刪除稅別失敗',
    }
  }
}
