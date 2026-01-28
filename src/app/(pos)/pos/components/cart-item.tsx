'use client'

import { Minus, Plus, X } from 'lucide-react'
import { usePOSStore, type CartItem as CartItemType } from '@/stores/pos-store'
import { Button } from '@/components/ui/button'

interface CartItemProps {
  item: CartItemType
}

export function CartItem({ item }: CartItemProps) {
  const { updateItemQuantity, removeItem } = usePOSStore()

  return (
    <div className="flex items-center gap-3 rounded-lg border p-2">
      {/* 商品資訊 */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{item.productName}</p>
        <p className="text-xs text-muted-foreground">${item.unitPrice.toLocaleString()}</p>
      </div>

      {/* 數量控制 */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={() => updateItemQuantity(item.productId, item.quantity - 1)}
        >
          <Minus className="h-3 w-3" />
        </Button>
        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={() => updateItemQuantity(item.productId, item.quantity + 1)}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>

      {/* 小計 */}
      <div className="text-right min-w-[70px]">
        <p className="font-medium text-sm">${item.subtotal.toLocaleString()}</p>
      </div>

      {/* 刪除 */}
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-muted-foreground hover:text-destructive"
        onClick={() => removeItem(item.productId)}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  )
}
