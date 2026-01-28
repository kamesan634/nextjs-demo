/**
 * RFM 分析工具單元測試
 * 測試 src/lib/rfm-analysis.ts 中的 RFM 分析功能
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { calculateRFM, getRFMSegment, segmentInfo, type CustomerRFMData } from '@/lib/rfm-analysis'

// ===================================
// 測試資料準備
// ===================================

const createCustomerData = (overrides: Partial<CustomerRFMData> = {}): CustomerRFMData => ({
  customerId: 'customer-1',
  customerName: '測試客戶',
  lastPurchaseDate: new Date(),
  purchaseCount: 10,
  totalAmount: 10000,
  ...overrides,
})

// ===================================
// getRFMSegment 測試
// ===================================

describe('getRFMSegment', () => {
  it('Champions: 高 R, 高 F, 高 M (r>=4, f>=4, m>=4)', () => {
    expect(getRFMSegment(5, 5, 5)).toBe('Champions')
    expect(getRFMSegment(4, 4, 4)).toBe('Champions')
    expect(getRFMSegment(5, 4, 4)).toBe('Champions')
  })

  it('Loyal: 高 F, 高 M (f>=4, m>=4)，但不是 Champions', () => {
    expect(getRFMSegment(3, 5, 5)).toBe('Loyal')
    expect(getRFMSegment(2, 4, 4)).toBe('Loyal')
    expect(getRFMSegment(1, 4, 4)).toBe('Loyal')
  })

  it('Promising: 高 R, 低 F (r>=4, f<=2)', () => {
    expect(getRFMSegment(5, 1, 3)).toBe('Promising')
    expect(getRFMSegment(4, 2, 2)).toBe('Promising')
    expect(getRFMSegment(5, 2, 1)).toBe('Promising')
  })

  it('At Risk: 低 R, 中高 F, 中高 M (r<=2, f>=3, m>=3)，但不是 Loyal 級別', () => {
    expect(getRFMSegment(2, 3, 3)).toBe('At Risk')
    expect(getRFMSegment(1, 4, 3)).toBe('At Risk') // m=3，不是 Loyal 級別
    expect(getRFMSegment(2, 3, 4)).toBe('At Risk') // f=3，不是 Loyal 級別
  })

  it('Hibernating: 低 R, 低 F (r<=2, f<=2)', () => {
    expect(getRFMSegment(2, 2, 5)).toBe('Hibernating')
    expect(getRFMSegment(2, 1, 3)).toBe('Hibernating')
    // 注意：r=1 會先匹配 Lost
  })

  it('Lost: 極低 R (r=1)，且不滿足其他條件', () => {
    expect(getRFMSegment(1, 1, 1)).toBe('Lost')
    expect(getRFMSegment(1, 2, 2)).toBe('Lost')
    expect(getRFMSegment(1, 1, 5)).toBe('Lost')
  })

  it('Potential: 中等分數 (r>=3, f>=2, m>=2)', () => {
    expect(getRFMSegment(3, 3, 3)).toBe('Potential')
    expect(getRFMSegment(3, 2, 2)).toBe('Potential')
    expect(getRFMSegment(5, 3, 3)).toBe('Potential')
  })

  it('Needs Attention: 其他所有情況', () => {
    expect(getRFMSegment(3, 1, 1)).toBe('Needs Attention')
    expect(getRFMSegment(2, 3, 2)).toBe('Needs Attention')
    expect(getRFMSegment(3, 2, 1)).toBe('Needs Attention')
  })

  // 邊界條件測試
  it('邊界值測試：分數為 1-5 的組合', () => {
    // 測試各種分數組合不會拋出錯誤
    for (let r = 1; r <= 5; r++) {
      for (let f = 1; f <= 5; f++) {
        for (let m = 1; m <= 5; m++) {
          const segment = getRFMSegment(r, f, m)
          expect(typeof segment).toBe('string')
          expect(segment.length).toBeGreaterThan(0)
        }
      }
    }
  })
})

// ===================================
// segmentInfo 測試
// ===================================

describe('segmentInfo', () => {
  it('應該包含所有分群的資訊', () => {
    const expectedSegments = [
      'Champions',
      'Loyal',
      'Promising',
      'Potential',
      'At Risk',
      'Hibernating',
      'Lost',
      'Needs Attention',
    ]

    expectedSegments.forEach((segment) => {
      expect(segmentInfo[segment]).toBeDefined()
      expect(segmentInfo[segment].label).toBeDefined()
      expect(segmentInfo[segment].description).toBeDefined()
      expect(segmentInfo[segment].color).toBeDefined()
    })
  })

  it('Champions 應該有正確的資訊', () => {
    expect(segmentInfo.Champions.label).toBe('頂級客戶')
    expect(segmentInfo.Champions.description).toContain('最近購買')
    expect(segmentInfo.Champions.color).toContain('green')
  })

  it('Loyal 應該有正確的資訊', () => {
    expect(segmentInfo.Loyal.label).toBe('忠誠客戶')
    expect(segmentInfo.Loyal.description).toContain('購買頻繁')
    expect(segmentInfo.Loyal.color).toContain('blue')
  })

  it('Promising 應該有正確的資訊', () => {
    expect(segmentInfo.Promising.label).toBe('潛力客戶')
    expect(segmentInfo.Promising.color).toContain('purple')
  })

  it('At Risk 應該有正確的資訊', () => {
    expect(segmentInfo['At Risk'].label).toBe('流失風險')
    expect(segmentInfo['At Risk'].color).toContain('orange')
  })

  it('Hibernating 應該有正確的資訊', () => {
    expect(segmentInfo.Hibernating.label).toBe('休眠客戶')
    expect(segmentInfo.Hibernating.color).toContain('gray')
  })

  it('Lost 應該有正確的資訊', () => {
    expect(segmentInfo.Lost.label).toBe('已流失客戶')
    expect(segmentInfo.Lost.color).toContain('red')
  })

  it('Needs Attention 應該有正確的資訊', () => {
    expect(segmentInfo['Needs Attention'].label).toBe('需要關注')
    expect(segmentInfo['Needs Attention'].color).toContain('yellow')
  })
})

// ===================================
// calculateRFM 測試
// ===================================

describe('calculateRFM', () => {
  let mockDate: Date

  beforeEach(() => {
    // 固定時間以便測試
    mockDate = new Date('2024-06-15T12:00:00.000Z')
    vi.useFakeTimers()
    vi.setSystemTime(mockDate)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('應該正確計算單一客戶的 RFM 分數', () => {
    const customers = [
      createCustomerData({
        customerId: 'c1',
        lastPurchaseDate: new Date('2024-06-10'), // 5 天前
        purchaseCount: 20,
        totalAmount: 50000,
      }),
    ]

    const results = calculateRFM(customers)

    expect(results).toHaveLength(1)
    expect(results[0].customerId).toBe('c1')
    expect(results[0].recencyScore).toBeGreaterThanOrEqual(1)
    expect(results[0].recencyScore).toBeLessThanOrEqual(5)
    expect(results[0].frequencyScore).toBeGreaterThanOrEqual(1)
    expect(results[0].frequencyScore).toBeLessThanOrEqual(5)
    expect(results[0].monetaryScore).toBeGreaterThanOrEqual(1)
    expect(results[0].monetaryScore).toBeLessThanOrEqual(5)
    expect(results[0].segment).toBeDefined()
  })

  it('應該正確處理多個客戶並計算分位數', () => {
    const customers = [
      createCustomerData({
        customerId: 'c1',
        lastPurchaseDate: new Date('2024-06-14'), // 1 天前
        purchaseCount: 50,
        totalAmount: 100000,
      }),
      createCustomerData({
        customerId: 'c2',
        lastPurchaseDate: new Date('2024-05-15'), // 31 天前
        purchaseCount: 20,
        totalAmount: 50000,
      }),
      createCustomerData({
        customerId: 'c3',
        lastPurchaseDate: new Date('2024-03-15'), // 92 天前
        purchaseCount: 5,
        totalAmount: 10000,
      }),
      createCustomerData({
        customerId: 'c4',
        lastPurchaseDate: new Date('2024-01-15'), // 152 天前
        purchaseCount: 2,
        totalAmount: 5000,
      }),
      createCustomerData({
        customerId: 'c5',
        lastPurchaseDate: new Date('2023-06-15'), // 366 天前
        purchaseCount: 1,
        totalAmount: 1000,
      }),
    ]

    const results = calculateRFM(customers)

    expect(results).toHaveLength(5)

    // 最近購買的客戶應該有較高的 R 分數
    const c1Result = results.find((r) => r.customerId === 'c1')!
    const c5Result = results.find((r) => r.customerId === 'c5')!

    // Recency 是反向的，天數越小分數應該越高
    // 但在只有5個客戶的情況下，分位數計算會影響結果
    expect(c1Result.recencyScore).toBeGreaterThanOrEqual(c5Result.recencyScore)

    // 購買次數最多的應該有較高的 F 分數
    expect(c1Result.frequencyScore).toBeGreaterThanOrEqual(c5Result.frequencyScore)

    // 消費金額最高的應該有較高的 M 分數
    expect(c1Result.monetaryScore).toBeGreaterThanOrEqual(c5Result.monetaryScore)
  })

  it('應該正確處理 null lastPurchaseDate', () => {
    const customers = [
      createCustomerData({
        customerId: 'c1',
        lastPurchaseDate: null,
        purchaseCount: 0,
        totalAmount: 0,
      }),
    ]

    const results = calculateRFM(customers)

    expect(results).toHaveLength(1)
    // null 日期應該轉換為極大天數，導致低 R 分數
    expect(results[0].recencyScore).toBe(1)
  })

  it('應該正確保留原始資料欄位', () => {
    const customers = [
      createCustomerData({
        customerId: 'c1',
        customerName: '測試客戶 A',
        lastPurchaseDate: new Date('2024-06-10'),
        purchaseCount: 10,
        totalAmount: 25000,
      }),
    ]

    const results = calculateRFM(customers)

    expect(results[0].customerId).toBe('c1')
    expect(results[0].customerName).toBe('測試客戶 A')
    expect(results[0].purchaseCount).toBe(10)
    expect(results[0].totalAmount).toBe(25000)
    expect(results[0].lastPurchaseDate).toEqual(new Date('2024-06-10'))
  })

  it('應該處理空客戶列表', () => {
    const customers: CustomerRFMData[] = []

    const results = calculateRFM(customers)

    expect(results).toHaveLength(0)
  })

  it('應該正確分配 segment', () => {
    const customers = [
      createCustomerData({
        customerId: 'champion',
        lastPurchaseDate: new Date('2024-06-14'), // 最近
        purchaseCount: 100,
        totalAmount: 500000,
      }),
      createCustomerData({
        customerId: 'lost',
        lastPurchaseDate: new Date('2020-01-01'), // 很久以前
        purchaseCount: 1,
        totalAmount: 100,
      }),
    ]

    const results = calculateRFM(customers)

    // 檢查每個結果都有 segment
    results.forEach((result) => {
      expect(result.segment).toBeDefined()
      expect(typeof result.segment).toBe('string')
    })
  })

  it('應該處理相同數值的情況', () => {
    const customers = [
      createCustomerData({
        customerId: 'c1',
        lastPurchaseDate: new Date('2024-06-10'),
        purchaseCount: 10,
        totalAmount: 10000,
      }),
      createCustomerData({
        customerId: 'c2',
        lastPurchaseDate: new Date('2024-06-10'),
        purchaseCount: 10,
        totalAmount: 10000,
      }),
      createCustomerData({
        customerId: 'c3',
        lastPurchaseDate: new Date('2024-06-10'),
        purchaseCount: 10,
        totalAmount: 10000,
      }),
    ]

    const results = calculateRFM(customers)

    expect(results).toHaveLength(3)
    // 所有相同的客戶應該有相同的分數
    expect(results[0].recencyScore).toBe(results[1].recencyScore)
    expect(results[1].recencyScore).toBe(results[2].recencyScore)
  })

  it('應該正確計算 Recency 天數', () => {
    // 設定 now 為 2024-06-15
    const customers = [
      createCustomerData({
        customerId: 'c1',
        lastPurchaseDate: new Date('2024-06-15'), // 0 天前
      }),
      createCustomerData({
        customerId: 'c2',
        lastPurchaseDate: new Date('2024-06-14'), // 1 天前
      }),
    ]

    const results = calculateRFM(customers)

    // 天數較少的應該有較高的 R 分數 (反向)
    const c1Result = results.find((r) => r.customerId === 'c1')!
    const c2Result = results.find((r) => r.customerId === 'c2')!

    expect(c1Result.recencyScore).toBeGreaterThanOrEqual(c2Result.recencyScore)
  })

  // 邊界條件測試
  it('應該處理極端值', () => {
    const customers = [
      createCustomerData({
        customerId: 'extreme-high',
        lastPurchaseDate: new Date(),
        purchaseCount: 999999,
        totalAmount: 999999999,
      }),
      createCustomerData({
        customerId: 'extreme-low',
        lastPurchaseDate: null,
        purchaseCount: 0,
        totalAmount: 0,
      }),
    ]

    const results = calculateRFM(customers)

    expect(results).toHaveLength(2)
    // 不應該拋出錯誤
    results.forEach((result) => {
      expect(result.recencyScore).toBeGreaterThanOrEqual(1)
      expect(result.recencyScore).toBeLessThanOrEqual(5)
      expect(result.frequencyScore).toBeGreaterThanOrEqual(1)
      expect(result.frequencyScore).toBeLessThanOrEqual(5)
      expect(result.monetaryScore).toBeGreaterThanOrEqual(1)
      expect(result.monetaryScore).toBeLessThanOrEqual(5)
    })
  })

  it('應該處理負數值', () => {
    const customers = [
      createCustomerData({
        customerId: 'c1',
        lastPurchaseDate: new Date('2024-06-10'),
        purchaseCount: -5, // 負數購買次數（不合理但應該處理）
        totalAmount: -1000, // 負數金額
      }),
    ]

    const results = calculateRFM(customers)

    expect(results).toHaveLength(1)
    // 應該有效計算，不拋出錯誤
    expect(results[0].segment).toBeDefined()
  })
})

// ===================================
// 整合測試
// ===================================

describe('RFM Analysis - 整合測試', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-06-15T12:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('完整流程：計算 RFM 並獲取分群資訊', () => {
    const customers = [
      createCustomerData({
        customerId: 'vip',
        customerName: 'VIP 客戶',
        lastPurchaseDate: new Date('2024-06-14'),
        purchaseCount: 50,
        totalAmount: 200000,
      }),
      createCustomerData({
        customerId: 'new',
        customerName: '新客戶',
        lastPurchaseDate: new Date('2024-06-13'),
        purchaseCount: 1,
        totalAmount: 500,
      }),
    ]

    const results = calculateRFM(customers)

    results.forEach((result) => {
      // 每個結果都應該能從 segmentInfo 獲取資訊
      const info = segmentInfo[result.segment]
      expect(info).toBeDefined()
      expect(info.label).toBeDefined()
      expect(info.description).toBeDefined()
      expect(info.color).toBeDefined()
    })
  })

  it('大量客戶資料處理', () => {
    // 生成 100 個隨機客戶
    const customers: CustomerRFMData[] = Array.from({ length: 100 }, (_, i) => {
      const daysAgo = Math.floor(Math.random() * 365)
      const lastPurchaseDate = new Date('2024-06-15')
      lastPurchaseDate.setDate(lastPurchaseDate.getDate() - daysAgo)

      return createCustomerData({
        customerId: `customer-${i}`,
        customerName: `客戶 ${i}`,
        lastPurchaseDate,
        purchaseCount: Math.floor(Math.random() * 100) + 1,
        totalAmount: Math.floor(Math.random() * 100000) + 100,
      })
    })

    const results = calculateRFM(customers)

    expect(results).toHaveLength(100)

    // 檢查分群分佈
    const segmentCounts: Record<string, number> = {}
    results.forEach((result) => {
      segmentCounts[result.segment] = (segmentCounts[result.segment] || 0) + 1
    })

    // 確認所有分群都是有效的
    Object.keys(segmentCounts).forEach((segment) => {
      expect(segmentInfo[segment]).toBeDefined()
    })
  })
})
