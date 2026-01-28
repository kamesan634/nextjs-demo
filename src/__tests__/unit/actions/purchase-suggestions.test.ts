/**
 * Purchase Suggestions Server Actions 測試
 * 測試採購建議相關的 Server Actions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getPurchaseSuggestions } from '@/actions/purchase-suggestions'
import prisma from '@/lib/prisma'

// Mock revalidatePath
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

describe('Purchase Suggestions Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // 模擬 Prisma Decimal 物件，支援 Number() 轉換
  const mockDecimal = (value: number) => ({
    toNumber: () => value,
    valueOf: () => value,
    toString: () => String(value),
  })

  describe('getPurchaseSuggestions', () => {
    const createMockProduct = (overrides = {}) => ({
      id: 'p1',
      sku: 'P001',
      name: '商品1',
      isActive: true,
      reorderPoint: 20,
      safetyStock: 10,
      reorderQty: 50,
      costPrice: mockDecimal(100),
      category: { name: '分類1' },
      unit: { name: '個' },
      inventories: [{ quantity: 15, warehouseId: 'w1', reservedQty: 0 }],
      supplierPrices: [
        {
          isPreferred: true,
          price: mockDecimal(90),
          supplier: { id: 's1', name: '供應商A' },
        },
      ],
      ...overrides,
    })

    it('應回傳需要補貨的商品列表', async () => {
      const mockProducts = [
        createMockProduct({
          inventories: [{ quantity: 15, warehouseId: 'w1', reservedQty: 0 }],
        }),
      ]

      vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts as never)

      const result = await getPurchaseSuggestions()

      expect(result.data).toHaveLength(1)
      expect(result.data[0].productSku).toBe('P001')
      expect(result.data[0].currentStock).toBe(15)
      expect(result.data[0].reorderPoint).toBe(20)
    })

    it('應排除庫存充足的商品', async () => {
      const mockProducts = [
        createMockProduct({
          inventories: [{ quantity: 100, warehouseId: 'w1', reservedQty: 0 }],
        }),
      ]

      vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts as never)

      const result = await getPurchaseSuggestions()

      expect(result.data).toHaveLength(0)
    })

    it('應正確計算可用庫存 (總庫存 - 保留數量)', async () => {
      const mockProducts = [
        createMockProduct({
          reorderPoint: 20,
          inventories: [{ quantity: 30, warehouseId: 'w1', reservedQty: 15 }],
        }),
      ]

      vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts as never)

      const result = await getPurchaseSuggestions()

      expect(result.data).toHaveLength(1)
      expect(result.data[0].currentStock).toBe(30)
      expect(result.data[0].availableStock).toBe(15)
    })

    it('應正確判斷緊急程度 - CRITICAL (可用庫存 <= 0)', async () => {
      const mockProducts = [
        createMockProduct({
          reorderPoint: 20,
          safetyStock: 10,
          inventories: [{ quantity: 10, warehouseId: 'w1', reservedQty: 15 }],
        }),
      ]

      vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts as never)

      const result = await getPurchaseSuggestions()

      expect(result.data[0].urgency).toBe('CRITICAL')
    })

    it('應正確判斷緊急程度 - HIGH (可用庫存 <= 安全庫存)', async () => {
      const mockProducts = [
        createMockProduct({
          reorderPoint: 20,
          safetyStock: 10,
          inventories: [{ quantity: 10, warehouseId: 'w1', reservedQty: 0 }],
        }),
      ]

      vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts as never)

      const result = await getPurchaseSuggestions()

      expect(result.data[0].urgency).toBe('HIGH')
    })

    it('應正確判斷緊急程度 - NORMAL', async () => {
      const mockProducts = [
        createMockProduct({
          reorderPoint: 20,
          safetyStock: 10,
          inventories: [{ quantity: 15, warehouseId: 'w1', reservedQty: 0 }],
        }),
      ]

      vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts as never)

      const result = await getPurchaseSuggestions()

      expect(result.data[0].urgency).toBe('NORMAL')
    })

    it('應使用首選供應商資訊', async () => {
      const mockProducts = [
        createMockProduct({
          supplierPrices: [
            {
              isPreferred: true,
              price: mockDecimal(85),
              supplier: { id: 's1', name: '首選供應商' },
            },
          ],
        }),
      ]

      vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts as never)

      const result = await getPurchaseSuggestions()

      expect(result.data[0].supplierId).toBe('s1')
      expect(result.data[0].supplierName).toBe('首選供應商')
      expect(result.data[0].supplierPrice).toBe(85)
    })

    it('無首選供應商時應使用成本價', async () => {
      const mockProducts = [
        createMockProduct({
          costPrice: mockDecimal(100),
          supplierPrices: [],
        }),
      ]

      vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts as never)

      const result = await getPurchaseSuggestions()

      expect(result.data[0].supplierId).toBeNull()
      expect(result.data[0].supplierName).toBe('未指定')
      expect(result.data[0].supplierPrice).toBe(100)
    })

    it('應正確計算建議採購數量 (有設定補貨數量)', async () => {
      const mockProducts = [
        createMockProduct({
          reorderQty: 100,
          inventories: [{ quantity: 15, warehouseId: 'w1', reservedQty: 0 }],
        }),
      ]

      vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts as never)

      const result = await getPurchaseSuggestions()

      expect(result.data[0].suggestedQty).toBe(100)
    })

    it('應正確計算建議採購數量 (未設定補貨數量)', async () => {
      const mockProducts = [
        createMockProduct({
          reorderQty: 0,
          safetyStock: 20,
          inventories: [{ quantity: 15, warehouseId: 'w1', reservedQty: 0 }],
        }),
      ]

      vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts as never)

      const result = await getPurchaseSuggestions()

      // suggestedQty = safetyStock * 2 - availableStock = 20 * 2 - 15 = 25
      expect(result.data[0].suggestedQty).toBe(25)
    })

    it('應支援倉庫篩選', async () => {
      vi.mocked(prisma.product.findMany).mockResolvedValue([])

      await getPurchaseSuggestions({ warehouseId: 'w1' })

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            inventories: expect.objectContaining({
              where: { warehouseId: 'w1' },
            }),
          }),
        })
      )
    })

    it('應支援分類篩選', async () => {
      vi.mocked(prisma.product.findMany).mockResolvedValue([])

      await getPurchaseSuggestions({ categoryId: 'cat-1' })

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            categoryId: 'cat-1',
          }),
        })
      )
    })

    it('應支援分頁', async () => {
      const mockProducts = Array.from({ length: 30 }, (_, i) =>
        createMockProduct({
          id: `p${i}`,
          sku: `P00${i}`,
          inventories: [{ quantity: 10, warehouseId: 'w1', reservedQty: 0 }],
        })
      )

      vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts as never)

      const result = await getPurchaseSuggestions({ page: 2, pageSize: 10 })

      expect(result.data).toHaveLength(10)
      expect(result.pagination.page).toBe(2)
      expect(result.pagination.pageSize).toBe(10)
      expect(result.pagination.total).toBe(30)
      expect(result.pagination.totalPages).toBe(3)
    })

    it('無參數時應使用預設分頁', async () => {
      vi.mocked(prisma.product.findMany).mockResolvedValue([])

      const result = await getPurchaseSuggestions()

      expect(result.pagination.page).toBe(1)
      expect(result.pagination.pageSize).toBe(20)
    })

    it('第一頁應無前一頁', async () => {
      vi.mocked(prisma.product.findMany).mockResolvedValue([])

      const result = await getPurchaseSuggestions({ page: 1, pageSize: 20 })

      expect(result.pagination.hasPrevPage).toBe(false)
    })

    it('最後一頁應無下一頁', async () => {
      const mockProducts = Array.from({ length: 40 }, (_, i) =>
        createMockProduct({
          id: `p${i}`,
          inventories: [{ quantity: 10, warehouseId: 'w1', reservedQty: 0 }],
        })
      )

      vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts as never)

      const result = await getPurchaseSuggestions({ page: 2, pageSize: 20 })

      expect(result.pagination.hasNextPage).toBe(false)
    })

    it('應回傳統計摘要', async () => {
      const mockProducts = [
        createMockProduct({
          id: 'p1',
          reorderPoint: 20,
          safetyStock: 10,
          supplierPrices: [
            {
              isPreferred: true,
              price: mockDecimal(100),
              supplier: { id: 's1', name: '供應商A' },
            },
          ],
          inventories: [{ quantity: 0, warehouseId: 'w1', reservedQty: 0 }],
        }),
        createMockProduct({
          id: 'p2',
          sku: 'P002',
          reorderPoint: 20,
          safetyStock: 10,
          supplierPrices: [
            {
              isPreferred: true,
              price: mockDecimal(50),
              supplier: { id: 's1', name: '供應商A' },
            },
          ],
          inventories: [{ quantity: 5, warehouseId: 'w1', reservedQty: 0 }],
        }),
        createMockProduct({
          id: 'p3',
          sku: 'P003',
          reorderPoint: 20,
          safetyStock: 10,
          supplierPrices: [
            {
              isPreferred: true,
              price: mockDecimal(30),
              supplier: { id: 's1', name: '供應商A' },
            },
          ],
          inventories: [{ quantity: 15, warehouseId: 'w1', reservedQty: 0 }],
        }),
      ]

      vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts as never)

      const result = await getPurchaseSuggestions()

      expect(result.summary.total).toBe(3)
      expect(result.summary.critical).toBe(1) // p1: availableStock = 0
      expect(result.summary.high).toBe(1) // p2: availableStock = 5 <= safetyStock 10
      expect(result.summary.normal).toBe(1) // p3: availableStock = 15 > safetyStock 10
    })

    it('應正確計算預估採購成本', async () => {
      const mockProducts = [
        createMockProduct({
          id: 'p1',
          reorderQty: 50, // suggestedQty = 50
          supplierPrices: [
            {
              isPreferred: true,
              price: mockDecimal(100),
              supplier: { id: 's1', name: '供應商A' },
            },
          ],
          inventories: [{ quantity: 10, warehouseId: 'w1', reservedQty: 0 }],
        }),
        createMockProduct({
          id: 'p2',
          sku: 'P002',
          reorderQty: 30, // suggestedQty = 30
          supplierPrices: [
            {
              isPreferred: true,
              price: mockDecimal(50),
              supplier: { id: 's1', name: '供應商A' },
            },
          ],
          inventories: [{ quantity: 10, warehouseId: 'w1', reservedQty: 0 }],
        }),
      ]

      vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts as never)

      const result = await getPurchaseSuggestions()

      // 50 * 100 + 30 * 50 = 5000 + 1500 = 6500
      expect(result.summary.estimatedCost).toBe(6500)
    })

    it('應合併多倉庫庫存', async () => {
      const mockProducts = [
        createMockProduct({
          reorderPoint: 100,
          inventories: [
            { quantity: 30, warehouseId: 'w1', reservedQty: 5 },
            { quantity: 20, warehouseId: 'w2', reservedQty: 10 },
            { quantity: 10, warehouseId: 'w3', reservedQty: 0 },
          ],
        }),
      ]

      vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts as never)

      const result = await getPurchaseSuggestions()

      expect(result.data[0].currentStock).toBe(60) // 30 + 20 + 10
      expect(result.data[0].availableStock).toBe(45) // 60 - (5 + 10 + 0)
    })

    it('空結果應回傳空資料', async () => {
      vi.mocked(prisma.product.findMany).mockResolvedValue([])

      const result = await getPurchaseSuggestions()

      expect(result.data).toHaveLength(0)
      expect(result.pagination.total).toBe(0)
      expect(result.summary.total).toBe(0)
      expect(result.summary.critical).toBe(0)
      expect(result.summary.high).toBe(0)
      expect(result.summary.normal).toBe(0)
      expect(result.summary.estimatedCost).toBe(0)
    })

    it('應只處理已啟用且有設定補貨點的商品', async () => {
      vi.mocked(prisma.product.findMany).mockResolvedValue([])

      await getPurchaseSuggestions()

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: true,
            reorderPoint: { gt: 0 },
          }),
        })
      )
    })
  })
})
