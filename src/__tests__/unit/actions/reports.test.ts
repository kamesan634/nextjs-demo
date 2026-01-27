/**
 * Reports Server Actions 測試
 * 測試報表統計相關的 Server Actions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getSalesReport,
  getInventoryReport,
  getPurchaseReport,
  getProfitReport,
} from '@/actions/reports'
import prisma from '@/lib/prisma'

describe('Reports Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const dateParams = {
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
  }

  describe('getSalesReport', () => {
    it('應回傳銷售報表摘要', async () => {
      vi.mocked(prisma.order.aggregate).mockResolvedValue({
        _sum: {
          totalAmount: { toNumber: () => 100000 },
          discountAmount: { toNumber: () => 5000 },
          taxAmount: { toNumber: () => 4750 },
        },
        _count: 500,
      } as never)
      vi.mocked(prisma.order.groupBy).mockResolvedValue([])
      vi.mocked(prisma.orderItem.groupBy).mockResolvedValue([])
      vi.mocked(prisma.product.findMany).mockResolvedValue([])
      vi.mocked(prisma.payment.groupBy).mockResolvedValue([])
      vi.mocked(prisma.paymentMethod.findMany).mockResolvedValue([])

      const result = await getSalesReport(dateParams)

      expect(result.summary.totalSales).toBe(100000)
      expect(result.summary.totalDiscount).toBe(5000)
      expect(result.summary.totalTax).toBe(4750)
      expect(result.summary.orderCount).toBe(500)
      expect(result.summary.averageOrderValue).toBe(200) // 100000 / 500
    })

    it('應回傳每日銷售數據', async () => {
      vi.mocked(prisma.order.aggregate).mockResolvedValue({
        _sum: { totalAmount: null, discountAmount: null, taxAmount: null },
        _count: 0,
      } as never)
      vi.mocked(prisma.order.groupBy).mockResolvedValue([
        {
          createdAt: new Date('2024-01-01'),
          _sum: { totalAmount: { toNumber: () => 10000 } },
          _count: 50,
        },
        {
          createdAt: new Date('2024-01-02'),
          _sum: { totalAmount: { toNumber: () => 15000 } },
          _count: 75,
        },
      ] as never)
      vi.mocked(prisma.orderItem.groupBy).mockResolvedValue([])
      vi.mocked(prisma.product.findMany).mockResolvedValue([])
      vi.mocked(prisma.payment.groupBy).mockResolvedValue([])
      vi.mocked(prisma.paymentMethod.findMany).mockResolvedValue([])

      const result = await getSalesReport(dateParams)

      expect(result.dailySales).toHaveLength(2)
      expect(result.dailySales[0].totalAmount).toBe(10000)
      expect(result.dailySales[0].orderCount).toBe(50)
    })

    it('應回傳熱銷商品排行', async () => {
      vi.mocked(prisma.order.aggregate).mockResolvedValue({
        _sum: { totalAmount: null, discountAmount: null, taxAmount: null },
        _count: 0,
      } as never)
      vi.mocked(prisma.order.groupBy).mockResolvedValue([])
      vi.mocked(prisma.orderItem.groupBy).mockResolvedValue([
        {
          productId: 'p1',
          _sum: { quantity: 100, subtotal: { toNumber: () => 50000 } },
        },
      ] as never)
      vi.mocked(prisma.product.findMany).mockResolvedValue([
        { id: 'p1', sku: 'P001', name: '熱銷商品' },
      ] as never)
      vi.mocked(prisma.payment.groupBy).mockResolvedValue([])
      vi.mocked(prisma.paymentMethod.findMany).mockResolvedValue([])

      const result = await getSalesReport(dateParams)

      expect(result.topProducts).toHaveLength(1)
      expect(result.topProducts[0].productName).toBe('熱銷商品')
      expect(result.topProducts[0].quantity).toBe(100)
      expect(result.topProducts[0].revenue).toBe(50000)
    })

    it('應回傳付款方式統計', async () => {
      vi.mocked(prisma.order.aggregate).mockResolvedValue({
        _sum: { totalAmount: null, discountAmount: null, taxAmount: null },
        _count: 0,
      } as never)
      vi.mocked(prisma.order.groupBy).mockResolvedValue([])
      vi.mocked(prisma.orderItem.groupBy).mockResolvedValue([])
      vi.mocked(prisma.product.findMany).mockResolvedValue([])
      vi.mocked(prisma.payment.groupBy).mockResolvedValue([
        {
          paymentMethodId: 'pm1',
          _sum: { amount: { toNumber: () => 60000 } },
          _count: 300,
        },
      ] as never)
      vi.mocked(prisma.paymentMethod.findMany).mockResolvedValue([
        { id: 'pm1', code: 'CASH', name: '現金' },
      ] as never)

      const result = await getSalesReport(dateParams)

      expect(result.paymentStats).toHaveLength(1)
      expect(result.paymentStats[0].method).toBe('現金')
      expect(result.paymentStats[0].amount).toBe(60000)
    })

    it('應支援門市篩選', async () => {
      vi.mocked(prisma.order.aggregate).mockResolvedValue({
        _sum: { totalAmount: null, discountAmount: null, taxAmount: null },
        _count: 0,
      } as never)
      vi.mocked(prisma.order.groupBy).mockResolvedValue([])
      vi.mocked(prisma.orderItem.groupBy).mockResolvedValue([])
      vi.mocked(prisma.product.findMany).mockResolvedValue([])
      vi.mocked(prisma.payment.groupBy).mockResolvedValue([])
      vi.mocked(prisma.paymentMethod.findMany).mockResolvedValue([])

      await getSalesReport({ ...dateParams, storeId: 'store-1' })

      expect(prisma.order.aggregate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ storeId: 'store-1' }),
        })
      )
    })
  })

  describe('getInventoryReport', () => {
    it('應回傳庫存報表摘要', async () => {
      vi.mocked(prisma.inventory.aggregate).mockResolvedValue({
        _sum: { quantity: 5000, reservedQty: 200 },
        _count: 100,
      } as never)
      vi.mocked(prisma.inventory.findMany).mockResolvedValue([
        {
          quantity: 100,
          product: { costPrice: { toNumber: () => 50 }, name: '商品1' },
        },
      ] as never)
      vi.mocked(prisma.inventoryMovement.groupBy).mockResolvedValue([])
      vi.mocked(prisma.inventory.groupBy).mockResolvedValue([])
      vi.mocked(prisma.warehouse.findMany).mockResolvedValue([])

      const result = await getInventoryReport({})

      expect(result.summary.totalQuantity).toBe(5000)
      expect(result.summary.reservedQty).toBe(200)
      expect(result.summary.availableQuantity).toBe(4800)
      expect(result.summary.totalValue).toBe(5000) // 100 * 50
      expect(result.summary.productCount).toBe(100)
    })

    it('應回傳低庫存商品列表', async () => {
      vi.mocked(prisma.inventory.aggregate).mockResolvedValue({
        _sum: { quantity: 1000, reservedQty: 0 },
        _count: 10,
      } as never)
      vi.mocked(prisma.inventory.findMany).mockResolvedValue([
        {
          quantity: 5,
          product: {
            id: 'p1',
            sku: 'P001',
            name: '低庫存商品',
            safetyStock: 10,
            costPrice: { toNumber: () => 100 },
          },
          warehouse: { code: 'W01', name: '主倉庫' },
        },
      ] as never)
      vi.mocked(prisma.inventoryMovement.groupBy).mockResolvedValue([])
      vi.mocked(prisma.inventory.groupBy).mockResolvedValue([])
      vi.mocked(prisma.warehouse.findMany).mockResolvedValue([])

      const result = await getInventoryReport({})

      expect(result.lowStockProducts).toHaveLength(1)
      expect(result.lowStockProducts[0].productName).toBe('低庫存商品')
      expect(result.lowStockProducts[0].quantity).toBe(5)
      expect(result.lowStockProducts[0].safetyStock).toBe(10)
    })

    it('應回傳倉庫庫存分布', async () => {
      vi.mocked(prisma.inventory.aggregate).mockResolvedValue({
        _sum: { quantity: 0, reservedQty: 0 },
        _count: 0,
      } as never)
      vi.mocked(prisma.inventory.findMany).mockResolvedValue([])
      vi.mocked(prisma.inventoryMovement.groupBy).mockResolvedValue([])
      vi.mocked(prisma.inventory.groupBy).mockResolvedValue([
        { warehouseId: 'w1', _sum: { quantity: 3000 }, _count: 50 },
        { warehouseId: 'w2', _sum: { quantity: 2000 }, _count: 30 },
      ] as never)
      vi.mocked(prisma.warehouse.findMany).mockResolvedValue([
        { id: 'w1', code: 'W01', name: '主倉庫' },
        { id: 'w2', code: 'W02', name: '分倉庫' },
      ] as never)

      const result = await getInventoryReport({})

      expect(result.warehouseInventory).toHaveLength(2)
      expect(result.warehouseInventory[0].warehouseName).toBe('主倉庫')
      expect(result.warehouseInventory[0].totalQuantity).toBe(3000)
    })

    it('應支援倉庫篩選', async () => {
      vi.mocked(prisma.inventory.aggregate).mockResolvedValue({
        _sum: { quantity: 0, reservedQty: 0 },
        _count: 0,
      } as never)
      vi.mocked(prisma.inventory.findMany).mockResolvedValue([])
      vi.mocked(prisma.inventoryMovement.groupBy).mockResolvedValue([])
      vi.mocked(prisma.inventory.groupBy).mockResolvedValue([])
      vi.mocked(prisma.warehouse.findMany).mockResolvedValue([])

      await getInventoryReport({ warehouseId: 'warehouse-1' })

      expect(prisma.inventory.aggregate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { warehouseId: 'warehouse-1' },
        })
      )
    })
  })

  describe('getPurchaseReport', () => {
    it('應回傳採購報表摘要', async () => {
      vi.mocked(prisma.purchaseOrder.aggregate).mockResolvedValue({
        _sum: { totalAmount: { toNumber: () => 500000 } },
        _count: 50,
      } as never)
      vi.mocked(prisma.purchaseOrder.groupBy).mockResolvedValue([])
      vi.mocked(prisma.supplier.findMany).mockResolvedValue([])

      const result = await getPurchaseReport(dateParams)

      expect(result.summary.totalPurchase).toBe(500000)
      expect(result.summary.orderCount).toBe(50)
      expect(result.summary.averageOrderValue).toBe(10000)
    })

    it('應回傳供應商採購排行', async () => {
      vi.mocked(prisma.purchaseOrder.aggregate).mockResolvedValue({
        _sum: { totalAmount: null },
        _count: 0,
      } as never)
      vi.mocked(prisma.purchaseOrder.groupBy).mockResolvedValue([
        {
          supplierId: 's1',
          _sum: { totalAmount: { toNumber: () => 200000 } },
          _count: 20,
        },
      ] as never)
      vi.mocked(prisma.supplier.findMany).mockResolvedValue([
        { id: 's1', code: 'S001', name: '主要供應商' },
      ] as never)

      const result = await getPurchaseReport(dateParams)

      expect(result.topSuppliers).toHaveLength(1)
      expect(result.topSuppliers[0].supplierName).toBe('主要供應商')
      expect(result.topSuppliers[0].totalAmount).toBe(200000)
    })

    it('應回傳狀態統計', async () => {
      vi.mocked(prisma.purchaseOrder.aggregate).mockResolvedValue({
        _sum: { totalAmount: null },
        _count: 0,
      } as never)
      vi.mocked(prisma.purchaseOrder.groupBy).mockResolvedValue([
        { status: 'COMPLETED', _count: 40, _sum: { totalAmount: { toNumber: () => 400000 } } },
        { status: 'PENDING', _count: 10, _sum: { totalAmount: { toNumber: () => 100000 } } },
      ] as never)
      vi.mocked(prisma.supplier.findMany).mockResolvedValue([])

      const result = await getPurchaseReport(dateParams)

      expect(result.statusStats).toHaveLength(2)
      expect(result.statusStats[0].status).toBe('COMPLETED')
      expect(result.statusStats[0].count).toBe(40)
    })

    it('應支援供應商篩選', async () => {
      vi.mocked(prisma.purchaseOrder.aggregate).mockResolvedValue({
        _sum: { totalAmount: null },
        _count: 0,
      } as never)
      vi.mocked(prisma.purchaseOrder.groupBy).mockResolvedValue([])
      vi.mocked(prisma.supplier.findMany).mockResolvedValue([])

      await getPurchaseReport({ ...dateParams, supplierId: 'supplier-1' })

      expect(prisma.purchaseOrder.aggregate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ supplierId: 'supplier-1' }),
        })
      )
    })
  })

  describe('getProfitReport', () => {
    it('應回傳利潤報表摘要', async () => {
      vi.mocked(prisma.orderItem.findMany).mockResolvedValue([
        {
          productId: 'p1',
          productName: '商品1',
          quantity: 10,
          subtotal: { toNumber: () => 1000 },
          product: {
            costPrice: { toNumber: () => 50 },
            category: { name: '分類1' },
          },
        },
      ] as never)

      const result = await getProfitReport(dateParams)

      // 營收: 1000, 成本: 10 * 50 = 500, 毛利: 500
      expect(result.summary.totalRevenue).toBe(1000)
      expect(result.summary.totalCost).toBe(500)
      expect(result.summary.grossProfit).toBe(500)
      expect(result.summary.profitMargin).toBe(50)
    })

    it('應回傳分類利潤分析', async () => {
      vi.mocked(prisma.orderItem.findMany).mockResolvedValue([
        {
          productId: 'p1',
          productName: '商品1',
          quantity: 10,
          subtotal: { toNumber: () => 1000 },
          product: {
            costPrice: { toNumber: () => 50 },
            category: { name: '電子產品' },
          },
        },
        {
          productId: 'p2',
          productName: '商品2',
          quantity: 5,
          subtotal: { toNumber: () => 500 },
          product: {
            costPrice: { toNumber: () => 60 },
            category: { name: '電子產品' },
          },
        },
      ] as never)

      const result = await getProfitReport(dateParams)

      expect(result.categoryProfits).toHaveLength(1)
      expect(result.categoryProfits[0].category).toBe('電子產品')
      // 電子產品營收: 1000 + 500 = 1500
      // 電子產品成本: 500 + 300 = 800
      // 電子產品毛利: 700
      expect(result.categoryProfits[0].profit).toBe(700)
    })

    it('應回傳商品利潤排行', async () => {
      vi.mocked(prisma.orderItem.findMany).mockResolvedValue([
        {
          productId: 'p1',
          productName: '高利潤商品',
          quantity: 20,
          subtotal: { toNumber: () => 2000 },
          product: {
            costPrice: { toNumber: () => 30 },
            category: null,
          },
        },
      ] as never)

      const result = await getProfitReport(dateParams)

      expect(result.topProfitProducts).toHaveLength(1)
      expect(result.topProfitProducts[0].name).toBe('高利潤商品')
      // 營收: 2000, 成本: 20 * 30 = 600, 利潤: 1400
      expect(result.topProfitProducts[0].profit).toBe(1400)
    })

    it('無訂單時應回傳空報表', async () => {
      vi.mocked(prisma.orderItem.findMany).mockResolvedValue([])

      const result = await getProfitReport(dateParams)

      expect(result.summary.totalRevenue).toBe(0)
      expect(result.summary.totalCost).toBe(0)
      expect(result.summary.grossProfit).toBe(0)
      expect(result.summary.profitMargin).toBe(0)
      expect(result.categoryProfits).toHaveLength(0)
      expect(result.topProfitProducts).toHaveLength(0)
    })

    it('應支援門市篩選', async () => {
      vi.mocked(prisma.orderItem.findMany).mockResolvedValue([])

      await getProfitReport({ ...dateParams, storeId: 'store-1' })

      expect(prisma.orderItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            order: expect.objectContaining({ storeId: 'store-1' }),
          }),
        })
      )
    })
  })
})
