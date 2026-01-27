'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import { ArrowLeft, CreditCard } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { getOrder, completePayment } from '@/actions/orders'
import { getPaymentMethods } from '@/actions/settings'
import type { Decimal } from '@prisma/client/runtime/library'

interface PaymentMethod {
  id: string
  code: string
  name: string
}

/**
 * 訂單收款頁面
 */
export default function OrderPaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [order, setOrder] = useState<Awaited<ReturnType<typeof getOrder>> | null>(null)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [orderId, setOrderId] = useState<string>('')

  const [paymentMethodId, setPaymentMethodId] = useState<string>('')
  const [amount, setAmount] = useState<string>('')
  const [referenceNo, setReferenceNo] = useState<string>('')

  const loadData = async (id: string) => {
    setLoading(true)
    const [orderData, methodsData] = await Promise.all([
      getOrder(id),
      getPaymentMethods({ isActive: true }),
    ])
    setOrder(orderData)
    setPaymentMethods(methodsData.data || [])

    // 預設金額為未付金額
    if (orderData) {
      const remaining = Number(orderData.totalAmount) - Number(orderData.paidAmount)
      setAmount(remaining.toString())
    }

    // 預設選擇第一個付款方式
    if (methodsData.data && methodsData.data.length > 0) {
      setPaymentMethodId(methodsData.data[0].id)
    }

    setLoading(false)
  }

  useEffect(() => {
    params.then((p) => {
      setOrderId(p.id)
      loadData(p.id)
    })
  }, [params])

  // 格式化金額
  const formatCurrency = (amount: Decimal | number | null | undefined) => {
    if (amount === null || amount === undefined) return 'NT$0'
    const value = typeof amount === 'number' ? amount : Number(amount)
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  // 計算未付金額
  const getRemainingAmount = () => {
    if (!order) return 0
    return Number(order.totalAmount) - Number(order.paidAmount)
  }

  // 處理提交付款
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!paymentMethodId) {
      toast.error('請選擇付款方式')
      return
    }

    const paymentAmount = Number(amount)
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      toast.error('請輸入有效的付款金額')
      return
    }

    const remaining = getRemainingAmount()
    if (paymentAmount > remaining) {
      toast.error(`付款金額不可超過未付金額 ${formatCurrency(remaining)}`)
      return
    }

    setSubmitting(true)

    const result = await completePayment({
      orderId,
      paymentMethodId,
      amount: paymentAmount,
      referenceNo: referenceNo || undefined,
    })

    setSubmitting(false)

    if (result.success) {
      toast.success(result.message)
      router.push(`/orders/${orderId}`)
    } else {
      toast.error(result.message)
    }
  }

  // 快速金額按鈕
  const quickAmounts = [100, 500, 1000, 5000]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 animate-pulse rounded bg-muted" />
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-12 animate-pulse rounded bg-muted" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="text-xl font-semibold">訂單不存在</h2>
        <p className="mt-2 text-muted-foreground">找不到指定的訂單</p>
        <Button asChild className="mt-4">
          <Link href="/orders">返回訂單列表</Link>
        </Button>
      </div>
    )
  }

  if (order.paymentStatus === 'PAID') {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="text-xl font-semibold">訂單已完成付款</h2>
        <p className="mt-2 text-muted-foreground">此訂單已全額付款，無需再次收款</p>
        <Button asChild className="mt-4">
          <Link href={`/orders/${orderId}`}>返回訂單詳情</Link>
        </Button>
      </div>
    )
  }

  if (order.status === 'CANCELLED') {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="text-xl font-semibold">訂單已取消</h2>
        <p className="mt-2 text-muted-foreground">已取消的訂單無法收款</p>
        <Button asChild className="mt-4">
          <Link href={`/orders/${orderId}`}>返回訂單詳情</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 頁面標題 */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/orders/${orderId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">訂單收款</h1>
          <p className="text-sm text-muted-foreground">訂單編號：{order.orderNo}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 左側：訂單摘要 */}
        <Card>
          <CardHeader>
            <CardTitle>訂單摘要</CardTitle>
            <CardDescription>
              訂單日期：{format(new Date(order.orderDate), 'yyyy/MM/dd HH:mm', { locale: zhTW })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">會員</span>
              <span>{order.customer?.name || '訪客'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">商品數量</span>
              <span>{order.items?.length || 0} 項</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">商品小計</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            {Number(order.discountAmount) > 0 && (
              <div className="flex justify-between text-green-600">
                <span>折扣</span>
                <span>-{formatCurrency(order.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold">
              <span>應付金額</span>
              <span>{formatCurrency(order.totalAmount)}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">已付金額</span>
              <span>{formatCurrency(order.paidAmount)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-destructive">
              <span>未付金額</span>
              <span>{formatCurrency(getRemainingAmount())}</span>
            </div>
          </CardContent>
        </Card>

        {/* 右側：收款表單 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              收款資訊
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">付款方式 *</Label>
                <Select value={paymentMethodId} onValueChange={setPaymentMethodId}>
                  <SelectTrigger>
                    <SelectValue placeholder="選擇付款方式" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((method) => (
                      <SelectItem key={method.id} value={method.id}>
                        {method.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">付款金額 *</Label>
                <Input
                  id="amount"
                  type="number"
                  min="1"
                  max={getRemainingAmount()}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="輸入付款金額"
                />
                <div className="flex flex-wrap gap-2">
                  {quickAmounts.map((quickAmount) => (
                    <Button
                      key={quickAmount}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setAmount(quickAmount.toString())}
                      disabled={quickAmount > getRemainingAmount()}
                    >
                      {formatCurrency(quickAmount)}
                    </Button>
                  ))}
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setAmount(getRemainingAmount().toString())}
                  >
                    全額
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="referenceNo">參考號碼</Label>
                <Input
                  id="referenceNo"
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                  placeholder="信用卡授權碼、匯款帳號等"
                />
              </div>

              <div className="flex gap-4">
                <Button type="submit" className="flex-1" disabled={submitting}>
                  {submitting ? '處理中...' : '確認收款'}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href={`/orders/${orderId}`}>取消</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
