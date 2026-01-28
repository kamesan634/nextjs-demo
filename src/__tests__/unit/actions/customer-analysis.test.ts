/**
 * Customer Analysis Server Actions 測試
 * 測試客戶 RFM 分析相關的 Server Actions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getCustomerRFMAnalysis } from '@/actions/customer-analysis'
import prisma from '@/lib/prisma'

// Mock RFM 分析模組
vi.mock('@/lib/rfm-analysis', () => ({
  calculateRFM: vi.fn((customers) =>
    customers.map(
      (c: {
        customerId: string
        customerName: string
        lastPurchaseDate: Date | null
        purchaseCount: number
        totalAmount: number
      }) => ({
        ...c,
        recencyScore: c.lastPurchaseDate ? 4 : 1,
        frequencyScore: c.purchaseCount >= 5 ? 4 : 2,
        monetaryScore: c.totalAmount >= 10000 ? 4 : 2,
        segment:
          c.purchaseCount >= 5 && c.totalAmount >= 10000
            ? 'Champions'
            : c.purchaseCount >= 5
              ? 'Loyal'
              : 'Needs Attention',
      })
    )
  ),
}))

describe('Customer Analysis Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===== getCustomerRFMAnalysis 測試 =====
  describe('getCustomerRFMAnalysis', () => {
    it('應回傳客戶 RFM 分析結果', async () => {
      const mockCustomers = [
        {
          id: 'c1',
          name: '張三',
          isActive: true,
          orders: [
            { createdAt: new Date('2024-01-15'), totalAmount: 5000 },
            { createdAt: new Date('2024-02-20'), totalAmount: 8000 },
          ],
        },
        {
          id: 'c2',
          name: '李四',
          isActive: true,
          orders: [{ createdAt: new Date('2024-03-01'), totalAmount: 3000 }],
        },
      ]

      vi.mocked(prisma.customer.findMany).mockResolvedValue(mockCustomers as never)

      const result = await getCustomerRFMAnalysis()

      expect(result.customers).toHaveLength(2)
      expect(result.stats.totalCustomers).toBe(2)
    })

    it('應正確計算客戶統計資料', async () => {
      const mockCustomers = [
        {
          id: 'c1',
          name: '高價值客戶',
          isActive: true,
          orders: [
            { createdAt: new Date('2024-01-15'), totalAmount: 15000 },
            { createdAt: new Date('2024-02-20'), totalAmount: 12000 },
            { createdAt: new Date('2024-03-10'), totalAmount: 8000 },
            { createdAt: new Date('2024-03-25'), totalAmount: 9000 },
            { createdAt: new Date('2024-04-05'), totalAmount: 6000 },
          ],
        },
        {
          id: 'c2',
          name: '一般客戶',
          isActive: true,
          orders: [{ createdAt: new Date('2024-03-01'), totalAmount: 3000 }],
        },
      ]

      vi.mocked(prisma.customer.findMany).mockResolvedValue(mockCustomers as never)

      const result = await getCustomerRFMAnalysis()

      expect(result.stats.totalCustomers).toBe(2)
      expect(result.stats.activeCustomers).toBe(2)
      expect(result.stats.vipCustomers).toBe(1) // Champions + Loyal
    })

    it('應正確計算平均消費金額', async () => {
      const mockCustomers = [
        {
          id: 'c1',
          name: '客戶1',
          isActive: true,
          orders: [{ createdAt: new Date('2024-01-15'), totalAmount: 10000 }],
        },
        {
          id: 'c2',
          name: '客戶2',
          isActive: true,
          orders: [{ createdAt: new Date('2024-02-20'), totalAmount: 20000 }],
        },
      ]

      vi.mocked(prisma.customer.findMany).mockResolvedValue(mockCustomers as never)

      const result = await getCustomerRFMAnalysis()

      expect(result.stats.averageAmount).toBe(15000) // (10000 + 20000) / 2
    })

    it('應正確處理沒有訂單的客戶', async () => {
      const mockCustomers = [
        {
          id: 'c1',
          name: '新客戶',
          isActive: true,
          orders: [],
        },
      ]

      vi.mocked(prisma.customer.findMany).mockResolvedValue(mockCustomers as never)

      const result = await getCustomerRFMAnalysis()

      expect(result.customers).toHaveLength(1)
      expect(result.customers[0].lastPurchaseDate).toBeNull()
      expect(result.customers[0].purchaseCount).toBe(0)
      expect(result.customers[0].totalAmount).toBe(0)
    })

    it('應計算最後購買日期', async () => {
      const mockCustomers = [
        {
          id: 'c1',
          name: '客戶1',
          isActive: true,
          orders: [
            { createdAt: new Date('2024-01-01'), totalAmount: 1000 },
            { createdAt: new Date('2024-03-15'), totalAmount: 2000 },
            { createdAt: new Date('2024-02-10'), totalAmount: 1500 },
          ],
        },
      ]

      vi.mocked(prisma.customer.findMany).mockResolvedValue(mockCustomers as never)

      const result = await getCustomerRFMAnalysis()

      // 最後購買日期應為最晚的那筆 (2024-03-15)
      expect(result.customers[0].lastPurchaseDate?.getTime()).toBe(new Date('2024-03-15').getTime())
    })

    it('應計算購買次數', async () => {
      const mockCustomers = [
        {
          id: 'c1',
          name: '客戶1',
          isActive: true,
          orders: [
            { createdAt: new Date('2024-01-01'), totalAmount: 1000 },
            { createdAt: new Date('2024-02-01'), totalAmount: 2000 },
            { createdAt: new Date('2024-03-01'), totalAmount: 1500 },
          ],
        },
      ]

      vi.mocked(prisma.customer.findMany).mockResolvedValue(mockCustomers as never)

      const result = await getCustomerRFMAnalysis()

      expect(result.customers[0].purchaseCount).toBe(3)
    })

    it('應計算總消費金額', async () => {
      const mockCustomers = [
        {
          id: 'c1',
          name: '客戶1',
          isActive: true,
          orders: [
            { createdAt: new Date('2024-01-01'), totalAmount: 1000 },
            { createdAt: new Date('2024-02-01'), totalAmount: 2000 },
            { createdAt: new Date('2024-03-01'), totalAmount: 1500 },
          ],
        },
      ]

      vi.mocked(prisma.customer.findMany).mockResolvedValue(mockCustomers as never)

      const result = await getCustomerRFMAnalysis()

      expect(result.customers[0].totalAmount).toBe(4500)
    })

    it('無客戶時應回傳空結果', async () => {
      vi.mocked(prisma.customer.findMany).mockResolvedValue([])

      const result = await getCustomerRFMAnalysis()

      expect(result.customers).toHaveLength(0)
      expect(result.stats.totalCustomers).toBe(0)
      expect(result.stats.activeCustomers).toBe(0)
      expect(result.stats.vipCustomers).toBe(0)
    })

    it('應只查詢活躍客戶', async () => {
      vi.mocked(prisma.customer.findMany).mockResolvedValue([])

      await getCustomerRFMAnalysis()

      expect(prisma.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isActive: true },
        })
      )
    })

    it('應只查詢已完成或已付款的訂單', async () => {
      vi.mocked(prisma.customer.findMany).mockResolvedValue([])

      await getCustomerRFMAnalysis()

      expect(prisma.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            orders: expect.objectContaining({
              where: {
                status: { in: ['COMPLETED', 'PAID'] },
              },
            }),
          }),
        })
      )
    })

    it('應正確計算活躍客戶數 (recencyScore >= 3)', async () => {
      const mockCustomers = [
        {
          id: 'c1',
          name: '活躍客戶',
          isActive: true,
          orders: [{ createdAt: new Date(), totalAmount: 5000 }],
        },
        {
          id: 'c2',
          name: '不活躍客戶',
          isActive: true,
          orders: [], // 沒有訂單，recencyScore 會很低
        },
      ]

      vi.mocked(prisma.customer.findMany).mockResolvedValue(mockCustomers as never)

      const result = await getCustomerRFMAnalysis()

      expect(result.stats.activeCustomers).toBe(1) // 只有有訂單的客戶是活躍的
    })

    it('應正確識別 VIP 客戶 (Champions 或 Loyal)', async () => {
      const mockCustomers = [
        {
          id: 'c1',
          name: 'VIP客戶',
          isActive: true,
          orders: [
            { createdAt: new Date(), totalAmount: 15000 },
            { createdAt: new Date(), totalAmount: 12000 },
            { createdAt: new Date(), totalAmount: 8000 },
            { createdAt: new Date(), totalAmount: 9000 },
            { createdAt: new Date(), totalAmount: 6000 },
          ],
        },
        {
          id: 'c2',
          name: '一般客戶',
          isActive: true,
          orders: [{ createdAt: new Date(), totalAmount: 1000 }],
        },
      ]

      vi.mocked(prisma.customer.findMany).mockResolvedValue(mockCustomers as never)

      const result = await getCustomerRFMAnalysis()

      expect(result.stats.vipCustomers).toBe(1)
    })

    it('平均金額計算應處理無客戶的情況', async () => {
      vi.mocked(prisma.customer.findMany).mockResolvedValue([])

      const result = await getCustomerRFMAnalysis()

      // 應該是 0 而不是 NaN
      expect(result.stats.averageAmount).toBe(0)
    })
  })
})
