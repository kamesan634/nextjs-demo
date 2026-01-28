import { NextResponse } from 'next/server'
import { createTemplateBuffer, productHeaderMapping, productSampleData } from '@/lib/excel'

export async function GET() {
  try {
    const buffer = createTemplateBuffer(productHeaderMapping, productSampleData, '商品匯入範本')

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="product_import_template.xlsx"',
      },
    })
  } catch (error) {
    console.error('Create template error:', error)
    return NextResponse.json({ error: '建立範本失敗' }, { status: 500 })
  }
}
