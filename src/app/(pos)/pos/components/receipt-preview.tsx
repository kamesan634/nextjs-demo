'use client'

import type { CartItem } from '@/stores/pos-store'

interface ReceiptPreviewProps {
  data: {
    orderId?: string
    items?: CartItem[]
    totalAmount?: number
    paidAmount?: number
    changeAmount?: number
    paymentMethod?: string
    [key: string]: unknown
  }
}

export function ReceiptPreview({ data }: ReceiptPreviewProps) {
  const items = (data.items || []) as CartItem[]

  return (
    <div className="font-mono text-sm border rounded-lg p-4 bg-white">
      <div className="text-center mb-4">
        <p className="font-bold text-lg">交易收據</p>
        <p className="text-xs text-muted-foreground">{new Date().toLocaleString('zh-TW')}</p>
        {data.orderId && (
          <p className="text-xs text-muted-foreground">訂單編號: {String(data.orderId)}</p>
        )}
      </div>

      <div className="border-t border-dashed my-2" />

      {/* 商品明細 */}
      <div className="space-y-1">
        {items.map((item, i) => (
          <div key={i} className="flex justify-between">
            <div className="flex-1 truncate">
              <span>{item.productName}</span>
              <span className="text-muted-foreground"> x{item.quantity}</span>
            </div>
            <span>${item.subtotal.toLocaleString()}</span>
          </div>
        ))}
      </div>

      <div className="border-t border-dashed my-2" />

      {/* 金額摘要 */}
      <div className="space-y-1">
        <div className="flex justify-between font-bold">
          <span>合計</span>
          <span>${Number(data.totalAmount || 0).toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span>付款方式</span>
          <span>{data.paymentMethod || '-'}</span>
        </div>
        <div className="flex justify-between">
          <span>收款</span>
          <span>${Number(data.paidAmount || 0).toLocaleString()}</span>
        </div>
        <div className="flex justify-between font-bold">
          <span>找零</span>
          <span>${Number(data.changeAmount || 0).toLocaleString()}</span>
        </div>
      </div>

      <div className="border-t border-dashed my-2" />

      <p className="text-center text-xs text-muted-foreground">感謝您的惠顧</p>
    </div>
  )
}
