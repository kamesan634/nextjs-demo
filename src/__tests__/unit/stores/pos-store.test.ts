/**
 * POS Store 測試
 * 測試 Zustand POS 購物車狀態管理
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { usePOSStore, CartItem, PaymentItem } from '@/stores/pos-store'

describe('POS Store', () => {
  beforeEach(() => {
    // 每個測試前重置 store
    usePOSStore.getState().reset()
  })

  describe('addItem', () => {
    it('應添加新商品到購物車', () => {
      const item = {
        productId: 'product-1',
        productName: '測試商品',
        productSku: 'SKU001',
        unitPrice: 100,
        quantity: 2,
        discount: 0,
      }

      usePOSStore.getState().addItem(item)
      const state = usePOSStore.getState()

      expect(state.items).toHaveLength(1)
      expect(state.items[0].productId).toBe('product-1')
      expect(state.items[0].quantity).toBe(2)
      expect(state.items[0].subtotal).toBe(200)
    })

    it('同一商品應增加數量而非重複添加', () => {
      const item = {
        productId: 'product-1',
        productName: '測試商品',
        productSku: 'SKU001',
        unitPrice: 100,
        quantity: 1,
        discount: 0,
      }

      usePOSStore.getState().addItem(item)
      usePOSStore.getState().addItem(item)
      const state = usePOSStore.getState()

      expect(state.items).toHaveLength(1)
      expect(state.items[0].quantity).toBe(2)
    })

    it('應正確計算小計', () => {
      const item = {
        productId: 'product-1',
        productName: '測試商品',
        productSku: 'SKU001',
        unitPrice: 100,
        quantity: 3,
        discount: 10,
      }

      usePOSStore.getState().addItem(item)
      const state = usePOSStore.getState()

      // subtotal = quantity * (unitPrice - discount) = 3 * (100 - 10) = 270
      expect(state.items[0].subtotal).toBe(270)
    })

    it('應更新總計', () => {
      usePOSStore.getState().addItem({
        productId: 'product-1',
        productName: '商品1',
        productSku: 'SKU001',
        unitPrice: 100,
        quantity: 2,
        discount: 0,
      })
      usePOSStore.getState().addItem({
        productId: 'product-2',
        productName: '商品2',
        productSku: 'SKU002',
        unitPrice: 50,
        quantity: 3,
        discount: 0,
      })
      const state = usePOSStore.getState()

      // 200 + 150 = 350
      expect(state.subtotal).toBe(350)
      expect(state.totalAmount).toBe(350)
    })
  })

  describe('removeItem', () => {
    it('應從購物車移除商品', () => {
      usePOSStore.getState().addItem({
        productId: 'product-1',
        productName: '測試商品',
        productSku: 'SKU001',
        unitPrice: 100,
        quantity: 1,
        discount: 0,
      })

      usePOSStore.getState().removeItem('product-1')
      const state = usePOSStore.getState()

      expect(state.items).toHaveLength(0)
    })

    it('應更新總計', () => {
      usePOSStore.getState().addItem({
        productId: 'product-1',
        productName: '商品1',
        productSku: 'SKU001',
        unitPrice: 100,
        quantity: 2,
        discount: 0,
      })
      usePOSStore.getState().addItem({
        productId: 'product-2',
        productName: '商品2',
        productSku: 'SKU002',
        unitPrice: 50,
        quantity: 3,
        discount: 0,
      })

      usePOSStore.getState().removeItem('product-1')
      const state = usePOSStore.getState()

      expect(state.subtotal).toBe(150) // 只剩 50 * 3 = 150
    })

    it('移除不存在的商品應不影響購物車', () => {
      usePOSStore.getState().addItem({
        productId: 'product-1',
        productName: '測試商品',
        productSku: 'SKU001',
        unitPrice: 100,
        quantity: 1,
        discount: 0,
      })

      usePOSStore.getState().removeItem('nonexistent')
      const state = usePOSStore.getState()

      expect(state.items).toHaveLength(1)
    })
  })

  describe('updateItemQuantity', () => {
    it('應更新商品數量', () => {
      usePOSStore.getState().addItem({
        productId: 'product-1',
        productName: '測試商品',
        productSku: 'SKU001',
        unitPrice: 100,
        quantity: 1,
        discount: 0,
      })

      usePOSStore.getState().updateItemQuantity('product-1', 5)
      const state = usePOSStore.getState()

      expect(state.items[0].quantity).toBe(5)
      expect(state.items[0].subtotal).toBe(500)
    })

    it('數量為 0 時應移除商品', () => {
      usePOSStore.getState().addItem({
        productId: 'product-1',
        productName: '測試商品',
        productSku: 'SKU001',
        unitPrice: 100,
        quantity: 1,
        discount: 0,
      })

      usePOSStore.getState().updateItemQuantity('product-1', 0)
      const state = usePOSStore.getState()

      expect(state.items).toHaveLength(0)
    })

    it('負數數量應移除商品', () => {
      usePOSStore.getState().addItem({
        productId: 'product-1',
        productName: '測試商品',
        productSku: 'SKU001',
        unitPrice: 100,
        quantity: 1,
        discount: 0,
      })

      usePOSStore.getState().updateItemQuantity('product-1', -1)
      const state = usePOSStore.getState()

      expect(state.items).toHaveLength(0)
    })

    it('應更新總計', () => {
      usePOSStore.getState().addItem({
        productId: 'product-1',
        productName: '測試商品',
        productSku: 'SKU001',
        unitPrice: 100,
        quantity: 2,
        discount: 0,
      })

      usePOSStore.getState().updateItemQuantity('product-1', 10)
      const state = usePOSStore.getState()

      expect(state.subtotal).toBe(1000)
    })
  })

  describe('updateItemDiscount', () => {
    it('應更新商品折扣', () => {
      usePOSStore.getState().addItem({
        productId: 'product-1',
        productName: '測試商品',
        productSku: 'SKU001',
        unitPrice: 100,
        quantity: 2,
        discount: 0,
      })

      usePOSStore.getState().updateItemDiscount('product-1', 20)
      const state = usePOSStore.getState()

      expect(state.items[0].discount).toBe(20)
      // subtotal = 2 * (100 - 20) = 160
      expect(state.items[0].subtotal).toBe(160)
    })

    it('應更新總折扣', () => {
      usePOSStore.getState().addItem({
        productId: 'product-1',
        productName: '測試商品',
        productSku: 'SKU001',
        unitPrice: 100,
        quantity: 2,
        discount: 0,
      })

      usePOSStore.getState().updateItemDiscount('product-1', 10)
      const state = usePOSStore.getState()

      // totalDiscount = discount * quantity = 10 * 2 = 20
      expect(state.totalDiscount).toBe(20)
    })
  })

  describe('clearCart', () => {
    it('應清空購物車', () => {
      usePOSStore.getState().addItem({
        productId: 'product-1',
        productName: '商品1',
        productSku: 'SKU001',
        unitPrice: 100,
        quantity: 2,
        discount: 0,
      })
      usePOSStore.getState().addItem({
        productId: 'product-2',
        productName: '商品2',
        productSku: 'SKU002',
        unitPrice: 50,
        quantity: 3,
        discount: 0,
      })

      usePOSStore.getState().clearCart()
      const state = usePOSStore.getState()

      expect(state.items).toHaveLength(0)
      expect(state.subtotal).toBe(0)
      expect(state.totalAmount).toBe(0)
    })

    it('清空購物車不應影響其他狀態', () => {
      usePOSStore.getState().addItem({
        productId: 'product-1',
        productName: '測試商品',
        productSku: 'SKU001',
        unitPrice: 100,
        quantity: 1,
        discount: 0,
      })
      usePOSStore.getState().setCustomer('customer-1', '張三')
      usePOSStore.getState().setNotes('測試備註')

      usePOSStore.getState().clearCart()
      const state = usePOSStore.getState()

      expect(state.items).toHaveLength(0)
      expect(state.customerId).toBe('customer-1')
      expect(state.customerName).toBe('張三')
      expect(state.notes).toBe('測試備註')
    })
  })

  describe('setCustomer', () => {
    it('應設定會員', () => {
      usePOSStore.getState().setCustomer('customer-1', '張三')
      const state = usePOSStore.getState()

      expect(state.customerId).toBe('customer-1')
      expect(state.customerName).toBe('張三')
    })

    it('應清除會員', () => {
      usePOSStore.getState().setCustomer('customer-1', '張三')
      usePOSStore.getState().setCustomer(null, null)
      const state = usePOSStore.getState()

      expect(state.customerId).toBeNull()
      expect(state.customerName).toBeNull()
    })
  })

  describe('setPromotion', () => {
    it('應設定促銷折扣', () => {
      usePOSStore.getState().addItem({
        productId: 'product-1',
        productName: '測試商品',
        productSku: 'SKU001',
        unitPrice: 100,
        quantity: 10,
        discount: 0,
      })

      usePOSStore.getState().setPromotion('promo-1', 100)
      const state = usePOSStore.getState()

      expect(state.promotionId).toBe('promo-1')
      expect(state.promotionDiscount).toBe(100)
      // totalAmount = subtotal - promotionDiscount = 1000 - 100 = 900
      expect(state.totalAmount).toBe(900)
    })

    it('應清除促銷', () => {
      usePOSStore.getState().setPromotion('promo-1', 100)
      usePOSStore.getState().setPromotion(null, 0)
      const state = usePOSStore.getState()

      expect(state.promotionId).toBeNull()
      expect(state.promotionDiscount).toBe(0)
    })

    it('總金額不應為負數', () => {
      usePOSStore.getState().addItem({
        productId: 'product-1',
        productName: '測試商品',
        productSku: 'SKU001',
        unitPrice: 100,
        quantity: 1,
        discount: 0,
      })

      usePOSStore.getState().setPromotion('promo-1', 500) // 折扣超過小計
      const state = usePOSStore.getState()

      expect(state.totalAmount).toBe(0) // 不為負數
    })
  })

  describe('setNotes', () => {
    it('應設定備註', () => {
      usePOSStore.getState().setNotes('這是測試備註')
      const state = usePOSStore.getState()

      expect(state.notes).toBe('這是測試備註')
    })
  })

  describe('Payment Methods', () => {
    describe('addPayment', () => {
      it('應添加付款方式', () => {
        const payment: PaymentItem = {
          paymentMethodId: 'pm-cash',
          paymentMethodName: '現金',
          amount: 500,
        }

        usePOSStore.getState().addPayment(payment)
        const state = usePOSStore.getState()

        expect(state.payments).toHaveLength(1)
        expect(state.payments[0].paymentMethodId).toBe('pm-cash')
        expect(state.totalPaid).toBe(500)
      })

      it('應支援多種付款方式', () => {
        usePOSStore.getState().addPayment({
          paymentMethodId: 'pm-cash',
          paymentMethodName: '現金',
          amount: 300,
        })
        usePOSStore.getState().addPayment({
          paymentMethodId: 'pm-card',
          paymentMethodName: '信用卡',
          amount: 200,
        })
        const state = usePOSStore.getState()

        expect(state.payments).toHaveLength(2)
        expect(state.totalPaid).toBe(500)
      })

      it('應計算找零', () => {
        usePOSStore.getState().addItem({
          productId: 'product-1',
          productName: '測試商品',
          productSku: 'SKU001',
          unitPrice: 100,
          quantity: 2,
          discount: 0,
        })

        usePOSStore.getState().addPayment({
          paymentMethodId: 'pm-cash',
          paymentMethodName: '現金',
          amount: 300,
        })
        const state = usePOSStore.getState()

        // totalAmount = 200, paid = 300, change = 100
        expect(state.changeAmount).toBe(100)
      })
    })

    describe('removePayment', () => {
      it('應移除付款方式', () => {
        usePOSStore.getState().addPayment({
          paymentMethodId: 'pm-cash',
          paymentMethodName: '現金',
          amount: 300,
        })
        usePOSStore.getState().addPayment({
          paymentMethodId: 'pm-card',
          paymentMethodName: '信用卡',
          amount: 200,
        })

        usePOSStore.getState().removePayment(0)
        const state = usePOSStore.getState()

        expect(state.payments).toHaveLength(1)
        expect(state.payments[0].paymentMethodId).toBe('pm-card')
        expect(state.totalPaid).toBe(200)
      })
    })

    describe('clearPayments', () => {
      it('應清空所有付款方式', () => {
        usePOSStore.getState().addPayment({
          paymentMethodId: 'pm-cash',
          paymentMethodName: '現金',
          amount: 300,
        })
        usePOSStore.getState().addPayment({
          paymentMethodId: 'pm-card',
          paymentMethodName: '信用卡',
          amount: 200,
        })

        usePOSStore.getState().clearPayments()
        const state = usePOSStore.getState()

        expect(state.payments).toHaveLength(0)
        expect(state.totalPaid).toBe(0)
        expect(state.changeAmount).toBe(0)
      })
    })
  })

  describe('reset', () => {
    it('應重置所有狀態', () => {
      usePOSStore.getState().addItem({
        productId: 'product-1',
        productName: '測試商品',
        productSku: 'SKU001',
        unitPrice: 100,
        quantity: 2,
        discount: 0,
      })
      usePOSStore.getState().setCustomer('customer-1', '張三')
      usePOSStore.getState().setPromotion('promo-1', 50)
      usePOSStore.getState().setNotes('測試備註')
      usePOSStore.getState().addPayment({
        paymentMethodId: 'pm-cash',
        paymentMethodName: '現金',
        amount: 200,
      })

      usePOSStore.getState().reset()
      const state = usePOSStore.getState()

      expect(state.items).toHaveLength(0)
      expect(state.customerId).toBeNull()
      expect(state.customerName).toBeNull()
      expect(state.promotionId).toBeNull()
      expect(state.promotionDiscount).toBe(0)
      expect(state.notes).toBe('')
      expect(state.payments).toHaveLength(0)
      expect(state.subtotal).toBe(0)
      expect(state.totalDiscount).toBe(0)
      expect(state.totalAmount).toBe(0)
      expect(state.totalPaid).toBe(0)
      expect(state.changeAmount).toBe(0)
    })
  })

  describe('restoreFromHoldOrder', () => {
    it('應從掛單恢復狀態', () => {
      const holdOrderData = {
        items: [
          {
            productId: 'product-1',
            productName: '商品1',
            productSku: 'SKU001',
            unitPrice: 100,
            quantity: 2,
            discount: 0,
            subtotal: 200,
          },
          {
            productId: 'product-2',
            productName: '商品2',
            productSku: 'SKU002',
            unitPrice: 50,
            quantity: 3,
            discount: 0,
            subtotal: 150,
          },
        ] as CartItem[],
        customerId: 'customer-1',
        customerName: '張三',
        notes: '掛單備註',
      }

      usePOSStore.getState().restoreFromHoldOrder(holdOrderData)
      const state = usePOSStore.getState()

      expect(state.items).toHaveLength(2)
      expect(state.items[0].productId).toBe('product-1')
      expect(state.items[1].productId).toBe('product-2')
      expect(state.customerId).toBe('customer-1')
      expect(state.customerName).toBe('張三')
      expect(state.notes).toBe('掛單備註')
      expect(state.subtotal).toBe(350)
    })

    it('應清空付款方式', () => {
      usePOSStore.getState().addPayment({
        paymentMethodId: 'pm-cash',
        paymentMethodName: '現金',
        amount: 200,
      })

      usePOSStore.getState().restoreFromHoldOrder({
        items: [],
        customerId: null,
        customerName: null,
        notes: '',
      })
      const state = usePOSStore.getState()

      expect(state.payments).toHaveLength(0)
    })

    it('應保留促銷設定', () => {
      usePOSStore.getState().setPromotion('promo-1', 100)

      usePOSStore.getState().restoreFromHoldOrder({
        items: [
          {
            productId: 'product-1',
            productName: '商品1',
            productSku: 'SKU001',
            unitPrice: 100,
            quantity: 10,
            discount: 0,
            subtotal: 1000,
          },
        ] as CartItem[],
        customerId: null,
        customerName: null,
        notes: '',
      })
      const state = usePOSStore.getState()

      expect(state.promotionDiscount).toBe(100)
      // totalAmount = 1000 - 100 = 900
      expect(state.totalAmount).toBe(900)
    })
  })

  describe('計算邏輯', () => {
    it('應正確計算總折扣（商品折扣 + 促銷折扣）', () => {
      usePOSStore.getState().addItem({
        productId: 'product-1',
        productName: '測試商品',
        productSku: 'SKU001',
        unitPrice: 100,
        quantity: 5,
        discount: 10, // 每件折 10 元
      })
      usePOSStore.getState().setPromotion('promo-1', 50)
      const state = usePOSStore.getState()

      // 商品折扣 = 10 * 5 = 50
      // 促銷折扣 = 50
      // 總折扣 = 50 + 50 = 100
      expect(state.totalDiscount).toBe(100)
    })

    it('找零不應為負數', () => {
      usePOSStore.getState().addItem({
        productId: 'product-1',
        productName: '測試商品',
        productSku: 'SKU001',
        unitPrice: 100,
        quantity: 10,
        discount: 0,
      })
      // totalAmount = 1000

      usePOSStore.getState().addPayment({
        paymentMethodId: 'pm-cash',
        paymentMethodName: '現金',
        amount: 500, // 付不夠
      })
      const state = usePOSStore.getState()

      expect(state.changeAmount).toBe(0) // 不為負數
    })
  })
})
