'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import type { ActionResult } from '@/types'

/**
 * 取得訂單列表
 */
export async function getOrders(params?: {
  page?: number
  pageSize?: number
  search?: string
  status?: string
  paymentStatus?: string
  storeId?: string
  customerId?: string
  startDate?: string
  endDate?: string
}) {
  const page = params?.page || 1
  const pageSize = params?.pageSize || 10
  const skip = (page - 1) * pageSize

  const where = {
    ...(params?.search && {
      OR: [
        { orderNo: { contains: params.search, mode: 'insensitive' as const } },
        { customer: { name: { contains: params.search, mode: 'insensitive' as const } } },
        { customer: { phone: { contains: params.search, mode: 'insensitive' as const } } },
      ],
    }),
    ...(params?.status && { status: params.status }),
    ...(params?.paymentStatus && { paymentStatus: params.paymentStatus }),
    ...(params?.storeId && { storeId: params.storeId }),
    ...(params?.customerId && { customerId: params.customerId }),
    ...(params?.startDate || params?.endDate
      ? {
          orderDate: {
            ...(params?.startDate && { gte: new Date(params.startDate) }),
            ...(params?.endDate && { lte: new Date(params.endDate + 'T23:59:59') }),
          },
        }
      : {}),
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            code: true,
            name: true,
            phone: true,
          },
        },
        store: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: { items: true },
        },
      },
      orderBy: { orderDate: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.order.count({ where }),
  ])

  return {
    data: orders,
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
 * 取得單一訂單詳情
 */
export async function getOrder(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: {
      customer: true,
      store: true,
      user: {
        select: {
          id: true,
          name: true,
          username: true,
        },
      },
      items: {
        include: {
          product: {
            select: {
              id: true,
              sku: true,
              name: true,
              imageUrl: true,
            },
          },
        },
      },
      payments: {
        include: {
          paymentMethod: true,
        },
      },
      refunds: {
        include: {
          items: true,
        },
      },
      promotion: true,
      coupon: true,
    },
  })
}

/**
 * 產生訂單編號
 */
export async function generateOrderNo(): Promise<string> {
  const today = new Date()
  const datePrefix = today.toISOString().slice(0, 10).replace(/-/g, '')

  const lastOrder = await prisma.order.findFirst({
    where: {
      orderNo: {
        startsWith: `ORD${datePrefix}`,
      },
    },
    orderBy: { orderNo: 'desc' },
    select: { orderNo: true },
  })

  if (!lastOrder) {
    return `ORD${datePrefix}0001`
  }

  const lastNumber = parseInt(lastOrder.orderNo.slice(-4), 10) || 0
  const nextNumber = lastNumber + 1
  return `ORD${datePrefix}${nextNumber.toString().padStart(4, '0')}`
}

/**
 * 建立訂單
 */
export async function createOrder(data: {
  customerId?: string
  storeId?: string
  userId: string
  items: {
    productId: string
    quantity: number
    unitPrice: number
    discount?: number
  }[]
  usedPoints?: number
  promotionId?: string
  couponId?: string
  notes?: string
}): Promise<ActionResult<{ id: string; orderNo: string }>> {
  try {
    const orderNo = await generateOrderNo()

    // 計算金額
    let subtotal = 0
    const orderItems = []

    for (const item of data.items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        select: { id: true, sku: true, name: true, sellingPrice: true },
      })

      if (!product) {
        return {
          success: false,
          message: `商品不存在: ${item.productId}`,
        }
      }

      const itemSubtotal = item.unitPrice * item.quantity - (item.discount || 0)
      subtotal += itemSubtotal

      orderItems.push({
        productId: product.id,
        productName: product.name,
        productSku: product.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount || 0,
        subtotal: itemSubtotal,
      })
    }

    // 計算點數折抵
    const pointsDiscount = (data.usedPoints || 0) * 0.1 // 假設 10 點 = 1 元
    const totalAmount = Math.max(0, subtotal - pointsDiscount)

    // 計算獲得點數（消費 100 元得 1 點）
    const earnedPoints = Math.floor(totalAmount / 100)

    // 建立訂單
    const order = await prisma.order.create({
      data: {
        orderNo,
        customerId: data.customerId || null,
        storeId: data.storeId || null,
        userId: data.userId,
        subtotal,
        discountAmount: pointsDiscount,
        totalAmount,
        usedPoints: data.usedPoints || 0,
        pointsDiscount,
        earnedPoints,
        status: 'PENDING',
        paymentStatus: 'UNPAID',
        promotionId: data.promotionId || null,
        couponId: data.couponId || null,
        notes: data.notes || null,
        items: {
          create: orderItems,
        },
      },
    })

    revalidatePath('/orders')

    return {
      success: true,
      message: '訂單建立成功',
      data: { id: order.id, orderNo: order.orderNo },
    }
  } catch (error) {
    console.error('Create order error:', error)
    return {
      success: false,
      message: '建立訂單失敗',
    }
  }
}

/**
 * 更新訂單狀態
 */
export async function updateOrderStatus(id: string, status: string): Promise<ActionResult> {
  try {
    const order = await prisma.order.findUnique({
      where: { id },
    })

    if (!order) {
      return {
        success: false,
        message: '訂單不存在',
      }
    }

    await prisma.order.update({
      where: { id },
      data: { status },
    })

    revalidatePath('/orders')

    return {
      success: true,
      message: '訂單狀態更新成功',
    }
  } catch (error) {
    console.error('Update order status error:', error)
    return {
      success: false,
      message: '更新訂單狀態失敗',
    }
  }
}

/**
 * 完成付款
 */
export async function completePayment(data: {
  orderId: string
  paymentMethodId: string
  amount: number
  referenceNo?: string
}): Promise<ActionResult> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: data.orderId },
      include: { customer: true },
    })

    if (!order) {
      return {
        success: false,
        message: '訂單不存在',
      }
    }

    const newPaidAmount = Number(order.paidAmount) + data.amount
    const isFullyPaid = newPaidAmount >= Number(order.totalAmount)

    // 建立付款紀錄並更新訂單
    await prisma.$transaction([
      prisma.payment.create({
        data: {
          orderId: data.orderId,
          paymentMethodId: data.paymentMethodId,
          amount: data.amount,
          status: 'COMPLETED',
          referenceNo: data.referenceNo || null,
        },
      }),
      prisma.order.update({
        where: { id: data.orderId },
        data: {
          paidAmount: newPaidAmount,
          paymentStatus: isFullyPaid ? 'PAID' : 'PARTIAL',
          status: isFullyPaid ? 'COMPLETED' : order.status,
        },
      }),
      // 如果有會員且完成付款，更新會員點數
      ...(order.customerId && isFullyPaid
        ? [
            prisma.customer.update({
              where: { id: order.customerId },
              data: {
                totalSpent: { increment: Number(order.totalAmount) },
                orderCount: { increment: 1 },
                totalPoints: { increment: order.earnedPoints },
                availablePoints: {
                  increment: order.earnedPoints - order.usedPoints,
                },
              },
            }),
            prisma.pointsLog.create({
              data: {
                customerId: order.customerId,
                type: 'EARN',
                points: order.earnedPoints,
                balance:
                  (order.customer?.availablePoints || 0) + order.earnedPoints - order.usedPoints,
                orderId: order.id,
                description: `訂單 ${order.orderNo} 消費獲得點數`,
              },
            }),
          ]
        : []),
    ])

    revalidatePath('/orders')

    return {
      success: true,
      message: '付款完成',
    }
  } catch (error) {
    console.error('Complete payment error:', error)
    return {
      success: false,
      message: '付款處理失敗',
    }
  }
}

/**
 * 取消訂單
 */
export async function cancelOrder(id: string, reason?: string): Promise<ActionResult> {
  try {
    const order = await prisma.order.findUnique({
      where: { id },
    })

    if (!order) {
      return {
        success: false,
        message: '訂單不存在',
      }
    }

    if (order.status === 'COMPLETED') {
      return {
        success: false,
        message: '已完成的訂單無法取消',
      }
    }

    if (order.status === 'CANCELLED') {
      return {
        success: false,
        message: '訂單已取消',
      }
    }

    await prisma.order.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        internalNotes: reason ? `取消原因: ${reason}` : null,
      },
    })

    revalidatePath('/orders')

    return {
      success: true,
      message: '訂單已取消',
    }
  } catch (error) {
    console.error('Cancel order error:', error)
    return {
      success: false,
      message: '取消訂單失敗',
    }
  }
}

/**
 * 取得訂單統計
 */
export async function getOrderStats(params?: {
  startDate?: string
  endDate?: string
  storeId?: string
}) {
  const where = {
    ...(params?.storeId && { storeId: params.storeId }),
    ...(params?.startDate || params?.endDate
      ? {
          orderDate: {
            ...(params?.startDate && { gte: new Date(params.startDate) }),
            ...(params?.endDate && { lte: new Date(params.endDate + 'T23:59:59') }),
          },
        }
      : {}),
  }

  const [totalOrders, completedOrders, pendingOrders, cancelledOrders, totalRevenue] =
    await Promise.all([
      prisma.order.count({ where }),
      prisma.order.count({ where: { ...where, status: 'COMPLETED' } }),
      prisma.order.count({ where: { ...where, status: 'PENDING' } }),
      prisma.order.count({ where: { ...where, status: 'CANCELLED' } }),
      prisma.order.aggregate({
        where: { ...where, status: 'COMPLETED' },
        _sum: { totalAmount: true },
      }),
    ])

  return {
    totalOrders,
    completedOrders,
    pendingOrders,
    cancelledOrders,
    totalRevenue: totalRevenue._sum.totalAmount || 0,
  }
}

/**
 * 建立退貨單
 */
export async function createRefund(data: {
  orderId: string
  reason: string
  items: {
    productId: string
    productName: string
    quantity: number
    unitPrice: number
  }[]
  notes?: string
}): Promise<ActionResult> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: data.orderId },
    })

    if (!order) {
      return {
        success: false,
        message: '訂單不存在',
      }
    }

    // 產生退貨單號
    const refundNo = `RFD${Date.now()}`

    // 計算退貨金額
    const subtotal = data.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)

    const refund = await prisma.refund.create({
      data: {
        refundNo,
        orderId: data.orderId,
        reason: data.reason,
        status: 'PENDING',
        subtotal,
        refundAmount: subtotal,
        notes: data.notes || null,
        items: {
          create: data.items.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.unitPrice * item.quantity,
          })),
        },
      },
    })

    revalidatePath('/orders')

    return {
      success: true,
      message: '退貨單建立成功',
      data: { id: refund.id, refundNo: refund.refundNo },
    }
  } catch (error) {
    console.error('Create refund error:', error)
    return {
      success: false,
      message: '建立退貨單失敗',
    }
  }
}
