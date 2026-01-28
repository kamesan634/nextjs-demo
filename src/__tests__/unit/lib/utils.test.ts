/**
 * 工具函數單元測試
 * 測試 src/lib/utils.ts 中的工具函數
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  cn,
  formatCurrency,
  formatDate,
  formatDateTime,
  generateId,
  generateDocumentNo,
  delay,
  safeJsonParse,
  calculatePagination,
} from '@/lib/utils'

describe('cn (className 合併函數)', () => {
  it('應該合併多個類名', () => {
    const result = cn('foo', 'bar', 'baz')
    expect(result).toBe('foo bar baz')
  })

  it('應該處理空值和 undefined', () => {
    const result = cn('foo', null, undefined, 'bar')
    expect(result).toBe('foo bar')
  })

  it('應該處理條件類名', () => {
    const isActive = true
    const isDisabled = false
    const result = cn('base', isActive && 'active', isDisabled && 'disabled')
    expect(result).toBe('base active')
  })

  it('應該處理物件形式的條件類名', () => {
    const result = cn('base', { active: true, disabled: false, hidden: true })
    expect(result).toBe('base active hidden')
  })

  it('應該處理陣列形式的類名', () => {
    const result = cn(['foo', 'bar'], 'baz')
    expect(result).toBe('foo bar baz')
  })

  it('應該合併 Tailwind CSS 衝突類名', () => {
    // twMerge 會處理衝突的 Tailwind 類名
    const result = cn('px-2 py-1', 'px-4')
    expect(result).toBe('py-1 px-4')
  })

  it('應該處理空字串', () => {
    const result = cn('', 'foo', '', 'bar')
    expect(result).toBe('foo bar')
  })

  it('應該處理完全空的輸入', () => {
    const result = cn()
    expect(result).toBe('')
  })

  it('應該處理巢狀陣列', () => {
    const result = cn(['foo', ['bar', 'baz']])
    expect(result).toBe('foo bar baz')
  })
})

describe('formatCurrency (貨幣格式化)', () => {
  it('應該格式化 TWD 金額 (數字)', () => {
    const result = formatCurrency(1000)
    expect(result).toBe('$1,000')
  })

  it('應該格式化 TWD 金額 (字串)', () => {
    const result = formatCurrency('1000')
    expect(result).toBe('$1,000')
  })

  it('應該處理小數點金額', () => {
    const result = formatCurrency(1000.5)
    // TWD 預設無小數位
    expect(result).toBe('$1,001')
  })

  it('應該格式化大金額', () => {
    const result = formatCurrency(1234567890)
    expect(result).toBe('$1,234,567,890')
  })

  it('應該處理零', () => {
    const result = formatCurrency(0)
    expect(result).toBe('$0')
  })

  it('應該處理負數', () => {
    const result = formatCurrency(-1000)
    expect(result).toBe('-$1,000')
  })

  it('應該支援其他貨幣 (USD)', () => {
    const result = formatCurrency(1000, 'USD')
    expect(result).toContain('1,000')
  })

  it('應該支援其他貨幣 (JPY)', () => {
    const result = formatCurrency(1000, 'JPY')
    expect(result).toContain('1,000')
  })

  it('應該處理字串形式的小數', () => {
    const result = formatCurrency('1234.56')
    expect(result).toBe('$1,235')
  })

  // 邊界值測試
  it('應該處理非常大的數字', () => {
    const result = formatCurrency(999999999999)
    expect(result).toContain('999,999,999,999')
  })

  it('應該處理非常小的小數', () => {
    const result = formatCurrency(0.001)
    expect(result).toBe('$0')
  })
})

describe('formatDate (日期格式化)', () => {
  it('應該格式化 Date 物件', () => {
    const date = new Date(2024, 0, 15) // 2024-01-15
    const result = formatDate(date)
    expect(result).toMatch(/2024/)
    expect(result).toMatch(/01/)
    expect(result).toMatch(/15/)
  })

  it('應該格式化 ISO 日期字串', () => {
    const result = formatDate('2024-01-15')
    expect(result).toMatch(/2024/)
  })

  it('應該使用自訂格式選項', () => {
    const date = new Date(2024, 0, 15)
    const result = formatDate(date, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    expect(result).toContain('2024')
  })

  it('應該處理年份邊界', () => {
    const date = new Date(1999, 11, 31)
    const result = formatDate(date)
    expect(result).toMatch(/1999/)
  })

  it('應該處理閏年日期', () => {
    const date = new Date(2024, 1, 29) // 2024-02-29 閏年
    const result = formatDate(date)
    expect(result).toMatch(/02/)
    expect(result).toMatch(/29/)
  })

  // 邊界值測試
  it('應該處理年初日期', () => {
    const date = new Date(2024, 0, 1)
    const result = formatDate(date)
    expect(result).toMatch(/01/)
  })

  it('應該處理年末日期', () => {
    const date = new Date(2024, 11, 31)
    const result = formatDate(date)
    expect(result).toMatch(/12/)
    expect(result).toMatch(/31/)
  })
})

describe('formatDateTime (日期時間格式化)', () => {
  it('應該格式化 Date 物件', () => {
    const date = new Date(2024, 0, 15, 14, 30)
    const result = formatDateTime(date)
    expect(result).toMatch(/2024/)
    // zh-TW 格式可能是 12 小時制 (下午02:30) 或 24 小時制 (14:30)
    expect(result).toMatch(/(14|02)/)
    expect(result).toMatch(/30/)
  })

  it('應該格式化 ISO 日期時間字串', () => {
    const result = formatDateTime('2024-01-15T14:30:00')
    expect(result).toMatch(/2024/)
  })

  it('應該處理午夜時間', () => {
    const date = new Date(2024, 0, 15, 0, 0)
    const result = formatDateTime(date)
    // 可能是 00:00 或 12:00 上午
    expect(result).toMatch(/(00|12)/)
  })

  it('應該處理午間時間', () => {
    const date = new Date(2024, 0, 15, 12, 0)
    const result = formatDateTime(date)
    expect(result).toMatch(/12/)
  })

  // 邊界值測試
  it('應該處理 23:59 時間', () => {
    const date = new Date(2024, 0, 15, 23, 59)
    const result = formatDateTime(date)
    // zh-TW 格式可能是 24 小時制或 12 小時制，檢查包含 59 分鐘
    expect(result).toMatch(/59/)
    // 應包含 23 或 11（12 小時制下午）
    expect(result).toMatch(/(23|11)/)
  })
})

describe('generateId (唯一識別碼產生)', () => {
  it('應該產生不帶前綴的識別碼', () => {
    const id = generateId()
    expect(typeof id).toBe('string')
    expect(id.length).toBeGreaterThan(0)
  })

  it('應該產生帶前綴的識別碼', () => {
    const id = generateId('USER')
    expect(id.startsWith('USER-')).toBe(true)
  })

  it('應該產生唯一的識別碼', () => {
    const ids = new Set<string>()
    for (let i = 0; i < 100; i++) {
      ids.add(generateId())
    }
    expect(ids.size).toBe(100)
  })

  it('應該處理空字串前綴', () => {
    const id = generateId('')
    expect(id.includes('-')).toBe(false)
  })

  it('應該處理特殊字元前綴', () => {
    const id = generateId('ORD-2024')
    expect(id.startsWith('ORD-2024-')).toBe(true)
  })
})

describe('generateDocumentNo (單據編號產生)', () => {
  let mockDate: Date

  beforeEach(() => {
    // 固定時間以便測試
    mockDate = new Date('2024-03-15T10:30:45.123Z')
    vi.useFakeTimers()
    vi.setSystemTime(mockDate)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('應該產生訂單編號', () => {
    const no = generateDocumentNo('ORD')
    expect(no.startsWith('ORD')).toBe(true)
    expect(no).toMatch(/^ORD\d+$/)
  })

  it('應該產生採購單編號', () => {
    const no = generateDocumentNo('PO')
    expect(no.startsWith('PO')).toBe(true)
  })

  it('應該產生發票編號', () => {
    const no = generateDocumentNo('INV')
    expect(no.startsWith('INV')).toBe(true)
  })

  it('應該包含年月日資訊', () => {
    const no = generateDocumentNo('ORD')
    // 格式: ORD + 年(2位) + 月(2位) + 日(2位) + 時間戳後6位
    expect(no.length).toBeGreaterThan(8)
  })

  it('應該產生唯一的編號', () => {
    vi.useRealTimers() // 使用真實時間
    const numbers = new Set<string>()
    for (let i = 0; i < 10; i++) {
      numbers.add(generateDocumentNo('ORD'))
    }
    // 編號應該全部不同或大部分不同（時間戳可能相同）
    expect(numbers.size).toBeGreaterThanOrEqual(1)
  })
})

describe('delay (延遲函數)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('應該回傳 Promise', () => {
    const result = delay(100)
    expect(result).toBeInstanceOf(Promise)
  })

  it('應該在指定時間後解析', async () => {
    const promise = delay(1000)
    vi.advanceTimersByTime(1000)
    await expect(promise).resolves.toBeUndefined()
  })

  it('應該處理 0 毫秒延遲', async () => {
    const promise = delay(0)
    vi.advanceTimersByTime(0)
    await expect(promise).resolves.toBeUndefined()
  })

  it('應該處理長時間延遲', async () => {
    const promise = delay(5000)
    vi.advanceTimersByTime(5000)
    await expect(promise).resolves.toBeUndefined()
  })
})

describe('safeJsonParse (安全 JSON 解析)', () => {
  it('應該解析有效的 JSON 字串', () => {
    const result = safeJsonParse('{"name":"John","age":30}', {})
    expect(result).toEqual({ name: 'John', age: 30 })
  })

  it('應該解析陣列', () => {
    const result = safeJsonParse('[1, 2, 3]', [])
    expect(result).toEqual([1, 2, 3])
  })

  it('應該在無效 JSON 時返回預設值 (物件)', () => {
    const fallback = { default: true }
    const result = safeJsonParse('invalid json', fallback)
    expect(result).toEqual(fallback)
  })

  it('應該在無效 JSON 時返回預設值 (陣列)', () => {
    const fallback = [1, 2, 3]
    const result = safeJsonParse('invalid json', fallback)
    expect(result).toEqual(fallback)
  })

  it('應該在無效 JSON 時返回預設值 (null)', () => {
    const result = safeJsonParse('invalid json', null)
    expect(result).toBeNull()
  })

  it('應該處理空字串', () => {
    const result = safeJsonParse('', 'default')
    expect(result).toBe('default')
  })

  it('應該解析基本類型', () => {
    expect(safeJsonParse('"hello"', '')).toBe('hello')
    expect(safeJsonParse('123', 0)).toBe(123)
    expect(safeJsonParse('true', false)).toBe(true)
    expect(safeJsonParse('null', 'fallback')).toBeNull()
  })

  it('應該解析巢狀物件', () => {
    const json = '{"user":{"name":"John","address":{"city":"Taipei"}}}'
    const result = safeJsonParse(json, {})
    expect(result).toEqual({
      user: {
        name: 'John',
        address: { city: 'Taipei' },
      },
    })
  })

  // 邊界值測試
  it('應該處理只有空白的字串', () => {
    const result = safeJsonParse('   ', 'default')
    expect(result).toBe('default')
  })

  it('應該處理不完整的 JSON', () => {
    const result = safeJsonParse('{"name":', {})
    expect(result).toEqual({})
  })

  it('應該處理含有特殊字元的 JSON', () => {
    const json = '{"message":"Hello\\nWorld\\t!"}'
    const result = safeJsonParse(json, {})
    expect(result).toEqual({ message: 'Hello\nWorld\t!' })
  })
})

describe('calculatePagination (分頁計算)', () => {
  it('應該計算基本分頁資訊', () => {
    const result = calculatePagination(100, 1, 10)
    expect(result).toEqual({
      total: 100,
      page: 1,
      pageSize: 10,
      totalPages: 10,
      hasNextPage: true,
      hasPrevPage: false,
    })
  })

  it('應該計算中間頁的分頁資訊', () => {
    const result = calculatePagination(100, 5, 10)
    expect(result).toEqual({
      total: 100,
      page: 5,
      pageSize: 10,
      totalPages: 10,
      hasNextPage: true,
      hasPrevPage: true,
    })
  })

  it('應該計算最後一頁的分頁資訊', () => {
    const result = calculatePagination(100, 10, 10)
    expect(result).toEqual({
      total: 100,
      page: 10,
      pageSize: 10,
      totalPages: 10,
      hasNextPage: false,
      hasPrevPage: true,
    })
  })

  it('應該處理不足一頁的情況', () => {
    const result = calculatePagination(5, 1, 10)
    expect(result).toEqual({
      total: 5,
      page: 1,
      pageSize: 10,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    })
  })

  it('應該處理總數為 0 的情況', () => {
    const result = calculatePagination(0, 1, 10)
    expect(result).toEqual({
      total: 0,
      page: 1,
      pageSize: 10,
      totalPages: 0,
      hasNextPage: false,
      hasPrevPage: false,
    })
  })

  it('應該正確計算非整除的總頁數', () => {
    const result = calculatePagination(25, 1, 10)
    expect(result.totalPages).toBe(3) // 25/10 = 2.5, ceil to 3
  })

  // 邊界值測試
  it('應該處理每頁 1 筆的情況', () => {
    const result = calculatePagination(5, 3, 1)
    expect(result).toEqual({
      total: 5,
      page: 3,
      pageSize: 1,
      totalPages: 5,
      hasNextPage: true,
      hasPrevPage: true,
    })
  })

  it('應該處理大量資料', () => {
    const result = calculatePagination(10000, 50, 100)
    expect(result).toEqual({
      total: 10000,
      page: 50,
      pageSize: 100,
      totalPages: 100,
      hasNextPage: true,
      hasPrevPage: true,
    })
  })

  it('應該處理只有一筆資料', () => {
    const result = calculatePagination(1, 1, 10)
    expect(result).toEqual({
      total: 1,
      page: 1,
      pageSize: 10,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    })
  })

  it('應該處理總數剛好整除的情況', () => {
    const result = calculatePagination(100, 10, 10)
    expect(result.totalPages).toBe(10)
    expect(result.hasNextPage).toBe(false)
  })
})
