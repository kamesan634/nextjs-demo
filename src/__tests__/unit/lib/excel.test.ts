/**
 * Excel 處理工具單元測試
 * 測試 src/lib/excel.ts 中的 Excel 處理功能
 */

import { describe, it, expect } from 'vitest'
import * as XLSX from 'xlsx'
import {
  createExcelBuffer,
  parseExcelBuffer,
  createTemplateBuffer,
  productHeaderMapping,
  productSampleData,
} from '@/lib/excel'

describe('createExcelBuffer (將資料轉換為 Excel Buffer)', () => {
  it('應該建立有效的 Excel Buffer', () => {
    const data = [
      { name: '商品1', price: 100 },
      { name: '商品2', price: 200 },
    ]

    const buffer = createExcelBuffer(data)

    expect(buffer).toBeInstanceOf(Buffer)
    expect(buffer.length).toBeGreaterThan(0)
  })

  it('應該使用預設的 Sheet 名稱', () => {
    const data = [{ name: '商品1' }]
    const buffer = createExcelBuffer(data)

    // 解析 buffer 驗證 sheet 名稱
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    expect(workbook.SheetNames).toContain('Sheet1')
  })

  it('應該使用自訂的 Sheet 名稱', () => {
    const data = [{ name: '商品1' }]
    const buffer = createExcelBuffer(data, '商品列表')

    const workbook = XLSX.read(buffer, { type: 'buffer' })
    expect(workbook.SheetNames).toContain('商品列表')
  })

  it('應該轉換欄位名稱 (使用 headers)', () => {
    const data = [
      { sku: 'P001', name: '商品1', price: 100 },
      { sku: 'P002', name: '商品2', price: 200 },
    ]

    const headers = {
      sku: '商品編號',
      name: '商品名稱',
      price: '售價',
    }

    const buffer = createExcelBuffer(data, 'Sheet1', headers)

    // 解析 buffer 驗證欄位名稱
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const worksheet = workbook.Sheets['Sheet1']
    const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet)

    expect(jsonData[0]).toHaveProperty('商品編號', 'P001')
    expect(jsonData[0]).toHaveProperty('商品名稱', '商品1')
    expect(jsonData[0]).toHaveProperty('售價', 100)
  })

  it('應該處理空資料', () => {
    const data: Record<string, unknown>[] = []
    const buffer = createExcelBuffer(data)

    expect(buffer).toBeInstanceOf(Buffer)

    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const worksheet = workbook.Sheets['Sheet1']
    const jsonData = XLSX.utils.sheet_to_json(worksheet)

    expect(jsonData.length).toBe(0)
  })

  it('應該處理含有特殊字元的資料', () => {
    const data = [
      { name: '商品"測試"', description: "含有'引號'" },
      { name: '含有\n換行', description: '含有\t跳格' },
    ]

    const buffer = createExcelBuffer(data)

    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const worksheet = workbook.Sheets['Sheet1']
    const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet)

    expect(jsonData[0].name).toBe('商品"測試"')
    expect(jsonData[1].name).toBe('含有\n換行')
  })

  it('應該處理各種資料類型', () => {
    const data = [
      {
        text: '文字',
        number: 12345,
        decimal: 123.45,
        boolean: true,
        nullValue: null,
      },
    ]

    const buffer = createExcelBuffer(data)

    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const worksheet = workbook.Sheets['Sheet1']
    const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet)

    expect(jsonData[0].text).toBe('文字')
    expect(jsonData[0].number).toBe(12345)
    expect(jsonData[0].decimal).toBe(123.45)
    expect(jsonData[0].boolean).toBe(true)
  })

  it('應該處理部分 headers 對應', () => {
    const data = [{ sku: 'P001', name: '商品1', extra: '額外欄位' }]

    const headers = {
      sku: '商品編號',
      name: '商品名稱',
      // 沒有 extra 的對應
    }

    const buffer = createExcelBuffer(data, 'Sheet1', headers)

    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const worksheet = workbook.Sheets['Sheet1']
    const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet)

    // 只會有 headers 中定義的欄位
    expect(jsonData[0]).toHaveProperty('商品編號', 'P001')
    expect(jsonData[0]).toHaveProperty('商品名稱', '商品1')
    expect(jsonData[0]).not.toHaveProperty('extra')
  })
})

describe('parseExcelBuffer (解析 Excel 檔案為 JSON)', () => {
  it('應該解析 Excel Buffer 為 JSON', () => {
    // 先建立一個 Excel buffer
    const originalData = [
      { name: '商品1', price: 100 },
      { name: '商品2', price: 200 },
    ]
    const buffer = createExcelBuffer(originalData)

    // 解析
    const parsedData = parseExcelBuffer(buffer)

    expect(parsedData).toHaveLength(2)
    expect(parsedData[0]).toEqual({ name: '商品1', price: 100 })
    expect(parsedData[1]).toEqual({ name: '商品2', price: 200 })
  })

  it('應該使用 headerMapping 轉換欄位名稱', () => {
    // 建立含有中文欄位名的 Excel
    const originalData = [{ 商品名稱: '商品1', 售價: 100 }]

    const worksheet = XLSX.utils.json_to_sheet(originalData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1')
    const buffer = Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }))

    // 解析並轉換欄位名
    const headerMapping = {
      name: '商品名稱',
      price: '售價',
    }

    const parsedData = parseExcelBuffer(buffer, headerMapping)

    expect(parsedData[0]).toHaveProperty('name', '商品1')
    expect(parsedData[0]).toHaveProperty('price', 100)
  })

  it('應該保留未映射的欄位名稱', () => {
    const originalData = [{ 商品名稱: '商品1', 額外欄位: '值' }]

    const worksheet = XLSX.utils.json_to_sheet(originalData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1')
    const buffer = Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }))

    const headerMapping = {
      name: '商品名稱',
    }

    const parsedData = parseExcelBuffer(buffer, headerMapping)

    expect(parsedData[0]).toHaveProperty('name', '商品1')
    expect(parsedData[0]).toHaveProperty('額外欄位', '值') // 保持原欄位名
  })

  it('應該處理空的 Excel 檔案', () => {
    const worksheet = XLSX.utils.aoa_to_sheet([])
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1')
    const buffer = Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }))

    const parsedData = parseExcelBuffer(buffer)

    expect(parsedData).toHaveLength(0)
  })

  it('應該處理只有標題沒有資料的 Excel', () => {
    const worksheet = XLSX.utils.aoa_to_sheet([['名稱', '價格']])
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1')
    const buffer = Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }))

    const parsedData = parseExcelBuffer(buffer)

    expect(parsedData).toHaveLength(0)
  })

  it('應該只讀取第一個 Sheet', () => {
    const workbook = XLSX.utils.book_new()

    const worksheet1 = XLSX.utils.json_to_sheet([{ name: 'Sheet1 資料' }])
    XLSX.utils.book_append_sheet(workbook, worksheet1, 'Sheet1')

    const worksheet2 = XLSX.utils.json_to_sheet([{ name: 'Sheet2 資料' }])
    XLSX.utils.book_append_sheet(workbook, worksheet2, 'Sheet2')

    const buffer = Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }))

    const parsedData = parseExcelBuffer(buffer)

    expect(parsedData).toHaveLength(1)
    expect(parsedData[0].name).toBe('Sheet1 資料')
  })
})

describe('createTemplateBuffer (建立匯入範本)', () => {
  it('應該建立含有標題的範本', () => {
    const headers = {
      sku: '商品編號',
      name: '商品名稱',
      price: '售價',
    }

    const buffer = createTemplateBuffer(headers)

    const workbook = XLSX.read(buffer, { type: 'buffer' })
    expect(workbook.SheetNames).toContain('匯入範本')

    const worksheet = workbook.Sheets['匯入範本']
    const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { header: 1 })

    // 第一列應該是標題
    expect(data[0]).toContain('商品編號')
    expect(data[0]).toContain('商品名稱')
    expect(data[0]).toContain('售價')
  })

  it('應該使用自訂的 Sheet 名稱', () => {
    const headers = { name: '名稱' }

    const buffer = createTemplateBuffer(headers, undefined, '自訂範本')

    const workbook = XLSX.read(buffer, { type: 'buffer' })
    expect(workbook.SheetNames).toContain('自訂範本')
  })

  it('應該包含範例資料', () => {
    const headers = {
      sku: '商品編號',
      name: '商品名稱',
    }

    const sampleData = [
      { sku: 'SAMPLE001', name: '範例商品1' },
      { sku: 'SAMPLE002', name: '範例商品2' },
    ]

    const buffer = createTemplateBuffer(headers, sampleData)

    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const worksheet = workbook.Sheets['匯入範本']
    const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet)

    expect(data).toHaveLength(2)
    expect(data[0]).toHaveProperty('商品編號', 'SAMPLE001')
    expect(data[0]).toHaveProperty('商品名稱', '範例商品1')
  })

  it('應該正確建立範本 Buffer', () => {
    const headers = {
      shortName: '短',
      longColumnName: '非常長的欄位名稱',
    }

    const buffer = createTemplateBuffer(headers)

    // 驗證 buffer 是有效的 Excel 檔案
    expect(buffer).toBeInstanceOf(Buffer)
    expect(buffer.length).toBeGreaterThan(0)

    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const worksheet = workbook.Sheets['匯入範本']

    // 驗證標題列存在
    const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { header: 1 })
    expect(data[0]).toContain('短')
    expect(data[0]).toContain('非常長的欄位名稱')
  })
})

describe('productHeaderMapping (商品匯入欄位對應)', () => {
  it('應該包含所有必要的商品欄位', () => {
    expect(productHeaderMapping).toHaveProperty('sku')
    expect(productHeaderMapping).toHaveProperty('barcode')
    expect(productHeaderMapping).toHaveProperty('name')
    expect(productHeaderMapping).toHaveProperty('shortName')
    expect(productHeaderMapping).toHaveProperty('categoryCode')
    expect(productHeaderMapping).toHaveProperty('unitCode')
    expect(productHeaderMapping).toHaveProperty('costPrice')
    expect(productHeaderMapping).toHaveProperty('listPrice')
    expect(productHeaderMapping).toHaveProperty('sellingPrice')
    expect(productHeaderMapping).toHaveProperty('safetyStock')
    expect(productHeaderMapping).toHaveProperty('reorderPoint')
    expect(productHeaderMapping).toHaveProperty('reorderQty')
    expect(productHeaderMapping).toHaveProperty('description')
  })

  it('應該有正確的中文欄位對應', () => {
    expect(productHeaderMapping.sku).toBe('商品編號')
    expect(productHeaderMapping.barcode).toBe('條碼')
    expect(productHeaderMapping.name).toBe('商品名稱')
    expect(productHeaderMapping.shortName).toBe('簡稱')
    expect(productHeaderMapping.categoryCode).toBe('分類代碼')
    expect(productHeaderMapping.unitCode).toBe('單位代碼')
    expect(productHeaderMapping.costPrice).toBe('成本價')
    expect(productHeaderMapping.listPrice).toBe('定價')
    expect(productHeaderMapping.sellingPrice).toBe('售價')
    expect(productHeaderMapping.safetyStock).toBe('安全庫存')
    expect(productHeaderMapping.reorderPoint).toBe('補貨點')
    expect(productHeaderMapping.reorderQty).toBe('建議補貨量')
    expect(productHeaderMapping.description).toBe('描述')
  })

  it('應該有 13 個欄位對應', () => {
    expect(Object.keys(productHeaderMapping).length).toBe(13)
  })
})

describe('productSampleData (商品匯入範例資料)', () => {
  it('應該是有效的範例資料陣列', () => {
    expect(Array.isArray(productSampleData)).toBe(true)
    expect(productSampleData.length).toBeGreaterThan(0)
  })

  it('範例資料應該包含所有必要欄位', () => {
    const sample = productSampleData[0]

    expect(sample).toHaveProperty('sku')
    expect(sample).toHaveProperty('barcode')
    expect(sample).toHaveProperty('name')
    expect(sample).toHaveProperty('shortName')
    expect(sample).toHaveProperty('categoryCode')
    expect(sample).toHaveProperty('unitCode')
    expect(sample).toHaveProperty('costPrice')
    expect(sample).toHaveProperty('listPrice')
    expect(sample).toHaveProperty('sellingPrice')
    expect(sample).toHaveProperty('safetyStock')
    expect(sample).toHaveProperty('reorderPoint')
    expect(sample).toHaveProperty('reorderQty')
    expect(sample).toHaveProperty('description')
  })

  it('範例資料應該有正確的資料類型', () => {
    const sample = productSampleData[0]

    expect(typeof sample.sku).toBe('string')
    expect(typeof sample.barcode).toBe('string')
    expect(typeof sample.name).toBe('string')
    expect(typeof sample.costPrice).toBe('number')
    expect(typeof sample.listPrice).toBe('number')
    expect(typeof sample.sellingPrice).toBe('number')
    expect(typeof sample.safetyStock).toBe('number')
  })

  it('範例資料應該能與 productHeaderMapping 配合使用', () => {
    const buffer = createTemplateBuffer(productHeaderMapping, productSampleData)

    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const worksheet = workbook.Sheets['匯入範本']
    const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet)

    expect(data).toHaveLength(1)
    expect(data[0]).toHaveProperty('商品編號', 'SKU001')
    expect(data[0]).toHaveProperty('商品名稱', '範例商品')
    expect(data[0]).toHaveProperty('售價', 180)
  })
})

describe('端到端測試 (建立 -> 解析)', () => {
  it('應該能完整往返轉換資料', () => {
    const originalData = [
      { sku: 'P001', name: '商品1', price: 100 },
      { sku: 'P002', name: '商品2', price: 200 },
      { sku: 'P003', name: '商品3', price: 300 },
    ]

    const headers = {
      sku: '商品編號',
      name: '商品名稱',
      price: '售價',
    }

    // 建立 Excel
    const buffer = createExcelBuffer(originalData, 'Sheet1', headers)

    // 解析 Excel (使用反向 mapping)
    const parsedData = parseExcelBuffer(buffer, headers)

    // 驗證資料完整性
    expect(parsedData.length).toBe(originalData.length)

    for (let i = 0; i < originalData.length; i++) {
      expect(parsedData[i].sku).toBe(originalData[i].sku)
      expect(parsedData[i].name).toBe(originalData[i].name)
      expect(parsedData[i].price).toBe(originalData[i].price)
    }
  })

  it('應該能處理商品範本的完整流程', () => {
    // 建立範本
    const templateBuffer = createTemplateBuffer(productHeaderMapping, productSampleData)

    // 解析範本
    const parsedData = parseExcelBuffer(templateBuffer, productHeaderMapping)

    // 驗證範例資料
    expect(parsedData).toHaveLength(1)
    expect(parsedData[0].sku).toBe('SKU001')
    expect(parsedData[0].name).toBe('範例商品')
    expect(parsedData[0].sellingPrice).toBe(180)
  })
})

describe('邊界條件測試', () => {
  it('應該處理空的 headers 對應', () => {
    const data = [{ name: '商品1' }]
    const buffer = createExcelBuffer(data, 'Sheet1', {})

    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const worksheet = workbook.Sheets['Sheet1']
    const jsonData = XLSX.utils.sheet_to_json(worksheet)

    // 空的 headers 會產生空白的行（沒有欄位被映射）
    expect(jsonData).toHaveLength(0)
  })

  it('應該處理非常大的資料集', () => {
    const largeData: Record<string, unknown>[] = []
    for (let i = 0; i < 1000; i++) {
      largeData.push({ id: i, name: `商品${i}`, price: i * 10 })
    }

    const buffer = createExcelBuffer(largeData)

    expect(buffer).toBeInstanceOf(Buffer)

    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const worksheet = workbook.Sheets['Sheet1']
    const jsonData = XLSX.utils.sheet_to_json(worksheet)

    expect(jsonData.length).toBe(1000)
  })

  it('應該處理 Unicode 字元', () => {
    const data = [
      { name: '日本語テスト', description: '한글 테스트' },
      { name: 'Emoji: 😀🎉', description: '特殊符號: ®™©' },
    ]

    const buffer = createExcelBuffer(data)

    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const worksheet = workbook.Sheets['Sheet1']
    const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet)

    expect(jsonData[0].name).toBe('日本語テスト')
    expect(jsonData[0].description).toBe('한글 테스트')
    expect(jsonData[1].name).toBe('Emoji: 😀🎉')
  })

  it('應該處理非常長的字串', () => {
    const longString = 'A'.repeat(10000)
    const data = [{ content: longString }]

    const buffer = createExcelBuffer(data)

    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const worksheet = workbook.Sheets['Sheet1']
    const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet)

    expect((jsonData[0].content as string).length).toBe(10000)
  })

  it('應該處理數字精度', () => {
    const data = [
      { precise: 0.1 + 0.2 }, // JavaScript 浮點數問題
      { precise: 123456789.123456789 },
    ]

    const buffer = createExcelBuffer(data)

    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const worksheet = workbook.Sheets['Sheet1']
    const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet)

    // Excel 也有精度限制，這裡只驗證不會出錯
    expect(typeof jsonData[0].precise).toBe('number')
  })
})
