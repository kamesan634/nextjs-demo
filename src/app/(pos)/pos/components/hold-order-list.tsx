'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { usePOSStore, type CartItem } from '@/stores/pos-store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface HoldOrder {
  id: string
  holdNo: string
  items: CartItem[]
  subtotal: number
  totalAmount: number
  reason: string | null
  status: string
  holdAt: string
  customer?: { id: string; name: string } | null
}

interface HoldOrderListProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  storeId: string
}

export function HoldOrderList({ open, onOpenChange, storeId }: HoldOrderListProps) {
  const [holdOrders, setHoldOrders] = useState<HoldOrder[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { restoreFromHoldOrder } = usePOSStore()

  useEffect(() => {
    if (open) {
      loadHoldOrders()
    }
  }, [open])

  const loadHoldOrders = async () => {
    setIsLoading(true)
    try {
      const { getHoldOrders } = await import('@/actions/hold-orders')
      const result = await getHoldOrders({ storeId, status: 'HOLD' })

      if (result.success && result.data) {
        const data = result.data as { holdOrders: Record<string, unknown>[] }
        setHoldOrders(
          data.holdOrders.map((order) => ({
            id: String(order.id),
            holdNo: String(order.holdNo),
            items:
              typeof order.items === 'string'
                ? JSON.parse(order.items as string)
                : (order.items as CartItem[]),
            subtotal: Number(order.subtotal),
            totalAmount: Number(order.totalAmount),
            reason: order.reason as string | null,
            status: String(order.status),
            holdAt: String(order.createdAt),
            customer: order.customer as { id: string; name: string } | null,
          }))
        )
      }
    } catch {
      toast.error('載入掛單列表失敗')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResume = async (order: HoldOrder) => {
    try {
      const { resumeHoldOrder } = await import('@/actions/hold-orders')
      const result = await resumeHoldOrder(order.id)

      if (result.success) {
        restoreFromHoldOrder({
          items: order.items,
          customerId: order.customer?.id || null,
          customerName: order.customer?.name || null,
          notes: '',
        })
        toast.success('掛單已恢復')
        onOpenChange(false)
      } else {
        toast.error(result.message || '恢復掛單失敗')
      }
    } catch {
      toast.error('恢復掛單失敗')
    }
  }

  const handleVoid = async (id: string) => {
    try {
      const { voidHoldOrder } = await import('@/actions/hold-orders')
      const result = await voidHoldOrder(id)

      if (result.success) {
        toast.success('掛單已作廢')
        loadHoldOrders()
      } else {
        toast.error(result.message || '作廢掛單失敗')
      }
    } catch {
      toast.error('作廢掛單失敗')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>掛單列表</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <p className="text-center py-8 text-muted-foreground">載入中...</p>
        ) : holdOrders.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">沒有掛單</p>
        ) : (
          <div className="max-h-[400px] overflow-y-auto divide-y">
            {holdOrders.map((order) => (
              <div key={order.id} className="py-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">{order.holdNo}</span>
                    <Badge variant="outline" className="ml-2">
                      {order.items.length} 商品
                    </Badge>
                  </div>
                  <span className="font-bold">${order.totalAmount.toLocaleString()}</span>
                </div>
                {order.reason && <p className="text-sm text-muted-foreground">{order.reason}</p>}
                <p className="text-xs text-muted-foreground">
                  {new Date(order.holdAt).toLocaleString('zh-TW')}
                </p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleResume(order)}>
                    恢復
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleVoid(order.id)}>
                    作廢
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
