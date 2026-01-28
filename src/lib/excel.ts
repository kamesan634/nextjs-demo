import * as XLSX from 'xlsx'

/**
 * Excel 處理工具
 */

/**
 * 將資料轉換為 Excel Buffer
 */
export function createExcelBuffer(
  data: Record<string, unknown>[],
  sheetName: string = 'Sheet1',
  headers?: Record<string, string>
): Buffer {
  // 如果有 headers 對應，轉換欄位名稱
  const processedData = headers
    ? data.map((row) => {
        const newRow: Record<string, unknown> = {}
        for (const [key, label] of Object.entries(headers)) {
          newRow[label] = row[key]
        }
        return newRow
      })
    : data

  const worksheet = XLSX.utils.json_to_sheet(processedData)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

  return Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }))
}

/**
 * 解析 Excel 檔案為 JSON
 */
export function parseExcelBuffer(
  buffer: Buffer,
  headerMapping?: Record<string, string>
): Record<string, unknown>[] {
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]
  const rawData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet)

  if (!headerMapping) {
    return rawData
  }

  // 反向對應：中文欄位名 -> 英文欄位名
  const reverseMapping: Record<string, string> = {}
  for (const [eng, chi] of Object.entries(headerMapping)) {
    reverseMapping[chi] = eng
  }

  return rawData.map((row) => {
    const newRow: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(row)) {
      const mappedKey = reverseMapping[key] || key
      newRow[mappedKey] = value
    }
    return newRow
  })
}

/**
 * 建立匯入範本
 */
export function createTemplateBuffer(
  headers: Record<string, string>,
  sampleData?: Record<string, unknown>[],
  sheetName: string = '匯入範本'
): Buffer {
  const headerLabels = Object.values(headers)

  const worksheet = XLSX.utils.aoa_to_sheet([headerLabels])

  if (sampleData) {
    const processedSample = sampleData.map((row) => {
      const newRow: Record<string, unknown> = {}
      for (const [key, label] of Object.entries(headers)) {
        newRow[label] = row[key]
      }
      return newRow
    })
    XLSX.utils.sheet_add_json(worksheet, processedSample, { skipHeader: true, origin: 'A2' })
  }

  // 設定欄寬
  const colWidths = headerLabels.map((h) => ({ wch: Math.max(h.length * 2, 15) }))
  worksheet['!cols'] = colWidths

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

  return Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }))
}

/**
 * 商品匯入欄位對應
 */
export const productHeaderMapping: Record<string, string> = {
  sku: '商品編號',
  barcode: '條碼',
  name: '商品名稱',
  shortName: '簡稱',
  categoryCode: '分類代碼',
  unitCode: '單位代碼',
  costPrice: '成本價',
  listPrice: '定價',
  sellingPrice: '售價',
  safetyStock: '安全庫存',
  reorderPoint: '補貨點',
  reorderQty: '建議補貨量',
  description: '描述',
}

/**
 * 商品匯入範例資料
 */
export const productSampleData: Record<string, unknown>[] = [
  {
    sku: 'SKU001',
    barcode: '4710000000001',
    name: '範例商品',
    shortName: '範例',
    categoryCode: 'CAT001',
    unitCode: 'PCS',
    costPrice: 100,
    listPrice: 200,
    sellingPrice: 180,
    safetyStock: 10,
    reorderPoint: 5,
    reorderQty: 20,
    description: '這是一個範例商品',
  },
]
