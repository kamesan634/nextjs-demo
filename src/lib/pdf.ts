/**
 * PDF 生成工具
 * 基本的標籤列印相關工具函數
 */

export interface LabelData {
  sku: string
  barcode: string | null
  name: string
  price: number
  unit: string
}

/**
 * 計算標籤頁面佈局
 */
export function calculateLabelLayout(
  pageWidth: number,
  pageHeight: number,
  labelWidth: number,
  labelHeight: number,
  marginX: number = 10,
  marginY: number = 10,
  gapX: number = 5,
  gapY: number = 5
): { cols: number; rows: number; labelsPerPage: number } {
  const usableWidth = pageWidth - 2 * marginX
  const usableHeight = pageHeight - 2 * marginY

  const cols = Math.floor((usableWidth + gapX) / (labelWidth + gapX))
  const rows = Math.floor((usableHeight + gapY) / (labelHeight + gapY))

  return {
    cols,
    rows,
    labelsPerPage: cols * rows,
  }
}

/**
 * 格式化價格
 */
export function formatPrice(price: number): string {
  return `$${price.toLocaleString('zh-TW', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}
