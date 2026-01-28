'use server'

import prisma from '@/lib/prisma'

/**
 * 取得同期比較資料
 */
export async function getComparisonData(params: {
  period1Start: Date
  period1End: Date
  period2Start: Date
  period2End: Date
  metric: 'sales' | 'orders' | 'profit' | 'customers'
}) {
  const [period1Data, period2Data] = await Promise.all([
    getPeriodData(params.period1Start, params.period1End, params.metric),
    getPeriodData(params.period2Start, params.period2End, params.metric),
  ])

  const change =
    period1Data.value !== 0
      ? ((period2Data.value - period1Data.value) / period1Data.value) * 100
      : 0

  return {
    period1: {
      start: params.period1Start,
      end: params.period1End,
      ...period1Data,
    },
    period2: {
      start: params.period2Start,
      end: params.period2End,
      ...period2Data,
    },
    change: Math.round(change * 100) / 100,
    metric: params.metric,
  }
}

async function getPeriodData(
  startDate: Date,
  endDate: Date,
  metric: string
): Promise<{ value: number; count: number; details: Record<string, unknown>[] }> {
  const orderWhere = {
    orderDate: { gte: startDate, lte: endDate },
    status: { in: ['CONFIRMED', 'COMPLETED'] },
  }

  switch (metric) {
    case 'sales': {
      const result = await prisma.order.aggregate({
        where: orderWhere,
        _sum: { totalAmount: true },
        _count: true,
      })

      // 每日銷售明細
      const dailySales = await prisma.order.groupBy({
        by: ['orderDate'],
        where: orderWhere,
        _sum: { totalAmount: true },
        _count: true,
        orderBy: { orderDate: 'asc' },
      })

      return {
        value: Number(result._sum.totalAmount || 0),
        count: result._count,
        details: dailySales.map((d: (typeof dailySales)[0]) => ({
          date: d.orderDate,
          amount: Number(d._sum.totalAmount || 0),
          count: d._count,
        })),
      }
    }

    case 'orders': {
      const result = await prisma.order.count({
        where: orderWhere,
      })

      return {
        value: result,
        count: result,
        details: [],
      }
    }

    case 'profit': {
      const orders = await prisma.order.findMany({
        where: orderWhere,
        include: {
          items: {
            include: {
              product: { select: { costPrice: true } },
            },
          },
        },
      })

      let revenue = 0
      let cost = 0

      for (const order of orders) {
        revenue += Number(order.totalAmount)
        for (const item of order.items) {
          cost += Number(item.product.costPrice) * item.quantity
        }
      }

      return {
        value: revenue - cost,
        count: orders.length,
        details: [{ revenue, cost, profit: revenue - cost }],
      }
    }

    case 'customers': {
      const result = await prisma.customer.count({
        where: {
          joinDate: { gte: startDate, lte: endDate },
        },
      })

      return {
        value: result,
        count: result,
        details: [],
      }
    }

    default:
      return { value: 0, count: 0, details: [] }
  }
}

/**
 * 取得銷售趨勢 (月度)
 */
export async function getSalesTrend(months: number = 12) {
  const now = new Date()
  const trends: { month: string; sales: number; orders: number; profit: number }[] = []

  for (let i = months - 1; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59)

    const result = await prisma.order.aggregate({
      where: {
        orderDate: { gte: start, lte: end },
        status: { in: ['CONFIRMED', 'COMPLETED'] },
      },
      _sum: { totalAmount: true },
      _count: true,
    })

    const month = `${start.getFullYear()}/${String(start.getMonth() + 1).padStart(2, '0')}`

    trends.push({
      month,
      sales: Number(result._sum.totalAmount || 0),
      orders: result._count,
      profit: 0, // 簡化版不算利潤
    })
  }

  return trends
}
