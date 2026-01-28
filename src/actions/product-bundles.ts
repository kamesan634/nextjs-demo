'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import {
  createProductBundleSchema,
  updateProductBundleSchema,
} from '@/lib/validations/product-bundles'
import type { ActionResult } from '@/types'

// Prisma 交易客戶端類型
type TransactionClient = Omit<
  typeof prisma,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>

/**
 * 取得所有商品組合
 */
export async function getProductBundles(params?: {
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

  const [bundles, total] = await Promise.all([
    prisma.productBundle.findMany({
      where,
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, sku: true, sellingPrice: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.productBundle.count({ where }),
  ])

  return {
    data: bundles,
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
 * 取得單一商品組合
 */
export async function getProductBundle(id: string) {
  return prisma.productBundle.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: {
            select: { id: true, name: true, sku: true, sellingPrice: true, imageUrl: true },
          },
        },
      },
    },
  })
}

/**
 * 建立商品組合
 */
export async function createProductBundle(
  data: Parameters<typeof createProductBundleSchema.parse>[0]
): Promise<ActionResult> {
  try {
    const validated = createProductBundleSchema.safeParse(data)
    if (!validated.success) {
      return {
        success: false,
        message: '驗證失敗',
        errors: validated.error.flatten().fieldErrors as Record<string, string[]>,
      }
    }

    const existing = await prisma.productBundle.findUnique({
      where: { code: validated.data.code },
    })

    if (existing) {
      return { success: false, message: '此組合代碼已存在' }
    }

    const bundle = await prisma.productBundle.create({
      data: {
        code: validated.data.code,
        name: validated.data.name,
        description: validated.data.description,
        bundlePrice: validated.data.bundlePrice,
        isActive: validated.data.isActive,
        startDate: validated.data.startDate ? new Date(validated.data.startDate) : null,
        endDate: validated.data.endDate ? new Date(validated.data.endDate) : null,
        items: {
          create: validated.data.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        },
      },
    })

    revalidatePath('/products/bundles')

    return {
      success: true,
      message: '商品組合建立成功',
      data: { id: bundle.id },
    }
  } catch (error) {
    console.error('Create product bundle error:', error)
    return { success: false, message: '建立商品組合失敗' }
  }
}

/**
 * 更新商品組合
 */
export async function updateProductBundle(
  id: string,
  data: Parameters<typeof updateProductBundleSchema.parse>[0]
): Promise<ActionResult> {
  try {
    const validated = updateProductBundleSchema.safeParse(data)
    if (!validated.success) {
      return {
        success: false,
        message: '驗證失敗',
        errors: validated.error.flatten().fieldErrors as Record<string, string[]>,
      }
    }

    const existing = await prisma.productBundle.findUnique({ where: { id } })
    if (!existing) {
      return { success: false, message: '商品組合不存在' }
    }

    await prisma.$transaction(async (tx: TransactionClient) => {
      // 刪除原有項目
      await tx.productBundleItem.deleteMany({ where: { bundleId: id } })

      // 更新組合並重建項目
      await tx.productBundle.update({
        where: { id },
        data: {
          name: validated.data.name,
          description: validated.data.description,
          bundlePrice: validated.data.bundlePrice,
          isActive: validated.data.isActive,
          startDate: validated.data.startDate ? new Date(validated.data.startDate) : null,
          endDate: validated.data.endDate ? new Date(validated.data.endDate) : null,
          items: {
            create: validated.data.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
            })),
          },
        },
      })
    })

    revalidatePath('/products/bundles')

    return { success: true, message: '商品組合更新成功' }
  } catch (error) {
    console.error('Update product bundle error:', error)
    return { success: false, message: '更新商品組合失敗' }
  }
}

/**
 * 刪除商品組合
 */
export async function deleteProductBundle(id: string): Promise<ActionResult> {
  try {
    const bundle = await prisma.productBundle.findUnique({ where: { id } })
    if (!bundle) {
      return { success: false, message: '商品組合不存在' }
    }

    await prisma.productBundle.delete({ where: { id } })

    revalidatePath('/products/bundles')

    return { success: true, message: '商品組合刪除成功' }
  } catch (error) {
    console.error('Delete product bundle error:', error)
    return { success: false, message: '刪除商品組合失敗' }
  }
}
