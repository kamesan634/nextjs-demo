'use server'

import prisma from '@/lib/prisma'
import type { Decimal } from '@prisma/client/runtime/library'

/**
 * 報表相關 Server Actions
 * 提供銷售、庫存、採購、利潤分析等報表數據
 */

// ===== 類型定義 =====

// 熱銷商品 groupBy 結果類型
interface TopProductGroupBy {
  productId: string
  _sum: {
    quantity: number | null
    subtotal: Decimal | null
  }
}

// 商品資訊類型
interface ProductInfo {
  id: string
  sku: string
  name: string
}

// 付款統計 groupBy 結果類型
interface PaymentStatGroupBy {
  paymentMethodId: string
  _sum: {
    amount: Decimal | null
  }
  _count: number
}

// 付款方式類型
interface PaymentMethodInfo {
  id: string
  code: string
  name: string
}

// 每日銷售 groupBy 結果類型
interface DailySalesGroupBy {
  createdAt: Date
  _sum: {
    totalAmount: Decimal | null
  }
  _count: number
}

// 帶有商品資訊的熱銷商品類型
interface TopProductWithInfo extends TopProductGroupBy {
  productCode: string
  productName: string
}

// 庫存與商品關聯類型
interface InventoryWithProduct {
  quantity: number
  product: {
    costPrice: Decimal | null
    name: string
  }
}

// 低庫存商品類型
interface LowStockInventory {
  quantity: number
  product: {
    id: string
    sku: string
    name: string
    safetyStock: number
  }
  warehouse: {
    code: string
    name: string
  } | null
}

// 按倉庫分組的庫存類型
interface InventoryByWarehouseGroupBy {
  warehouseId: string | null
  _sum: {
    quantity: number | null
  }
  _count: number
}

// 倉庫資訊類型
interface WarehouseInfo {
  id: string
  code: string
  name: string
}

// 庫存異動 groupBy 結果類型
interface MovementGroupBy {
  productId: string
  _sum: {
    quantity: number | null
  }
}

// 按供應商分組的採購類型
interface PurchaseBySupplierGroupBy {
  supplierId: string
  _sum: {
    totalAmount: Decimal | null
  }
  _count: number
}

// 供應商資訊類型
interface SupplierInfo {
  id: string
  code: string
  name: string
}

// 採購狀態統計類型
interface StatusStatGroupBy {
  status: string
  _count: number
  _sum: {
    totalAmount: Decimal | null
  }
}

// 月度採購趨勢類型
interface MonthlyPurchaseGroupBy {
  orderDate: Date
  _sum: {
    totalAmount: Decimal | null
  }
  _count: number
}

// 訂單明細與商品關聯類型
interface OrderItemWithProduct {
  productId: string
  productName: string
  quantity: number
  subtotal: Decimal
  product: {
    costPrice: Decimal | null
    category: {
      name: string
    } | null
  }
}

// 利潤統計項目類型
interface ProfitItem {
  productId: string
  name: string
  revenue: number
  cost: number
  quantity: number
}

// ===== 銷售報表 =====

/**
 * 取得銷售報表數據
 */
export async function getSalesReport(params: { startDate: Date; endDate: Date; storeId?: string }) {
  const { startDate, endDate, storeId } = params

  // 銷售總覽
  const salesSummary = await prisma.order.aggregate({
    where: {
      createdAt: { gte: startDate, lte: endDate },
      status: { not: 'CANCELLED' },
      ...(storeId && { storeId }),
    },
    _sum: {
      totalAmount: true,
      discountAmount: true,
      taxAmount: true,
    },
    _count: true,
  })

  // 按日期分組的銷售數據
  const dailySales = await prisma.order.groupBy({
    by: ['createdAt'],
    where: {
      createdAt: { gte: startDate, lte: endDate },
      status: { not: 'CANCELLED' },
      ...(storeId && { storeId }),
    },
    _sum: {
      totalAmount: true,
    },
    _count: true,
  })

  // 熱銷商品 Top 10
  const topProducts = await prisma.orderItem.groupBy({
    by: ['productId'],
    where: {
      order: {
        createdAt: { gte: startDate, lte: endDate },
        status: { not: 'CANCELLED' },
        ...(storeId && { storeId }),
      },
    },
    _sum: {
      quantity: true,
      subtotal: true,
    },
    orderBy: {
      _sum: {
        subtotal: 'desc',
      },
    },
    take: 10,
  })

  // 取得商品資訊
  const productIds = topProducts.map((p: TopProductGroupBy) => p.productId)
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, sku: true, name: true },
  })

  const topProductsWithInfo = topProducts.map((p: TopProductGroupBy) => {
    const product = products.find((prod: ProductInfo) => prod.id === p.productId)
    return {
      ...p,
      productCode: product?.sku || '',
      productName: product?.name || '',
    }
  })

  // 付款方式統計
  const paymentStats = await prisma.payment.groupBy({
    by: ['paymentMethodId'],
    where: {
      order: {
        createdAt: { gte: startDate, lte: endDate },
        status: { not: 'CANCELLED' },
        ...(storeId && { storeId }),
      },
    },
    _sum: {
      amount: true,
    },
    _count: true,
  })

  // 取得付款方式名稱
  const paymentMethodIds = paymentStats.map((p: PaymentStatGroupBy) => p.paymentMethodId)
  const paymentMethods = await prisma.paymentMethod.findMany({
    where: { id: { in: paymentMethodIds } },
    select: { id: true, code: true, name: true },
  })

  return {
    summary: {
      totalSales: salesSummary._sum.totalAmount?.toNumber() || 0,
      totalDiscount: salesSummary._sum.discountAmount?.toNumber() || 0,
      totalTax: salesSummary._sum.taxAmount?.toNumber() || 0,
      orderCount: salesSummary._count,
      averageOrderValue:
        salesSummary._count > 0
          ? (salesSummary._sum.totalAmount?.toNumber() || 0) / salesSummary._count
          : 0,
    },
    dailySales: dailySales.map((d: DailySalesGroupBy) => ({
      date: d.createdAt,
      totalAmount: d._sum.totalAmount?.toNumber() || 0,
      orderCount: d._count,
    })),
    topProducts: topProductsWithInfo.map((p: TopProductWithInfo) => ({
      productId: p.productId,
      productCode: p.productCode,
      productName: p.productName,
      quantity: p._sum.quantity || 0,
      revenue: p._sum.subtotal?.toNumber() || 0,
    })),
    paymentStats: paymentStats.map((p: PaymentStatGroupBy) => {
      const method = paymentMethods.find((m: PaymentMethodInfo) => m.id === p.paymentMethodId)
      return {
        method: method?.name || method?.code || '未知',
        amount: p._sum.amount?.toNumber() || 0,
        count: p._count,
      }
    }),
  }
}

// ===== 庫存報表 =====

/**
 * 取得庫存報表數據
 */
export async function getInventoryReport(params: { warehouseId?: string }) {
  const { warehouseId } = params

  // 庫存總覽
  const inventorySummary = await prisma.inventory.aggregate({
    where: warehouseId ? { warehouseId } : {},
    _sum: {
      quantity: true,
      reservedQty: true,
    },
    _count: true,
  })

  // 庫存價值
  const inventoryWithProducts = await prisma.inventory.findMany({
    where: warehouseId ? { warehouseId } : {},
    include: {
      product: {
        select: { costPrice: true, name: true },
      },
    },
  })

  const totalValue = inventoryWithProducts.reduce((sum: number, inv: InventoryWithProduct) => {
    return sum + inv.quantity * (inv.product.costPrice?.toNumber() || 0)
  }, 0)

  // 低庫存商品 - 先取得所有庫存再過濾
  const allInventory = await prisma.inventory.findMany({
    where: warehouseId ? { warehouseId } : {},
    include: {
      product: {
        select: { id: true, sku: true, name: true, safetyStock: true },
      },
      warehouse: {
        select: { code: true, name: true },
      },
    },
    orderBy: { quantity: 'asc' },
  })

  // 過濾低庫存商品 (quantity <= product.safetyStock)
  const lowStockProducts = allInventory
    .filter((inv: LowStockInventory) => inv.quantity <= inv.product.safetyStock)
    .slice(0, 20)

  // 庫存週轉率（最近 30 天）
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const recentMovements = await prisma.inventoryMovement.groupBy({
    by: ['productId'],
    where: {
      createdAt: { gte: thirtyDaysAgo },
      movementType: 'OUT',
      ...(warehouseId && { warehouseId }),
    },
    _sum: {
      quantity: true,
    },
  })

  // 按倉庫分組庫存
  const inventoryByWarehouse = await prisma.inventory.groupBy({
    by: ['warehouseId'],
    _sum: {
      quantity: true,
    },
    _count: true,
  })

  const warehouses = await prisma.warehouse.findMany({
    select: { id: true, code: true, name: true },
  })

  const warehouseInventory = inventoryByWarehouse.map((inv: InventoryByWarehouseGroupBy) => {
    const warehouse = warehouses.find((w: WarehouseInfo) => w.id === inv.warehouseId)
    return {
      warehouseId: inv.warehouseId,
      warehouseCode: warehouse?.code || '',
      warehouseName: warehouse?.name || '',
      totalQuantity: inv._sum.quantity || 0,
      productCount: inv._count,
    }
  })

  return {
    summary: {
      totalQuantity: inventorySummary._sum.quantity || 0,
      reservedQty: inventorySummary._sum.reservedQty || 0,
      availableQuantity:
        (inventorySummary._sum.quantity || 0) - (inventorySummary._sum.reservedQty || 0),
      totalValue,
      productCount: inventorySummary._count,
    },
    lowStockProducts: lowStockProducts.map((inv: LowStockInventory) => ({
      productId: inv.product.id,
      productCode: inv.product.sku,
      productName: inv.product.name,
      warehouseCode: inv.warehouse?.code || '',
      warehouseName: inv.warehouse?.name || '',
      quantity: inv.quantity,
      safetyStock: inv.product.safetyStock,
    })),
    warehouseInventory,
    turnoverData: recentMovements.map((m: MovementGroupBy) => ({
      productId: m.productId,
      outQuantity: m._sum.quantity || 0,
    })),
  }
}

// ===== 採購報表 =====

/**
 * 取得採購報表數據
 */
export async function getPurchaseReport(params: {
  startDate: Date
  endDate: Date
  supplierId?: string
}) {
  const { startDate, endDate, supplierId } = params

  // 採購總覽
  const purchaseSummary = await prisma.purchaseOrder.aggregate({
    where: {
      orderDate: { gte: startDate, lte: endDate },
      status: { not: 'CANCELLED' },
      ...(supplierId && { supplierId }),
    },
    _sum: {
      totalAmount: true,
    },
    _count: true,
  })

  // 按供應商分組
  const purchaseBySupplier = await prisma.purchaseOrder.groupBy({
    by: ['supplierId'],
    where: {
      orderDate: { gte: startDate, lte: endDate },
      status: { not: 'CANCELLED' },
    },
    _sum: {
      totalAmount: true,
    },
    _count: true,
    orderBy: {
      _sum: {
        totalAmount: 'desc',
      },
    },
    take: 10,
  })

  const supplierIds = purchaseBySupplier.map((p: PurchaseBySupplierGroupBy) => p.supplierId)
  const suppliers = await prisma.supplier.findMany({
    where: { id: { in: supplierIds } },
    select: { id: true, code: true, name: true },
  })

  const topSuppliers = purchaseBySupplier.map((p: PurchaseBySupplierGroupBy) => {
    const supplier = suppliers.find((s: SupplierInfo) => s.id === p.supplierId)
    return {
      supplierId: p.supplierId,
      supplierCode: supplier?.code || '',
      supplierName: supplier?.name || '',
      totalAmount: p._sum.totalAmount?.toNumber() || 0,
      orderCount: p._count,
    }
  })

  // 採購狀態統計
  const statusStats = await prisma.purchaseOrder.groupBy({
    by: ['status'],
    where: {
      orderDate: { gte: startDate, lte: endDate },
      ...(supplierId && { supplierId }),
    },
    _count: true,
    _sum: {
      totalAmount: true,
    },
  })

  // 月度採購趨勢
  const monthlyPurchase = await prisma.purchaseOrder.groupBy({
    by: ['orderDate'],
    where: {
      orderDate: { gte: startDate, lte: endDate },
      status: { not: 'CANCELLED' },
      ...(supplierId && { supplierId }),
    },
    _sum: {
      totalAmount: true,
    },
    _count: true,
  })

  return {
    summary: {
      totalPurchase: purchaseSummary._sum.totalAmount?.toNumber() || 0,
      orderCount: purchaseSummary._count,
      averageOrderValue:
        purchaseSummary._count > 0
          ? (purchaseSummary._sum.totalAmount?.toNumber() || 0) / purchaseSummary._count
          : 0,
    },
    topSuppliers,
    statusStats: statusStats.map((s: StatusStatGroupBy) => ({
      status: s.status,
      count: s._count,
      amount: s._sum.totalAmount?.toNumber() || 0,
    })),
    monthlyTrend: monthlyPurchase.map((m: MonthlyPurchaseGroupBy) => ({
      date: m.orderDate,
      totalAmount: m._sum.totalAmount?.toNumber() || 0,
      orderCount: m._count,
    })),
  }
}

// ===== 利潤分析報表 =====

/**
 * 取得利潤分析報表數據
 */
export async function getProfitReport(params: {
  startDate: Date
  endDate: Date
  storeId?: string
}) {
  const { startDate, endDate, storeId } = params

  // 取得銷售明細（包含成本）
  const orderItems = await prisma.orderItem.findMany({
    where: {
      order: {
        createdAt: { gte: startDate, lte: endDate },
        status: { in: ['COMPLETED', 'SHIPPED', 'DELIVERED'] },
        ...(storeId && { storeId }),
      },
    },
    include: {
      product: {
        select: { costPrice: true, category: { select: { name: true } } },
      },
    },
  })

  // 計算總收入、成本、毛利
  let totalRevenue = 0
  let totalCost = 0

  orderItems.forEach((item: OrderItemWithProduct) => {
    const revenue = item.subtotal.toNumber()
    const cost = item.quantity * (item.product.costPrice?.toNumber() || 0)
    totalRevenue += revenue
    totalCost += cost
  })

  const grossProfit = totalRevenue - totalCost
  const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0

  // 按商品分類統計利潤
  const profitByCategory: Record<string, { revenue: number; cost: number; profit: number }> = {}

  orderItems.forEach((item: OrderItemWithProduct) => {
    const categoryName = item.product.category?.name || '未分類'
    if (!profitByCategory[categoryName]) {
      profitByCategory[categoryName] = { revenue: 0, cost: 0, profit: 0 }
    }
    const revenue = item.subtotal.toNumber()
    const cost = item.quantity * (item.product.costPrice?.toNumber() || 0)
    profitByCategory[categoryName].revenue += revenue
    profitByCategory[categoryName].cost += cost
    profitByCategory[categoryName].profit += revenue - cost
  })

  const categoryProfits = Object.entries(profitByCategory)
    .map(([category, data]: [string, { revenue: number; cost: number; profit: number }]) => ({
      category,
      revenue: data.revenue,
      cost: data.cost,
      profit: data.profit,
      margin: data.revenue > 0 ? (data.profit / data.revenue) * 100 : 0,
    }))
    .sort((a, b) => b.profit - a.profit)

  // 按商品統計利潤 Top 10
  const profitByProduct: Record<
    string,
    { productId: string; name: string; revenue: number; cost: number; quantity: number }
  > = {}

  orderItems.forEach((item: OrderItemWithProduct) => {
    if (!profitByProduct[item.productId]) {
      profitByProduct[item.productId] = {
        productId: item.productId,
        name: item.productName,
        revenue: 0,
        cost: 0,
        quantity: 0,
      }
    }
    const revenue = item.subtotal.toNumber()
    const cost = item.quantity * (item.product.costPrice?.toNumber() || 0)
    profitByProduct[item.productId].revenue += revenue
    profitByProduct[item.productId].cost += cost
    profitByProduct[item.productId].quantity += item.quantity
  })

  const topProfitProducts = Object.values(profitByProduct)
    .map((p: ProfitItem) => ({
      ...p,
      profit: p.revenue - p.cost,
      margin: p.revenue > 0 ? ((p.revenue - p.cost) / p.revenue) * 100 : 0,
    }))
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 10)

  return {
    summary: {
      totalRevenue,
      totalCost,
      grossProfit,
      profitMargin,
    },
    categoryProfits,
    topProfitProducts,
  }
}
