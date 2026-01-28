import { createExcelBuffer } from '@/lib/excel'

/**
 * 報表匯出工具
 */

export type ExportFormat = 'EXCEL' | 'CSV'

/**
 * 將報表資料匯出為 Excel
 */
export function exportToExcel(
  data: Record<string, unknown>[],
  headers: Record<string, string>,
  sheetName: string = '報表'
): Buffer {
  return createExcelBuffer(data, sheetName, headers)
}

/**
 * 將報表資料匯出為 CSV
 */
export function exportToCSV(
  data: Record<string, unknown>[],
  headers: Record<string, string>
): string {
  const headerLabels = Object.values(headers)
  const headerKeys = Object.keys(headers)

  const csvRows = [
    headerLabels.join(','),
    ...data.map((row) =>
      headerKeys
        .map((key) => {
          const value = row[key]
          if (value === null || value === undefined) return ''
          const str = String(value)
          // CSV 需要轉義包含逗號或引號的值
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`
          }
          return str
        })
        .join(',')
    ),
  ]

  return csvRows.join('\n')
}

/**
 * 銷售報表匯出欄位
 */
export const salesReportHeaders: Record<string, string> = {
  orderNo: '訂單編號',
  orderDate: '訂單日期',
  storeName: '門市',
  customerName: '客戶',
  subtotal: '小計',
  discountAmount: '折扣',
  taxAmount: '稅額',
  totalAmount: '總金額',
  paymentStatus: '付款狀態',
  status: '訂單狀態',
}

/**
 * 庫存報表匯出欄位
 */
export const inventoryReportHeaders: Record<string, string> = {
  sku: '商品編號',
  name: '商品名稱',
  category: '分類',
  warehouse: '倉庫',
  quantity: '庫存數量',
  reservedQty: '預留數量',
  availableQty: '可用數量',
  safetyStock: '安全庫存',
  costPrice: '成本價',
  stockValue: '庫存金額',
}

/**
 * 採購報表匯出欄位
 */
export const purchaseReportHeaders: Record<string, string> = {
  orderNo: '採購單號',
  supplierName: '供應商',
  orderDate: '採購日期',
  subtotal: '小計',
  taxAmount: '稅額',
  totalAmount: '總金額',
  status: '狀態',
}

/**
 * 報表欄位對照表
 */
export const reportHeaders: Record<string, Record<string, string>> = {
  orders: {
    orderNo: '訂單編號',
    orderDate: '訂單日期',
    customer: '客戶',
    store: '門市',
    subtotal: '小計',
    discount: '折扣',
    tax: '稅額',
    totalAmount: '總金額',
    status: '狀態',
  },
  products: {
    sku: '商品編號',
    name: '商品名稱',
    category: '分類',
    sellingPrice: '售價',
    costPrice: '成本價',
    status: '狀態',
  },
  customers: {
    code: '會員編號',
    name: '姓名',
    phone: '電話',
    email: '電子郵件',
    level: '會員等級',
    points: '點數',
    totalSpent: '累計消費',
    orderCount: '訂單數',
  },
  inventory: {
    sku: '商品編號',
    productName: '商品名稱',
    warehouse: '倉庫',
    quantity: '庫存數量',
    availableQty: '可用數量',
    reservedQty: '預留數量',
  },
}
