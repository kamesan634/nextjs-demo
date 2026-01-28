'use server'

import prisma from '@/lib/prisma'
import { calculateRFM, type CustomerRFMData } from '@/lib/rfm-analysis'

/**
 * 取得客戶 RFM 分析
 */
export async function getCustomerRFMAnalysis() {
  // 查詢所有客戶的訂單資料
  const customers = await prisma.customer.findMany({
    where: { isActive: true },
    include: {
      orders: {
        where: {
          status: { in: ['COMPLETED', 'PAID'] },
        },
        select: {
          createdAt: true,
          totalAmount: true,
        },
      },
    },
  })

  // 轉換為 RFM 分析所需的格式
  const rfmData: CustomerRFMData[] = customers.map((customer) => {
    const orders = customer.orders
    const lastPurchaseDate =
      orders.length > 0 ? new Date(Math.max(...orders.map((o) => o.createdAt.getTime()))) : null

    const totalAmount = orders.reduce((sum, order) => sum + Number(order.totalAmount), 0)

    return {
      customerId: customer.id,
      customerName: customer.name,
      lastPurchaseDate,
      purchaseCount: orders.length,
      totalAmount,
    }
  })

  // 計算 RFM 分數
  const rfmScores = calculateRFM(rfmData)

  // 計算統計資料
  const totalCustomers = rfmScores.length
  const activeCustomers = rfmScores.filter((c) => c.recencyScore >= 3).length
  const averageAmount = rfmScores.reduce((sum, c) => sum + c.totalAmount, 0) / totalCustomers || 0
  const vipCustomers = rfmScores.filter(
    (c) => c.segment === 'Champions' || c.segment === 'Loyal'
  ).length

  return {
    customers: rfmScores,
    stats: {
      totalCustomers,
      activeCustomers,
      averageAmount,
      vipCustomers,
    },
  }
}
