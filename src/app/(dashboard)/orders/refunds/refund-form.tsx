'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { createRefund } from '@/actions/refunds'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface RefundItem {
  id: string
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  reason?: string
}

interface RefundFormProps {
  orderId?: string
  products?: Array<{
    id: string
    productName: string
    sku: string
    unitPrice: number
  }>
}

/**
 * 退換貨表單元件
 */
export function RefundForm({ orderId, products = [] }: RefundFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    orderId: orderId || '',
    reason: '',
    type: 'REFUND' as 'REFUND' | 'EXCHANGE',
    notes: '',
  })
  const [items, setItems] = useState<RefundItem[]>([])

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        id: Math.random().toString(36).substr(2, 9),
        productId: '',
        productName: '',
        quantity: 1,
        unitPrice: 0,
        reason: '',
      },
    ])
  }

  const handleRemoveItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id))
  }

  const handleItemChange = (id: string, field: keyof RefundItem, value: string | number) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          if (field === 'productId' && typeof value === 'string') {
            const product = products.find((p) => p.id === value)
            if (product) {
              return {
                ...item,
                productId: value,
                productName: product.productName,
                unitPrice: Number(product.unitPrice),
              }
            }
          }
          // Handle each field explicitly to maintain type safety
          if (field === 'quantity' && typeof value === 'number') {
            return { ...item, quantity: value }
          }
          if (field === 'unitPrice' && typeof value === 'number') {
            return { ...item, unitPrice: value }
          }
          if (field === 'reason' && typeof value === 'string') {
            return { ...item, reason: value }
          }
          if (field === 'productId' && typeof value === 'string') {
            return { ...item, productId: value }
          }
          if (field === 'productName' && typeof value === 'string') {
            return { ...item, productName: value }
          }
        }
        return item
      })
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.orderId) {
      toast.error('請選擇訂單')
      return
    }

    if (!formData.reason.trim()) {
      toast.error('請輸入退貨原因')
      return
    }

    if (items.length === 0) {
      toast.error('請至少新增一個退貨項目')
      return
    }

    // 驗證所有項目
    for (const item of items) {
      if (!item.productId) {
        toast.error('請選擇商品')
        return
      }
      if (item.quantity <= 0) {
        toast.error('退貨數量必須大於 0')
        return
      }
    }

    setIsSubmitting(true)

    const result = await createRefund({
      ...formData,
      items: items.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        reason: item.reason,
      })),
    })

    setIsSubmitting(false)

    if (result.success) {
      toast.success(result.message)
      router.push('/orders/refunds')
      router.refresh()
    } else {
      toast.error(result.message)
    }
  }

  const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 基本資訊 */}
      <Card>
        <CardHeader>
          <CardTitle>基本資訊</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="orderId">訂單編號 *</Label>
              <Input
                id="orderId"
                value={formData.orderId}
                onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
                placeholder="請輸入訂單 ID"
                required
                disabled={!!orderId}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">類型 *</Label>
              <Select
                value={formData.type}
                onValueChange={(value: 'REFUND' | 'EXCHANGE') =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="REFUND">退貨</SelectItem>
                  <SelectItem value="EXCHANGE">換貨</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">退貨原因 *</Label>
            <Textarea
              id="reason"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="請輸入退貨原因"
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">備註</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="選填"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* 退貨項目 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>退貨項目</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
              <Plus className="h-4 w-4 mr-2" />
              新增項目
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              尚未新增退貨項目，請點擊「新增項目」按鈕
            </div>
          ) : (
            items.map((item, index) => (
              <div key={item.id} className="border rounded-lg p-4 space-y-4 relative">
                <div className="absolute top-4 right-4">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveItem(item.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4 pr-12">
                  <div className="space-y-2">
                    <Label>商品 *</Label>
                    <Select
                      value={item.productId}
                      onValueChange={(value) => handleItemChange(item.id, 'productId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="選擇商品" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.productName} ({product.sku})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>數量 *</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        handleItemChange(item.id, 'quantity', parseInt(e.target.value) || 0)
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>單價</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) =>
                        handleItemChange(item.id, 'unitPrice', parseFloat(e.target.value) || 0)
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>小計</Label>
                    <Input
                      value={`NT$ ${(item.quantity * item.unitPrice).toLocaleString()}`}
                      readOnly
                      disabled
                    />
                  </div>

                  <div className="col-span-2 space-y-2">
                    <Label>退貨原因</Label>
                    <Input
                      value={item.reason || ''}
                      onChange={(e) => handleItemChange(item.id, 'reason', e.target.value)}
                      placeholder="選填"
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* 金額總計 */}
      {items.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center text-lg font-bold">
              <span>退款總額</span>
              <span className="text-red-600">NT$ {totalAmount.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 提交按鈕 */}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          取消
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? '建立中...' : '建立退貨單'}
        </Button>
      </div>
    </form>
  )
}
