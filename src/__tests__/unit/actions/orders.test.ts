/**
 * 訂單相關業務邏輯單元測試
 */

import { describe, it, expect } from 'vitest'

/**
 * 產生訂單編號
 * 格式：ORD-YYYYMMDD-XXX
 */
function generateOrderNo(date: Date, sequence: number): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const seq = String(sequence).padStart(3, '0')
  return `ORD-${year}${month}${day}-${seq}`
}

/**
 * 計算訂單金額
 */
interface OrderItem {
  quantity: number
  unitPrice: number
  discount: number
}

interface OrderAmounts {
  subtotal: number
  discountTotal: number
  taxAmount: number
  totalAmount: number
}

function calculateOrderAmounts(items: OrderItem[], taxRate: number = 0.05): OrderAmounts {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
  const discountTotal = items.reduce((sum, item) => sum + item.discount, 0)
  const taxableAmount = subtotal - discountTotal
  const taxAmount = Math.round(taxableAmount * taxRate)
  const totalAmount = taxableAmount + taxAmount

  return {
    subtotal,
    discountTotal,
    taxAmount,
    totalAmount,
  }
}

/**
 * 計算會員點數
 * 消費 100 元可得 1 點
 */
function calculatePoints(amount: number): number {
  return Math.floor(amount / 100)
}

/**
 * 計算點數折抵金額
 * 10 點 = 1 元
 */
function calculatePointsDiscount(points: number): number {
  return Math.floor(points / 10)
}

describe('generateOrderNo', () => {
  it('應該產生正確格式的訂單編號', () => {
    const date = new Date('2024-01-15')
    const orderNo = generateOrderNo(date, 1)
    expect(orderNo).toBe('ORD-20240115-001')
  })

  it('應該正確補零', () => {
    const date = new Date('2024-01-01')
    const orderNo = generateOrderNo(date, 5)
    expect(orderNo).toBe('ORD-20240101-005')
  })

  it('應該處理大序號', () => {
    const date = new Date('2024-12-31')
    const orderNo = generateOrderNo(date, 999)
    expect(orderNo).toBe('ORD-20241231-999')
  })
})

describe('calculateOrderAmounts', () => {
  it('應該計算單一商品的金額', () => {
    const items = [{ quantity: 2, unitPrice: 100, discount: 0 }]

    const result = calculateOrderAmounts(items)

    expect(result.subtotal).toBe(200)
    expect(result.discountTotal).toBe(0)
    expect(result.taxAmount).toBe(10)
    expect(result.totalAmount).toBe(210)
  })

  it('應該計算多商品的金額', () => {
    const items = [
      { quantity: 1, unitPrice: 500, discount: 50 },
      { quantity: 2, unitPrice: 200, discount: 0 },
    ]

    const result = calculateOrderAmounts(items)

    expect(result.subtotal).toBe(900) // 500 + 400
    expect(result.discountTotal).toBe(50)
    expect(result.taxAmount).toBe(43) // (900 - 50) * 0.05 = 42.5 四捨五入
    expect(result.totalAmount).toBe(893) // 850 + 43
  })

  it('應該使用自訂稅率', () => {
    const items = [{ quantity: 1, unitPrice: 1000, discount: 0 }]

    const result = calculateOrderAmounts(items, 0)

    expect(result.taxAmount).toBe(0)
    expect(result.totalAmount).toBe(1000)
  })

  it('應該處理空訂單', () => {
    const result = calculateOrderAmounts([])

    expect(result.subtotal).toBe(0)
    expect(result.totalAmount).toBe(0)
  })
})

describe('calculatePoints', () => {
  it('應該計算正確的點數 (消費100元得1點)', () => {
    expect(calculatePoints(100)).toBe(1)
    expect(calculatePoints(500)).toBe(5)
    expect(calculatePoints(1000)).toBe(10)
  })

  it('應該捨去不足 100 元的部分', () => {
    expect(calculatePoints(99)).toBe(0)
    expect(calculatePoints(150)).toBe(1)
    expect(calculatePoints(299)).toBe(2)
  })

  it('應該處理零元', () => {
    expect(calculatePoints(0)).toBe(0)
  })
})

describe('calculatePointsDiscount', () => {
  it('應該計算正確的折抵金額 (10點=1元)', () => {
    expect(calculatePointsDiscount(10)).toBe(1)
    expect(calculatePointsDiscount(100)).toBe(10)
    expect(calculatePointsDiscount(500)).toBe(50)
  })

  it('應該捨去不足 10 點的部分', () => {
    expect(calculatePointsDiscount(9)).toBe(0)
    expect(calculatePointsDiscount(15)).toBe(1)
    expect(calculatePointsDiscount(99)).toBe(9)
  })
})

describe('訂單狀態轉換', () => {
  const ORDER_STATUS = {
    PENDING: 'PENDING',
    CONFIRMED: 'CONFIRMED',
    PROCESSING: 'PROCESSING',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
  } as const

  type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS]

  const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
    PENDING: ['CONFIRMED', 'CANCELLED'],
    CONFIRMED: ['PROCESSING', 'CANCELLED'],
    PROCESSING: ['COMPLETED', 'CANCELLED'],
    COMPLETED: [],
    CANCELLED: [],
  }

  function canTransition(from: OrderStatus, to: OrderStatus): boolean {
    return allowedTransitions[from].includes(to)
  }

  it('應該允許 PENDING -> CONFIRMED', () => {
    expect(canTransition('PENDING', 'CONFIRMED')).toBe(true)
  })

  it('應該允許 PENDING -> CANCELLED', () => {
    expect(canTransition('PENDING', 'CANCELLED')).toBe(true)
  })

  it('應該不允許 COMPLETED -> PENDING', () => {
    expect(canTransition('COMPLETED', 'PENDING')).toBe(false)
  })

  it('應該不允許 CANCELLED -> 任何狀態', () => {
    expect(canTransition('CANCELLED', 'PENDING')).toBe(false)
    expect(canTransition('CANCELLED', 'COMPLETED')).toBe(false)
  })
})

describe('付款狀態邏輯', () => {
  function getPaymentStatus(
    totalAmount: number,
    paidAmount: number
  ): 'UNPAID' | 'PARTIAL' | 'PAID' {
    if (paidAmount === 0) return 'UNPAID'
    if (paidAmount >= totalAmount) return 'PAID'
    return 'PARTIAL'
  }

  it('應該判定未付款', () => {
    expect(getPaymentStatus(1000, 0)).toBe('UNPAID')
  })

  it('應該判定部分付款', () => {
    expect(getPaymentStatus(1000, 500)).toBe('PARTIAL')
  })

  it('應該判定已付款', () => {
    expect(getPaymentStatus(1000, 1000)).toBe('PAID')
  })

  it('應該處理超額付款', () => {
    expect(getPaymentStatus(1000, 1200)).toBe('PAID')
  })
})
