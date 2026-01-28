import { create } from 'zustand'

/**
 * POS 購物車項目
 */
export interface CartItem {
  productId: string
  productName: string
  productSku: string
  unitPrice: number
  quantity: number
  discount: number
  subtotal: number
  imageUrl?: string | null
}

/**
 * 付款項目
 */
export interface PaymentItem {
  paymentMethodId: string
  paymentMethodName: string
  amount: number
}

/**
 * POS Store 狀態
 */
interface POSState {
  // 購物車
  items: CartItem[]
  // 客戶
  customerId: string | null
  customerName: string | null
  // 促銷
  promotionId: string | null
  promotionDiscount: number
  // 備註
  notes: string
  // 付款
  payments: PaymentItem[]

  // 計算屬性
  subtotal: number
  totalDiscount: number
  totalAmount: number
  totalPaid: number
  changeAmount: number

  // Actions
  addItem: (item: Omit<CartItem, 'subtotal'>) => void
  removeItem: (productId: string) => void
  updateItemQuantity: (productId: string, quantity: number) => void
  updateItemDiscount: (productId: string, discount: number) => void
  clearCart: () => void
  setCustomer: (customerId: string | null, customerName: string | null) => void
  setPromotion: (promotionId: string | null, discount: number) => void
  setNotes: (notes: string) => void
  addPayment: (payment: PaymentItem) => void
  removePayment: (index: number) => void
  clearPayments: () => void
  reset: () => void

  // 從掛單恢復
  restoreFromHoldOrder: (data: {
    items: CartItem[]
    customerId: string | null
    customerName: string | null
    notes: string
  }) => void
}

/**
 * 計算購物車金額
 */
function calculateTotals(items: CartItem[], promotionDiscount: number, payments: PaymentItem[]) {
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0)
  const totalDiscount =
    items.reduce((sum, item) => sum + item.discount * item.quantity, 0) + promotionDiscount
  const totalAmount = Math.max(subtotal - promotionDiscount, 0)
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)
  const changeAmount = Math.max(totalPaid - totalAmount, 0)

  return { subtotal, totalDiscount, totalAmount, totalPaid, changeAmount }
}

const initialState = {
  items: [],
  customerId: null,
  customerName: null,
  promotionId: null,
  promotionDiscount: 0,
  notes: '',
  payments: [],
  subtotal: 0,
  totalDiscount: 0,
  totalAmount: 0,
  totalPaid: 0,
  changeAmount: 0,
}

/**
 * POS Zustand Store
 */
export const usePOSStore = create<POSState>((set, get) => ({
  ...initialState,

  addItem: (item) => {
    set((state) => {
      const existingIndex = state.items.findIndex((i) => i.productId === item.productId)

      let newItems: CartItem[]
      if (existingIndex >= 0) {
        newItems = [...state.items]
        newItems[existingIndex] = {
          ...newItems[existingIndex],
          quantity: newItems[existingIndex].quantity + item.quantity,
          subtotal:
            (newItems[existingIndex].quantity + item.quantity) *
            (newItems[existingIndex].unitPrice - newItems[existingIndex].discount),
        }
      } else {
        const subtotal = item.quantity * (item.unitPrice - item.discount)
        newItems = [...state.items, { ...item, subtotal }]
      }

      const totals = calculateTotals(newItems, state.promotionDiscount, state.payments)
      return { items: newItems, ...totals }
    })
  },

  removeItem: (productId) => {
    set((state) => {
      const newItems = state.items.filter((i) => i.productId !== productId)
      const totals = calculateTotals(newItems, state.promotionDiscount, state.payments)
      return { items: newItems, ...totals }
    })
  },

  updateItemQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId)
      return
    }

    set((state) => {
      const newItems = state.items.map((item) =>
        item.productId === productId
          ? {
              ...item,
              quantity,
              subtotal: quantity * (item.unitPrice - item.discount),
            }
          : item
      )
      const totals = calculateTotals(newItems, state.promotionDiscount, state.payments)
      return { items: newItems, ...totals }
    })
  },

  updateItemDiscount: (productId, discount) => {
    set((state) => {
      const newItems = state.items.map((item) =>
        item.productId === productId
          ? {
              ...item,
              discount,
              subtotal: item.quantity * (item.unitPrice - discount),
            }
          : item
      )
      const totals = calculateTotals(newItems, state.promotionDiscount, state.payments)
      return { items: newItems, ...totals }
    })
  },

  clearCart: () => {
    set((state) => {
      const totals = calculateTotals([], state.promotionDiscount, state.payments)
      return { items: [], ...totals }
    })
  },

  setCustomer: (customerId, customerName) => {
    set({ customerId, customerName })
  },

  setPromotion: (promotionId, discount) => {
    set((state) => {
      const totals = calculateTotals(state.items, discount, state.payments)
      return { promotionId, promotionDiscount: discount, ...totals }
    })
  },

  setNotes: (notes) => {
    set({ notes })
  },

  addPayment: (payment) => {
    set((state) => {
      const newPayments = [...state.payments, payment]
      const totals = calculateTotals(state.items, state.promotionDiscount, newPayments)
      return { payments: newPayments, ...totals }
    })
  },

  removePayment: (index) => {
    set((state) => {
      const newPayments = state.payments.filter((_, i) => i !== index)
      const totals = calculateTotals(state.items, state.promotionDiscount, newPayments)
      return { payments: newPayments, ...totals }
    })
  },

  clearPayments: () => {
    set((state) => {
      const totals = calculateTotals(state.items, state.promotionDiscount, [])
      return { payments: [], ...totals }
    })
  },

  reset: () => {
    set(initialState)
  },

  restoreFromHoldOrder: (data) => {
    set((state) => {
      const totals = calculateTotals(data.items, state.promotionDiscount, [])
      return {
        items: data.items,
        customerId: data.customerId,
        customerName: data.customerName,
        notes: data.notes,
        payments: [],
        ...totals,
      }
    })
  },
}))
