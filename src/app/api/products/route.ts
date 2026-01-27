import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * GET /api/products
 * 取得商品列表（供下拉選單使用）
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const isActive = searchParams.get('isActive')

    const products = await prisma.product.findMany({
      where: {
        ...(isActive === 'true' && { isActive: true }),
      },
      select: {
        id: true,
        sku: true,
        name: true,
        barcode: true,
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ data: products })
  } catch (error) {
    console.error('Get products error:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}
