'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { createGoodsIssueSchema } from '@/lib/validations/goods-issues'
import type { ActionResult } from '@/types'

/**
 * 取得出庫單列表
 */
export async function getGoodsIssues(params?: {
  page?: number
  pageSize?: number
  search?: string
  status?: string
  warehouseId?: string
}) {
  const page = params?.page || 1
  const pageSize = params?.pageSize || 10
  const skip = (page - 1) * pageSize

  const where = {
    ...(params?.search && {
      OR: [{ issueNo: { contains: params.search, mode: 'insensitive' as const } }],
    }),
    ...(params?.status && { status: params.status }),
    ...(params?.warehouseId && { warehouseId: params.warehouseId }),
  }

  const [issues, total] = await Promise.all([
    prisma.goodsIssue.findMany({
      where,
      include: {
        warehouse: { select: { id: true, code: true, name: true } },
        items: {
          include: {
            product: { select: { id: true, sku: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.goodsIssue.count({ where }),
  ])

  return {
    data: issues,
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
 * 取得單一出庫單
 */
export async function getGoodsIssue(id: string) {
  return prisma.goodsIssue.findUnique({
    where: { id },
    include: {
      warehouse: true,
      items: {
        include: {
          product: { select: { id: true, sku: true, name: true } },
        },
      },
    },
  })
}

/**
 * 建立出庫單
 */
export async function createGoodsIssue(
  data: Parameters<typeof createGoodsIssueSchema.parse>[0]
): Promise<ActionResult> {
  try {
    const validated = createGoodsIssueSchema.safeParse(data)
    if (!validated.success) {
      return {
        success: false,
        message: '驗證失敗',
        errors: validated.error.flatten().fieldErrors as Record<string, string[]>,
      }
    }

    // 產生出庫單號
    const today = new Date()
    const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`
    const count = await prisma.goodsIssue.count({
      where: {
        issueNo: { startsWith: `GI-${dateStr}` },
      },
    })
    const issueNo = `GI-${dateStr}-${String(count + 1).padStart(4, '0')}`

    const issue = await prisma.goodsIssue.create({
      data: {
        issueNo,
        warehouseId: validated.data.warehouseId,
        type: validated.data.type,
        referenceType: validated.data.referenceType,
        referenceId: validated.data.referenceId,
        issueDate: validated.data.issueDate ? new Date(validated.data.issueDate) : new Date(),
        notes: validated.data.notes,
        status: 'PENDING',
        items: {
          create: validated.data.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            notes: item.notes,
          })),
        },
      },
    })

    revalidatePath('/inventory/issues')

    return {
      success: true,
      message: '出庫單建立成功',
      data: { id: issue.id },
    }
  } catch (error) {
    console.error('Create goods issue error:', error)
    return { success: false, message: '建立出庫單失敗' }
  }
}

/**
 * 完成出庫單 (扣減庫存)
 */
export async function completeGoodsIssue(id: string): Promise<ActionResult> {
  try {
    const issue = await prisma.goodsIssue.findUnique({
      where: { id },
      include: { items: true },
    })

    if (!issue) {
      return { success: false, message: '出庫單不存在' }
    }

    if (issue.status !== 'PENDING') {
      return { success: false, message: '出庫單狀態不正確' }
    }

    await prisma.$transaction(async (tx) => {
      // 扣減庫存
      for (const item of issue.items) {
        const inventory = await tx.inventory.findFirst({
          where: { productId: item.productId, warehouseId: issue.warehouseId },
        })

        if (inventory) {
          const newQty = inventory.quantity - item.quantity
          await tx.inventory.update({
            where: { id: inventory.id },
            data: {
              quantity: newQty,
              availableQty: newQty - inventory.reservedQty,
            },
          })
        }

        // 記錄庫存異動
        await tx.inventoryMovement.create({
          data: {
            productId: item.productId,
            movementType: 'OUT',
            quantity: -item.quantity,
            beforeQty: inventory?.quantity || 0,
            afterQty: (inventory?.quantity || 0) - item.quantity,
            referenceType: 'GOODS_ISSUE',
            referenceId: issue.id,
            warehouseId: issue.warehouseId,
            reason: `出庫單 ${issue.issueNo}`,
          },
        })
      }

      // 更新出庫單狀態
      await tx.goodsIssue.update({
        where: { id },
        data: { status: 'COMPLETED', completedAt: new Date() },
      })
    })

    revalidatePath('/inventory/issues')

    return { success: true, message: '出庫單已完成' }
  } catch (error) {
    console.error('Complete goods issue error:', error)
    return { success: false, message: '完成出庫單失敗' }
  }
}

/**
 * 取消出庫單
 */
export async function cancelGoodsIssue(id: string): Promise<ActionResult> {
  try {
    const issue = await prisma.goodsIssue.findUnique({ where: { id } })

    if (!issue) {
      return { success: false, message: '出庫單不存在' }
    }

    if (issue.status !== 'PENDING') {
      return { success: false, message: '只能取消待處理的出庫單' }
    }

    await prisma.goodsIssue.update({
      where: { id },
      data: { status: 'CANCELLED' },
    })

    revalidatePath('/inventory/issues')

    return { success: true, message: '出庫單已取消' }
  } catch (error) {
    console.error('Cancel goods issue error:', error)
    return { success: false, message: '取消出庫單失敗' }
  }
}
