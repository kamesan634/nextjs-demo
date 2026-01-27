import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * GET /api/warehouses
 * 取得倉庫列表（供下拉選單使用）
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const isActive = searchParams.get('isActive')

    const warehouses = await prisma.warehouse.findMany({
      where: {
        ...(isActive === 'true' && { isActive: true }),
      },
      select: {
        id: true,
        code: true,
        name: true,
      },
      orderBy: { code: 'asc' },
    })

    return NextResponse.json({ data: warehouses })
  } catch (error) {
    console.error('Get warehouses error:', error)
    return NextResponse.json({ error: 'Failed to fetch warehouses' }, { status: 500 })
  }
}
