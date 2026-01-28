import { NextRequest, NextResponse } from 'next/server'
import { exportProducts } from '@/actions/product-export'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const categoryId = searchParams.get('categoryId') || undefined
    const isActive = searchParams.get('isActive')
    const search = searchParams.get('search') || undefined

    const buffer = await exportProducts({
      categoryId,
      isActive: isActive !== null ? isActive === 'true' : undefined,
      search,
    })

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="products_${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    })
  } catch (error) {
    console.error('Export products error:', error)
    return NextResponse.json({ error: '匯出失敗' }, { status: 500 })
  }
}
