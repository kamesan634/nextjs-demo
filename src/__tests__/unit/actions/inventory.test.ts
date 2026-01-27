/**
 * 庫存相關業務邏輯單元測試
 */

import { describe, it, expect } from 'vitest'

/**
 * 計算可用庫存
 */
function calculateAvailableQuantity(quantity: number, reservedQuantity: number = 0): number {
  return Math.max(0, quantity - reservedQuantity)
}

/**
 * 檢查是否低於安全庫存
 */
function isLowStock(quantity: number, safetyStock: number): boolean {
  return quantity <= safetyStock
}

/**
 * 庫存調整計算
 */
type AdjustmentType = 'ADD' | 'SUBTRACT' | 'SET'

function calculateAdjustedQuantity(
  currentQuantity: number,
  adjustmentType: AdjustmentType,
  adjustmentQuantity: number
): number {
  switch (adjustmentType) {
    case 'ADD':
      return currentQuantity + adjustmentQuantity
    case 'SUBTRACT':
      return Math.max(0, currentQuantity - adjustmentQuantity)
    case 'SET':
      return Math.max(0, adjustmentQuantity)
  }
}

/**
 * 盤點差異計算
 */
interface StockCountResult {
  difference: number
  status: 'MATCH' | 'SURPLUS' | 'SHORTAGE'
}

function calculateStockCountDifference(
  systemQuantity: number,
  actualQuantity: number
): StockCountResult {
  const difference = actualQuantity - systemQuantity

  let status: StockCountResult['status']
  if (difference === 0) {
    status = 'MATCH'
  } else if (difference > 0) {
    status = 'SURPLUS'
  } else {
    status = 'SHORTAGE'
  }

  return { difference, status }
}

describe('calculateAvailableQuantity', () => {
  it('應該計算正確的可用庫存', () => {
    expect(calculateAvailableQuantity(100, 20)).toBe(80)
  })

  it('應該在沒有保留數量時返回全部庫存', () => {
    expect(calculateAvailableQuantity(100)).toBe(100)
  })

  it('應該在保留超過庫存時返回 0', () => {
    expect(calculateAvailableQuantity(50, 100)).toBe(0)
  })
})

describe('isLowStock', () => {
  it('應該在低於安全庫存時返回 true', () => {
    expect(isLowStock(5, 10)).toBe(true)
  })

  it('應該在等於安全庫存時返回 true', () => {
    expect(isLowStock(10, 10)).toBe(true)
  })

  it('應該在高於安全庫存時返回 false', () => {
    expect(isLowStock(15, 10)).toBe(false)
  })

  it('應該處理零安全庫存', () => {
    expect(isLowStock(0, 0)).toBe(true)
    expect(isLowStock(1, 0)).toBe(false)
  })
})

describe('calculateAdjustedQuantity', () => {
  describe('ADD 操作', () => {
    it('應該正確增加庫存', () => {
      expect(calculateAdjustedQuantity(100, 'ADD', 50)).toBe(150)
    })

    it('應該處理從零開始增加', () => {
      expect(calculateAdjustedQuantity(0, 'ADD', 100)).toBe(100)
    })
  })

  describe('SUBTRACT 操作', () => {
    it('應該正確減少庫存', () => {
      expect(calculateAdjustedQuantity(100, 'SUBTRACT', 30)).toBe(70)
    })

    it('應該不允許負數庫存', () => {
      expect(calculateAdjustedQuantity(50, 'SUBTRACT', 100)).toBe(0)
    })
  })

  describe('SET 操作', () => {
    it('應該直接設定庫存數量', () => {
      expect(calculateAdjustedQuantity(100, 'SET', 200)).toBe(200)
    })

    it('應該允許設定為零', () => {
      expect(calculateAdjustedQuantity(100, 'SET', 0)).toBe(0)
    })

    it('應該不允許設定負數', () => {
      expect(calculateAdjustedQuantity(100, 'SET', -50)).toBe(0)
    })
  })
})

describe('calculateStockCountDifference', () => {
  it('應該識別相符', () => {
    const result = calculateStockCountDifference(100, 100)
    expect(result.difference).toBe(0)
    expect(result.status).toBe('MATCH')
  })

  it('應該識別盤盈', () => {
    const result = calculateStockCountDifference(100, 120)
    expect(result.difference).toBe(20)
    expect(result.status).toBe('SURPLUS')
  })

  it('應該識別盤虧', () => {
    const result = calculateStockCountDifference(100, 80)
    expect(result.difference).toBe(-20)
    expect(result.status).toBe('SHORTAGE')
  })

  it('應該處理系統庫存為零', () => {
    const result = calculateStockCountDifference(0, 10)
    expect(result.difference).toBe(10)
    expect(result.status).toBe('SURPLUS')
  })

  it('應該處理實際庫存為零', () => {
    const result = calculateStockCountDifference(100, 0)
    expect(result.difference).toBe(-100)
    expect(result.status).toBe('SHORTAGE')
  })
})

describe('庫存異動記錄', () => {
  interface InventoryMovement {
    type: 'IN' | 'OUT' | 'ADJUST' | 'TRANSFER'
    quantity: number
    beforeQuantity: number
    afterQuantity: number
  }

  function createMovementRecord(
    type: InventoryMovement['type'],
    quantity: number,
    currentQuantity: number
  ): InventoryMovement {
    let afterQuantity: number

    switch (type) {
      case 'IN':
        afterQuantity = currentQuantity + quantity
        break
      case 'OUT':
        afterQuantity = Math.max(0, currentQuantity - quantity)
        break
      case 'ADJUST':
      case 'TRANSFER':
        afterQuantity = quantity
        break
    }

    return {
      type,
      quantity,
      beforeQuantity: currentQuantity,
      afterQuantity,
    }
  }

  it('應該記錄入庫異動', () => {
    const record = createMovementRecord('IN', 50, 100)
    expect(record.beforeQuantity).toBe(100)
    expect(record.afterQuantity).toBe(150)
  })

  it('應該記錄出庫異動', () => {
    const record = createMovementRecord('OUT', 30, 100)
    expect(record.beforeQuantity).toBe(100)
    expect(record.afterQuantity).toBe(70)
  })

  it('應該記錄調整異動', () => {
    const record = createMovementRecord('ADJUST', 80, 100)
    expect(record.beforeQuantity).toBe(100)
    expect(record.afterQuantity).toBe(80)
  })
})
