/**
 * Cron 工具函數單元測試
 * 測試 src/lib/cron-utils.ts 中的 cron 表達式處理功能
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { calculateNextRunAt, parseCronToReadable, commonCronExpressions } from '@/lib/cron-utils'

// ===================================
// calculateNextRunAt 測試
// ===================================

describe('calculateNextRunAt', () => {
  beforeEach(() => {
    // 固定時間: 2024-06-15 10:30:00 (週六) - 使用本地時間
    // 注意：使用 new Date(year, month, day, hour, minute) 建立本地時間
    const mockDate = new Date(2024, 5, 15, 10, 30, 0) // 月份從 0 開始，5 = 6 月
    vi.useFakeTimers()
    vi.setSystemTime(mockDate)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('每天執行', () => {
    it('應該計算今天晚於當前時間的執行時間', () => {
      // 現在是 10:30，設定 14:00 執行
      const result = calculateNextRunAt('0 14 * * *')

      expect(result.getHours()).toBe(14)
      expect(result.getMinutes()).toBe(0)
      expect(result.getDate()).toBe(15) // 今天
    })

    it('應該計算明天早於當前時間的執行時間', () => {
      // 現在是 10:30，設定 8:00 執行
      const result = calculateNextRunAt('0 8 * * *')

      expect(result.getHours()).toBe(8)
      expect(result.getMinutes()).toBe(0)
      expect(result.getDate()).toBe(16) // 明天
    })

    it('應該處理午夜執行時間', () => {
      const result = calculateNextRunAt('0 0 * * *')

      expect(result.getHours()).toBe(0)
      expect(result.getMinutes()).toBe(0)
      expect(result.getDate()).toBe(16) // 明天午夜
    })

    it('應該處理帶分鐘的執行時間', () => {
      // 現在是 10:30，設定 10:45 執行
      const result = calculateNextRunAt('45 10 * * *')

      expect(result.getHours()).toBe(10)
      expect(result.getMinutes()).toBe(45)
      expect(result.getDate()).toBe(15) // 今天
    })
  })

  describe('每月特定日期執行', () => {
    it('應該計算下個月的執行時間（當月已過）', () => {
      // 現在是 6/15 10:30，設定每月 1 日 8:00
      const result = calculateNextRunAt('0 8 1 * *')

      expect(result.getDate()).toBe(1)
      expect(result.getMonth()).toBe(6) // 7月 (0-indexed)
    })

    it('應該計算本月的執行時間（當月未過）', () => {
      // 現在是 6/15 10:30，設定每月 20 日 8:00
      const result = calculateNextRunAt('0 8 20 * *')

      expect(result.getDate()).toBe(20)
      expect(result.getMonth()).toBe(5) // 6月
    })

    it('應該處理月末日期', () => {
      const result = calculateNextRunAt('0 8 28 * *')

      expect(result.getDate()).toBe(28)
    })
  })

  describe('每週特定星期執行', () => {
    it('應該計算下週的執行時間', () => {
      // 現在是週六 (6)，設定週一 (1) 執行
      const result = calculateNextRunAt('0 9 * * 1')

      expect(result.getDay()).toBe(1) // 週一
    })

    it('應該計算本週稍後的執行時間', () => {
      // 現在是週六 (6)，設定週日 (0) 執行
      const result = calculateNextRunAt('0 14 * * 0')

      expect(result.getDay()).toBe(0) // 週日
    })

    it('應該處理當天的執行（時間已過）', () => {
      // 現在是週六 10:30，設定週六 8:00 執行
      const result = calculateNextRunAt('0 8 * * 6')

      // 時間已過，應該是下週六
      expect(result.getDay()).toBe(6)
      expect(result.getDate()).toBeGreaterThan(15)
    })

    it('應該處理當天的執行（時間未過）', () => {
      // 現在是週六 10:30，設定週六 14:00 執行
      const result = calculateNextRunAt('0 14 * * 6')

      expect(result.getDay()).toBe(6)
      expect(result.getDate()).toBe(15) // 今天
    })
  })

  describe('邊界條件', () => {
    it('應該處理 * 分鐘', () => {
      const result = calculateNextRunAt('* 14 * * *')

      expect(result.getMinutes()).toBe(0) // * 被解析為 0
    })

    it('應該處理 * 小時', () => {
      const result = calculateNextRunAt('30 * * * *')

      expect(result.getHours()).toBe(0) // * 被解析為 0
    })

    it('應該處理當前時間剛好等於執行時間', () => {
      // 設定系統時間為剛好 10:30 (本地時間)
      vi.setSystemTime(new Date(2024, 5, 15, 10, 30, 0))

      const result = calculateNextRunAt('30 10 * * *')

      // 時間剛好等於，應該是明天
      expect(result.getDate()).toBe(16)
    })
  })
})

// ===================================
// parseCronToReadable 測試
// ===================================

describe('parseCronToReadable', () => {
  describe('每天執行', () => {
    it('應該解析每天早上 8 點', () => {
      const result = parseCronToReadable('0 8 * * *')

      expect(result).toBe('每天 8:00')
    })

    it('應該解析每天下午 6 點', () => {
      const result = parseCronToReadable('0 18 * * *')

      expect(result).toBe('每天 18:00')
    })

    it('應該解析帶分鐘的時間', () => {
      const result = parseCronToReadable('30 14 * * *')

      expect(result).toBe('每天 14:30')
    })

    it('應該在分鐘為個位數時補零', () => {
      const result = parseCronToReadable('5 9 * * *')

      expect(result).toBe('每天 9:05')
    })

    it('應該解析午夜時間', () => {
      const result = parseCronToReadable('0 0 * * *')

      expect(result).toBe('每天 0:00')
    })
  })

  describe('每月特定日期執行', () => {
    it('應該解析每月 1 日', () => {
      const result = parseCronToReadable('0 8 1 * *')

      expect(result).toBe('每月 1 日 8:00')
    })

    it('應該解析每月 15 日', () => {
      const result = parseCronToReadable('0 9 15 * *')

      expect(result).toBe('每月 15 日 9:00')
    })

    it('應該解析每月最後一天（31 日）', () => {
      const result = parseCronToReadable('30 17 31 * *')

      expect(result).toBe('每月 31 日 17:30')
    })
  })

  describe('每週特定星期執行', () => {
    it('應該解析每週日', () => {
      const result = parseCronToReadable('0 9 * * 0')

      expect(result).toBe('每週日 9:00')
    })

    it('應該解析每週一', () => {
      const result = parseCronToReadable('0 9 * * 1')

      expect(result).toBe('每週一 9:00')
    })

    it('應該解析每週二', () => {
      const result = parseCronToReadable('0 10 * * 2')

      expect(result).toBe('每週二 10:00')
    })

    it('應該解析每週三', () => {
      const result = parseCronToReadable('0 11 * * 3')

      expect(result).toBe('每週三 11:00')
    })

    it('應該解析每週四', () => {
      const result = parseCronToReadable('0 12 * * 4')

      expect(result).toBe('每週四 12:00')
    })

    it('應該解析每週五', () => {
      const result = parseCronToReadable('0 17 * * 5')

      expect(result).toBe('每週五 17:00')
    })

    it('應該解析每週六', () => {
      const result = parseCronToReadable('0 8 * * 6')

      expect(result).toBe('每週六 8:00')
    })
  })

  describe('每小時執行', () => {
    it('應該解析每小時 0 分', () => {
      const result = parseCronToReadable('0 * * * *')

      expect(result).toBe('每小時 0 分')
    })

    it('應該解析每小時 30 分', () => {
      const result = parseCronToReadable('30 * * * *')

      expect(result).toBe('每小時 30 分')
    })

    it('應該解析每小時 15 分', () => {
      const result = parseCronToReadable('15 * * * *')

      expect(result).toBe('每小時 15 分')
    })
  })

  describe('無效或特殊格式', () => {
    it('應該返回原始表達式（格式不正確）', () => {
      const result = parseCronToReadable('invalid')

      expect(result).toBe('invalid')
    })

    it('應該返回原始表達式（部分數量不對）', () => {
      const result = parseCronToReadable('0 8 * *')

      expect(result).toBe('0 8 * *')
    })

    it('應該返回原始表達式（部分過多）', () => {
      const result = parseCronToReadable('0 8 * * * extra')

      expect(result).toBe('0 8 * * * extra')
    })
  })
})

// ===================================
// commonCronExpressions 測試
// ===================================

describe('commonCronExpressions', () => {
  it('應該包含常用的 cron 表達式', () => {
    expect(commonCronExpressions.length).toBeGreaterThan(0)
  })

  it('每個表達式應該有 label 和 value', () => {
    commonCronExpressions.forEach((expr) => {
      expect(expr.label).toBeDefined()
      expect(typeof expr.label).toBe('string')
      expect(expr.value).toBeDefined()
      expect(typeof expr.value).toBe('string')
    })
  })

  it('應該包含每天早上 8 點', () => {
    const expr = commonCronExpressions.find((e) => e.value === '0 8 * * *')

    expect(expr).toBeDefined()
    expect(expr?.label).toBe('每天早上 8 點')
  })

  it('應該包含每天下午 6 點', () => {
    const expr = commonCronExpressions.find((e) => e.value === '0 18 * * *')

    expect(expr).toBeDefined()
    expect(expr?.label).toBe('每天下午 6 點')
  })

  it('應該包含每週一早上 9 點', () => {
    const expr = commonCronExpressions.find((e) => e.value === '0 9 * * 1')

    expect(expr).toBeDefined()
    expect(expr?.label).toBe('每週一早上 9 點')
  })

  it('應該包含每週五下午 5 點', () => {
    const expr = commonCronExpressions.find((e) => e.value === '0 17 * * 5')

    expect(expr).toBeDefined()
    expect(expr?.label).toBe('每週五下午 5 點')
  })

  it('應該包含每月 1 日早上 8 點', () => {
    const expr = commonCronExpressions.find((e) => e.value === '0 8 1 * *')

    expect(expr).toBeDefined()
    expect(expr?.label).toBe('每月 1 日早上 8 點')
  })

  it('應該包含每月 15 日早上 8 點', () => {
    const expr = commonCronExpressions.find((e) => e.value === '0 8 15 * *')

    expect(expr).toBeDefined()
    expect(expr?.label).toBe('每月 15 日早上 8 點')
  })

  it('所有 value 應該是有效的 5 部分 cron 表達式', () => {
    commonCronExpressions.forEach((expr) => {
      const parts = expr.value.split(' ')
      expect(parts).toHaveLength(5)
    })
  })

  it('parseCronToReadable 應該能正確解析所有常用表達式', () => {
    commonCronExpressions.forEach((expr) => {
      const readable = parseCronToReadable(expr.value)
      // 確保返回的不是原始表達式（代表解析成功）
      expect(readable).not.toBe(expr.value)
    })
  })
})

// ===================================
// 整合測試
// ===================================

describe('Cron Utils - 整合測試', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2024, 5, 15, 10, 30, 0))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('完整流程：選擇常用表達式並計算下次執行時間', () => {
    const selectedExpr = commonCronExpressions[0] // 每天早上 8 點

    expect(selectedExpr.value).toBe('0 8 * * *')

    const readable = parseCronToReadable(selectedExpr.value)
    expect(readable).toBe('每天 8:00')

    const nextRun = calculateNextRunAt(selectedExpr.value)
    expect(nextRun.getHours()).toBe(8)
    expect(nextRun.getMinutes()).toBe(0)
    // 今天 10:30，8:00 已過，所以是明天
    expect(nextRun.getDate()).toBe(16)
  })

  it('完整流程：每週執行', () => {
    const weeklyExpr = commonCronExpressions.find((e) => e.value === '0 9 * * 1')!

    const readable = parseCronToReadable(weeklyExpr.value)
    expect(readable).toBe('每週一 9:00')

    const nextRun = calculateNextRunAt(weeklyExpr.value)
    expect(nextRun.getDay()).toBe(1) // 週一
    expect(nextRun.getHours()).toBe(9)
  })

  it('完整流程：每月執行', () => {
    const monthlyExpr = commonCronExpressions.find((e) => e.value === '0 8 1 * *')!

    const readable = parseCronToReadable(monthlyExpr.value)
    expect(readable).toBe('每月 1 日 8:00')

    const nextRun = calculateNextRunAt(monthlyExpr.value)
    expect(nextRun.getDate()).toBe(1)
    expect(nextRun.getMonth()).toBe(6) // 7月（因為現在是 6/15）
  })
})

// ===================================
// 邊界條件和錯誤處理測試
// ===================================

describe('Cron Utils - 邊界條件和錯誤處理', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('年末跨年的執行時間計算', () => {
    // 設定為 2024-12-31 23:30 (本地時間)
    vi.setSystemTime(new Date(2024, 11, 31, 23, 30, 0))

    const result = calculateNextRunAt('0 8 * * *')

    // 應該是 2025-01-01 08:00
    expect(result.getFullYear()).toBe(2025)
    expect(result.getMonth()).toBe(0) // 1月
    expect(result.getDate()).toBe(1)
  })

  it('月末跨月的執行時間計算', () => {
    // 設定為 2024-01-31 23:30 (本地時間)
    vi.setSystemTime(new Date(2024, 0, 31, 23, 30, 0))

    const result = calculateNextRunAt('0 8 * * *')

    // 應該是 2024-02-01 08:00
    expect(result.getMonth()).toBe(1) // 2月
    expect(result.getDate()).toBe(1)
  })

  it('閏年 2 月的處理', () => {
    // 設定為 2024-02-28 23:30 (閏年，本地時間)
    vi.setSystemTime(new Date(2024, 1, 28, 23, 30, 0))

    const result = calculateNextRunAt('0 8 * * *')

    // 閏年，應該是 2024-02-29
    expect(result.getMonth()).toBe(1)
    expect(result.getDate()).toBe(29)
  })

  it('非閏年 2 月的處理', () => {
    // 設定為 2023-02-28 23:30 (非閏年，本地時間)
    vi.setSystemTime(new Date(2023, 1, 28, 23, 30, 0))

    const result = calculateNextRunAt('0 8 * * *')

    // 非閏年，應該是 2023-03-01
    expect(result.getMonth()).toBe(2) // 3月
    expect(result.getDate()).toBe(1)
  })

  it('應該處理空字串 cron 表達式', () => {
    // 這會導致部分為空，但不應該拋出錯誤
    const readable = parseCronToReadable('')
    expect(readable).toBe('')
  })

  it('應該處理極端的分鐘值', () => {
    const result = parseCronToReadable('59 23 * * *')
    expect(result).toBe('每天 23:59')
  })
})
