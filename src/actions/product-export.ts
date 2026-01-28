'use server'

import prisma from '@/lib/prisma'
import { createExcelBuffer, productHeaderMapping } from '@/lib/excel'

/**
 * 匯出商品資料
 */
export async function exportProducts(params?: {
  categoryId?: string
  isActive?: boolean
  search?: string
}): Promise<Buffer> {
  const where = {
    ...(params?.categoryId && { categoryId: params.categoryId }),
    ...(params?.isActive !== undefined && { isActive: params.isActive }),
    ...(params?.search && {
      OR: [
        { sku: { contains: params.search, mode: 'insensitive' as const } },
        { name: { contains: params.search, mode: 'insensitive' as const } },
      ],
    }),
  }

  const products = await prisma.product.findMany({
    where,
    include: {
      category: { select: { code: true } },
      unit: { select: { code: true } },
    },
    orderBy: { sku: 'asc' },
  })

  const data = products.map((p) => ({
    sku: p.sku,
    barcode: p.barcode || '',
    name: p.name,
    shortName: p.shortName || '',
    categoryCode: p.category.code,
    unitCode: p.unit.code,
    costPrice: Number(p.costPrice),
    listPrice: Number(p.listPrice),
    sellingPrice: Number(p.sellingPrice),
    safetyStock: p.safetyStock,
    reorderPoint: p.reorderPoint,
    reorderQty: p.reorderQty,
    description: p.description || '',
  }))

  return createExcelBuffer(data, '商品清單', productHeaderMapping)
}
