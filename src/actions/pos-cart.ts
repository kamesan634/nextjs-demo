'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import type { ActionResult } from '@/types'

// Prisma 交易客戶端類型
type TransactionClient = Omit<
  typeof prisma,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>

interface POSOrderItem {
  productId: string
  productName: string
  productSku: string
  quantity: number
  unitPrice: number
  discount?: number
}

interface POSPayment {
  paymentMethodId: string
  amount: number
}

interface CreatePOSOrderData {
  storeId: string
  userId: string
  customerId?: string
  items: POSOrderItem[]
  payments: POSPayment[]
  promotionId?: string
  notes?: string
}

/**
 * 生成訂單編號
 */
async function generateOrderNo(): Promise<string> {
  const today = new Date()
  const dateStr = today.toISOString().split('T')[0].replace(/-/g, '')

  const lastOrder = await prisma.order.findFirst({
    where: {
      orderNo: {
        startsWith: `ORD-${dateStr}-`,
      },
    },
    orderBy: {
      orderNo: 'desc',
    },
  })

  let sequence = 1
  if (lastOrder) {
    const lastSequence = parseInt(lastOrder.orderNo.split('-')[2])
    sequence = lastSequence + 1
  }

  return `ORD-${dateStr}-${sequence.toString().padStart(4, '0')}`
}

/**
 * 計算訂單金額
 */
function calculateOrderAmounts(items: POSOrderItem[], taxRate: number = 0.05) {
  const subtotal = items.reduce((sum, item) => {
    const itemTotal = item.quantity * item.unitPrice
    const itemDiscount = item.discount || 0
    return sum + (itemTotal - itemDiscount)
  }, 0)

  const taxAmount = Math.round(subtotal * taxRate * 100) / 100
  const totalAmount = subtotal + taxAmount

  return {
    subtotal,
    taxAmount,
    totalAmount,
  }
}

/**
 * 建立 POS 訂單（含訂單項目、付款、庫存更新、會員點數）
 */
export async function createPOSOrder(data: CreatePOSOrderData): Promise<ActionResult> {
  try {
    // 驗證商品庫存 (使用 warehouseId 而非 storeId)
    for (const item of data.items) {
      const inventory = await prisma.inventory.findFirst({
        where: {
          productId: item.productId,
        },
      })

      if (!inventory) {
        return {
          success: false,
          message: `商品 ${item.productName} 無庫存記錄`,
        }
      }

      if (inventory.availableQty < item.quantity) {
        return {
          success: false,
          message: `商品 ${item.productName} 庫存不足，可用數量：${inventory.availableQty}`,
        }
      }
    }

    // 驗證付款金額
    const { subtotal, taxAmount, totalAmount } = calculateOrderAmounts(data.items)
    const totalPayment = data.payments.reduce((sum, p) => sum + p.amount, 0)
    const changeAmount = totalPayment - totalAmount

    if (changeAmount < 0) {
      return {
        success: false,
        message: `付款金額不足，應付：${totalAmount}，實付：${totalPayment}`,
      }
    }

    // 使用交易建立訂單
    const result = await prisma.$transaction(async (tx: TransactionClient) => {
      // 1. 建立訂單
      const orderNo = await generateOrderNo()

      const order = await tx.order.create({
        data: {
          orderNo,
          storeId: data.storeId,
          userId: data.userId,
          customerId: data.customerId,
          promotionId: data.promotionId,
          status: 'COMPLETED',
          paymentStatus: 'PAID',
          subtotal,
          taxAmount,
          totalAmount,
          paidAmount: totalPayment,
          changeAmount: changeAmount > 0 ? changeAmount : 0,
          notes: data.notes,
          orderDate: new Date(),
        },
      })

      // 2. 建立訂單項目並更新庫存
      for (const item of data.items) {
        const itemSubtotal = item.quantity * item.unitPrice - (item.discount || 0)

        await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.productId,
            productName: item.productName,
            productSku: item.productSku,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount || 0,
            subtotal: itemSubtotal,
          },
        })

        // 更新庫存
        await tx.inventory.updateMany({
          where: {
            productId: item.productId,
          },
          data: {
            quantity: {
              decrement: item.quantity,
            },
            availableQty: {
              decrement: item.quantity,
            },
            updatedAt: new Date(),
          },
        })
      }

      // 3. 建立付款記錄
      for (const payment of data.payments) {
        await tx.payment.create({
          data: {
            orderId: order.id,
            paymentMethodId: payment.paymentMethodId,
            amount: payment.amount,
            status: 'COMPLETED',
            paidAt: new Date(),
          },
        })
      }

      // 4. 計算並增加會員點數（如果有會員）
      if (data.customerId) {
        const pointsToAdd = Math.floor(totalAmount / 10) // 每消費 10 元獲得 1 點

        // 取得當前點數
        const customer = await tx.customer.findUnique({
          where: { id: data.customerId },
          select: { availablePoints: true },
        })

        const newBalance = (customer?.availablePoints || 0) + pointsToAdd

        await tx.pointsLog.create({
          data: {
            customerId: data.customerId,
            orderId: order.id,
            type: 'EARN',
            points: pointsToAdd,
            balance: newBalance,
            description: `消費獲得點數 (訂單 ${orderNo})`,
            expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 年後過期
          },
        })

        // 更新會員總點數
        await tx.customer.update({
          where: { id: data.customerId },
          data: {
            totalPoints: {
              increment: pointsToAdd,
            },
            availablePoints: {
              increment: pointsToAdd,
            },
            totalSpent: {
              increment: totalAmount,
            },
            orderCount: {
              increment: 1,
            },
          },
        })

        // 更新訂單的獲得點數
        await tx.order.update({
          where: { id: order.id },
          data: {
            earnedPoints: pointsToAdd,
          },
        })
      }

      return order
    })

    revalidatePath('/pos')
    revalidatePath('/orders')
    revalidatePath('/inventory')

    return {
      success: true,
      message: '訂單建立成功',
      data: { orderId: result.id, orderNo: result.orderNo },
    }
  } catch (error) {
    console.error('Error creating POS order:', error)
    return {
      success: false,
      message: '建立訂單失敗',
    }
  }
}
