/**
 * Comparison Reports Server Actions 測試
 * 測試同期比較報表相關的 Server Actions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getComparisonData, getSalesTrend } from '@/actions/comparison-reports'
import prisma from '@/lib/prisma'

describe('Comparison Reports Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===== getComparisonData 測試 =====
  describe('getComparisonData', () => {
    const dateParams = {
      period1Start: new Date('2024-01-01'),
      period1End: new Date('2024-01-31'),
      period2Start: new Date('2024-02-01'),
      period2End: new Date('2024-02-29'),
    }

    describe('sales metric', () => {
      it('應回傳銷售比較資料', async () => {
        vi.mocked(prisma.order.aggregate)
          .mockResolvedValueOnce({
            _sum: { totalAmount: 100000 },
            _count: 50,
          } as never)
          .mockResolvedValueOnce({
            _sum: { totalAmount: 120000 },
            _count: 60,
          } as never)
        vi.mocked(prisma.order.groupBy).mockResolvedValueOnce([]).mockResolvedValueOnce([])

        const result = await getComparisonData({ ...dateParams, metric: 'sales' })

        expect(result.period1.value).toBe(100000)
        expect(result.period2.value).toBe(120000)
        expect(result.change).toBe(20)
        expect(result.metric).toBe('sales')
      })

      it('應回傳每日銷售明細', async () => {
        vi.mocked(prisma.order.aggregate).mockResolvedValue({
          _sum: { totalAmount: 100000 },
          _count: 50,
        } as never)
        vi.mocked(prisma.order.groupBy).mockResolvedValue([
          {
            orderDate: new Date('2024-01-15'),
            _sum: { totalAmount: 5000 },
            _count: 10,
          },
        ] as never)

        const result = await getComparisonData({ ...dateParams, metric: 'sales' })

        expect(result.period1.details).toHaveLength(1)
        expect(result.period1.details[0]).toEqual(
          expect.objectContaining({
            amount: 5000,
            count: 10,
          })
        )
      })

      it('銷售金額為 null 時應回傳 0', async () => {
        vi.mocked(prisma.order.aggregate).mockResolvedValue({
          _sum: { totalAmount: null },
          _count: 0,
        } as never)
        vi.mocked(prisma.order.groupBy).mockResolvedValue([])

        const result = await getComparisonData({ ...dateParams, metric: 'sales' })

        expect(result.period1.value).toBe(0)
      })
    })

    describe('orders metric', () => {
      it('應回傳訂單數量比較資料', async () => {
        vi.mocked(prisma.order.count).mockResolvedValueOnce(100).mockResolvedValueOnce(150)

        const result = await getComparisonData({ ...dateParams, metric: 'orders' })

        expect(result.period1.value).toBe(100)
        expect(result.period2.value).toBe(150)
        expect(result.change).toBe(50)
        expect(result.metric).toBe('orders')
      })

      it('訂單數為 0 時應正確處理', async () => {
        vi.mocked(prisma.order.count).mockResolvedValue(0)

        const result = await getComparisonData({ ...dateParams, metric: 'orders' })

        expect(result.period1.value).toBe(0)
        expect(result.period1.count).toBe(0)
      })
    })

    describe('profit metric', () => {
      it('應回傳利潤比較資料', async () => {
        vi.mocked(prisma.order.findMany)
          .mockResolvedValueOnce([
            {
              totalAmount: 10000,
              items: [
                { quantity: 10, product: { costPrice: 50 } },
                { quantity: 5, product: { costPrice: 100 } },
              ],
            },
          ] as never)
          .mockResolvedValueOnce([
            {
              totalAmount: 15000,
              items: [{ quantity: 20, product: { costPrice: 50 } }],
            },
          ] as never)

        const result = await getComparisonData({ ...dateParams, metric: 'profit' })

        // Period 1: Revenue 10000, Cost (10*50 + 5*100) = 1000, Profit = 9000
        expect(result.period1.value).toBe(9000)
        // Period 2: Revenue 15000, Cost 20*50 = 1000, Profit = 14000
        expect(result.period2.value).toBe(14000)
        expect(result.metric).toBe('profit')
      })

      it('應回傳利潤明細', async () => {
        vi.mocked(prisma.order.findMany).mockResolvedValue([
          {
            totalAmount: 10000,
            items: [{ quantity: 10, product: { costPrice: 50 } }],
          },
        ] as never)

        const result = await getComparisonData({ ...dateParams, metric: 'profit' })

        expect(result.period1.details).toHaveLength(1)
        expect(result.period1.details[0]).toEqual({
          revenue: 10000,
          cost: 500,
          profit: 9500,
        })
      })

      it('無訂單時應回傳 0 利潤', async () => {
        vi.mocked(prisma.order.findMany).mockResolvedValue([])

        const result = await getComparisonData({ ...dateParams, metric: 'profit' })

        expect(result.period1.value).toBe(0)
        expect(result.period1.details).toEqual([{ revenue: 0, cost: 0, profit: 0 }])
      })
    })

    describe('customers metric', () => {
      it('應回傳新客戶數量比較資料', async () => {
        vi.mocked(prisma.customer.count).mockResolvedValueOnce(20).mockResolvedValueOnce(30)

        const result = await getComparisonData({ ...dateParams, metric: 'customers' })

        expect(result.period1.value).toBe(20)
        expect(result.period2.value).toBe(30)
        expect(result.change).toBe(50)
        expect(result.metric).toBe('customers')
      })
    })

    describe('change calculation', () => {
      it('第一期為 0 時變化率應為 0', async () => {
        vi.mocked(prisma.order.count).mockResolvedValueOnce(0).mockResolvedValueOnce(100)

        const result = await getComparisonData({ ...dateParams, metric: 'orders' })

        expect(result.change).toBe(0)
      })

      it('應正確計算負成長', async () => {
        vi.mocked(prisma.order.count).mockResolvedValueOnce(100).mockResolvedValueOnce(80)

        const result = await getComparisonData({ ...dateParams, metric: 'orders' })

        expect(result.change).toBe(-20)
      })

      it('應四捨五入到小數點後兩位', async () => {
        vi.mocked(prisma.order.count).mockResolvedValueOnce(100).mockResolvedValueOnce(133)

        const result = await getComparisonData({ ...dateParams, metric: 'orders' })

        expect(result.change).toBe(33)
      })
    })

    describe('unknown metric', () => {
      it('未知的 metric 應回傳預設值', async () => {
        const result = await getComparisonData({
          ...dateParams,
          metric: 'unknown' as 'sales',
        })

        expect(result.period1.value).toBe(0)
        expect(result.period1.count).toBe(0)
        expect(result.period1.details).toEqual([])
      })
    })
  })

  // ===== getSalesTrend 測試 =====
  describe('getSalesTrend', () => {
    it('應回傳預設 12 個月的銷售趨勢', async () => {
      vi.mocked(prisma.order.aggregate).mockResolvedValue({
        _sum: { totalAmount: 10000 },
        _count: 50,
      } as never)

      const result = await getSalesTrend()

      expect(result).toHaveLength(12)
    })

    it('應支援自訂月數', async () => {
      vi.mocked(prisma.order.aggregate).mockResolvedValue({
        _sum: { totalAmount: 10000 },
        _count: 50,
      } as never)

      const result = await getSalesTrend(6)

      expect(result).toHaveLength(6)
    })

    it('應回傳正確的月份格式', async () => {
      vi.mocked(prisma.order.aggregate).mockResolvedValue({
        _sum: { totalAmount: 10000 },
        _count: 50,
      } as never)

      const result = await getSalesTrend(1)

      expect(result[0].month).toMatch(/^\d{4}\/\d{2}$/)
    })

    it('應回傳銷售金額和訂單數', async () => {
      vi.mocked(prisma.order.aggregate).mockResolvedValue({
        _sum: { totalAmount: 25000 },
        _count: 100,
      } as never)

      const result = await getSalesTrend(1)

      expect(result[0].sales).toBe(25000)
      expect(result[0].orders).toBe(100)
    })

    it('銷售金額為 null 時應回傳 0', async () => {
      vi.mocked(prisma.order.aggregate).mockResolvedValue({
        _sum: { totalAmount: null },
        _count: 0,
      } as never)

      const result = await getSalesTrend(1)

      expect(result[0].sales).toBe(0)
      expect(result[0].orders).toBe(0)
    })

    it('利潤應固定為 0 (簡化版)', async () => {
      vi.mocked(prisma.order.aggregate).mockResolvedValue({
        _sum: { totalAmount: 10000 },
        _count: 50,
      } as never)

      const result = await getSalesTrend(1)

      expect(result[0].profit).toBe(0)
    })

    it('月份應按時間順序排列', async () => {
      vi.mocked(prisma.order.aggregate).mockResolvedValue({
        _sum: { totalAmount: 10000 },
        _count: 50,
      } as never)

      const result = await getSalesTrend(3)

      const months = result.map((r) => r.month)
      const sortedMonths = [...months].sort()
      expect(months).toEqual(sortedMonths)
    })
  })
})
