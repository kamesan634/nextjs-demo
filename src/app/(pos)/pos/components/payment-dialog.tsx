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
import { Numpad } from './numpad'
import { ReceiptPreview } from './receipt-preview'

interface PaymentMethod {
  id: string
  code: string
  name: string
}

interface PaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  paymentMethods: PaymentMethod[]
  userId: string
  storeId: string
}

export function PaymentDialog({
  open,
  onOpenChange,
  paymentMethods,
  userId,
  storeId,
}: PaymentDialogProps) {
  const { items, totalAmount, customerId, promotionId, notes, reset } = usePOSStore()

  const [selectedMethod, setSelectedMethod] = useState<string>(paymentMethods[0]?.id || '')
  const [payAmount, setPayAmount] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [receiptData, setReceiptData] = useState<Record<string, unknown> | null>(null)

  const paidAmount = parseFloat(payAmount) || 0
  const changeAmount = Math.max(paidAmount - totalAmount, 0)
  const canPay = paidAmount >= totalAmount && selectedMethod

  const handleNumpadInput = (value: string) => {
    if (value === 'C') {
      setPayAmount('')
    } else if (value === 'exact') {
      setPayAmount(totalAmount.toString())
    } else {
      setPayAmount((prev) => prev + value)
    }
  }

  const handlePay = async () => {
    if (!canPay) return

    setIsProcessing(true)

    try {
      const { createPOSOrder } = await import('@/actions/pos-cart')

      const result = await createPOSOrder({
        storeId,
        userId,
        customerId: customerId || undefined,
        items: items.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          productSku: item.productSku,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
        })),
        payments: [
          {
            paymentMethodId: selectedMethod,
            amount: paidAmount,
          },
        ],
        promotionId: promotionId || undefined,
        notes: notes || undefined,
      })

      if (result.success) {
        toast.success('結帳成功')
        const orderData = result.data as { orderId: string; orderNo: string } | undefined
        setReceiptData({
          orderId: orderData?.orderId,
          orderNo: orderData?.orderNo,
          items,
          totalAmount,
          paidAmount,
          changeAmount,
          paymentMethod: paymentMethods.find((m) => m.id === selectedMethod)?.name,
        })
      } else {
        toast.error(result.message || '結帳失敗')
      }
    } catch {
      toast.error('結帳過程發生錯誤')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClose = () => {
    if (receiptData) {
      reset()
      setReceiptData(null)
    }
    setPayAmount('')
    onOpenChange(false)
  }

  // 收據預覽
  if (receiptData) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>交易完成</DialogTitle>
          </DialogHeader>
          <ReceiptPreview data={receiptData} />
          <DialogFooter>
            <Button onClick={handleClose} className="w-full">
              完成
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>結帳付款</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 應付金額 */}
          <div className="text-center py-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">應付金額</p>
            <p className="text-3xl font-bold text-primary">${totalAmount.toLocaleString()}</p>
          </div>

          {/* 付款方式 */}
          <div>
            <Label className="mb-2 block">付款方式</Label>
            <div className="flex flex-wrap gap-2">
              {paymentMethods.map((method) => (
                <Button
                  key={method.id}
                  variant={selectedMethod === method.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedMethod(method.id)}
                >
                  {method.name}
                </Button>
              ))}
            </div>
          </div>

          {/* 付款金額 */}
          <div>
            <Label className="mb-2 block">付款金額</Label>
            <Input
              value={payAmount}
              readOnly
              className="text-right text-2xl font-bold h-14"
              placeholder="0"
            />
          </div>

          {/* 數字鍵盤 */}
          <Numpad onInput={handleNumpadInput} />

          {/* 找零 */}
          {paidAmount > 0 && (
            <div className="flex justify-between items-center bg-muted rounded-lg p-3">
              <span>找零</span>
              <span className="text-xl font-bold">${changeAmount.toLocaleString()}</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handlePay} disabled={!canPay || isProcessing}>
            {isProcessing ? '處理中...' : '確認付款'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
