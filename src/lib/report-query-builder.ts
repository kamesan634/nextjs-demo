/**
 * 報表查詢建構器
 * 用於自訂報表的動態查詢建構
 */

export type DataSource = 'orders' | 'products' | 'customers' | 'inventory' | 'purchase_orders'

export interface QueryField {
  name: string
  label: string
  dataSource: DataSource
  aggregation?: 'SUM' | 'COUNT' | 'AVG' | 'MIN' | 'MAX'
}

export interface QueryFilter {
  field: string
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'in'
  value: unknown
}

export interface QueryDefinition {
  dataSource: DataSource
  fields: string[]
  filters: QueryFilter[]
  groupBy?: string[]
  orderBy?: { field: string; direction: 'asc' | 'desc' }[]
  limit?: number
}

export interface ChartConfig {
  type: 'bar' | 'line' | 'pie' | 'table'
  xField?: string
  yField?: string
  title?: string
}

/**
 * 可用的查詢欄位
 */
export const availableFields: Record<DataSource, QueryField[]> = {
  orders: [
    { name: 'orderNo', label: '訂單編號', dataSource: 'orders' },
    { name: 'orderDate', label: '訂單日期', dataSource: 'orders' },
    { name: 'totalAmount', label: '訂單金額', dataSource: 'orders' },
    { name: 'status', label: '訂單狀態', dataSource: 'orders' },
    { name: 'store.name', label: '門市', dataSource: 'orders' },
    { name: 'customer.name', label: '客戶', dataSource: 'orders' },
    { name: '_count', label: '訂單數', dataSource: 'orders', aggregation: 'COUNT' },
    { name: '_sum.totalAmount', label: '總金額', dataSource: 'orders', aggregation: 'SUM' },
  ],
  products: [
    { name: 'sku', label: '商品編號', dataSource: 'products' },
    { name: 'name', label: '商品名稱', dataSource: 'products' },
    { name: 'sellingPrice', label: '售價', dataSource: 'products' },
    { name: 'costPrice', label: '成本價', dataSource: 'products' },
    { name: 'category.name', label: '分類', dataSource: 'products' },
  ],
  customers: [
    { name: 'code', label: '會員編號', dataSource: 'customers' },
    { name: 'name', label: '會員姓名', dataSource: 'customers' },
    { name: 'totalSpent', label: '累計消費', dataSource: 'customers' },
    { name: 'orderCount', label: '消費次數', dataSource: 'customers' },
    { name: 'level.name', label: '會員等級', dataSource: 'customers' },
  ],
  inventory: [
    { name: 'product.sku', label: '商品編號', dataSource: 'inventory' },
    { name: 'product.name', label: '商品名稱', dataSource: 'inventory' },
    { name: 'quantity', label: '庫存數量', dataSource: 'inventory' },
    { name: 'availableQty', label: '可用數量', dataSource: 'inventory' },
    { name: 'warehouse.name', label: '倉庫', dataSource: 'inventory' },
  ],
  purchase_orders: [
    { name: 'orderNo', label: '採購單號', dataSource: 'purchase_orders' },
    { name: 'supplier.name', label: '供應商', dataSource: 'purchase_orders' },
    { name: 'totalAmount', label: '採購金額', dataSource: 'purchase_orders' },
    { name: 'status', label: '採購狀態', dataSource: 'purchase_orders' },
  ],
}

/**
 * 驗證查詢定義
 */
export function validateQueryDefinition(def: QueryDefinition): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!def.dataSource) {
    errors.push('請選擇資料來源')
  }

  if (!def.fields || def.fields.length === 0) {
    errors.push('請至少選擇一個欄位')
    return { valid: false, errors }
  }

  const validFields = availableFields[def.dataSource]?.map((f) => f.name) || []

  for (const field of def.fields) {
    if (!validFields.includes(field)) {
      errors.push(`欄位 ${field} 不存在於 ${def.dataSource}`)
    }
  }

  return { valid: errors.length === 0, errors }
}
