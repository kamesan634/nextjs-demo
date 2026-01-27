'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import type { ActionResult } from '@/types'

/**
 * 取得採購單列表
 */
export async function getPurchaseOrders(params?: {
  page?: number
  pageSize?: number
  search?: string
  status?: string
  supplierId?: string
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
        { supplier: { name: { contains: params.search, mode: 'insensitive' as const } } },
      ],
    }),
    ...(params?.status && { status: params.status }),
    ...(params?.supplierId && { supplierId: params.supplierId }),
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
    prisma.purchaseOrder.findMany({
      where,
      include: {
        supplier: {
          select: {
            id: true,
            code: true,
            name: true,
            shortName: true,
          },
        },
        _count: {
          select: { items: true, receipts: true },
        },
      },
      orderBy: { orderDate: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.purchaseOrder.count({ where }),
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
 * 取得單一採購單詳情
 */
export async function getPurchaseOrder(id: string) {
  return prisma.purchaseOrder.findUnique({
    where: { id },
    include: {
      supplier: true,
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
      receipts: {
        include: {
          warehouse: true,
          items: true,
        },
      },
    },
  })
}

/**
 * 產生採購單號
 */
export async function generatePurchaseOrderNo(): Promise<string> {
  const today = new Date()
  const datePrefix = today.toISOString().slice(0, 10).replace(/-/g, '')

  const lastOrder = await prisma.purchaseOrder.findFirst({
    where: {
      orderNo: {
        startsWith: `PO${datePrefix}`,
      },
    },
    orderBy: { orderNo: 'desc' },
    select: { orderNo: true },
  })

  if (!lastOrder) {
    return `PO${datePrefix}0001`
  }

  const lastNumber = parseInt(lastOrder.orderNo.slice(-4), 10) || 0
  const nextNumber = lastNumber + 1
  return `PO${datePrefix}${nextNumber.toString().padStart(4, '0')}`
}

/**
 * 建立採購單
 */
export async function createPurchaseOrder(data: {
  supplierId: string
  expectedDate?: string
  items: {
    productId: string
    quantity: number
    unitPrice: number
  }[]
  notes?: string
}): Promise<ActionResult<{ id: string; orderNo: string }>> {
  try {
    const orderNo = await generatePurchaseOrderNo()

    // 計算金額
    let subtotal = 0
    const orderItems = []

    for (const item of data.items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        select: { id: true, sku: true, name: true },
      })

      if (!product) {
        return {
          success: false,
          message: `商品不存在: ${item.productId}`,
        }
      }

      const itemSubtotal = item.unitPrice * item.quantity
      subtotal += itemSubtotal

      orderItems.push({
        productId: product.id,
        productName: product.name,
        productSku: product.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: itemSubtotal,
      })
    }

    // 計算稅額（假設 5%）
    const taxAmount = subtotal * 0.05
    const totalAmount = subtotal + taxAmount

    const order = await prisma.purchaseOrder.create({
      data: {
        orderNo,
        supplierId: data.supplierId,
        status: 'DRAFT',
        subtotal,
        taxAmount,
        totalAmount,
        expectedDate: data.expectedDate ? new Date(data.expectedDate) : null,
        notes: data.notes || null,
        items: {
          create: orderItems,
        },
      },
    })

    revalidatePath('/purchase-orders')

    return {
      success: true,
      message: '採購單建立成功',
      data: { id: order.id, orderNo: order.orderNo },
    }
  } catch (error) {
    console.error('Create purchase order error:', error)
    return {
      success: false,
      message: '建立採購單失敗',
    }
  }
}

/**
 * 更新採購單
 */
export async function updatePurchaseOrder(
  id: string,
  data: {
    supplierId?: string
    expectedDate?: string
    items?: {
      productId: string
      quantity: number
      unitPrice: number
    }[]
    notes?: string
  }
): Promise<ActionResult> {
  try {
    const order = await prisma.purchaseOrder.findUnique({
      where: { id },
    })

    if (!order) {
      return {
        success: false,
        message: '採購單不存在',
      }
    }

    if (order.status !== 'DRAFT') {
      return {
        success: false,
        message: '只能編輯草稿狀態的採購單',
      }
    }

    // 如果有更新明細
    if (data.items) {
      // 刪除舊明細
      await prisma.purchaseOrderItem.deleteMany({
        where: { orderId: id },
      })

      // 計算新金額
      let subtotal = 0
      const orderItems = []

      for (const item of data.items) {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { id: true, sku: true, name: true },
        })

        if (!product) {
          return {
            success: false,
            message: `商品不存在: ${item.productId}`,
          }
        }

        const itemSubtotal = item.unitPrice * item.quantity
        subtotal += itemSubtotal

        orderItems.push({
          orderId: id,
          productId: product.id,
          productName: product.name,
          productSku: product.sku,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: itemSubtotal,
        })
      }

      const taxAmount = subtotal * 0.05
      const totalAmount = subtotal + taxAmount

      await prisma.$transaction([
        prisma.purchaseOrder.update({
          where: { id },
          data: {
            supplierId: data.supplierId,
            expectedDate: data.expectedDate ? new Date(data.expectedDate) : null,
            notes: data.notes,
            subtotal,
            taxAmount,
            totalAmount,
          },
        }),
        prisma.purchaseOrderItem.createMany({
          data: orderItems,
        }),
      ])
    } else {
      await prisma.purchaseOrder.update({
        where: { id },
        data: {
          supplierId: data.supplierId,
          expectedDate: data.expectedDate ? new Date(data.expectedDate) : null,
          notes: data.notes,
        },
      })
    }

    revalidatePath('/purchase-orders')

    return {
      success: true,
      message: '採購單更新成功',
    }
  } catch (error) {
    console.error('Update purchase order error:', error)
    return {
      success: false,
      message: '更新採購單失敗',
    }
  }
}

/**
 * 更新採購單狀態
 */
export async function updatePurchaseOrderStatus(id: string, status: string): Promise<ActionResult> {
  try {
    const order = await prisma.purchaseOrder.findUnique({
      where: { id },
    })

    if (!order) {
      return {
        success: false,
        message: '採購單不存在',
      }
    }

    const updateData: Record<string, unknown> = { status }

    if (status === 'APPROVED') {
      updateData.approvedAt = new Date()
    }

    await prisma.purchaseOrder.update({
      where: { id },
      data: updateData,
    })

    revalidatePath('/purchase-orders')

    return {
      success: true,
      message: '採購單狀態更新成功',
    }
  } catch (error) {
    console.error('Update purchase order status error:', error)
    return {
      success: false,
      message: '更新採購單狀態失敗',
    }
  }
}

/**
 * 刪除採購單
 */
export async function deletePurchaseOrder(id: string): Promise<ActionResult> {
  try {
    const order = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        _count: {
          select: { receipts: true },
        },
      },
    })

    if (!order) {
      return {
        success: false,
        message: '採購單不存在',
      }
    }

    if (order.status !== 'DRAFT' && order.status !== 'CANCELLED') {
      return {
        success: false,
        message: '只能刪除草稿或已取消的採購單',
      }
    }

    if (order._count.receipts > 0) {
      return {
        success: false,
        message: '此採購單已有驗收紀錄，無法刪除',
      }
    }

    await prisma.$transaction([
      prisma.purchaseOrderItem.deleteMany({
        where: { orderId: id },
      }),
      prisma.purchaseOrder.delete({
        where: { id },
      }),
    ])

    revalidatePath('/purchase-orders')

    return {
      success: true,
      message: '採購單刪除成功',
    }
  } catch (error) {
    console.error('Delete purchase order error:', error)
    return {
      success: false,
      message: '刪除採購單失敗',
    }
  }
}

/**
 * 建立採購驗收單
 */
export async function createPurchaseReceipt(data: {
  purchaseOrderId: string
  warehouseId: string
  items: {
    productId: string
    expectedQty: number
    receivedQty: number
    acceptedQty: number
    rejectedQty?: number
  }[]
  notes?: string
}): Promise<ActionResult<{ id: string; receiptNo: string }>> {
  try {
    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id: data.purchaseOrderId },
      include: { items: true },
    })

    if (!purchaseOrder) {
      return {
        success: false,
        message: '採購單不存在',
      }
    }

    // 產生驗收單號
    const receiptNo = `PR${Date.now()}`

    // 建立驗收單
    const receipt = await prisma.purchaseReceipt.create({
      data: {
        receiptNo,
        purchaseOrderId: data.purchaseOrderId,
        warehouseId: data.warehouseId,
        status: 'PENDING',
        notes: data.notes || null,
        items: {
          create: data.items.map((item) => ({
            productId: item.productId,
            expectedQty: item.expectedQty,
            receivedQty: item.receivedQty,
            acceptedQty: item.acceptedQty,
            rejectedQty: item.rejectedQty || 0,
          })),
        },
      },
    })

    revalidatePath('/purchase-orders')

    return {
      success: true,
      message: '驗收單建立成功',
      data: { id: receipt.id, receiptNo: receipt.receiptNo },
    }
  } catch (error) {
    console.error('Create purchase receipt error:', error)
    return {
      success: false,
      message: '建立驗收單失敗',
    }
  }
}

/**
 * 完成驗收並入庫
 */
export async function completePurchaseReceipt(id: string): Promise<ActionResult> {
  try {
    const receipt = await prisma.purchaseReceipt.findUnique({
      where: { id },
      include: {
        items: true,
        purchaseOrder: {
          include: { items: true },
        },
      },
    })

    if (!receipt) {
      return {
        success: false,
        message: '驗收單不存在',
      }
    }

    if (receipt.status === 'COMPLETED') {
      return {
        success: false,
        message: '此驗收單已完成',
      }
    }

    const transactions = []

    // 更新庫存
    for (const item of receipt.items) {
      // 查詢現有庫存
      const existingInventory = await prisma.inventory.findFirst({
        where: {
          productId: item.productId,
          warehouseId: receipt.warehouseId,
          storeId: null,
        },
      })

      if (existingInventory) {
        // 更新現有庫存
        transactions.push(
          prisma.inventory.update({
            where: { id: existingInventory.id },
            data: {
              quantity: { increment: item.acceptedQty },
              availableQty: { increment: item.acceptedQty },
            },
          })
        )
      } else {
        // 建立新庫存紀錄
        transactions.push(
          prisma.inventory.create({
            data: {
              productId: item.productId,
              warehouseId: receipt.warehouseId,
              quantity: item.acceptedQty,
              availableQty: item.acceptedQty,
            },
          })
        )
      }

      // 建立庫存異動紀錄
      transactions.push(
        prisma.inventoryMovement.create({
          data: {
            productId: item.productId,
            movementType: 'IN',
            quantity: item.acceptedQty,
            beforeQty: 0, // 實際應該查詢當前庫存
            afterQty: item.acceptedQty,
            warehouseId: receipt.warehouseId,
            referenceType: 'PURCHASE_RECEIPT',
            referenceId: receipt.receiptNo,
            reason: '採購入庫',
          },
        })
      )

      // 更新採購單明細的已收數量
      const poItem = receipt.purchaseOrder.items.find((i) => i.productId === item.productId)
      if (poItem) {
        transactions.push(
          prisma.purchaseOrderItem.update({
            where: { id: poItem.id },
            data: {
              receivedQty: { increment: item.acceptedQty },
            },
          })
        )
      }
    }

    // 更新驗收單狀態
    transactions.push(
      prisma.purchaseReceipt.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      })
    )

    // 檢查採購單是否全部驗收完成
    const allReceived = receipt.purchaseOrder.items.every((item) => {
      const receiptItem = receipt.items.find((ri) => ri.productId === item.productId)
      const totalReceived = item.receivedQty + (receiptItem?.acceptedQty || 0)
      return totalReceived >= item.quantity
    })

    if (allReceived) {
      transactions.push(
        prisma.purchaseOrder.update({
          where: { id: receipt.purchaseOrderId },
          data: { status: 'COMPLETED' },
        })
      )
    } else {
      transactions.push(
        prisma.purchaseOrder.update({
          where: { id: receipt.purchaseOrderId },
          data: { status: 'PARTIAL' },
        })
      )
    }

    await prisma.$transaction(transactions)

    revalidatePath('/purchase-orders')
    revalidatePath('/inventory')

    return {
      success: true,
      message: '驗收完成，庫存已更新',
    }
  } catch (error) {
    console.error('Complete purchase receipt error:', error)
    return {
      success: false,
      message: '完成驗收失敗',
    }
  }
}

/**
 * 取得採購統計
 */
export async function getPurchaseStats(params?: { startDate?: string; endDate?: string }) {
  const where = {
    ...(params?.startDate || params?.endDate
      ? {
          orderDate: {
            ...(params?.startDate && { gte: new Date(params.startDate) }),
            ...(params?.endDate && { lte: new Date(params.endDate + 'T23:59:59') }),
          },
        }
      : {}),
  }

  const [totalOrders, completedOrders, pendingOrders, totalAmount] = await Promise.all([
    prisma.purchaseOrder.count({ where }),
    prisma.purchaseOrder.count({ where: { ...where, status: 'COMPLETED' } }),
    prisma.purchaseOrder.count({
      where: {
        ...where,
        status: { in: ['DRAFT', 'PENDING', 'APPROVED', 'ORDERED'] },
      },
    }),
    prisma.purchaseOrder.aggregate({
      where: { ...where, status: { not: 'CANCELLED' } },
      _sum: { totalAmount: true },
    }),
  ])

  return {
    totalOrders,
    completedOrders,
    pendingOrders,
    totalAmount: totalAmount._sum.totalAmount || 0,
  }
}

/**
 * 取得採購單統計（用於列表頁）
 */
export async function getPurchaseOrderStats() {
  const [totalOrders, pendingOrders, approvedOrders, completedOrders] = await Promise.all([
    prisma.purchaseOrder.count(),
    prisma.purchaseOrder.count({ where: { status: { in: ['DRAFT', 'PENDING'] } } }),
    prisma.purchaseOrder.count({ where: { status: { in: ['APPROVED', 'ORDERED', 'PARTIAL'] } } }),
    prisma.purchaseOrder.count({ where: { status: 'COMPLETED' } }),
  ])

  return {
    totalOrders,
    pendingOrders,
    approvedOrders,
    completedOrders,
  }
}
