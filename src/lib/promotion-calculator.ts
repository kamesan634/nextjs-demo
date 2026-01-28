/**
 * 促銷計算引擎
 * 使用策略模式計算不同類型的促銷折扣
 */

import type { Decimal } from '@prisma/client/runtime/library'

export interface PromotionInput {
  type: string
  discountType: string | null
  discountValue: number | null
  minPurchase: number | null
  maxDiscount: number | null
}

export interface CartItemInput {
  productId: string
  quantity: number
  unitPrice: number
  subtotal: number
}

export interface PromotionResult {
  applicable: boolean
  discountAmount: number
  description: string
}

/**
 * 計算促銷折扣
 */
export function calculatePromotion(
  promotion: PromotionInput,
  items: CartItemInput[],
  orderSubtotal: number
): PromotionResult {
  const strategy = getStrategy(promotion.type)
  return strategy(promotion, items, orderSubtotal)
}

/**
 * 取得促銷策略
 */
function getStrategy(
  type: string
): (promotion: PromotionInput, items: CartItemInput[], orderSubtotal: number) => PromotionResult {
  const strategies: Record<
    string,
    (p: PromotionInput, items: CartItemInput[], subtotal: number) => PromotionResult
  > = {
    PERCENTAGE_DISCOUNT: calculatePercentageDiscount,
    FIXED_DISCOUNT: calculateFixedDiscount,
    BUY_X_GET_Y: calculateBuyXGetY,
    BUNDLE_PRICE: calculateBundlePrice,
    SECOND_HALF_PRICE: calculateSecondHalfPrice,
    QUANTITY_DISCOUNT: calculateQuantityDiscount,
    // 以下類型需要更多上下文，暫時返回不適用
    GIFT_WITH_PURCHASE: notApplicable,
    POINTS_MULTIPLIER: notApplicable,
    FREE_SHIPPING: notApplicable,
    MEMBER_EXCLUSIVE: calculatePercentageDiscount,
    // 保留舊類型相容
    DISCOUNT: calculatePercentageDiscount,
    BUNDLE: calculateBundlePrice,
    GIFT: notApplicable,
    POINTS: notApplicable,
  }

  return strategies[type] || notApplicable
}

function notApplicable(): PromotionResult {
  return { applicable: false, discountAmount: 0, description: '' }
}

/**
 * 百分比折扣
 */
function calculatePercentageDiscount(
  promotion: PromotionInput,
  _items: CartItemInput[],
  orderSubtotal: number
): PromotionResult {
  if (promotion.minPurchase && orderSubtotal < promotion.minPurchase) {
    return {
      applicable: false,
      discountAmount: 0,
      description: `未達最低消費 $${promotion.minPurchase}`,
    }
  }

  if (!promotion.discountValue) {
    return notApplicable()
  }

  let discount: number

  if (promotion.discountType === 'PERCENTAGE') {
    discount = orderSubtotal * (promotion.discountValue / 100)
  } else {
    discount = promotion.discountValue
  }

  if (promotion.maxDiscount && discount > promotion.maxDiscount) {
    discount = promotion.maxDiscount
  }

  return {
    applicable: true,
    discountAmount: Math.round(discount),
    description:
      promotion.discountType === 'PERCENTAGE'
        ? `${promotion.discountValue}% 折扣`
        : `折扣 $${promotion.discountValue}`,
  }
}

/**
 * 固定折扣
 */
function calculateFixedDiscount(
  promotion: PromotionInput,
  _items: CartItemInput[],
  orderSubtotal: number
): PromotionResult {
  if (promotion.minPurchase && orderSubtotal < promotion.minPurchase) {
    return {
      applicable: false,
      discountAmount: 0,
      description: `未達最低消費 $${promotion.minPurchase}`,
    }
  }

  const discount = promotion.discountValue || 0

  return {
    applicable: true,
    discountAmount: Math.min(discount, orderSubtotal),
    description: `折扣 $${discount}`,
  }
}

/**
 * 買X送Y
 */
function calculateBuyXGetY(
  promotion: PromotionInput,
  items: CartItemInput[],
  _orderSubtotal: number
): PromotionResult {
  // 簡化版：每購買2件，最低價免費
  const totalQty = items.reduce((sum, i) => sum + i.quantity, 0)

  if (totalQty < 2) {
    return { applicable: false, discountAmount: 0, description: '需至少購買 2 件' }
  }

  const prices = items.flatMap((i) => Array(i.quantity).fill(i.unitPrice)).sort((a, b) => a - b)

  const freeCount = Math.floor(totalQty / 3) // 買3送1
  const discount = prices.slice(0, freeCount).reduce((sum: number, p: number) => sum + p, 0)

  return {
    applicable: freeCount > 0,
    discountAmount: Math.round(discount),
    description: `買3送1，免費 ${freeCount} 件`,
  }
}

/**
 * 組合價
 */
function calculateBundlePrice(
  promotion: PromotionInput,
  _items: CartItemInput[],
  orderSubtotal: number
): PromotionResult {
  if (!promotion.discountValue) {
    return notApplicable()
  }

  const discount = orderSubtotal - promotion.discountValue

  return {
    applicable: discount > 0,
    discountAmount: Math.max(Math.round(discount), 0),
    description: `組合價 $${promotion.discountValue}`,
  }
}

/**
 * 第二件半價
 */
function calculateSecondHalfPrice(
  _promotion: PromotionInput,
  items: CartItemInput[],
  _orderSubtotal: number
): PromotionResult {
  const totalQty = items.reduce((sum, i) => sum + i.quantity, 0)

  if (totalQty < 2) {
    return { applicable: false, discountAmount: 0, description: '需至少購買 2 件' }
  }

  const prices = items.flatMap((i) => Array(i.quantity).fill(i.unitPrice)).sort((a, b) => b - a) // 高價優先

  let discount = 0
  for (let i = 1; i < prices.length; i += 2) {
    discount += prices[i] * 0.5
  }

  return {
    applicable: true,
    discountAmount: Math.round(discount),
    description: '第二件半價',
  }
}

/**
 * 數量折扣
 */
function calculateQuantityDiscount(
  promotion: PromotionInput,
  items: CartItemInput[],
  orderSubtotal: number
): PromotionResult {
  const totalQty = items.reduce((sum, i) => sum + i.quantity, 0)

  if (promotion.minPurchase && totalQty < promotion.minPurchase) {
    return {
      applicable: false,
      discountAmount: 0,
      description: `需購買 ${promotion.minPurchase} 件以上`,
    }
  }

  if (!promotion.discountValue) {
    return notApplicable()
  }

  const discount =
    promotion.discountType === 'PERCENTAGE'
      ? orderSubtotal * (promotion.discountValue / 100)
      : promotion.discountValue

  return {
    applicable: true,
    discountAmount: Math.round(Math.min(discount, promotion.maxDiscount || Infinity)),
    description: `數量折扣：${promotion.discountType === 'PERCENTAGE' ? `${promotion.discountValue}%` : `$${promotion.discountValue}`}`,
  }
}
