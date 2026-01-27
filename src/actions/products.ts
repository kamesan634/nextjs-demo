'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { productSchema } from '@/lib/validations/products'
import type { ActionResult } from '@/types'

/**
 * 取得所有商品
 */
export async function getProducts(params?: {
  page?: number
  pageSize?: number
  search?: string
  categoryId?: string
  isActive?: boolean
}) {
  const page = params?.page || 1
  const pageSize = params?.pageSize || 10
  const skip = (page - 1) * pageSize

  const where = {
    ...(params?.search && {
      OR: [
        { sku: { contains: params.search, mode: 'insensitive' as const } },
        { name: { contains: params.search, mode: 'insensitive' as const } },
        { barcode: { contains: params.search, mode: 'insensitive' as const } },
      ],
    }),
    ...(params?.categoryId && { categoryId: params.categoryId }),
    ...(params?.isActive !== undefined && { isActive: params.isActive }),
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: {
          select: { id: true, name: true },
        },
        unit: {
          select: { id: true, name: true },
        },
        taxType: {
          select: { id: true, name: true },
        },
        inventories: {
          select: { quantity: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.product.count({ where }),
  ])

  // 計算總庫存
  const productsWithStock = products.map((product) => ({
    ...product,
    costPrice: Number(product.costPrice),
    listPrice: Number(product.listPrice),
    sellingPrice: Number(product.sellingPrice),
    minPrice: product.minPrice ? Number(product.minPrice) : null,
    totalStock: product.inventories.reduce((sum, inv) => sum + inv.quantity, 0),
  }))

  return {
    data: productsWithStock,
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
 * 取得單一商品
 */
export async function getProduct(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      unit: true,
      taxType: true,
      inventories: {
        include: {
          warehouse: true,
          store: true,
        },
      },
      supplierPrices: {
        include: {
          supplier: true,
        },
      },
    },
  })

  if (product) {
    return {
      ...product,
      costPrice: Number(product.costPrice),
      listPrice: Number(product.listPrice),
      sellingPrice: Number(product.sellingPrice),
      minPrice: product.minPrice ? Number(product.minPrice) : null,
    }
  }

  return null
}

/**
 * 取得計量單位選項
 */
export async function getUnitOptions() {
  const units = await prisma.unit.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  })

  return units.map((unit) => ({
    value: unit.id,
    label: unit.name,
  }))
}

/**
 * 取得稅別選項
 */
export async function getTaxTypeOptions() {
  const taxTypes = await prisma.taxType.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  })

  return taxTypes.map((tax) => ({
    value: tax.id,
    label: `${tax.name} (${Number(tax.rate) * 100}%)`,
  }))
}

/**
 * 建立商品
 */
export async function createProduct(
  data: Parameters<typeof productSchema.parse>[0]
): Promise<ActionResult> {
  try {
    const validated = productSchema.safeParse(data)
    if (!validated.success) {
      return {
        success: false,
        message: '驗證失敗',
        errors: validated.error.flatten().fieldErrors as Record<string, string[]>,
      }
    }

    // 檢查 SKU 是否重複
    const existingProduct = await prisma.product.findUnique({
      where: { sku: validated.data.sku },
    })

    if (existingProduct) {
      return {
        success: false,
        message: '此商品編號已存在',
      }
    }

    // 檢查條碼是否重複
    if (validated.data.barcode) {
      const barcodeExists = await prisma.product.findUnique({
        where: { barcode: validated.data.barcode },
      })

      if (barcodeExists) {
        return {
          success: false,
          message: '此條碼已被其他商品使用',
        }
      }
    }

    const product = await prisma.product.create({
      data: {
        sku: validated.data.sku,
        barcode: validated.data.barcode || null,
        name: validated.data.name,
        shortName: validated.data.shortName,
        description: validated.data.description,
        specification: validated.data.specification,
        costPrice: validated.data.costPrice,
        listPrice: validated.data.listPrice,
        sellingPrice: validated.data.sellingPrice,
        minPrice: validated.data.minPrice,
        safetyStock: validated.data.safetyStock,
        reorderPoint: validated.data.reorderPoint,
        reorderQty: validated.data.reorderQty,
        categoryId: validated.data.categoryId,
        unitId: validated.data.unitId,
        taxTypeId: validated.data.taxTypeId || null,
        isActive: validated.data.isActive,
        isSerialControl: validated.data.isSerialControl,
        isBatchControl: validated.data.isBatchControl,
        allowNegativeStock: validated.data.allowNegativeStock,
        imageUrl: validated.data.imageUrl || null,
      },
    })

    revalidatePath('/products')

    return {
      success: true,
      message: '商品建立成功',
      data: { id: product.id },
    }
  } catch (error) {
    console.error('Create product error:', error)
    return {
      success: false,
      message: '建立商品失敗',
    }
  }
}

/**
 * 更新商品
 */
export async function updateProduct(
  id: string,
  data: Parameters<typeof productSchema.parse>[0]
): Promise<ActionResult> {
  try {
    const validated = productSchema.safeParse(data)
    if (!validated.success) {
      return {
        success: false,
        message: '驗證失敗',
        errors: validated.error.flatten().fieldErrors as Record<string, string[]>,
      }
    }

    const existingProduct = await prisma.product.findUnique({
      where: { id },
    })

    if (!existingProduct) {
      return {
        success: false,
        message: '商品不存在',
      }
    }

    // 檢查 SKU 是否重複
    const skuExists = await prisma.product.findFirst({
      where: {
        sku: validated.data.sku,
        NOT: { id },
      },
    })

    if (skuExists) {
      return {
        success: false,
        message: '此商品編號已被使用',
      }
    }

    // 檢查條碼是否重複
    if (validated.data.barcode) {
      const barcodeExists = await prisma.product.findFirst({
        where: {
          barcode: validated.data.barcode,
          NOT: { id },
        },
      })

      if (barcodeExists) {
        return {
          success: false,
          message: '此條碼已被其他商品使用',
        }
      }
    }

    await prisma.product.update({
      where: { id },
      data: {
        sku: validated.data.sku,
        barcode: validated.data.barcode || null,
        name: validated.data.name,
        shortName: validated.data.shortName,
        description: validated.data.description,
        specification: validated.data.specification,
        costPrice: validated.data.costPrice,
        listPrice: validated.data.listPrice,
        sellingPrice: validated.data.sellingPrice,
        minPrice: validated.data.minPrice,
        safetyStock: validated.data.safetyStock,
        reorderPoint: validated.data.reorderPoint,
        reorderQty: validated.data.reorderQty,
        categoryId: validated.data.categoryId,
        unitId: validated.data.unitId,
        taxTypeId: validated.data.taxTypeId || null,
        isActive: validated.data.isActive,
        isSerialControl: validated.data.isSerialControl,
        isBatchControl: validated.data.isBatchControl,
        allowNegativeStock: validated.data.allowNegativeStock,
        imageUrl: validated.data.imageUrl || null,
      },
    })

    revalidatePath('/products')

    return {
      success: true,
      message: '商品更新成功',
    }
  } catch (error) {
    console.error('Update product error:', error)
    return {
      success: false,
      message: '更新商品失敗',
    }
  }
}

/**
 * 刪除商品
 */
export async function deleteProduct(id: string): Promise<ActionResult> {
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        inventories: true,
        orderItems: { take: 1 },
        purchaseOrderItems: { take: 1 },
      },
    })

    if (!product) {
      return {
        success: false,
        message: '商品不存在',
      }
    }

    // 有庫存記錄時不允許刪除
    const hasStock = product.inventories.some((inv) => inv.quantity > 0)
    if (hasStock) {
      return {
        success: false,
        message: '此商品仍有庫存，無法刪除',
      }
    }

    // 有訂單記錄時不允許刪除
    if (product.orderItems.length > 0) {
      return {
        success: false,
        message: '此商品有訂單記錄，無法刪除',
      }
    }

    // 有採購記錄時不允許刪除
    if (product.purchaseOrderItems.length > 0) {
      return {
        success: false,
        message: '此商品有採購記錄，無法刪除',
      }
    }

    await prisma.product.delete({
      where: { id },
    })

    revalidatePath('/products')

    return {
      success: true,
      message: '商品刪除成功',
    }
  } catch (error) {
    console.error('Delete product error:', error)
    return {
      success: false,
      message: '刪除商品失敗',
    }
  }
}
