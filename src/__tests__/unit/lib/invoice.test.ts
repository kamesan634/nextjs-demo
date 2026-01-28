/**
 * 發票工具單元測試
 * 測試 src/lib/invoice.ts 中的發票處理功能
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  generateInvoiceNo,
  validateTaxId,
  calculateTax,
  calculateTotalWithTax,
  calculateAmountFromTotal,
} from '@/lib/invoice'

describe('generateInvoiceNo (產生發票號碼)', () => {
  let mockDate: Date

  beforeEach(() => {
    // 固定時間以便測試: 2024-03-15 (民國113年)
    mockDate = new Date('2024-03-15T10:30:45.123Z')
    vi.useFakeTimers()
    vi.setSystemTime(mockDate)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('應該產生正確格式的發票號碼 (預設前綴)', () => {
    const invoiceNo = generateInvoiceNo()

    // 格式: 民國年(3位) + 月份(2位) + 英文字母(2位) + 數字(8位)
    // 2024 - 1911 = 113
    expect(invoiceNo).toMatch(/^11303AA\d{8}$/)
  })

  it('應該產生正確格式的發票號碼 (自訂前綴)', () => {
    const invoiceNo = generateInvoiceNo('BC')

    expect(invoiceNo).toMatch(/^11303BC\d{8}$/)
  })

  it('應該產生正確格式的發票號碼 (不同月份)', () => {
    // 設定為 1 月
    vi.setSystemTime(new Date('2024-01-15T10:30:45.123Z'))
    const invoiceNo1 = generateInvoiceNo()
    expect(invoiceNo1).toMatch(/^11301AA\d{8}$/)

    // 設定為 12 月
    vi.setSystemTime(new Date('2024-12-15T10:30:45.123Z'))
    const invoiceNo12 = generateInvoiceNo()
    expect(invoiceNo12).toMatch(/^11312AA\d{8}$/)
  })

  it('應該產生不同的隨機數字', () => {
    vi.useRealTimers()

    const invoiceNumbers = new Set<string>()
    for (let i = 0; i < 100; i++) {
      invoiceNumbers.add(generateInvoiceNo())
    }

    // 100 次產生應該全部或大部分不同 (考慮隨機碰撞)
    expect(invoiceNumbers.size).toBeGreaterThanOrEqual(90)
  })

  it('應該正確計算民國年', () => {
    // 西元 2024 年 = 民國 113 年
    const invoiceNo2024 = generateInvoiceNo()
    expect(invoiceNo2024.startsWith('113')).toBe(true)

    // 西元 2025 年 = 民國 114 年
    vi.setSystemTime(new Date('2025-06-15T10:30:45.123Z'))
    const invoiceNo2025 = generateInvoiceNo()
    expect(invoiceNo2025.startsWith('114')).toBe(true)

    // 西元 2030 年 = 民國 119 年
    vi.setSystemTime(new Date('2030-06-15T10:30:45.123Z'))
    const invoiceNo2030 = generateInvoiceNo()
    expect(invoiceNo2030.startsWith('119')).toBe(true)
  })

  it('應該處理單位數月份補零', () => {
    // 1 月
    vi.setSystemTime(new Date('2024-01-15T10:30:45.123Z'))
    const invoiceNo = generateInvoiceNo()
    expect(invoiceNo.substring(3, 5)).toBe('01')

    // 9 月
    vi.setSystemTime(new Date('2024-09-15T10:30:45.123Z'))
    const invoiceNo9 = generateInvoiceNo()
    expect(invoiceNo9.substring(3, 5)).toBe('09')
  })

  it('應該處理隨機數字補零', () => {
    // Mock Math.random 回傳很小的值
    const originalRandom = Math.random
    Math.random = () => 0.00000001 // 會產生接近 0 的數字

    const invoiceNo = generateInvoiceNo()
    // 應該補零到 8 位
    const randomPart = invoiceNo.slice(-8)
    expect(randomPart.length).toBe(8)
    expect(randomPart).toMatch(/^\d{8}$/)

    Math.random = originalRandom
  })
})

describe('validateTaxId (驗證統一編號)', () => {
  describe('格式驗證', () => {
    it('應該接受有效的 8 位數統一編號', () => {
      // 測試真實有效的統一編號 (財政部)
      expect(validateTaxId('04595257')).toBe(true)
    })

    it('應該拒絕非 8 位數的統一編號', () => {
      expect(validateTaxId('1234567')).toBe(false) // 7 位
      expect(validateTaxId('123456789')).toBe(false) // 9 位
      expect(validateTaxId('')).toBe(false) // 空字串
      expect(validateTaxId('12345')).toBe(false) // 5 位
    })

    it('應該拒絕包含非數字字元的統一編號', () => {
      expect(validateTaxId('1234567A')).toBe(false)
      expect(validateTaxId('12-34567')).toBe(false)
      expect(validateTaxId('ABCDEFGH')).toBe(false)
      expect(validateTaxId('1234 567')).toBe(false)
      expect(validateTaxId('12.34567')).toBe(false)
    })
  })

  describe('檢查碼驗證', () => {
    it('應該接受通過檢查碼驗證的統一編號', () => {
      // 這些是有效的台灣統一編號 (總和為 5 或 10 的倍數)
      expect(validateTaxId('04595257')).toBe(true) // 財政部
      expect(validateTaxId('10458575')).toBe(true) // 常見有效統編
      expect(validateTaxId('22099131')).toBe(true) // 台北市政府
    })

    it('應該拒絕未通過檢查碼驗證的統一編號', () => {
      // 這些統一編號格式正確但檢查碼無效
      expect(validateTaxId('12345678')).toBe(false)
      expect(validateTaxId('11111111')).toBe(false)
      expect(validateTaxId('99999999')).toBe(false)
    })

    it('應該處理第 7 位為 7 的特殊情況', () => {
      // 當第 7 位（索引 6）為 7 時，有容錯機制 (+1)
      // 10458574: 計算總和為 29，第 7 位是 7，+1 後 30 可被 5 整除
      expect(validateTaxId('10458574')).toBe(true)
    })
  })

  describe('邊界條件', () => {
    it('應該處理全零統一編號', () => {
      expect(validateTaxId('00000000')).toBe(true) // 全零總和為 0，是 5 的倍數
    })

    it('應該正確處理乘積為兩位數的情況', () => {
      // 統編檢查碼演算法中，當乘積 >= 10 時需要將十位數和個位數相加
      // 例如 8 * 2 = 16，需要轉換成 1 + 6 = 7
      // 測試用統編：08000003，第二位 8 * 2 = 16 → 7，總和 = 10
      expect(validateTaxId('08000003')).toBe(true)
    })
  })
})

describe('calculateTax (計算稅額)', () => {
  it('應該計算 5% 的營業稅', () => {
    expect(calculateTax(100)).toBe(5)
    expect(calculateTax(200)).toBe(10)
    expect(calculateTax(1000)).toBe(50)
  })

  it('應該四捨五入到整數', () => {
    // 123 * 0.05 = 6.15 -> 6
    expect(calculateTax(123)).toBe(6)
    // 127 * 0.05 = 6.35 -> 6
    expect(calculateTax(127)).toBe(6)
    // 130 * 0.05 = 6.5 -> 7 (四捨五入)
    expect(calculateTax(130)).toBe(7)
  })

  it('應該處理零金額', () => {
    expect(calculateTax(0)).toBe(0)
  })

  it('應該處理負數金額', () => {
    expect(calculateTax(-100)).toBe(-5)
    expect(calculateTax(-123)).toBe(-6)
  })

  it('應該處理小數金額', () => {
    // 99.5 * 0.05 = 4.975 -> 5
    expect(calculateTax(99.5)).toBe(5)
    // 99.1 * 0.05 = 4.955 -> 5
    expect(calculateTax(99.1)).toBe(5)
  })

  it('應該處理大金額', () => {
    expect(calculateTax(1000000)).toBe(50000)
    expect(calculateTax(9999999)).toBe(500000)
  })
})

describe('calculateTotalWithTax (計算含稅總額)', () => {
  it('應該計算含稅總額', () => {
    expect(calculateTotalWithTax(100)).toBe(105)
    expect(calculateTotalWithTax(200)).toBe(210)
    expect(calculateTotalWithTax(1000)).toBe(1050)
  })

  it('應該處理四捨五入', () => {
    // 123 + 6 = 129
    expect(calculateTotalWithTax(123)).toBe(129)
    // 127 + 6 = 133
    expect(calculateTotalWithTax(127)).toBe(133)
    // 130 + 7 = 137
    expect(calculateTotalWithTax(130)).toBe(137)
  })

  it('應該處理零金額', () => {
    expect(calculateTotalWithTax(0)).toBe(0)
  })

  it('應該處理負數金額', () => {
    expect(calculateTotalWithTax(-100)).toBe(-105)
  })

  it('應該處理小數金額', () => {
    // 99.5 + 5 = 104.5
    expect(calculateTotalWithTax(99.5)).toBe(104.5)
  })

  it('應該處理大金額', () => {
    expect(calculateTotalWithTax(1000000)).toBe(1050000)
  })
})

describe('calculateAmountFromTotal (從含稅金額反推未稅金額)', () => {
  it('應該反推未稅金額', () => {
    // 105 / 1.05 = 100
    expect(calculateAmountFromTotal(105)).toBe(100)
    // 210 / 1.05 = 200
    expect(calculateAmountFromTotal(210)).toBe(200)
    // 1050 / 1.05 = 1000
    expect(calculateAmountFromTotal(1050)).toBe(1000)
  })

  it('應該四捨五入到整數', () => {
    // 129 / 1.05 = 122.857... -> 123
    expect(calculateAmountFromTotal(129)).toBe(123)
    // 133 / 1.05 = 126.666... -> 127
    expect(calculateAmountFromTotal(133)).toBe(127)
    // 137 / 1.05 = 130.476... -> 130
    expect(calculateAmountFromTotal(137)).toBe(130)
  })

  it('應該處理零金額', () => {
    expect(calculateAmountFromTotal(0)).toBe(0)
  })

  it('應該處理負數金額', () => {
    // -105 / 1.05 = -100
    expect(calculateAmountFromTotal(-105)).toBe(-100)
  })

  it('應該處理小數金額', () => {
    // 104.5 / 1.05 = 99.523... -> 100
    expect(calculateAmountFromTotal(104.5)).toBe(100)
  })

  it('應該處理大金額', () => {
    // 1050000 / 1.05 = 1000000
    expect(calculateAmountFromTotal(1050000)).toBe(1000000)
  })

  it('計算結果應該與 calculateTotalWithTax 互逆 (近似)', () => {
    const testAmounts = [100, 200, 500, 1000, 5000, 10000]

    for (const amount of testAmounts) {
      const withTax = calculateTotalWithTax(amount)
      const reversed = calculateAmountFromTotal(withTax)
      // 由於四捨五入，可能會有 1 元誤差
      expect(Math.abs(reversed - amount)).toBeLessThanOrEqual(1)
    }
  })
})

describe('邊界條件與錯誤處理', () => {
  it('calculateTax 應該處理非常小的金額', () => {
    // 1 * 0.05 = 0.05 -> 0
    expect(calculateTax(1)).toBe(0)
    // 10 * 0.05 = 0.5 -> 1
    expect(calculateTax(10)).toBe(1)
    // 9 * 0.05 = 0.45 -> 0
    expect(calculateTax(9)).toBe(0)
  })

  it('validateTaxId 應該處理特殊輸入', () => {
    expect(validateTaxId('        ')).toBe(false) // 8 個空格
    expect(validateTaxId('\t\t\t\t\t\t\t\t')).toBe(false) // 8 個 tab
    expect(validateTaxId('01234567')).toBe(false) // 開頭是 0，但檢查碼不對
  })

  it('generateInvoiceNo 應該處理不同長度的前綴', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-03-15T10:30:45.123Z'))

    const invoiceNo1 = generateInvoiceNo('A')
    expect(invoiceNo1).toMatch(/^11303A\d{8}$/)

    const invoiceNo3 = generateInvoiceNo('ABC')
    expect(invoiceNo3).toMatch(/^11303ABC\d{8}$/)

    vi.useRealTimers()
  })

  it('計算函數應該處理 NaN 和 Infinity', () => {
    // 這些是邊界情況，函數應該不會崩潰
    expect(calculateTax(NaN)).toBeNaN()
    expect(calculateTax(Infinity)).toBe(Infinity)

    expect(calculateTotalWithTax(NaN)).toBeNaN()
    expect(calculateTotalWithTax(Infinity)).toBe(Infinity)

    expect(calculateAmountFromTotal(NaN)).toBeNaN()
    expect(calculateAmountFromTotal(Infinity)).toBe(Infinity)
  })
})
