'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import type { ActionResult } from '@/types'

interface CreateRefundData {
  orderId: string
  reason: string
  type?: 'REFUND' | 'EXCHANGE'
  items: Array<{
    productId: string
    productName: string
    quantity: number
    unitPrice: number
    reason?: string
  }>
  notes?: string
  createdById?: string
}

interface GetRefundsParams {
  orderId?: string
  status?: string
  type?: 'REFUND' | 'EXCHANGE'
  search?: string
  page?: number
  pageSize?: number
}

interface ApproveRefundData {
  status: 'APPROVED' | 'REJECTED'
  approvedBy: string
  notes?: string
}

/**
 * 生成退貨單號
 */
async function generateRefundNo(): Promise<string> {
  const today = new Date()
  const dateStr = today.toISOString().split('T')[0].replace(/-/g, '')

  const lastRefund = await prisma.refund.findFirst({
    where: {
      refundNo: {
        startsWith: `RF-${dateStr}-`,
      },
    },
    orderBy: {
      refundNo: 'desc',
    },
  })

  let sequence = 1
  if (lastRefund) {
    const lastSequence = parseInt(lastRefund.refundNo.split('-')[2])
    sequence = lastSequence + 1
  }

  return `RF-${dateStr}-${sequence.toString().padStart(4, '0')}`
}

/**
 * 建立退貨單
 */
export async function createRefund(data: CreateRefundData): Promise<ActionResult> {
  try {
    if (!data.items || data.items.length === 0) {
      return {
        success: false,
        message: '退貨單必須包含至少一個商品',
      }
    }

    // 檢查訂單是否存在
    const order = await prisma.order.findUnique({
      where: { id: data.orderId },
      include: {
        items: true,
      },
    })

    if (!order) {
      return {
        success: false,
        message: '訂單不存在',
      }
    }

    const refundNo = await generateRefundNo()

    // 計算退貨金額
    const subtotal = data.items.reduce(
      (sum, item) => sum + item.quantity * Number(item.unitPrice),
      0
    )

    const refund = await prisma.refund.create({
      data: {
        refundNo,
        orderId: data.orderId,
        reason: data.reason,
        type: data.type || 'REFUND',
        status: 'PENDING',
        subtotal,
        refundAmount: subtotal,
        notes: data.notes,
        createdById: data.createdById,
        items: {
          create: data.items.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.quantity * Number(item.unitPrice),
            reason: item.reason,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        order: {
          include: {
            customer: true,
          },
        },
      },
    })

    revalidatePath('/orders/refunds')
    revalidatePath(`/orders/${data.orderId}`)

    return {
      success: true,
      message: '退貨單建立成功',
      data: refund,
    }
  } catch (error) {
    console.error('Error creating refund:', error)
    return {
      success: false,
      message: '建立退貨單失敗',
    }
  }
}

/**
 * 取得退貨單列表（含分頁）
 */
export async function getRefunds(params: GetRefundsParams = {}): Promise<ActionResult> {
  try {
    const { orderId, status, type, search, page = 1, pageSize = 20 } = params

    const where: Record<string, unknown> = {}

    if (orderId) where.orderId = orderId
    if (status) where.status = status
    if (type) where.type = type

    if (search) {
      where.OR = [
        { refundNo: { contains: search } },
        { reason: { contains: search } },
        { order: { orderNo: { contains: search } } },
      ]
    }

    const [refunds, total] = await Promise.all([
      prisma.refund.findMany({
        where,
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                },
              },
            },
          },
          order: {
            select: {
              id: true,
              orderNo: true,
              orderDate: true,
              customer: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.refund.count({ where }),
    ])

    return {
      success: true,
      data: {
        refunds,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    }
  } catch (error) {
    console.error('Error getting refunds:', error)
    return {
      success: false,
      message: '取得退貨單列表失敗',
    }
  }
}

/**
 * 取得單一退貨單
 */
export async function getRefund(id: string): Promise<ActionResult> {
  try {
    const refund = await prisma.refund.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                imageUrl: true,
              },
            },
          },
        },
        order: {
          include: {
            items: {
              include: {
                product: true,
              },
            },
            customer: true,
            store: true,
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
      },
    })

    if (!refund) {
      return {
        success: false,
        message: '退貨單不存在',
      }
    }

    return {
      success: true,
      data: refund,
    }
  } catch (error) {
    console.error('Error getting refund:', error)
    return {
      success: false,
      message: '取得退貨單失敗',
    }
  }
}

/**
 * 核准/駁回退貨單
 */
export async function approveRefund(id: string, data: ApproveRefundData): Promise<ActionResult> {
  try {
    const refund = await prisma.refund.findUnique({
      where: { id },
    })

    if (!refund) {
      return {
        success: false,
        message: '退貨單不存在',
      }
    }

    if (refund.status !== 'PENDING') {
      return {
        success: false,
        message: `無法處理此退貨單，目前狀態：${refund.status}`,
      }
    }

    const updatedRefund = await prisma.refund.update({
      where: { id },
      data: {
        approvalStatus: data.status,
        status: data.status,
        approvedBy: data.approvedBy,
        approvedAt: new Date(),
        notes: data.notes ? `${refund.notes || ''}\n${data.notes}`.trim() : refund.notes,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        order: true,
      },
    })

    revalidatePath('/orders/refunds')
    revalidatePath(`/orders/refunds/${id}`)

    return {
      success: true,
      message: data.status === 'APPROVED' ? '退貨單已核准' : '退貨單已駁回',
      data: updatedRefund,
    }
  } catch (error) {
    console.error('Error approving refund:', error)
    return {
      success: false,
      message: '處理退貨單失敗',
    }
  }
}

/**
 * 刪除退貨單
 */
export async function deleteRefund(id: string): Promise<ActionResult> {
  try {
    const refund = await prisma.refund.findUnique({
      where: { id },
    })

    if (!refund) {
      return {
        success: false,
        message: '退貨單不存在',
      }
    }

    if (refund.status !== 'PENDING') {
      return {
        success: false,
        message: '只能刪除待處理的退貨單',
      }
    }

    await prisma.refund.delete({
      where: { id },
    })

    revalidatePath('/orders/refunds')

    return {
      success: true,
      message: '退貨單已刪除',
    }
  } catch (error) {
    console.error('Error deleting refund:', error)
    return {
      success: false,
      message: '刪除退貨單失敗',
    }
  }
}
