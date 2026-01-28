/**
 * 促銷計算引擎單元測試
 * 測試 src/lib/promotion-calculator.ts 中的促銷計算功能
 */

import { describe, it, expect } from 'vitest'
import {
  calculatePromotion,
  type PromotionInput,
  type CartItemInput,
} from '@/lib/promotion-calculator'

// ===================================
// 測試資料準備
// ===================================

const createPromotion = (overrides: Partial<PromotionInput> = {}): PromotionInput => ({
  type: 'PERCENTAGE_DISCOUNT',
  discountType: 'PERCENTAGE',
  discountValue: 10,
  minPurchase: null,
  maxDiscount: null,
  ...overrides,
})

const createCartItem = (overrides: Partial<CartItemInput> = {}): CartItemInput => ({
  productId: 'product-1',
  quantity: 1,
  unitPrice: 100,
  subtotal: 100,
  ...overrides,
})

// ===================================
// 百分比折扣測試
// ===================================

describe('calculatePromotion - PERCENTAGE_DISCOUNT', () => {
  it('應該正確計算百分比折扣', () => {
    const promotion = createPromotion({
      type: 'PERCENTAGE_DISCOUNT',
      discountType: 'PERCENTAGE',
      discountValue: 10,
    })
    const items = [createCartItem({ subtotal: 1000 })]

    const result = calculatePromotion(promotion, items, 1000)

    expect(result.applicable).toBe(true)
    expect(result.discountAmount).toBe(100) // 10% of 1000
    expect(result.description).toBe('10% 折扣')
  })

  it('應該正確計算固定金額折扣 (discountType: FIXED)', () => {
    const promotion = createPromotion({
      type: 'PERCENTAGE_DISCOUNT',
      discountType: 'FIXED',
      discountValue: 50,
    })
    const items = [createCartItem({ subtotal: 1000 })]

    const result = calculatePromotion(promotion, items, 1000)

    expect(result.applicable).toBe(true)
    expect(result.discountAmount).toBe(50)
    expect(result.description).toBe('折扣 $50')
  })

  it('應該在未達最低消費時返回不適用', () => {
    const promotion = createPromotion({
      type: 'PERCENTAGE_DISCOUNT',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minPurchase: 500,
    })
    const items = [createCartItem({ subtotal: 300 })]

    const result = calculatePromotion(promotion, items, 300)

    expect(result.applicable).toBe(false)
    expect(result.discountAmount).toBe(0)
    expect(result.description).toBe('未達最低消費 $500')
  })

  it('應該在達到最低消費時正確計算', () => {
    const promotion = createPromotion({
      type: 'PERCENTAGE_DISCOUNT',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minPurchase: 500,
    })
    const items = [createCartItem({ subtotal: 500 })]

    const result = calculatePromotion(promotion, items, 500)

    expect(result.applicable).toBe(true)
    expect(result.discountAmount).toBe(50)
  })

  it('應該限制最大折扣金額', () => {
    const promotion = createPromotion({
      type: 'PERCENTAGE_DISCOUNT',
      discountType: 'PERCENTAGE',
      discountValue: 50, // 50%
      maxDiscount: 100,
    })
    const items = [createCartItem({ subtotal: 1000 })]

    const result = calculatePromotion(promotion, items, 1000)

    expect(result.applicable).toBe(true)
    expect(result.discountAmount).toBe(100) // 應該是最大折扣 100，而非 500
  })

  it('應該在無折扣值時返回不適用', () => {
    const promotion = createPromotion({
      type: 'PERCENTAGE_DISCOUNT',
      discountValue: null,
    })
    const items = [createCartItem()]

    const result = calculatePromotion(promotion, items, 1000)

    expect(result.applicable).toBe(false)
  })

  it('應該四捨五入折扣金額', () => {
    const promotion = createPromotion({
      type: 'PERCENTAGE_DISCOUNT',
      discountType: 'PERCENTAGE',
      discountValue: 15, // 15%
    })
    const items = [createCartItem({ subtotal: 333 })]

    const result = calculatePromotion(promotion, items, 333)

    // 333 * 0.15 = 49.95, 四捨五入為 50
    expect(result.discountAmount).toBe(50)
  })
})

// ===================================
// 固定折扣測試
// ===================================

describe('calculatePromotion - FIXED_DISCOUNT', () => {
  it('應該正確計算固定折扣', () => {
    const promotion = createPromotion({
      type: 'FIXED_DISCOUNT',
      discountValue: 100,
    })
    const items = [createCartItem({ subtotal: 500 })]

    const result = calculatePromotion(promotion, items, 500)

    expect(result.applicable).toBe(true)
    expect(result.discountAmount).toBe(100)
    expect(result.description).toBe('折扣 $100')
  })

  it('應該在折扣大於訂單金額時限制折扣', () => {
    const promotion = createPromotion({
      type: 'FIXED_DISCOUNT',
      discountValue: 200,
    })
    const items = [createCartItem({ subtotal: 100 })]

    const result = calculatePromotion(promotion, items, 100)

    expect(result.applicable).toBe(true)
    expect(result.discountAmount).toBe(100) // 不超過訂單金額
  })

  it('應該在未達最低消費時返回不適用', () => {
    const promotion = createPromotion({
      type: 'FIXED_DISCOUNT',
      discountValue: 50,
      minPurchase: 300,
    })
    const items = [createCartItem({ subtotal: 200 })]

    const result = calculatePromotion(promotion, items, 200)

    expect(result.applicable).toBe(false)
    expect(result.description).toBe('未達最低消費 $300')
  })

  it('應該處理無折扣值的情況', () => {
    const promotion = createPromotion({
      type: 'FIXED_DISCOUNT',
      discountValue: null,
    })
    const items = [createCartItem()]

    const result = calculatePromotion(promotion, items, 500)

    expect(result.applicable).toBe(true)
    expect(result.discountAmount).toBe(0)
  })
})

// ===================================
// 買X送Y測試
// ===================================

describe('calculatePromotion - BUY_X_GET_Y', () => {
  it('應該在購買少於2件時返回不適用', () => {
    const promotion = createPromotion({ type: 'BUY_X_GET_Y' })
    const items = [createCartItem({ quantity: 1, unitPrice: 100 })]

    const result = calculatePromotion(promotion, items, 100)

    expect(result.applicable).toBe(false)
    expect(result.description).toBe('需至少購買 2 件')
  })

  it('應該在購買2件但不足3件時不提供免費', () => {
    const promotion = createPromotion({ type: 'BUY_X_GET_Y' })
    const items = [createCartItem({ quantity: 2, unitPrice: 100, subtotal: 200 })]

    const result = calculatePromotion(promotion, items, 200)

    expect(result.applicable).toBe(false) // freeCount = 0
    expect(result.discountAmount).toBe(0)
  })

  it('應該在購買3件時提供1件免費', () => {
    const promotion = createPromotion({ type: 'BUY_X_GET_Y' })
    const items = [createCartItem({ quantity: 3, unitPrice: 100, subtotal: 300 })]

    const result = calculatePromotion(promotion, items, 300)

    expect(result.applicable).toBe(true)
    expect(result.discountAmount).toBe(100) // 最便宜的一件
    expect(result.description).toContain('買3送1')
  })

  it('應該在購買6件時提供2件免費', () => {
    const promotion = createPromotion({ type: 'BUY_X_GET_Y' })
    const items = [createCartItem({ quantity: 6, unitPrice: 100, subtotal: 600 })]

    const result = calculatePromotion(promotion, items, 600)

    expect(result.applicable).toBe(true)
    expect(result.discountAmount).toBe(200) // 最便宜的兩件
  })

  it('應該選擇最低價商品作為免費品', () => {
    const promotion = createPromotion({ type: 'BUY_X_GET_Y' })
    const items = [
      createCartItem({ productId: 'p1', quantity: 2, unitPrice: 200, subtotal: 400 }),
      createCartItem({ productId: 'p2', quantity: 1, unitPrice: 50, subtotal: 50 }),
    ]

    const result = calculatePromotion(promotion, items, 450)

    expect(result.applicable).toBe(true)
    expect(result.discountAmount).toBe(50) // 最便宜的那件
  })
})

// ===================================
// 組合價測試
// ===================================

describe('calculatePromotion - BUNDLE_PRICE', () => {
  it('應該正確計算組合價折扣', () => {
    const promotion = createPromotion({
      type: 'BUNDLE_PRICE',
      discountValue: 800, // 組合價 $800
    })
    const items = [createCartItem({ subtotal: 1000 })]

    const result = calculatePromotion(promotion, items, 1000)

    expect(result.applicable).toBe(true)
    expect(result.discountAmount).toBe(200) // 1000 - 800
    expect(result.description).toBe('組合價 $800')
  })

  it('應該在組合價高於原價時不適用', () => {
    const promotion = createPromotion({
      type: 'BUNDLE_PRICE',
      discountValue: 1200, // 組合價高於原價
    })
    const items = [createCartItem({ subtotal: 1000 })]

    const result = calculatePromotion(promotion, items, 1000)

    expect(result.applicable).toBe(false)
    expect(result.discountAmount).toBe(0)
  })

  it('應該在無折扣值時返回不適用', () => {
    const promotion = createPromotion({
      type: 'BUNDLE_PRICE',
      discountValue: null,
    })
    const items = [createCartItem()]

    const result = calculatePromotion(promotion, items, 1000)

    expect(result.applicable).toBe(false)
  })

  it('應該處理組合價等於原價的邊界情況', () => {
    const promotion = createPromotion({
      type: 'BUNDLE_PRICE',
      discountValue: 1000,
    })
    const items = [createCartItem({ subtotal: 1000 })]

    const result = calculatePromotion(promotion, items, 1000)

    expect(result.applicable).toBe(false) // discount = 0
  })
})

// ===================================
// 第二件半價測試
// ===================================

describe('calculatePromotion - SECOND_HALF_PRICE', () => {
  it('應該在購買少於2件時返回不適用', () => {
    const promotion = createPromotion({ type: 'SECOND_HALF_PRICE' })
    const items = [createCartItem({ quantity: 1, unitPrice: 100 })]

    const result = calculatePromotion(promotion, items, 100)

    expect(result.applicable).toBe(false)
    expect(result.description).toBe('需至少購買 2 件')
  })

  it('應該正確計算第二件半價', () => {
    const promotion = createPromotion({ type: 'SECOND_HALF_PRICE' })
    const items = [createCartItem({ quantity: 2, unitPrice: 100, subtotal: 200 })]

    const result = calculatePromotion(promotion, items, 200)

    expect(result.applicable).toBe(true)
    expect(result.discountAmount).toBe(50) // 100 * 0.5
    expect(result.description).toBe('第二件半價')
  })

  it('應該正確計算多對商品的半價', () => {
    const promotion = createPromotion({ type: 'SECOND_HALF_PRICE' })
    const items = [createCartItem({ quantity: 4, unitPrice: 100, subtotal: 400 })]

    const result = calculatePromotion(promotion, items, 400)

    expect(result.applicable).toBe(true)
    expect(result.discountAmount).toBe(100) // 2 * (100 * 0.5)
  })

  it('應該以高價商品優先配對', () => {
    const promotion = createPromotion({ type: 'SECOND_HALF_PRICE' })
    const items = [
      createCartItem({ productId: 'p1', quantity: 1, unitPrice: 200, subtotal: 200 }),
      createCartItem({ productId: 'p2', quantity: 1, unitPrice: 100, subtotal: 100 }),
    ]

    const result = calculatePromotion(promotion, items, 300)

    expect(result.applicable).toBe(true)
    // 排序後: [200, 100]，第二件 (100) 半價 = 50
    expect(result.discountAmount).toBe(50)
  })

  it('應該處理奇數件商品', () => {
    const promotion = createPromotion({ type: 'SECOND_HALF_PRICE' })
    const items = [createCartItem({ quantity: 3, unitPrice: 100, subtotal: 300 })]

    const result = calculatePromotion(promotion, items, 300)

    expect(result.applicable).toBe(true)
    // 3件，只有1對，折扣 = 100 * 0.5 = 50
    expect(result.discountAmount).toBe(50)
  })
})

// ===================================
// 數量折扣測試
// ===================================

describe('calculatePromotion - QUANTITY_DISCOUNT', () => {
  it('應該正確計算數量百分比折扣', () => {
    const promotion = createPromotion({
      type: 'QUANTITY_DISCOUNT',
      discountType: 'PERCENTAGE',
      discountValue: 20, // 20%
      minPurchase: 5, // 至少 5 件
    })
    const items = [createCartItem({ quantity: 5, subtotal: 500 })]

    const result = calculatePromotion(promotion, items, 500)

    expect(result.applicable).toBe(true)
    expect(result.discountAmount).toBe(100) // 500 * 0.2
    expect(result.description).toContain('20%')
  })

  it('應該正確計算數量固定折扣', () => {
    const promotion = createPromotion({
      type: 'QUANTITY_DISCOUNT',
      discountType: 'FIXED',
      discountValue: 50,
      minPurchase: 3,
    })
    const items = [createCartItem({ quantity: 3, subtotal: 300 })]

    const result = calculatePromotion(promotion, items, 300)

    expect(result.applicable).toBe(true)
    expect(result.discountAmount).toBe(50)
    expect(result.description).toContain('$50')
  })

  it('應該在未達最低數量時返回不適用', () => {
    const promotion = createPromotion({
      type: 'QUANTITY_DISCOUNT',
      discountType: 'PERCENTAGE',
      discountValue: 20,
      minPurchase: 10,
    })
    const items = [createCartItem({ quantity: 5, subtotal: 500 })]

    const result = calculatePromotion(promotion, items, 500)

    expect(result.applicable).toBe(false)
    expect(result.description).toBe('需購買 10 件以上')
  })

  it('應該限制最大折扣金額', () => {
    const promotion = createPromotion({
      type: 'QUANTITY_DISCOUNT',
      discountType: 'PERCENTAGE',
      discountValue: 50,
      maxDiscount: 100,
    })
    const items = [createCartItem({ quantity: 10, subtotal: 1000 })]

    const result = calculatePromotion(promotion, items, 1000)

    expect(result.applicable).toBe(true)
    expect(result.discountAmount).toBe(100) // 限制為最大 100
  })

  it('應該在無折扣值時返回不適用', () => {
    const promotion = createPromotion({
      type: 'QUANTITY_DISCOUNT',
      discountValue: null,
    })
    const items = [createCartItem({ quantity: 5 })]

    const result = calculatePromotion(promotion, items, 500)

    expect(result.applicable).toBe(false)
  })
})

// ===================================
// 不適用類型測試
// ===================================

describe('calculatePromotion - 不適用類型', () => {
  it('GIFT_WITH_PURCHASE 應該返回不適用', () => {
    const promotion = createPromotion({ type: 'GIFT_WITH_PURCHASE' })
    const items = [createCartItem()]

    const result = calculatePromotion(promotion, items, 1000)

    expect(result.applicable).toBe(false)
    expect(result.discountAmount).toBe(0)
    expect(result.description).toBe('')
  })

  it('POINTS_MULTIPLIER 應該返回不適用', () => {
    const promotion = createPromotion({ type: 'POINTS_MULTIPLIER' })
    const items = [createCartItem()]

    const result = calculatePromotion(promotion, items, 1000)

    expect(result.applicable).toBe(false)
  })

  it('FREE_SHIPPING 應該返回不適用', () => {
    const promotion = createPromotion({ type: 'FREE_SHIPPING' })
    const items = [createCartItem()]

    const result = calculatePromotion(promotion, items, 1000)

    expect(result.applicable).toBe(false)
  })

  it('未知類型應該返回不適用', () => {
    const promotion = createPromotion({ type: 'UNKNOWN_TYPE' })
    const items = [createCartItem()]

    const result = calculatePromotion(promotion, items, 1000)

    expect(result.applicable).toBe(false)
    expect(result.discountAmount).toBe(0)
  })
})

// ===================================
// 相容舊類型測試
// ===================================

describe('calculatePromotion - 舊類型相容', () => {
  it('DISCOUNT 應該等同於 PERCENTAGE_DISCOUNT', () => {
    const promotion = createPromotion({
      type: 'DISCOUNT',
      discountType: 'PERCENTAGE',
      discountValue: 10,
    })
    const items = [createCartItem({ subtotal: 1000 })]

    const result = calculatePromotion(promotion, items, 1000)

    expect(result.applicable).toBe(true)
    expect(result.discountAmount).toBe(100)
  })

  it('BUNDLE 應該等同於 BUNDLE_PRICE', () => {
    const promotion = createPromotion({
      type: 'BUNDLE',
      discountValue: 800,
    })
    const items = [createCartItem({ subtotal: 1000 })]

    const result = calculatePromotion(promotion, items, 1000)

    expect(result.applicable).toBe(true)
    expect(result.discountAmount).toBe(200)
  })

  it('MEMBER_EXCLUSIVE 應該等同於 PERCENTAGE_DISCOUNT', () => {
    const promotion = createPromotion({
      type: 'MEMBER_EXCLUSIVE',
      discountType: 'PERCENTAGE',
      discountValue: 15,
    })
    const items = [createCartItem({ subtotal: 1000 })]

    const result = calculatePromotion(promotion, items, 1000)

    expect(result.applicable).toBe(true)
    expect(result.discountAmount).toBe(150)
  })

  it('GIFT 應該返回不適用', () => {
    const promotion = createPromotion({ type: 'GIFT' })
    const items = [createCartItem()]

    const result = calculatePromotion(promotion, items, 1000)

    expect(result.applicable).toBe(false)
  })

  it('POINTS 應該返回不適用', () => {
    const promotion = createPromotion({ type: 'POINTS' })
    const items = [createCartItem()]

    const result = calculatePromotion(promotion, items, 1000)

    expect(result.applicable).toBe(false)
  })
})

// ===================================
// 邊界條件測試
// ===================================

describe('calculatePromotion - 邊界條件', () => {
  it('應該處理空購物車', () => {
    const promotion = createPromotion({
      type: 'PERCENTAGE_DISCOUNT',
      discountType: 'PERCENTAGE',
      discountValue: 10,
    })
    const items: CartItemInput[] = []

    const result = calculatePromotion(promotion, items, 0)

    expect(result.applicable).toBe(true)
    expect(result.discountAmount).toBe(0) // 10% of 0
  })

  it('應該處理零金額訂單', () => {
    const promotion = createPromotion({
      type: 'FIXED_DISCOUNT',
      discountValue: 50,
    })
    const items = [createCartItem({ subtotal: 0 })]

    const result = calculatePromotion(promotion, items, 0)

    expect(result.applicable).toBe(true)
    expect(result.discountAmount).toBe(0) // 不超過訂單金額
  })

  it('應該處理大金額訂單', () => {
    const promotion = createPromotion({
      type: 'PERCENTAGE_DISCOUNT',
      discountType: 'PERCENTAGE',
      discountValue: 10,
    })
    const items = [createCartItem({ subtotal: 999999 })]

    const result = calculatePromotion(promotion, items, 999999)

    expect(result.applicable).toBe(true)
    expect(result.discountAmount).toBe(100000) // 10% of 999999, rounded
  })

  it('應該處理小數金額', () => {
    const promotion = createPromotion({
      type: 'PERCENTAGE_DISCOUNT',
      discountType: 'PERCENTAGE',
      discountValue: 10,
    })
    const items = [createCartItem({ subtotal: 99.99 })]

    const result = calculatePromotion(promotion, items, 99.99)

    expect(result.applicable).toBe(true)
    expect(result.discountAmount).toBe(10) // 四捨五入
  })

  it('應該處理多個商品的複雜購物車', () => {
    const promotion = createPromotion({ type: 'SECOND_HALF_PRICE' })
    const items = [
      createCartItem({ productId: 'p1', quantity: 3, unitPrice: 100, subtotal: 300 }),
      createCartItem({ productId: 'p2', quantity: 2, unitPrice: 150, subtotal: 300 }),
      createCartItem({ productId: 'p3', quantity: 1, unitPrice: 200, subtotal: 200 }),
    ]

    const result = calculatePromotion(promotion, items, 800)

    // 總共 6 件，價格排序: [200, 150, 150, 100, 100, 100]
    // 配對: (200, 150), (150, 100), (100, 100)
    // 折扣: 150*0.5 + 100*0.5 + 100*0.5 = 75 + 50 + 50 = 175
    expect(result.applicable).toBe(true)
    expect(result.discountAmount).toBe(175)
  })
})

// ===================================
// 錯誤處理測試
// ===================================

describe('calculatePromotion - 錯誤處理', () => {
  it('應該處理 null discountType', () => {
    const promotion = createPromotion({
      type: 'PERCENTAGE_DISCOUNT',
      discountType: null,
      discountValue: 10,
    })
    const items = [createCartItem({ subtotal: 100 })]

    const result = calculatePromotion(promotion, items, 100)

    // discountType 不是 'PERCENTAGE'，所以使用固定折扣邏輯
    expect(result.applicable).toBe(true)
    expect(result.discountAmount).toBe(10)
  })

  it('應該處理 0 值的 discountValue', () => {
    const promotion = createPromotion({
      type: 'PERCENTAGE_DISCOUNT',
      discountType: 'PERCENTAGE',
      discountValue: 0,
    })
    const items = [createCartItem({ subtotal: 100 })]

    const result = calculatePromotion(promotion, items, 100)

    // discountValue 為 0 是 falsy，應返回不適用
    expect(result.applicable).toBe(false)
  })

  it('應該處理剛好等於 minPurchase 的訂單金額', () => {
    const promotion = createPromotion({
      type: 'PERCENTAGE_DISCOUNT',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minPurchase: 100,
    })
    const items = [createCartItem({ subtotal: 100 })]

    const result = calculatePromotion(promotion, items, 100)

    // orderSubtotal (100) >= minPurchase (100)，應該適用
    expect(result.applicable).toBe(true)
  })

  it('應該處理 minPurchase 為 0 的情況', () => {
    const promotion = createPromotion({
      type: 'PERCENTAGE_DISCOUNT',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minPurchase: 0,
    })
    const items = [createCartItem({ subtotal: 100 })]

    const result = calculatePromotion(promotion, items, 100)

    // minPurchase 為 0 是 falsy，不會進行最低消費檢查
    expect(result.applicable).toBe(true)
  })
})
