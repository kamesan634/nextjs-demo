'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { supplierSchema } from '@/lib/validations/business'
import type { ActionResult } from '@/types'

/**
 * 取得所有供應商
 */
export async function getSuppliers(params?: {
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
        { shortName: { contains: params.search, mode: 'insensitive' as const } },
        { contactPerson: { contains: params.search, mode: 'insensitive' as const } },
        { phone: { contains: params.search, mode: 'insensitive' as const } },
        { taxId: { contains: params.search, mode: 'insensitive' as const } },
      ],
    }),
    ...(params?.isActive !== undefined && { isActive: params.isActive }),
  }

  const [suppliers, total] = await Promise.all([
    prisma.supplier.findMany({
      where,
      include: {
        _count: {
          select: {
            purchaseOrders: true,
            prices: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.supplier.count({ where }),
  ])

  return {
    data: suppliers,
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
 * 取得所有啟用的供應商（供下拉選單使用）
 */
export async function getActiveSuppliers() {
  return prisma.supplier.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      code: true,
      name: true,
      shortName: true,
    },
  })
}

/**
 * 取得單一供應商
 */
export async function getSupplier(id: string) {
  return prisma.supplier.findUnique({
    where: { id },
    include: {
      prices: {
        include: {
          product: {
            select: {
              id: true,
              sku: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
      purchaseOrders: {
        orderBy: { orderDate: 'desc' },
        take: 10,
        select: {
          id: true,
          orderNo: true,
          status: true,
          totalAmount: true,
          orderDate: true,
        },
      },
      _count: {
        select: {
          purchaseOrders: true,
          prices: true,
        },
      },
    },
  })
}

/**
 * 建立供應商
 */
export async function createSupplier(
  data: Parameters<typeof supplierSchema.parse>[0]
): Promise<ActionResult> {
  try {
    const validated = supplierSchema.safeParse(data)
    if (!validated.success) {
      return {
        success: false,
        message: '驗證失敗',
        errors: validated.error.flatten().fieldErrors as Record<string, string[]>,
      }
    }

    // 檢查代碼是否已存在
    const codeExists = await prisma.supplier.findUnique({
      where: { code: validated.data.code },
    })

    if (codeExists) {
      return {
        success: false,
        message: '此供應商代碼已被使用',
      }
    }

    const supplierData = {
      ...validated.data,
      email: validated.data.email || null,
    }

    const supplier = await prisma.supplier.create({
      data: supplierData,
    })

    revalidatePath('/suppliers')

    return {
      success: true,
      message: '供應商建立成功',
      data: { id: supplier.id },
    }
  } catch (error) {
    console.error('Create supplier error:', error)
    return {
      success: false,
      message: '建立供應商失敗',
    }
  }
}

/**
 * 更新供應商
 */
export async function updateSupplier(
  id: string,
  data: Parameters<typeof supplierSchema.parse>[0]
): Promise<ActionResult> {
  try {
    const validated = supplierSchema.safeParse(data)
    if (!validated.success) {
      return {
        success: false,
        message: '驗證失敗',
        errors: validated.error.flatten().fieldErrors as Record<string, string[]>,
      }
    }

    const existing = await prisma.supplier.findUnique({
      where: { id },
    })

    if (!existing) {
      return {
        success: false,
        message: '供應商不存在',
      }
    }

    // 檢查代碼是否重複
    const codeExists = await prisma.supplier.findFirst({
      where: {
        code: validated.data.code,
        NOT: { id },
      },
    })

    if (codeExists) {
      return {
        success: false,
        message: '此供應商代碼已被使用',
      }
    }

    const supplierData = {
      ...validated.data,
      email: validated.data.email || null,
    }

    await prisma.supplier.update({
      where: { id },
      data: supplierData,
    })

    revalidatePath('/suppliers')

    return {
      success: true,
      message: '供應商更新成功',
    }
  } catch (error) {
    console.error('Update supplier error:', error)
    return {
      success: false,
      message: '更新供應商失敗',
    }
  }
}

/**
 * 刪除供應商
 */
export async function deleteSupplier(id: string): Promise<ActionResult> {
  try {
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            purchaseOrders: true,
            prices: true,
          },
        },
      },
    })

    if (!supplier) {
      return {
        success: false,
        message: '供應商不存在',
      }
    }

    if (supplier._count.purchaseOrders > 0) {
      return {
        success: false,
        message: `此供應商有 ${supplier._count.purchaseOrders} 筆採購單紀錄，無法刪除`,
      }
    }

    // 先刪除供應商價格
    await prisma.supplierPrice.deleteMany({
      where: { supplierId: id },
    })

    // 刪除供應商
    await prisma.supplier.delete({
      where: { id },
    })

    revalidatePath('/suppliers')

    return {
      success: true,
      message: '供應商刪除成功',
    }
  } catch (error) {
    console.error('Delete supplier error:', error)
    return {
      success: false,
      message: '刪除供應商失敗',
    }
  }
}

/**
 * 產生下一個供應商代碼
 */
export async function generateSupplierCode(): Promise<string> {
  const lastSupplier = await prisma.supplier.findFirst({
    where: {
      code: {
        startsWith: 'S',
      },
    },
    orderBy: { code: 'desc' },
    select: { code: true },
  })

  if (!lastSupplier) {
    return 'S00001'
  }

  const lastNumber = parseInt(lastSupplier.code.slice(1), 10) || 0
  const nextNumber = lastNumber + 1
  return `S${nextNumber.toString().padStart(5, '0')}`
}

// ===================================
// 供應商價格相關 Actions
// ===================================

/**
 * 取得供應商的商品價格列表
 */
export async function getSupplierPrices(
  supplierId: string,
  params?: {
    page?: number
    pageSize?: number
    search?: string
  }
) {
  const page = params?.page || 1
  const pageSize = params?.pageSize || 10
  const skip = (page - 1) * pageSize

  const where = {
    supplierId,
    ...(params?.search && {
      product: {
        OR: [
          { sku: { contains: params.search, mode: 'insensitive' as const } },
          { name: { contains: params.search, mode: 'insensitive' as const } },
        ],
      },
    }),
  }

  const [prices, total] = await Promise.all([
    prisma.supplierPrice.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            sku: true,
            name: true,
            costPrice: true,
            sellingPrice: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.supplierPrice.count({ where }),
  ])

  return {
    data: prices,
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
 * 新增或更新供應商價格
 */
export async function upsertSupplierPrice(data: {
  supplierId: string
  productId: string
  price: number
  minQty?: number
  leadTime?: number
  isPreferred?: boolean
}): Promise<ActionResult> {
  try {
    // 檢查供應商和商品是否存在
    const [supplier, product] = await Promise.all([
      prisma.supplier.findUnique({ where: { id: data.supplierId } }),
      prisma.product.findUnique({ where: { id: data.productId } }),
    ])

    if (!supplier) {
      return { success: false, message: '供應商不存在' }
    }

    if (!product) {
      return { success: false, message: '商品不存在' }
    }

    // 如果設為首選供應商，先取消其他供應商的首選狀態
    if (data.isPreferred) {
      await prisma.supplierPrice.updateMany({
        where: {
          productId: data.productId,
          NOT: { supplierId: data.supplierId },
        },
        data: { isPreferred: false },
      })
    }

    await prisma.supplierPrice.upsert({
      where: {
        supplierId_productId: {
          supplierId: data.supplierId,
          productId: data.productId,
        },
      },
      create: {
        supplierId: data.supplierId,
        productId: data.productId,
        price: data.price,
        minQty: data.minQty || 1,
        leadTime: data.leadTime || 0,
        isPreferred: data.isPreferred || false,
      },
      update: {
        price: data.price,
        minQty: data.minQty || 1,
        leadTime: data.leadTime || 0,
        isPreferred: data.isPreferred || false,
      },
    })

    revalidatePath('/suppliers')

    return {
      success: true,
      message: '供應商價格設定成功',
    }
  } catch (error) {
    console.error('Upsert supplier price error:', error)
    return {
      success: false,
      message: '設定供應商價格失敗',
    }
  }
}

/**
 * 刪除供應商價格
 */
export async function deleteSupplierPrice(
  supplierId: string,
  productId: string
): Promise<ActionResult> {
  try {
    await prisma.supplierPrice.delete({
      where: {
        supplierId_productId: {
          supplierId,
          productId,
        },
      },
    })

    revalidatePath('/suppliers')

    return {
      success: true,
      message: '供應商價格刪除成功',
    }
  } catch (error) {
    console.error('Delete supplier price error:', error)
    return {
      success: false,
      message: '刪除供應商價格失敗',
    }
  }
}
