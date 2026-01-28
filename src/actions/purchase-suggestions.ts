'use server'

import prisma from '@/lib/prisma'

/**
 * 取得採購建議
 * 基於安全庫存和補貨點，找出需要補貨的商品
 */
export async function getPurchaseSuggestions(params?: {
  page?: number
  pageSize?: number
  warehouseId?: string
  categoryId?: string
}) {
  const page = params?.page || 1
  const pageSize = params?.pageSize || 20
  const skip = (page - 1) * pageSize

  // 取得所有庫存低於補貨點的商品
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      reorderPoint: { gt: 0 },
      ...(params?.categoryId && { categoryId: params.categoryId }),
    },
    include: {
      category: { select: { name: true } },
      unit: { select: { name: true } },
      inventories: {
        where: params?.warehouseId ? { warehouseId: params.warehouseId } : {},
        select: { quantity: true, warehouseId: true, reservedQty: true },
      },
      supplierPrices: {
        where: { isPreferred: true },
        include: {
          supplier: { select: { id: true, name: true } },
        },
        take: 1,
      },
    },
    orderBy: { name: 'asc' },
  })

  // 過濾出需要補貨的商品
  const suggestions = products
    .map((product) => {
      const totalStock = product.inventories.reduce((sum, inv) => sum + inv.quantity, 0)
      const totalReserved = product.inventories.reduce((sum, inv) => sum + inv.reservedQty, 0)
      const availableStock = totalStock - totalReserved

      if (availableStock > product.reorderPoint) {
        return null
      }

      const preferredSupplier = product.supplierPrices[0]

      return {
        productId: product.id,
        productSku: product.sku,
        productName: product.name,
        category: product.category.name,
        unit: product.unit.name,
        currentStock: totalStock,
        availableStock,
        safetyStock: product.safetyStock,
        reorderPoint: product.reorderPoint,
        suggestedQty: product.reorderQty || product.safetyStock * 2 - availableStock,
        costPrice: Number(product.costPrice),
        supplierId: preferredSupplier?.supplier.id || null,
        supplierName: preferredSupplier?.supplier.name || '未指定',
        supplierPrice: preferredSupplier
          ? Number(preferredSupplier.price)
          : Number(product.costPrice),
        urgency:
          availableStock <= 0
            ? 'CRITICAL'
            : availableStock <= product.safetyStock
              ? 'HIGH'
              : 'NORMAL',
      }
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)

  const total = suggestions.length
  const paginatedSuggestions = suggestions.slice(skip, skip + pageSize)

  return {
    data: paginatedSuggestions,
    pagination: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      hasNextPage: page < Math.ceil(total / pageSize),
      hasPrevPage: page > 1,
    },
    summary: {
      total,
      critical: suggestions.filter((s) => s?.urgency === 'CRITICAL').length,
      high: suggestions.filter((s) => s?.urgency === 'HIGH').length,
      normal: suggestions.filter((s) => s?.urgency === 'NORMAL').length,
      estimatedCost: suggestions.reduce(
        (sum, s) => sum + (s?.suggestedQty || 0) * (s?.supplierPrice || 0),
        0
      ),
    },
  }
}
