/**
 * 報表查詢建構器單元測試
 * 測試 src/lib/report-query-builder.ts 中的查詢建構功能
 */

import { describe, it, expect } from 'vitest'
import {
  validateQueryDefinition,
  availableFields,
  type QueryDefinition,
  type DataSource,
  type QueryField,
  type QueryFilter,
  type ChartConfig,
} from '@/lib/report-query-builder'

// ===================================
// validateQueryDefinition 測試
// ===================================

describe('validateQueryDefinition', () => {
  const createValidQuery = (overrides: Partial<QueryDefinition> = {}): QueryDefinition => ({
    dataSource: 'orders',
    fields: ['orderNo', 'totalAmount'],
    filters: [],
    ...overrides,
  })

  it('應該驗證有效的查詢定義', () => {
    const query = createValidQuery()

    const result = validateQueryDefinition(query)

    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('應該拒絕缺少 dataSource 的查詢', () => {
    const query = createValidQuery({ dataSource: '' as DataSource })

    const result = validateQueryDefinition(query)

    expect(result.valid).toBe(false)
    expect(result.errors).toContain('請選擇資料來源')
  })

  it('應該拒絕空欄位列表', () => {
    const query = createValidQuery({ fields: [] })

    const result = validateQueryDefinition(query)

    expect(result.valid).toBe(false)
    expect(result.errors).toContain('請至少選擇一個欄位')
  })

  it('應該拒絕 null 欄位列表', () => {
    const query = createValidQuery({ fields: null as unknown as string[] })

    const result = validateQueryDefinition(query)

    expect(result.valid).toBe(false)
    expect(result.errors).toContain('請至少選擇一個欄位')
  })

  it('應該拒絕無效的欄位名稱', () => {
    const query = createValidQuery({ fields: ['invalidField'] })

    const result = validateQueryDefinition(query)

    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes('invalidField'))).toBe(true)
    expect(result.errors.some((e) => e.includes('不存在'))).toBe(true)
  })

  it('應該驗證 orders 資料來源的有效欄位', () => {
    const query = createValidQuery({
      dataSource: 'orders',
      fields: ['orderNo', 'orderDate', 'totalAmount', 'status'],
    })

    const result = validateQueryDefinition(query)

    expect(result.valid).toBe(true)
  })

  it('應該驗證 products 資料來源的有效欄位', () => {
    const query = createValidQuery({
      dataSource: 'products',
      fields: ['sku', 'name', 'sellingPrice'],
    })

    const result = validateQueryDefinition(query)

    expect(result.valid).toBe(true)
  })

  it('應該驗證 customers 資料來源的有效欄位', () => {
    const query = createValidQuery({
      dataSource: 'customers',
      fields: ['code', 'name', 'totalSpent'],
    })

    const result = validateQueryDefinition(query)

    expect(result.valid).toBe(true)
  })

  it('應該驗證 inventory 資料來源的有效欄位', () => {
    const query = createValidQuery({
      dataSource: 'inventory',
      fields: ['product.sku', 'quantity', 'availableQty'],
    })

    const result = validateQueryDefinition(query)

    expect(result.valid).toBe(true)
  })

  it('應該驗證 purchase_orders 資料來源的有效欄位', () => {
    const query = createValidQuery({
      dataSource: 'purchase_orders',
      fields: ['orderNo', 'supplier.name', 'totalAmount'],
    })

    const result = validateQueryDefinition(query)

    expect(result.valid).toBe(true)
  })

  it('應該回報多個錯誤', () => {
    const query: QueryDefinition = {
      dataSource: '' as DataSource,
      fields: [],
      filters: [],
    }

    const result = validateQueryDefinition(query)

    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThanOrEqual(2)
  })

  it('應該回報每個無效欄位的錯誤', () => {
    const query = createValidQuery({
      fields: ['invalid1', 'invalid2', 'orderNo'],
    })

    const result = validateQueryDefinition(query)

    expect(result.valid).toBe(false)
    expect(result.errors.filter((e) => e.includes('invalid1'))).toHaveLength(1)
    expect(result.errors.filter((e) => e.includes('invalid2'))).toHaveLength(1)
  })

  it('應該處理巢狀欄位名稱', () => {
    const query = createValidQuery({
      dataSource: 'orders',
      fields: ['store.name', 'customer.name'],
    })

    const result = validateQueryDefinition(query)

    expect(result.valid).toBe(true)
  })

  it('應該處理聚合欄位', () => {
    const query = createValidQuery({
      dataSource: 'orders',
      fields: ['_count', '_sum.totalAmount'],
    })

    const result = validateQueryDefinition(query)

    expect(result.valid).toBe(true)
  })

  // 邊界條件測試
  it('應該處理未知的資料來源', () => {
    const query = createValidQuery({
      dataSource: 'unknown' as DataSource,
      fields: ['field1'],
    })

    const result = validateQueryDefinition(query)

    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes('field1'))).toBe(true)
  })
})

// ===================================
// availableFields 測試
// ===================================

describe('availableFields', () => {
  it('應該定義 orders 資料來源的欄位', () => {
    expect(availableFields.orders).toBeDefined()
    expect(availableFields.orders.length).toBeGreaterThan(0)

    const fieldNames = availableFields.orders.map((f) => f.name)
    expect(fieldNames).toContain('orderNo')
    expect(fieldNames).toContain('orderDate')
    expect(fieldNames).toContain('totalAmount')
    expect(fieldNames).toContain('status')
    expect(fieldNames).toContain('store.name')
    expect(fieldNames).toContain('customer.name')
    expect(fieldNames).toContain('_count')
    expect(fieldNames).toContain('_sum.totalAmount')
  })

  it('應該定義 products 資料來源的欄位', () => {
    expect(availableFields.products).toBeDefined()
    expect(availableFields.products.length).toBeGreaterThan(0)

    const fieldNames = availableFields.products.map((f) => f.name)
    expect(fieldNames).toContain('sku')
    expect(fieldNames).toContain('name')
    expect(fieldNames).toContain('sellingPrice')
    expect(fieldNames).toContain('costPrice')
    expect(fieldNames).toContain('category.name')
  })

  it('應該定義 customers 資料來源的欄位', () => {
    expect(availableFields.customers).toBeDefined()
    expect(availableFields.customers.length).toBeGreaterThan(0)

    const fieldNames = availableFields.customers.map((f) => f.name)
    expect(fieldNames).toContain('code')
    expect(fieldNames).toContain('name')
    expect(fieldNames).toContain('totalSpent')
    expect(fieldNames).toContain('orderCount')
    expect(fieldNames).toContain('level.name')
  })

  it('應該定義 inventory 資料來源的欄位', () => {
    expect(availableFields.inventory).toBeDefined()
    expect(availableFields.inventory.length).toBeGreaterThan(0)

    const fieldNames = availableFields.inventory.map((f) => f.name)
    expect(fieldNames).toContain('product.sku')
    expect(fieldNames).toContain('product.name')
    expect(fieldNames).toContain('quantity')
    expect(fieldNames).toContain('availableQty')
    expect(fieldNames).toContain('warehouse.name')
  })

  it('應該定義 purchase_orders 資料來源的欄位', () => {
    expect(availableFields.purchase_orders).toBeDefined()
    expect(availableFields.purchase_orders.length).toBeGreaterThan(0)

    const fieldNames = availableFields.purchase_orders.map((f) => f.name)
    expect(fieldNames).toContain('orderNo')
    expect(fieldNames).toContain('supplier.name')
    expect(fieldNames).toContain('totalAmount')
    expect(fieldNames).toContain('status')
  })

  it('每個欄位應該有正確的結構', () => {
    Object.values(availableFields).forEach((fields) => {
      fields.forEach((field) => {
        expect(field.name).toBeDefined()
        expect(typeof field.name).toBe('string')
        expect(field.label).toBeDefined()
        expect(typeof field.label).toBe('string')
        expect(field.dataSource).toBeDefined()
      })
    })
  })

  it('聚合欄位應該有 aggregation 屬性', () => {
    const ordersFields = availableFields.orders
    const countField = ordersFields.find((f) => f.name === '_count')
    const sumField = ordersFields.find((f) => f.name === '_sum.totalAmount')

    expect(countField?.aggregation).toBe('COUNT')
    expect(sumField?.aggregation).toBe('SUM')
  })

  it('應該有正確的中文標籤', () => {
    const orderNoField = availableFields.orders.find((f) => f.name === 'orderNo')
    expect(orderNoField?.label).toBe('訂單編號')

    const skuField = availableFields.products.find((f) => f.name === 'sku')
    expect(skuField?.label).toBe('商品編號')

    const customerCodeField = availableFields.customers.find((f) => f.name === 'code')
    expect(customerCodeField?.label).toBe('會員編號')
  })
})

// ===================================
// 類型定義測試
// ===================================

describe('類型定義', () => {
  it('DataSource 應該支援所有資料來源', () => {
    const sources: DataSource[] = [
      'orders',
      'products',
      'customers',
      'inventory',
      'purchase_orders',
    ]

    sources.forEach((source) => {
      expect(availableFields[source]).toBeDefined()
    })
  })

  it('QueryField 應該有正確的結構', () => {
    const field: QueryField = {
      name: 'testField',
      label: '測試欄位',
      dataSource: 'orders',
      aggregation: 'SUM',
    }

    expect(field.name).toBe('testField')
    expect(field.label).toBe('測試欄位')
    expect(field.dataSource).toBe('orders')
    expect(field.aggregation).toBe('SUM')
  })

  it('QueryFilter 應該支援所有運算符', () => {
    const operators: QueryFilter['operator'][] = [
      'eq',
      'ne',
      'gt',
      'gte',
      'lt',
      'lte',
      'contains',
      'in',
    ]

    operators.forEach((op) => {
      const filter: QueryFilter = {
        field: 'testField',
        operator: op,
        value: 'testValue',
      }
      expect(filter.operator).toBe(op)
    })
  })

  it('ChartConfig 應該支援所有圖表類型', () => {
    const chartTypes: ChartConfig['type'][] = ['bar', 'line', 'pie', 'table']

    chartTypes.forEach((type) => {
      const config: ChartConfig = {
        type,
        xField: 'x',
        yField: 'y',
        title: '測試圖表',
      }
      expect(config.type).toBe(type)
    })
  })

  it('QueryDefinition 應該支援完整配置', () => {
    const query: QueryDefinition = {
      dataSource: 'orders',
      fields: ['orderNo', 'totalAmount'],
      filters: [
        { field: 'status', operator: 'eq', value: 'COMPLETED' },
        { field: 'totalAmount', operator: 'gte', value: 1000 },
      ],
      groupBy: ['store.name'],
      orderBy: [
        { field: 'orderDate', direction: 'desc' },
        { field: 'totalAmount', direction: 'asc' },
      ],
      limit: 100,
    }

    expect(query.dataSource).toBe('orders')
    expect(query.fields).toHaveLength(2)
    expect(query.filters).toHaveLength(2)
    expect(query.groupBy).toHaveLength(1)
    expect(query.orderBy).toHaveLength(2)
    expect(query.limit).toBe(100)
  })
})

// ===================================
// 整合測試
// ===================================

describe('報表查詢建構器 - 整合測試', () => {
  it('完整流程：建立並驗證銷售報表查詢', () => {
    const query: QueryDefinition = {
      dataSource: 'orders',
      fields: ['orderNo', 'orderDate', 'totalAmount', 'status', 'store.name', 'customer.name'],
      filters: [{ field: 'status', operator: 'eq', value: 'COMPLETED' }],
      orderBy: [{ field: 'orderDate', direction: 'desc' }],
      limit: 50,
    }

    const result = validateQueryDefinition(query)

    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('完整流程：建立並驗證庫存報表查詢', () => {
    const query: QueryDefinition = {
      dataSource: 'inventory',
      fields: ['product.sku', 'product.name', 'quantity', 'availableQty', 'warehouse.name'],
      filters: [{ field: 'quantity', operator: 'lt', value: 10 }],
      orderBy: [{ field: 'quantity', direction: 'asc' }],
    }

    const result = validateQueryDefinition(query)

    expect(result.valid).toBe(true)
  })

  it('完整流程：建立並驗證會員分析查詢', () => {
    const query: QueryDefinition = {
      dataSource: 'customers',
      fields: ['code', 'name', 'totalSpent', 'orderCount', 'level.name'],
      filters: [{ field: 'totalSpent', operator: 'gte', value: 10000 }],
      groupBy: ['level.name'],
      orderBy: [{ field: 'totalSpent', direction: 'desc' }],
      limit: 100,
    }

    const result = validateQueryDefinition(query)

    expect(result.valid).toBe(true)
  })

  it('完整流程：建立並驗證採購報表查詢', () => {
    const query: QueryDefinition = {
      dataSource: 'purchase_orders',
      fields: ['orderNo', 'supplier.name', 'totalAmount', 'status'],
      filters: [{ field: 'status', operator: 'in', value: ['PENDING', 'APPROVED'] }],
      orderBy: [{ field: 'totalAmount', direction: 'desc' }],
    }

    const result = validateQueryDefinition(query)

    expect(result.valid).toBe(true)
  })

  it('完整流程：建立聚合報表查詢', () => {
    const query: QueryDefinition = {
      dataSource: 'orders',
      fields: ['store.name', '_count', '_sum.totalAmount'],
      filters: [],
      groupBy: ['store.name'],
      orderBy: [{ field: '_sum.totalAmount', direction: 'desc' }],
    }

    const result = validateQueryDefinition(query)

    expect(result.valid).toBe(true)
  })
})

// ===================================
// 錯誤場景測試
// ===================================

describe('報表查詢建構器 - 錯誤場景', () => {
  it('跨資料來源欄位應該失敗', () => {
    const query: QueryDefinition = {
      dataSource: 'orders',
      fields: ['orderNo', 'sku'], // sku 屬於 products
      filters: [],
    }

    const result = validateQueryDefinition(query)

    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes('sku'))).toBe(true)
  })

  it('混合有效和無效欄位應該部分失敗', () => {
    const query: QueryDefinition = {
      dataSource: 'orders',
      fields: ['orderNo', 'invalidField1', 'totalAmount', 'invalidField2'],
      filters: [],
    }

    const result = validateQueryDefinition(query)

    expect(result.valid).toBe(false)
    expect(result.errors).toHaveLength(2) // 兩個無效欄位
  })

  it('空資料來源字串應該失敗', () => {
    const query: QueryDefinition = {
      dataSource: '' as DataSource,
      fields: ['orderNo'],
      filters: [],
    }

    const result = validateQueryDefinition(query)

    expect(result.valid).toBe(false)
    expect(result.errors).toContain('請選擇資料來源')
  })

  it('undefined 欄位應該被正確處理', () => {
    const query: QueryDefinition = {
      dataSource: 'orders',
      fields: undefined as unknown as string[],
      filters: [],
    }

    const result = validateQueryDefinition(query)

    expect(result.valid).toBe(false)
    expect(result.errors).toContain('請至少選擇一個欄位')
  })
})
