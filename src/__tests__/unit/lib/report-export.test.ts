/**
 * 報表匯出工具單元測試
 * 測試 src/lib/report-export.ts 中的報表匯出功能
 */

import { describe, it, expect, vi } from 'vitest'
import {
  exportToCSV,
  exportToExcel,
  salesReportHeaders,
  inventoryReportHeaders,
  purchaseReportHeaders,
  reportHeaders,
  type ExportFormat,
} from '@/lib/report-export'

// Mock xlsx 模組
vi.mock('@/lib/excel', () => ({
  createExcelBuffer: vi.fn((data, sheetName, headers) => {
    // 返回一個模擬的 Buffer
    return Buffer.from(JSON.stringify({ data, sheetName, headers }))
  }),
}))

// ===================================
// exportToCSV 測試
// ===================================

describe('exportToCSV', () => {
  it('應該正確產生 CSV 格式', () => {
    const data = [
      { name: '商品A', price: 100, quantity: 5 },
      { name: '商品B', price: 200, quantity: 3 },
    ]
    const headers = {
      name: '商品名稱',
      price: '價格',
      quantity: '數量',
    }

    const result = exportToCSV(data, headers)

    const lines = result.split('\n')
    expect(lines[0]).toBe('商品名稱,價格,數量')
    expect(lines[1]).toBe('商品A,100,5')
    expect(lines[2]).toBe('商品B,200,3')
  })

  it('應該正確處理空資料', () => {
    const data: Record<string, unknown>[] = []
    const headers = {
      name: '名稱',
      value: '值',
    }

    const result = exportToCSV(data, headers)

    expect(result).toBe('名稱,值')
  })

  it('應該正確處理 null 和 undefined 值', () => {
    const data = [{ name: '商品A', price: null, quantity: undefined }]
    const headers = {
      name: '商品名稱',
      price: '價格',
      quantity: '數量',
    }

    const result = exportToCSV(data, headers)

    const lines = result.split('\n')
    expect(lines[1]).toBe('商品A,,')
  })

  it('應該正確轉義包含逗號的值', () => {
    const data = [{ name: '商品A, 特價版', price: 100 }]
    const headers = {
      name: '商品名稱',
      price: '價格',
    }

    const result = exportToCSV(data, headers)

    const lines = result.split('\n')
    expect(lines[1]).toBe('"商品A, 特價版",100')
  })

  it('應該正確轉義包含引號的值', () => {
    const data = [{ name: '商品"特別"版', price: 100 }]
    const headers = {
      name: '商品名稱',
      price: '價格',
    }

    const result = exportToCSV(data, headers)

    const lines = result.split('\n')
    expect(lines[1]).toBe('"商品""特別""版",100')
  })

  it('應該正確轉義包含換行的值', () => {
    const data = [{ name: '商品\n描述', price: 100 }]
    const headers = {
      name: '商品名稱',
      price: '價格',
    }

    const result = exportToCSV(data, headers)

    // CSV 中包含換行的值會被引號包圍
    // 不使用 split('\n') 因為引號內的換行也會被分割
    expect(result).toContain('"商品\n描述"')
    expect(result).toContain(',100')
  })

  it('應該正確處理數字類型', () => {
    const data = [{ id: 1, price: 100.5, quantity: 0 }]
    const headers = {
      id: 'ID',
      price: '價格',
      quantity: '數量',
    }

    const result = exportToCSV(data, headers)

    const lines = result.split('\n')
    expect(lines[1]).toBe('1,100.5,0')
  })

  it('應該正確處理布林值', () => {
    const data = [{ name: '商品A', isActive: true, isDeleted: false }]
    const headers = {
      name: '名稱',
      isActive: '啟用',
      isDeleted: '已刪除',
    }

    const result = exportToCSV(data, headers)

    const lines = result.split('\n')
    expect(lines[1]).toBe('商品A,true,false')
  })

  it('應該按 headers 順序輸出欄位', () => {
    const data = [{ c: 3, a: 1, b: 2 }]
    const headers = {
      a: 'A欄',
      b: 'B欄',
      c: 'C欄',
    }

    const result = exportToCSV(data, headers)

    const lines = result.split('\n')
    expect(lines[0]).toBe('A欄,B欄,C欄')
    expect(lines[1]).toBe('1,2,3')
  })

  it('應該忽略 headers 中未定義的欄位', () => {
    const data = [{ name: '商品A', price: 100, extra: 'ignored' }]
    const headers = {
      name: '名稱',
      price: '價格',
    }

    const result = exportToCSV(data, headers)

    const lines = result.split('\n')
    expect(lines[0]).toBe('名稱,價格')
    expect(lines[1]).toBe('商品A,100')
    expect(lines[1]).not.toContain('ignored')
  })

  // 邊界條件測試
  it('應該處理大量資料', () => {
    const data = Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      name: `商品${i}`,
    }))
    const headers = { id: 'ID', name: '名稱' }

    const result = exportToCSV(data, headers)

    const lines = result.split('\n')
    expect(lines).toHaveLength(1001) // 1 header + 1000 data rows
  })

  it('應該處理中文欄位名稱', () => {
    const data = [{ 名稱: '測試', 價格: 100 }]
    const headers = { 名稱: '商品名稱', 價格: '售價' }

    const result = exportToCSV(data, headers)

    const lines = result.split('\n')
    expect(lines[0]).toBe('商品名稱,售價')
  })

  it('應該處理空字串值', () => {
    const data = [{ name: '', price: 100 }]
    const headers = { name: '名稱', price: '價格' }

    const result = exportToCSV(data, headers)

    const lines = result.split('\n')
    expect(lines[1]).toBe(',100')
  })
})

// ===================================
// exportToExcel 測試
// ===================================

describe('exportToExcel', () => {
  it('應該呼叫 createExcelBuffer 並返回 Buffer', () => {
    const data = [{ name: '商品A', price: 100 }]
    const headers = { name: '名稱', price: '價格' }

    const result = exportToExcel(data, headers, '測試報表')

    expect(result).toBeInstanceOf(Buffer)
  })

  it('應該使用預設 sheetName', () => {
    const data = [{ name: '商品A' }]
    const headers = { name: '名稱' }

    const result = exportToExcel(data, headers)

    // 驗證 Buffer 被創建
    expect(result).toBeInstanceOf(Buffer)
  })

  it('應該正確傳遞參數給 createExcelBuffer', () => {
    const data = [{ name: '商品A', price: 100 }]
    const headers = { name: '名稱', price: '價格' }
    const sheetName = '銷售報表'

    const result = exportToExcel(data, headers, sheetName)

    // 解析 mock 返回的 JSON
    const parsed = JSON.parse(result.toString())
    expect(parsed.data).toEqual(data)
    expect(parsed.sheetName).toBe(sheetName)
    expect(parsed.headers).toEqual(headers)
  })

  it('應該處理空資料', () => {
    const data: Record<string, unknown>[] = []
    const headers = { name: '名稱' }

    const result = exportToExcel(data, headers)

    expect(result).toBeInstanceOf(Buffer)
  })
})

// ===================================
// 報表欄位定義測試
// ===================================

describe('salesReportHeaders', () => {
  it('應該包含所有銷售報表必要欄位', () => {
    expect(salesReportHeaders.orderNo).toBe('訂單編號')
    expect(salesReportHeaders.orderDate).toBe('訂單日期')
    expect(salesReportHeaders.storeName).toBe('門市')
    expect(salesReportHeaders.customerName).toBe('客戶')
    expect(salesReportHeaders.subtotal).toBe('小計')
    expect(salesReportHeaders.discountAmount).toBe('折扣')
    expect(salesReportHeaders.taxAmount).toBe('稅額')
    expect(salesReportHeaders.totalAmount).toBe('總金額')
    expect(salesReportHeaders.paymentStatus).toBe('付款狀態')
    expect(salesReportHeaders.status).toBe('訂單狀態')
  })

  it('應該有 10 個欄位', () => {
    expect(Object.keys(salesReportHeaders)).toHaveLength(10)
  })
})

describe('inventoryReportHeaders', () => {
  it('應該包含所有庫存報表必要欄位', () => {
    expect(inventoryReportHeaders.sku).toBe('商品編號')
    expect(inventoryReportHeaders.name).toBe('商品名稱')
    expect(inventoryReportHeaders.category).toBe('分類')
    expect(inventoryReportHeaders.warehouse).toBe('倉庫')
    expect(inventoryReportHeaders.quantity).toBe('庫存數量')
    expect(inventoryReportHeaders.reservedQty).toBe('預留數量')
    expect(inventoryReportHeaders.availableQty).toBe('可用數量')
    expect(inventoryReportHeaders.safetyStock).toBe('安全庫存')
    expect(inventoryReportHeaders.costPrice).toBe('成本價')
    expect(inventoryReportHeaders.stockValue).toBe('庫存金額')
  })

  it('應該有 10 個欄位', () => {
    expect(Object.keys(inventoryReportHeaders)).toHaveLength(10)
  })
})

describe('purchaseReportHeaders', () => {
  it('應該包含所有採購報表必要欄位', () => {
    expect(purchaseReportHeaders.orderNo).toBe('採購單號')
    expect(purchaseReportHeaders.supplierName).toBe('供應商')
    expect(purchaseReportHeaders.orderDate).toBe('採購日期')
    expect(purchaseReportHeaders.subtotal).toBe('小計')
    expect(purchaseReportHeaders.taxAmount).toBe('稅額')
    expect(purchaseReportHeaders.totalAmount).toBe('總金額')
    expect(purchaseReportHeaders.status).toBe('狀態')
  })

  it('應該有 7 個欄位', () => {
    expect(Object.keys(purchaseReportHeaders)).toHaveLength(7)
  })
})

describe('reportHeaders', () => {
  it('應該包含 orders 報表欄位', () => {
    expect(reportHeaders.orders).toBeDefined()
    expect(reportHeaders.orders.orderNo).toBe('訂單編號')
    expect(reportHeaders.orders.totalAmount).toBe('總金額')
  })

  it('應該包含 products 報表欄位', () => {
    expect(reportHeaders.products).toBeDefined()
    expect(reportHeaders.products.sku).toBe('商品編號')
    expect(reportHeaders.products.name).toBe('商品名稱')
    expect(reportHeaders.products.sellingPrice).toBe('售價')
  })

  it('應該包含 customers 報表欄位', () => {
    expect(reportHeaders.customers).toBeDefined()
    expect(reportHeaders.customers.code).toBe('會員編號')
    expect(reportHeaders.customers.name).toBe('姓名')
    expect(reportHeaders.customers.points).toBe('點數')
  })

  it('應該包含 inventory 報表欄位', () => {
    expect(reportHeaders.inventory).toBeDefined()
    expect(reportHeaders.inventory.sku).toBe('商品編號')
    expect(reportHeaders.inventory.quantity).toBe('庫存數量')
  })

  it('應該有 4 種報表類型', () => {
    expect(Object.keys(reportHeaders)).toHaveLength(4)
    expect(reportHeaders.orders).toBeDefined()
    expect(reportHeaders.products).toBeDefined()
    expect(reportHeaders.customers).toBeDefined()
    expect(reportHeaders.inventory).toBeDefined()
  })
})

// ===================================
// 整合測試
// ===================================

describe('報表匯出 - 整合測試', () => {
  it('使用 salesReportHeaders 匯出銷售報表 CSV', () => {
    const data = [
      {
        orderNo: 'ORD001',
        orderDate: '2024-01-15',
        storeName: '台北店',
        customerName: '王小明',
        subtotal: 1000,
        discountAmount: 100,
        taxAmount: 45,
        totalAmount: 945,
        paymentStatus: 'PAID',
        status: 'COMPLETED',
      },
    ]

    const result = exportToCSV(data, salesReportHeaders)

    expect(result).toContain('訂單編號')
    expect(result).toContain('ORD001')
    expect(result).toContain('台北店')
    expect(result).toContain('945')
  })

  it('使用 inventoryReportHeaders 匯出庫存報表 CSV', () => {
    const data = [
      {
        sku: 'SKU001',
        name: '測試商品',
        category: '電子產品',
        warehouse: '主倉庫',
        quantity: 100,
        reservedQty: 10,
        availableQty: 90,
        safetyStock: 20,
        costPrice: 500,
        stockValue: 50000,
      },
    ]

    const result = exportToCSV(data, inventoryReportHeaders)

    expect(result).toContain('商品編號')
    expect(result).toContain('SKU001')
    expect(result).toContain('主倉庫')
    expect(result).toContain('50000')
  })

  it('使用 reportHeaders.customers 匯出會員報表 CSV', () => {
    const data = [
      {
        code: 'C001',
        name: '王小明',
        phone: '0912345678',
        email: 'wang@example.com',
        level: 'VIP',
        points: 1000,
        totalSpent: 50000,
        orderCount: 10,
      },
    ]

    const result = exportToCSV(data, reportHeaders.customers)

    expect(result).toContain('會員編號')
    expect(result).toContain('C001')
    expect(result).toContain('王小明')
    expect(result).toContain('1000')
  })

  it('ExportFormat 類型檢查', () => {
    const format1: ExportFormat = 'EXCEL'
    const format2: ExportFormat = 'CSV'

    expect(format1).toBe('EXCEL')
    expect(format2).toBe('CSV')
  })
})

// ===================================
// 錯誤處理測試
// ===================================

describe('報表匯出 - 錯誤處理', () => {
  it('應該處理包含特殊字元組合的值', () => {
    const data = [{ name: '商品"A", 特價\n版本' }]
    const headers = { name: '名稱' }

    const result = exportToCSV(data, headers)

    // 應該正確轉義，不拋出錯誤
    expect(result).toContain('名稱')
    expect(result).toContain('"')
  })

  it('應該處理物件類型的值', () => {
    const data = [{ name: '商品A', details: { nested: 'value' } }]
    const headers = { name: '名稱', details: '詳情' }

    const result = exportToCSV(data, headers)

    // 物件會被轉換為字串 "[object Object]"
    const lines = result.split('\n')
    expect(lines[1]).toContain('[object Object]')
  })

  it('應該處理陣列類型的值', () => {
    const data = [{ name: '商品A', tags: ['tag1', 'tag2'] }]
    const headers = { name: '名稱', tags: '標籤' }

    const result = exportToCSV(data, headers)

    // 陣列會被轉換為字串
    const lines = result.split('\n')
    expect(lines[1]).toContain('tag1')
  })

  it('應該處理 Date 類型的值', () => {
    const date = new Date('2024-01-15T00:00:00Z')
    const data = [{ name: '商品A', date }]
    const headers = { name: '名稱', date: '日期' }

    const result = exportToCSV(data, headers)

    // Date 會被轉換為字串
    expect(result).toContain('2024')
  })
})
