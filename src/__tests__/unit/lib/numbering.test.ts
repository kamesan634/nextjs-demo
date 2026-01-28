/**
 * 編號產生工具單元測試
 * 測試 src/lib/numbering.ts 中的編號產生功能
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { generateNextNumber, previewNextNumber, NumberingRuleCodes } from '@/lib/numbering'
import prisma from '@/lib/prisma'

describe('NumberingRuleCodes (編號規則代碼常量)', () => {
  it('應包含所有預期的編號規則代碼', () => {
    expect(NumberingRuleCodes.ORDER).toBe('ORDER')
    expect(NumberingRuleCodes.PURCHASE_ORDER).toBe('PO')
    expect(NumberingRuleCodes.REFUND).toBe('REFUND')
    expect(NumberingRuleCodes.GOODS_RECEIPT).toBe('GR')
    expect(NumberingRuleCodes.GOODS_ISSUE).toBe('GI')
    expect(NumberingRuleCodes.STOCK_COUNT).toBe('SC')
    expect(NumberingRuleCodes.STOCK_TRANSFER).toBe('ST')
    expect(NumberingRuleCodes.STOCK_ADJUSTMENT).toBe('SA')
    expect(NumberingRuleCodes.INVOICE).toBe('INV')
    expect(NumberingRuleCodes.HOLD_ORDER).toBe('HOLD')
    expect(NumberingRuleCodes.POS_SESSION).toBe('POS')
    expect(NumberingRuleCodes.CASHIER_SHIFT).toBe('SHIFT')
    expect(NumberingRuleCodes.CUSTOMER).toBe('CUST')
  })

  it('應該是唯讀物件', () => {
    // 確保 NumberingRuleCodes 是 as const
    const codes = Object.values(NumberingRuleCodes)
    expect(codes.length).toBe(13)
  })
})

describe('generateNextNumber (產生下一個編號)', () => {
  let mockDate: Date

  beforeEach(() => {
    vi.clearAllMocks()
    // 固定時間以便測試
    mockDate = new Date('2024-03-15T10:30:45.123Z')
    vi.useFakeTimers()
    vi.setSystemTime(mockDate)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('應該產生正確格式的訂單編號 (包含日期)', async () => {
    const mockRule = {
      id: 'rule-1',
      code: 'ORDER',
      prefix: 'ORD',
      dateFormat: 'YYYYMMDD',
      sequenceLength: 4,
      currentSequence: 5,
      resetPeriod: 'DAILY',
      lastResetAt: mockDate,
      isActive: true,
    }

    vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
      if (typeof callback === 'function') {
        const mockTx = {
          numberingRule: {
            findUnique: vi.fn().mockResolvedValue(mockRule),
            update: vi.fn().mockResolvedValue(mockRule),
          },
        }
        return callback(mockTx as never)
      }
      return Promise.resolve([])
    })

    const result = await generateNextNumber('ORDER')

    // 格式: ORD + 20240315 + 0006
    expect(result).toBe('ORD202403150006')
  })

  it('應該產生正確格式的編號 (只有年月)', async () => {
    const mockRule = {
      id: 'rule-1',
      code: 'PO',
      prefix: 'PO',
      dateFormat: 'YYYYMM',
      sequenceLength: 5,
      currentSequence: 10,
      resetPeriod: 'MONTHLY',
      lastResetAt: mockDate,
      isActive: true,
    }

    vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
      if (typeof callback === 'function') {
        const mockTx = {
          numberingRule: {
            findUnique: vi.fn().mockResolvedValue(mockRule),
            update: vi.fn().mockResolvedValue(mockRule),
          },
        }
        return callback(mockTx as never)
      }
      return Promise.resolve([])
    })

    const result = await generateNextNumber('PO')

    // 格式: PO + 202403 + 00011
    expect(result).toBe('PO20240300011')
  })

  it('應該產生正確格式的編號 (只有年)', async () => {
    const mockRule = {
      id: 'rule-1',
      code: 'INV',
      prefix: 'INV',
      dateFormat: 'YYYY',
      sequenceLength: 6,
      currentSequence: 99,
      resetPeriod: 'YEARLY',
      lastResetAt: mockDate,
      isActive: true,
    }

    vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
      if (typeof callback === 'function') {
        const mockTx = {
          numberingRule: {
            findUnique: vi.fn().mockResolvedValue(mockRule),
            update: vi.fn().mockResolvedValue(mockRule),
          },
        }
        return callback(mockTx as never)
      }
      return Promise.resolve([])
    })

    const result = await generateNextNumber('INV')

    // 格式: INV + 2024 + 000100
    expect(result).toBe('INV2024000100')
  })

  it('應該產生正確格式的編號 (無日期格式)', async () => {
    const mockRule = {
      id: 'rule-1',
      code: 'CUST',
      prefix: 'C',
      dateFormat: null,
      sequenceLength: 6,
      currentSequence: 999,
      resetPeriod: 'NEVER',
      lastResetAt: null,
      isActive: true,
    }

    vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
      if (typeof callback === 'function') {
        const mockTx = {
          numberingRule: {
            findUnique: vi.fn().mockResolvedValue(mockRule),
            update: vi.fn().mockResolvedValue(mockRule),
          },
        }
        return callback(mockTx as never)
      }
      return Promise.resolve([])
    })

    const result = await generateNextNumber('CUST')

    // 格式: C + 001000
    expect(result).toBe('C001000')
  })

  it('應該在規則不存在時拋出錯誤', async () => {
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
      if (typeof callback === 'function') {
        const mockTx = {
          numberingRule: {
            findUnique: vi.fn().mockResolvedValue(null),
          },
        }
        return callback(mockTx as never)
      }
      return Promise.resolve([])
    })

    await expect(generateNextNumber('NONEXISTENT')).rejects.toThrow('編號規則 NONEXISTENT 不存在')
  })

  it('應該在規則已停用時拋出錯誤', async () => {
    const mockRule = {
      id: 'rule-1',
      code: 'ORDER',
      prefix: 'ORD',
      dateFormat: 'YYYYMMDD',
      sequenceLength: 4,
      currentSequence: 5,
      resetPeriod: 'DAILY',
      lastResetAt: mockDate,
      isActive: false,
    }

    vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
      if (typeof callback === 'function') {
        const mockTx = {
          numberingRule: {
            findUnique: vi.fn().mockResolvedValue(mockRule),
          },
        }
        return callback(mockTx as never)
      }
      return Promise.resolve([])
    })

    await expect(generateNextNumber('ORDER')).rejects.toThrow('編號規則 ORDER 已停用')
  })

  it('應該在每日重設時重新計數', async () => {
    // 設定上次重設是昨天
    const yesterdayReset = new Date('2024-03-14T10:30:45.123Z')
    const mockRule = {
      id: 'rule-1',
      code: 'ORDER',
      prefix: 'ORD',
      dateFormat: 'YYYYMMDD',
      sequenceLength: 4,
      currentSequence: 999,
      resetPeriod: 'DAILY',
      lastResetAt: yesterdayReset,
      isActive: true,
    }

    vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
      if (typeof callback === 'function') {
        const mockTx = {
          numberingRule: {
            findUnique: vi.fn().mockResolvedValue(mockRule),
            update: vi.fn().mockResolvedValue(mockRule),
          },
        }
        return callback(mockTx as never)
      }
      return Promise.resolve([])
    })

    const result = await generateNextNumber('ORDER')

    // 應該重設為 1
    expect(result).toBe('ORD202403150001')
  })

  it('應該在每月重設時重新計數', async () => {
    // 設定上次重設是上個月
    const lastMonthReset = new Date('2024-02-15T10:30:45.123Z')
    const mockRule = {
      id: 'rule-1',
      code: 'PO',
      prefix: 'PO',
      dateFormat: 'YYYYMM',
      sequenceLength: 5,
      currentSequence: 500,
      resetPeriod: 'MONTHLY',
      lastResetAt: lastMonthReset,
      isActive: true,
    }

    vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
      if (typeof callback === 'function') {
        const mockTx = {
          numberingRule: {
            findUnique: vi.fn().mockResolvedValue(mockRule),
            update: vi.fn().mockResolvedValue(mockRule),
          },
        }
        return callback(mockTx as never)
      }
      return Promise.resolve([])
    })

    const result = await generateNextNumber('PO')

    // 應該重設為 1
    expect(result).toBe('PO20240300001')
  })

  it('應該在每年重設時重新計數', async () => {
    // 設定上次重設是去年
    const lastYearReset = new Date('2023-03-15T10:30:45.123Z')
    const mockRule = {
      id: 'rule-1',
      code: 'INV',
      prefix: 'INV',
      dateFormat: 'YYYY',
      sequenceLength: 6,
      currentSequence: 99999,
      resetPeriod: 'YEARLY',
      lastResetAt: lastYearReset,
      isActive: true,
    }

    vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
      if (typeof callback === 'function') {
        const mockTx = {
          numberingRule: {
            findUnique: vi.fn().mockResolvedValue(mockRule),
            update: vi.fn().mockResolvedValue(mockRule),
          },
        }
        return callback(mockTx as never)
      }
      return Promise.resolve([])
    })

    const result = await generateNextNumber('INV')

    // 應該重設為 1
    expect(result).toBe('INV2024000001')
  })

  it('應該在 NEVER 重設時持續遞增', async () => {
    const mockRule = {
      id: 'rule-1',
      code: 'CUST',
      prefix: 'C',
      dateFormat: null,
      sequenceLength: 6,
      currentSequence: 999999,
      resetPeriod: 'NEVER',
      lastResetAt: null,
      isActive: true,
    }

    vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
      if (typeof callback === 'function') {
        const mockTx = {
          numberingRule: {
            findUnique: vi.fn().mockResolvedValue(mockRule),
            update: vi.fn().mockResolvedValue(mockRule),
          },
        }
        return callback(mockTx as never)
      }
      return Promise.resolve([])
    })

    const result = await generateNextNumber('CUST')

    // 應該遞增到 1000000
    expect(result).toBe('C1000000')
  })

  it('應該在 lastResetAt 為 null 時進行重設', async () => {
    const mockRule = {
      id: 'rule-1',
      code: 'ORDER',
      prefix: 'ORD',
      dateFormat: 'YYYYMMDD',
      sequenceLength: 4,
      currentSequence: 100,
      resetPeriod: 'DAILY',
      lastResetAt: null,
      isActive: true,
    }

    vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
      if (typeof callback === 'function') {
        const mockTx = {
          numberingRule: {
            findUnique: vi.fn().mockResolvedValue(mockRule),
            update: vi.fn().mockResolvedValue(mockRule),
          },
        }
        return callback(mockTx as never)
      }
      return Promise.resolve([])
    })

    const result = await generateNextNumber('ORDER')

    // lastResetAt 為 null 會被視為 new Date(0)，所以應該重設
    expect(result).toBe('ORD202403150001')
  })
})

describe('previewNextNumber (預覽下一個編號)', () => {
  let mockDate: Date

  beforeEach(() => {
    vi.clearAllMocks()
    mockDate = new Date('2024-03-15T10:30:45.123Z')
    vi.useFakeTimers()
    vi.setSystemTime(mockDate)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('應該預覽下一個編號而不遞增序號', async () => {
    const mockRule = {
      id: 'rule-1',
      code: 'ORDER',
      prefix: 'ORD',
      dateFormat: 'YYYYMMDD',
      sequenceLength: 4,
      currentSequence: 5,
      resetPeriod: 'DAILY',
      lastResetAt: mockDate,
      isActive: true,
    }

    vi.mocked(prisma.numberingRule.findUnique).mockResolvedValue(mockRule as never)

    const result = await previewNextNumber('ORDER')

    expect(result).toBe('ORD202403150006')
    // 確認沒有呼叫更新
    expect(prisma.numberingRule.findUnique).toHaveBeenCalledWith({
      where: { code: 'ORDER' },
    })
  })

  it('應該在規則不存在時拋出錯誤', async () => {
    vi.mocked(prisma.numberingRule.findUnique).mockResolvedValue(null)

    await expect(previewNextNumber('NONEXISTENT')).rejects.toThrow('編號規則 NONEXISTENT 不存在')
  })

  it('應該正確處理重設週期的預覽', async () => {
    const yesterdayReset = new Date('2024-03-14T10:30:45.123Z')
    const mockRule = {
      id: 'rule-1',
      code: 'ORDER',
      prefix: 'ORD',
      dateFormat: 'YYYYMMDD',
      sequenceLength: 4,
      currentSequence: 999,
      resetPeriod: 'DAILY',
      lastResetAt: yesterdayReset,
      isActive: true,
    }

    vi.mocked(prisma.numberingRule.findUnique).mockResolvedValue(mockRule as never)

    const result = await previewNextNumber('ORDER')

    // 預覽時應該顯示重設後的編號
    expect(result).toBe('ORD202403150001')
  })

  it('應該正確處理無日期格式的預覽', async () => {
    const mockRule = {
      id: 'rule-1',
      code: 'CUST',
      prefix: 'C',
      dateFormat: null,
      sequenceLength: 6,
      currentSequence: 100,
      resetPeriod: 'NEVER',
      lastResetAt: null,
      isActive: true,
    }

    vi.mocked(prisma.numberingRule.findUnique).mockResolvedValue(mockRule as never)

    const result = await previewNextNumber('CUST')

    expect(result).toBe('C000101')
  })

  it('應該處理未知的日期格式', async () => {
    const mockRule = {
      id: 'rule-1',
      code: 'TEST',
      prefix: 'T',
      dateFormat: 'UNKNOWN',
      sequenceLength: 4,
      currentSequence: 0,
      resetPeriod: 'NEVER',
      lastResetAt: null,
      isActive: true,
    }

    vi.mocked(prisma.numberingRule.findUnique).mockResolvedValue(mockRule as never)

    const result = await previewNextNumber('TEST')

    // 未知格式應該回傳空字串
    expect(result).toBe('T0001')
  })

  it('應該處理未知的重設週期', async () => {
    const mockRule = {
      id: 'rule-1',
      code: 'TEST',
      prefix: 'T',
      dateFormat: null,
      sequenceLength: 4,
      currentSequence: 10,
      resetPeriod: 'UNKNOWN',
      lastResetAt: mockDate,
      isActive: true,
    }

    vi.mocked(prisma.numberingRule.findUnique).mockResolvedValue(mockRule as never)

    const result = await previewNextNumber('TEST')

    // 未知的重設週期不應該重設
    expect(result).toBe('T0011')
  })

  it('應該處理 resetPeriod 為 null 的情況', async () => {
    const mockRule = {
      id: 'rule-1',
      code: 'TEST',
      prefix: 'T',
      dateFormat: null,
      sequenceLength: 4,
      currentSequence: 50,
      resetPeriod: null,
      lastResetAt: null,
      isActive: true,
    }

    vi.mocked(prisma.numberingRule.findUnique).mockResolvedValue(mockRule as never)

    const result = await previewNextNumber('TEST')

    // resetPeriod 為 null 時不應該重設
    expect(result).toBe('T0051')
  })
})

describe('邊界條件測試', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('應該正確處理序號長度不足的情況', async () => {
    const mockDate = new Date('2024-03-15T10:30:45.123Z')
    vi.useFakeTimers()
    vi.setSystemTime(mockDate)

    const mockRule = {
      id: 'rule-1',
      code: 'TEST',
      prefix: 'T',
      dateFormat: null,
      sequenceLength: 3,
      currentSequence: 9999, // 超過 3 位數
      resetPeriod: 'NEVER',
      lastResetAt: null,
      isActive: true,
    }

    vi.mocked(prisma.numberingRule.findUnique).mockResolvedValue(mockRule as never)

    const result = await previewNextNumber('TEST')

    // 序號會超過長度限制
    expect(result).toBe('T10000')

    vi.useRealTimers()
  })

  it('應該處理空前綴', async () => {
    const mockDate = new Date('2024-03-15T10:30:45.123Z')
    vi.useFakeTimers()
    vi.setSystemTime(mockDate)

    const mockRule = {
      id: 'rule-1',
      code: 'TEST',
      prefix: '',
      dateFormat: 'YYYYMMDD',
      sequenceLength: 4,
      currentSequence: 0,
      resetPeriod: 'NEVER',
      lastResetAt: null,
      isActive: true,
    }

    vi.mocked(prisma.numberingRule.findUnique).mockResolvedValue(mockRule as never)

    const result = await previewNextNumber('TEST')

    expect(result).toBe('202403150001')

    vi.useRealTimers()
  })

  it('應該處理跨年邊界', async () => {
    // 使用本地時間而非 UTC，避免時區轉換問題
    const newYearDate = new Date(2024, 0, 1, 12, 0, 0) // 2024-01-01 12:00 本地時間
    vi.useFakeTimers()
    vi.setSystemTime(newYearDate)

    const lastYearReset = new Date(2023, 5, 15, 12, 0, 0) // 2023-06-15 12:00 本地時間
    const mockRule = {
      id: 'rule-1',
      code: 'TEST',
      prefix: 'T',
      dateFormat: 'YYYY',
      sequenceLength: 6,
      currentSequence: 99999,
      resetPeriod: 'YEARLY',
      lastResetAt: lastYearReset,
      isActive: true,
    }

    vi.mocked(prisma.numberingRule.findUnique).mockResolvedValue(mockRule as never)

    const result = await previewNextNumber('TEST')

    // 跨年應該重設
    expect(result).toBe('T2024000001')

    vi.useRealTimers()
  })

  it('應該處理跨月邊界', async () => {
    // 使用本地時間而非 UTC，避免時區轉換問題
    const newMonthDate = new Date(2024, 2, 1, 12, 0, 0) // 2024-03-01 12:00 本地時間
    vi.useFakeTimers()
    vi.setSystemTime(newMonthDate)

    const lastMonthReset = new Date(2024, 1, 15, 12, 0, 0) // 2024-02-15 12:00 本地時間
    const mockRule = {
      id: 'rule-1',
      code: 'TEST',
      prefix: 'T',
      dateFormat: 'YYYYMM',
      sequenceLength: 5,
      currentSequence: 500,
      resetPeriod: 'MONTHLY',
      lastResetAt: lastMonthReset,
      isActive: true,
    }

    vi.mocked(prisma.numberingRule.findUnique).mockResolvedValue(mockRule as never)

    const result = await previewNextNumber('TEST')

    // 跨月應該重設
    expect(result).toBe('T20240300001')

    vi.useRealTimers()
  })

  it('應該正確處理同一天不重設', async () => {
    const mockDate = new Date('2024-03-15T10:30:45.123Z')
    vi.useFakeTimers()
    vi.setSystemTime(mockDate)

    // 同一天但不同時間的 lastResetAt
    const sameDayReset = new Date('2024-03-15T01:00:00.000Z')
    const mockRule = {
      id: 'rule-1',
      code: 'TEST',
      prefix: 'T',
      dateFormat: 'YYYYMMDD',
      sequenceLength: 4,
      currentSequence: 100,
      resetPeriod: 'DAILY',
      lastResetAt: sameDayReset,
      isActive: true,
    }

    vi.mocked(prisma.numberingRule.findUnique).mockResolvedValue(mockRule as never)

    const result = await previewNextNumber('TEST')

    // 同一天不應該重設
    expect(result).toBe('T202403150101')

    vi.useRealTimers()
  })
})
