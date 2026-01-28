'use client'

import { useState } from 'react'
import { Trash2, Pause, CreditCard } from 'lucide-react'
import { usePOSStore } from '@/stores/pos-store'
import { Button } from '@/components/ui/button'
import { CartItem } from './cart-item'
import { PaymentDialog } from './payment-dialog'
import { HoldOrderDialog } from './hold-order-dialog'
import { HoldOrderList } from './hold-order-list'

interface PaymentMethod {
  id: string
  code: string
  name: string
}

interface CartProps {
  paymentMethods: PaymentMethod[]
  userId: string
  storeId: string
}

export function Cart({ paymentMethods, userId, storeId }: CartProps) {
  const { items, subtotal, totalDiscount, totalAmount, customerName, notes, clearCart } =
    usePOSStore()

  const [paymentOpen, setPaymentOpen] = useState(false)
  const [holdOpen, setHoldOpen] = useState(false)
  const [holdListOpen, setHoldListOpen] = useState(false)

  return (
    <>
      {/* 購物車標題 */}
      <div className="border-b p-3 flex items-center justify-between">
        <div>
          <h2 className="font-bold text-lg">購物車</h2>
          {customerName && <p className="text-sm text-muted-foreground">會員: {customerName}</p>}
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => setHoldListOpen(true)}>
            掛單列表
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive"
            onClick={clearCart}
            disabled={items.length === 0}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 購物車項目 */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {items.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">購物車是空的</p>
        ) : (
          items.map((item) => <CartItem key={item.productId} item={item} />)
        )}
      </div>

      {/* 金額摘要 */}
      <div className="border-t p-3 space-y-2">
        <div className="flex justify-between text-sm">
          <span>小計</span>
          <span>${subtotal.toLocaleString()}</span>
        </div>
        {totalDiscount > 0 && (
          <div className="flex justify-between text-sm text-red-500">
            <span>折扣</span>
            <span>-${totalDiscount.toLocaleString()}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-lg border-t pt-2">
          <span>應付金額</span>
          <span className="text-primary">${totalAmount.toLocaleString()}</span>
        </div>
      </div>

      {/* 操作按鈕 */}
      <div className="border-t p-3 flex gap-2">
        <Button
          variant="outline"
          className="flex-1"
          disabled={items.length === 0}
          onClick={() => setHoldOpen(true)}
        >
          <Pause className="mr-2 h-4 w-4" />
          掛單
        </Button>
        <Button
          className="flex-1"
          disabled={items.length === 0}
          onClick={() => setPaymentOpen(true)}
        >
          <CreditCard className="mr-2 h-4 w-4" />
          結帳
        </Button>
      </div>

      {/* 付款對話框 */}
      <PaymentDialog
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        paymentMethods={paymentMethods}
        userId={userId}
        storeId={storeId}
      />

      {/* 掛單對話框 */}
      <HoldOrderDialog
        open={holdOpen}
        onOpenChange={setHoldOpen}
        userId={userId}
        storeId={storeId}
      />

      {/* 掛單列表 */}
      <HoldOrderList open={holdListOpen} onOpenChange={setHoldListOpen} storeId={storeId} />
    </>
  )
}
