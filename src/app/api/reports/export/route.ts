import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { exportToExcel, exportToCSV, reportHeaders } from '@/lib/report-export'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') || 'orders'
    const format = searchParams.get('format') || 'xlsx'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // 取得資料
    let data: Record<string, unknown>[] = []
    let filename = ''

    const dateFilter =
      startDate && endDate
        ? {
            createdAt: {
              gte: new Date(startDate),
              lte: new Date(endDate),
            },
          }
        : {}

    switch (type) {
      case 'orders':
        const orders = await prisma.order.findMany({
          where: {
            orderDate: dateFilter.createdAt,
          },
          include: {
            customer: { select: { name: true } },
            store: { select: { name: true } },
          },
          orderBy: { orderDate: 'desc' },
          take: 1000,
        })
        data = orders.map((o: (typeof orders)[number]) => ({
          orderNo: o.orderNo,
          orderDate: o.orderDate.toISOString().split('T')[0],
          customer: o.customer?.name || '-',
          store: o.store?.name || '-',
          subtotal: Number(o.subtotal),
          discount: Number(o.discountAmount),
          tax: Number(o.taxAmount),
          totalAmount: Number(o.totalAmount),
          status: o.status,
        }))
        filename = 'orders-report'
        break

      case 'products':
        const products = await prisma.product.findMany({
          where: dateFilter,
          include: {
            category: { select: { name: true } },
          },
          orderBy: { name: 'asc' },
          take: 1000,
        })
        data = products.map((p: (typeof products)[number]) => ({
          sku: p.sku,
          name: p.name,
          category: p.category.name,
          sellingPrice: Number(p.sellingPrice),
          costPrice: Number(p.costPrice),
          status: p.isActive ? '啟用' : '停用',
        }))
        filename = 'products-report'
        break

      case 'customers':
        const customers = await prisma.customer.findMany({
          where: dateFilter,
          include: {
            level: { select: { name: true } },
          },
          orderBy: { name: 'asc' },
          take: 1000,
        })
        data = customers.map((c: (typeof customers)[number]) => ({
          code: c.code,
          name: c.name,
          phone: c.phone || '-',
          email: c.email || '-',
          level: c.level?.name || '-',
          points: c.availablePoints,
          totalSpent: Number(c.totalSpent),
          orderCount: c.orderCount,
        }))
        filename = 'customers-report'
        break

      case 'inventory':
        const inventory = await prisma.inventory.findMany({
          include: {
            product: { select: { sku: true, name: true } },
            warehouse: { select: { name: true } },
          },
          orderBy: { product: { name: 'asc' } },
          take: 1000,
        })
        data = inventory.map((i: (typeof inventory)[number]) => ({
          sku: i.product.sku,
          productName: i.product.name,
          warehouse: i.warehouse?.name || '-',
          quantity: i.quantity,
          availableQty: i.availableQty,
          reservedQty: i.reservedQty,
        }))
        filename = 'inventory-report'
        break

      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 })
    }

    // 匯出
    const headers = reportHeaders[type as keyof typeof reportHeaders] || {}

    if (format === 'csv') {
      const csv = exportToCSV(data, headers)
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}.csv"`,
        },
      })
    }

    const buffer = await exportToExcel(data, headers, filename)
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}.xlsx"`,
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}
