'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { usePOSStore } from '@/stores/pos-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

interface HoldOrderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  storeId: string
}

export function HoldOrderDialog({ open, onOpenChange, userId, storeId }: HoldOrderDialogProps) {
  const { items, totalAmount, customerId, clearCart } = usePOSStore()
  const [reason, setReason] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const handleHold = async () => {
    if (items.length === 0) return

    setIsProcessing(true)

    try {
      const { createHoldOrder } = await import('@/actions/hold-orders')

      // 轉換 CartItem 為 HoldOrderItem 格式
      const holdOrderItems = items.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        sku: item.productSku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      }))

      const result = await createHoldOrder({
        storeId,
        userId,
        customerId: customerId || undefined,
        items: holdOrderItems,
        reason: reason || undefined,
      })

      if (result.success) {
        toast.success('掛單成功')
        clearCart()
        setReason('')
        onOpenChange(false)
      } else {
        toast.error(result.message || '掛單失敗')
      }
    } catch {
      toast.error('掛單過程發生錯誤')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>掛單</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted rounded-lg p-3 text-center">
            <p className="text-sm text-muted-foreground">
              {items.length} 個商品，合計 ${totalAmount.toLocaleString()}
            </p>
          </div>

          <div>
            <Label>掛單原因 (選填)</Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="例: 客戶需要出去拿錢"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleHold} disabled={items.length === 0 || isProcessing}>
            {isProcessing ? '處理中...' : '確認掛單'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
