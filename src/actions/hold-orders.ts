'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import type { ActionResult } from '@/types'

interface HoldOrderItem {
  productId: string
  productName: string
  sku: string
  quantity: number
  unitPrice: number
}

interface CreateHoldOrderData {
  storeId: string
  userId: string
  customerId?: string
  items: HoldOrderItem[]
  reason?: string
}

interface GetHoldOrdersParams {
  storeId?: string
  userId?: string
  status?: 'HOLD' | 'RESUMED' | 'VOIDED' | 'EXPIRED'
  page?: number
  pageSize?: number
}

/**
 * 生成掛單編號
 */
async function generateHoldNo(): Promise<string> {
  const today = new Date()
  const dateStr = today.toISOString().split('T')[0].replace(/-/g, '')

  const lastHoldOrder = await prisma.holdOrder.findFirst({
    where: {
      holdNo: {
        startsWith: `HOLD-${dateStr}-`,
      },
    },
    orderBy: {
      holdNo: 'desc',
    },
  })

  let sequence = 1
  if (lastHoldOrder) {
    const lastSequence = parseInt(lastHoldOrder.holdNo.split('-')[2])
    sequence = lastSequence + 1
  }

  return `HOLD-${dateStr}-${sequence.toString().padStart(4, '0')}`
}

/**
 * 建立掛單
 */
export async function createHoldOrder(data: CreateHoldOrderData): Promise<ActionResult> {
  try {
    if (!data.items || data.items.length === 0) {
      return {
        success: false,
        message: '掛單必須包含至少一個商品',
      }
    }

    const holdNo = await generateHoldNo()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 小時後過期

    const subtotal = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)

    const holdOrder = await prisma.holdOrder.create({
      data: {
        holdNo,
        storeId: data.storeId,
        userId: data.userId,
        customerId: data.customerId,
        items: data.items as unknown as Prisma.InputJsonValue,
        subtotal,
        discount: 0,
        totalAmount: subtotal,
        status: 'HOLD',
        expiresAt,
        reason: data.reason,
      },
      include: {
        customer: true,
        user: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
        store: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    revalidatePath('/pos')
    revalidatePath('/pos/hold-orders')

    return {
      success: true,
      message: '掛單建立成功',
      data: holdOrder,
    }
  } catch (error) {
    console.error('Error creating hold order:', error)
    return {
      success: false,
      message: '建立掛單失敗',
    }
  }
}

/**
 * 取得掛單列表（含分頁）
 */
export async function getHoldOrders(params: GetHoldOrdersParams = {}): Promise<ActionResult> {
  try {
    const { storeId, userId, status, page = 1, pageSize = 20 } = params

    const where: Prisma.HoldOrderWhereInput = {}

    if (storeId) where.storeId = storeId
    if (userId) where.userId = userId
    if (status) where.status = status

    const [holdOrders, total] = await Promise.all([
      prisma.holdOrder.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
            },
          },
          user: {
            select: {
              id: true,
              username: true,
              name: true,
            },
          },
          store: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.holdOrder.count({ where }),
    ])

    return {
      success: true,
      data: {
        holdOrders,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    }
  } catch (error) {
    console.error('Error getting hold orders:', error)
    return {
      success: false,
      message: '取得掛單列表失敗',
    }
  }
}

/**
 * 恢復掛單
 */
export async function resumeHoldOrder(id: string): Promise<ActionResult> {
  try {
    const holdOrder = await prisma.holdOrder.findUnique({
      where: { id },
      include: {
        customer: true,
      },
    })

    if (!holdOrder) {
      return {
        success: false,
        message: '掛單不存在',
      }
    }

    if (holdOrder.status !== 'HOLD') {
      return {
        success: false,
        message: `無法恢復此掛單，目前狀態：${holdOrder.status}`,
      }
    }

    // 檢查是否已過期
    if (holdOrder.expiresAt && new Date() > holdOrder.expiresAt) {
      await prisma.holdOrder.update({
        where: { id },
        data: { status: 'EXPIRED' },
      })

      return {
        success: false,
        message: '掛單已過期',
      }
    }

    const updatedHoldOrder = await prisma.holdOrder.update({
      where: { id },
      data: {
        status: 'RESUMED',
        resumedAt: new Date(),
      },
      include: {
        customer: true,
      },
    })

    revalidatePath('/pos')
    revalidatePath('/pos/hold-orders')

    return {
      success: true,
      message: '掛單已恢復',
      data: {
        ...updatedHoldOrder,
        items: updatedHoldOrder.items as unknown as HoldOrderItem[],
      },
    }
  } catch (error) {
    console.error('Error resuming hold order:', error)
    return {
      success: false,
      message: '恢復掛單失敗',
    }
  }
}

/**
 * 作廢掛單
 */
export async function voidHoldOrder(id: string): Promise<ActionResult> {
  try {
    const holdOrder = await prisma.holdOrder.findUnique({
      where: { id },
    })

    if (!holdOrder) {
      return {
        success: false,
        message: '掛單不存在',
      }
    }

    if (holdOrder.status !== 'HOLD') {
      return {
        success: false,
        message: `無法作廢此掛單，目前狀態：${holdOrder.status}`,
      }
    }

    await prisma.holdOrder.update({
      where: { id },
      data: {
        status: 'VOIDED',
      },
    })

    revalidatePath('/pos')
    revalidatePath('/pos/hold-orders')

    return {
      success: true,
      message: '掛單已作廢',
    }
  } catch (error) {
    console.error('Error voiding hold order:', error)
    return {
      success: false,
      message: '作廢掛單失敗',
    }
  }
}

/**
 * 取得單一掛單
 */
export async function getHoldOrder(id: string): Promise<ActionResult> {
  try {
    const holdOrder = await prisma.holdOrder.findUnique({
      where: { id },
      include: {
        customer: true,
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            name: true,
          },
        },
        store: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!holdOrder) {
      return {
        success: false,
        message: '掛單不存在',
      }
    }

    return {
      success: true,
      data: {
        ...holdOrder,
        items: holdOrder.items as unknown as HoldOrderItem[],
      },
    }
  } catch (error) {
    console.error('Error getting hold order:', error)
    return {
      success: false,
      message: '取得掛單失敗',
    }
  }
}
