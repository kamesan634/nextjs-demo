'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import type { ActionResult } from '@/types'

// ===================================
// 庫存查詢相關 Actions
// ===================================

/**
 * 取得庫存列表
 */
export async function getInventoryList(params?: {
  page?: number
  pageSize?: number
  search?: string
  warehouseId?: string
  storeId?: string
  lowStock?: boolean
}) {
  const page = params?.page || 1
  const pageSize = params?.pageSize || 10
  const skip = (page - 1) * pageSize

  const where = {
    ...(params?.warehouseId && { warehouseId: params.warehouseId }),
    ...(params?.storeId && { storeId: params.storeId }),
    ...(params?.search && {
      product: {
        OR: [
          { sku: { contains: params.search, mode: 'insensitive' as const } },
          { name: { contains: params.search, mode: 'insensitive' as const } },
          { barcode: { contains: params.search, mode: 'insensitive' as const } },
        ],
      },
    }),
  }

  const [inventories, total] = await Promise.all([
    prisma.inventory.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            sku: true,
            name: true,
            barcode: true,
            safetyStock: true,
            reorderPoint: true,
            sellingPrice: true,
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        warehouse: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        store: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
      orderBy: [{ product: { name: 'asc' } }],
      skip,
      take: pageSize,
    }),
    prisma.inventory.count({ where }),
  ])

  // 如果需要篩選低庫存
  let filteredData = inventories
  if (params?.lowStock) {
    filteredData = inventories.filter((inv) => inv.quantity <= (inv.product.safetyStock || 0))
  }

  return {
    data: filteredData,
    pagination: {
      total: params?.lowStock ? filteredData.length : total,
      page,
      pageSize,
      totalPages: Math.ceil((params?.lowStock ? filteredData.length : total) / pageSize),
      hasNextPage: page < Math.ceil((params?.lowStock ? filteredData.length : total) / pageSize),
      hasPrevPage: page > 1,
    },
  }
}

/**
 * 取得商品在各倉庫的庫存
 */
export async function getProductInventory(productId: string) {
  return prisma.inventory.findMany({
    where: { productId },
    include: {
      warehouse: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
      store: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
    },
  })
}

/**
 * 取得低庫存警示列表
 */
export async function getLowStockAlerts(params?: { page?: number; pageSize?: number }) {
  const page = params?.page || 1
  const pageSize = params?.pageSize || 10
  const skip = (page - 1) * pageSize

  // 取得所有庫存並篩選低庫存
  const allInventories = await prisma.inventory.findMany({
    include: {
      product: {
        select: {
          id: true,
          sku: true,
          name: true,
          safetyStock: true,
          reorderPoint: true,
          reorderQty: true,
        },
      },
      warehouse: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
    },
  })

  const lowStockItems = allInventories.filter(
    (inv) => inv.quantity <= (inv.product.safetyStock || 0)
  )

  const paginatedItems = lowStockItems.slice(skip, skip + pageSize)

  return {
    data: paginatedItems,
    pagination: {
      total: lowStockItems.length,
      page,
      pageSize,
      totalPages: Math.ceil(lowStockItems.length / pageSize),
      hasNextPage: page < Math.ceil(lowStockItems.length / pageSize),
      hasPrevPage: page > 1,
    },
  }
}

// ===================================
// 庫存異動相關 Actions
// ===================================

/**
 * 取得庫存異動紀錄
 */
export async function getInventoryMovements(params?: {
  page?: number
  pageSize?: number
  productId?: string
  warehouseId?: string
  movementType?: string
  startDate?: string
  endDate?: string
}) {
  const page = params?.page || 1
  const pageSize = params?.pageSize || 10
  const skip = (page - 1) * pageSize

  const where = {
    ...(params?.productId && { productId: params.productId }),
    ...(params?.warehouseId && { warehouseId: params.warehouseId }),
    ...(params?.movementType && { movementType: params.movementType }),
    ...(params?.startDate || params?.endDate
      ? {
          createdAt: {
            ...(params?.startDate && { gte: new Date(params.startDate) }),
            ...(params?.endDate && { lte: new Date(params.endDate + 'T23:59:59') }),
          },
        }
      : {}),
  }

  const [movements, total] = await Promise.all([
    prisma.inventoryMovement.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            sku: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.inventoryMovement.count({ where }),
  ])

  return {
    data: movements,
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

// ===================================
// 庫存調整相關 Actions
// ===================================

/**
 * 調整庫存數量
 */
export async function adjustInventory(data: {
  productId: string
  warehouseId?: string
  storeId?: string
  type: 'ADD' | 'SUBTRACT' | 'DAMAGE'
  quantity: number
  reason?: string
}): Promise<ActionResult> {
  try {
    // 查詢現有庫存
    const inventory = await prisma.inventory.findFirst({
      where: {
        productId: data.productId,
        warehouseId: data.warehouseId ?? null,
        storeId: data.storeId ?? null,
      },
    })

    if (!inventory) {
      return {
        success: false,
        message: '找不到對應的庫存紀錄',
      }
    }

    // 計算調整數量
    const adjustQty = data.type === 'ADD' ? data.quantity : -data.quantity

    // 檢查庫存是否足夠
    if (data.type !== 'ADD' && inventory.quantity + adjustQty < 0) {
      return {
        success: false,
        message: '庫存數量不足',
      }
    }

    const newQty = inventory.quantity + adjustQty
    const newAvailableQty = Math.max(0, inventory.availableQty + adjustQty)

    // 產生調整單號
    const adjustmentNo = `ADJ${Date.now()}`

    // 更新庫存並建立調整紀錄
    await prisma.$transaction([
      // 更新庫存
      prisma.inventory.update({
        where: { id: inventory.id },
        data: {
          quantity: newQty,
          availableQty: newAvailableQty,
        },
      }),
      // 建立庫存調整紀錄
      prisma.stockAdjustment.create({
        data: {
          adjustmentNo,
          productId: data.productId,
          warehouseId: data.warehouseId || null,
          storeId: data.storeId || null,
          type: data.type,
          quantity: Math.abs(data.quantity),
          beforeQty: inventory.quantity,
          afterQty: newQty,
          reason: data.reason,
          status: 'COMPLETED',
        },
      }),
      // 建立庫存異動紀錄
      prisma.inventoryMovement.create({
        data: {
          productId: data.productId,
          movementType: 'ADJUST',
          quantity: adjustQty,
          beforeQty: inventory.quantity,
          afterQty: newQty,
          warehouseId: data.warehouseId || null,
          storeId: data.storeId || null,
          referenceType: 'ADJUSTMENT',
          referenceId: adjustmentNo,
          reason: data.reason,
        },
      }),
    ])

    revalidatePath('/inventory')

    return {
      success: true,
      message: '庫存調整成功',
    }
  } catch (error) {
    console.error('Adjust inventory error:', error)
    return {
      success: false,
      message: '庫存調整失敗',
    }
  }
}

/**
 * 取得庫存調整紀錄
 */
export async function getStockAdjustments(params?: {
  page?: number
  pageSize?: number
  productId?: string
  startDate?: string
  endDate?: string
}) {
  const page = params?.page || 1
  const pageSize = params?.pageSize || 10
  const skip = (page - 1) * pageSize

  const where = {
    ...(params?.productId && { productId: params.productId }),
    ...(params?.startDate || params?.endDate
      ? {
          createdAt: {
            ...(params?.startDate && { gte: new Date(params.startDate) }),
            ...(params?.endDate && { lte: new Date(params.endDate + 'T23:59:59') }),
          },
        }
      : {}),
  }

  const [adjustments, total] = await Promise.all([
    prisma.stockAdjustment.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            sku: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.stockAdjustment.count({ where }),
  ])

  return {
    data: adjustments,
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

// ===================================
// 庫存盤點相關 Actions
// ===================================

/**
 * 取得盤點單列表
 */
export async function getStockCounts(params?: {
  page?: number
  pageSize?: number
  warehouseId?: string
  status?: string
}) {
  const page = params?.page || 1
  const pageSize = params?.pageSize || 10
  const skip = (page - 1) * pageSize

  const where = {
    ...(params?.warehouseId && { warehouseId: params.warehouseId }),
    ...(params?.status && { status: params.status }),
  }

  const [counts, total] = await Promise.all([
    prisma.stockCount.findMany({
      where,
      include: {
        warehouse: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        _count: {
          select: { items: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.stockCount.count({ where }),
  ])

  return {
    data: counts,
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
 * 取得單一盤點單詳情
 */
export async function getStockCount(id: string) {
  return prisma.stockCount.findUnique({
    where: { id },
    include: {
      warehouse: true,
      items: {
        include: {
          product: {
            select: {
              id: true,
              sku: true,
              name: true,
              barcode: true,
            },
          },
        },
      },
    },
  })
}

/**
 * 建立盤點單
 */
export async function createStockCount(data: {
  warehouseId: string
  type: string
  productIds?: string[]
  notes?: string
}): Promise<ActionResult<{ id: string }>> {
  try {
    // 產生盤點單號
    const countNo = `SC${Date.now()}`

    // 取得需要盤點的商品庫存
    const inventories = await prisma.inventory.findMany({
      where: {
        warehouseId: data.warehouseId,
        ...(data.productIds && data.productIds.length > 0
          ? { productId: { in: data.productIds } }
          : {}),
      },
      include: {
        product: {
          select: {
            id: true,
            sku: true,
            name: true,
          },
        },
      },
    })

    // 建立盤點單和明細
    const stockCount = await prisma.stockCount.create({
      data: {
        countNo,
        warehouseId: data.warehouseId,
        type: data.type,
        status: 'DRAFT',
        notes: data.notes,
        items: {
          create: inventories.map((inv) => ({
            productId: inv.productId,
            systemQty: inv.quantity,
          })),
        },
      },
    })

    revalidatePath('/inventory')

    return {
      success: true,
      message: '盤點單建立成功',
      data: { id: stockCount.id },
    }
  } catch (error) {
    console.error('Create stock count error:', error)
    return {
      success: false,
      message: '建立盤點單失敗',
    }
  }
}

/**
 * 更新盤點單明細
 */
export async function updateStockCountItem(
  itemId: string,
  countedQty: number
): Promise<ActionResult> {
  try {
    const item = await prisma.stockCountItem.findUnique({
      where: { id: itemId },
    })

    if (!item) {
      return {
        success: false,
        message: '找不到盤點明細',
      }
    }

    await prisma.stockCountItem.update({
      where: { id: itemId },
      data: {
        countedQty,
        diffQty: countedQty - item.systemQty,
      },
    })

    revalidatePath('/inventory')

    return {
      success: true,
      message: '盤點數量更新成功',
    }
  } catch (error) {
    console.error('Update stock count item error:', error)
    return {
      success: false,
      message: '更新盤點數量失敗',
    }
  }
}

/**
 * 完成盤點並調整庫存
 */
export async function completeStockCount(id: string): Promise<ActionResult> {
  try {
    const stockCount = await prisma.stockCount.findUnique({
      where: { id },
      include: {
        items: true,
      },
    })

    if (!stockCount) {
      return {
        success: false,
        message: '找不到盤點單',
      }
    }

    if (stockCount.status === 'COMPLETED') {
      return {
        success: false,
        message: '此盤點單已完成',
      }
    }

    // 檢查所有明細是否都已盤點
    const unCountedItems = stockCount.items.filter((item) => item.countedQty === null)
    if (unCountedItems.length > 0) {
      return {
        success: false,
        message: `尚有 ${unCountedItems.length} 項商品未盤點`,
      }
    }

    // 更新庫存並建立異動紀錄
    const transactions = []

    for (const item of stockCount.items) {
      if (item.countedQty !== null && item.diffQty !== 0) {
        // 更新庫存
        transactions.push(
          prisma.inventory.updateMany({
            where: {
              productId: item.productId,
              warehouseId: stockCount.warehouseId,
            },
            data: {
              quantity: item.countedQty!,
              availableQty: item.countedQty!,
              lastCountDate: new Date(),
            },
          })
        )

        // 建立異動紀錄
        transactions.push(
          prisma.inventoryMovement.create({
            data: {
              productId: item.productId,
              movementType: 'ADJUST',
              quantity: item.diffQty!,
              beforeQty: item.systemQty,
              afterQty: item.countedQty!,
              warehouseId: stockCount.warehouseId,
              referenceType: 'STOCK_COUNT',
              referenceId: stockCount.countNo,
              reason: '庫存盤點調整',
            },
          })
        )
      }
    }

    // 更新盤點單狀態
    transactions.push(
      prisma.stockCount.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      })
    )

    await prisma.$transaction(transactions)

    revalidatePath('/inventory')

    return {
      success: true,
      message: '盤點單已完成，庫存已調整',
    }
  } catch (error) {
    console.error('Complete stock count error:', error)
    return {
      success: false,
      message: '完成盤點失敗',
    }
  }
}

// ===================================
// 庫存統計相關 Actions
// ===================================

/**
 * 取得庫存統計資料
 */
export async function getInventoryStats() {
  const [totalProducts, totalInventory, outOfStockCount] = await Promise.all([
    prisma.product.count({ where: { isActive: true } }),
    prisma.inventory.aggregate({
      _sum: { quantity: true },
    }),
    prisma.inventory.count({
      where: {
        quantity: { lte: 0 },
      },
    }),
  ])

  // 計算低庫存數量（需要額外查詢）
  const inventoriesWithProduct = await prisma.inventory.findMany({
    include: {
      product: {
        select: {
          safetyStock: true,
        },
      },
    },
  })

  const actualLowStockCount = inventoriesWithProduct.filter(
    (inv) => inv.quantity > 0 && inv.quantity <= (inv.product.safetyStock || 0)
  ).length

  return {
    totalProducts,
    totalInventory: totalInventory._sum.quantity || 0,
    lowStockCount: actualLowStockCount,
    outOfStockCount,
  }
}
