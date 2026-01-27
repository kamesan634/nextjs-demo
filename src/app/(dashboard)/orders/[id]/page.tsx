'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import {
  ArrowLeft,
  Package,
  User,
  Store,
  CreditCard,
  FileText,
  CheckCircle,
  XCircle,
  Printer,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import { DeleteDialog } from '@/components/ui/delete-dialog'
import { getOrder, cancelOrder, updateOrderStatus } from '@/actions/orders'
import type { Decimal } from '@prisma/client/runtime/library'

/**
 * 訂單詳情頁面
 */
export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [order, setOrder] = useState<Awaited<ReturnType<typeof getOrder>> | null>(null)
  const [loading, setLoading] = useState(true)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [orderId, setOrderId] = useState<string>('')

  const loadOrder = async (id: string) => {
    setLoading(true)
    const data = await getOrder(id)
    setOrder(data)
    setLoading(false)
  }

  useEffect(() => {
    params.then((p) => {
      setOrderId(p.id)
      loadOrder(p.id)
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

  // 取得訂單狀態標籤
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge>已完成</Badge>
      case 'PENDING':
        return <Badge variant="outline">待處理</Badge>
      case 'CONFIRMED':
        return <Badge variant="secondary">已確認</Badge>
      case 'CANCELLED':
        return <Badge variant="destructive">已取消</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // 取得付款狀態標籤
  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <Badge className="bg-green-500">已付款</Badge>
      case 'UNPAID':
        return <Badge variant="outline">未付款</Badge>
      case 'PARTIAL':
        return <Badge variant="secondary">部分付款</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // 處理取消訂單
  const handleCancel = async () => {
    const result = await cancelOrder(orderId)
    if (result.success) {
      toast.success(result.message)
      setCancelDialogOpen(false)
      loadOrder(orderId)
    } else {
      toast.error(result.message)
    }
  }

  // 處理完成訂單
  const handleComplete = async () => {
    const result = await updateOrderStatus(orderId, 'COMPLETED')
    if (result.success) {
      toast.success(result.message)
      loadOrder(orderId)
    } else {
      toast.error(result.message)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 animate-pulse rounded bg-muted" />
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="h-6 w-32 animate-pulse rounded bg-muted" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-12 animate-pulse rounded bg-muted" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-6 animate-pulse rounded bg-muted" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
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

  return (
    <>
      <div className="space-y-6">
        {/* 頁面標題 */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/orders">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">訂單 {order.orderNo}</h1>
              <p className="text-sm text-muted-foreground">
                {format(new Date(order.orderDate), 'yyyy/MM/dd HH:mm', { locale: zhTW })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {order.paymentStatus !== 'PAID' && order.status !== 'CANCELLED' && (
              <Button asChild>
                <Link href={`/orders/${orderId}/payment`}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  收款
                </Link>
              </Button>
            )}
            {order.status === 'PENDING' && (
              <Button variant="secondary" onClick={handleComplete}>
                <CheckCircle className="mr-2 h-4 w-4" />
                完成訂單
              </Button>
            )}
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" />
              列印
            </Button>
            {order.status !== 'CANCELLED' && order.status !== 'COMPLETED' && (
              <Button variant="destructive" onClick={() => setCancelDialogOpen(true)}>
                <XCircle className="mr-2 h-4 w-4" />
                取消訂單
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* 左側：訂單明細 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 商品明細 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  商品明細
                </CardTitle>
                <CardDescription>共 {order.items?.length || 0} 項商品</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>商品</TableHead>
                      <TableHead className="text-right">單價</TableHead>
                      <TableHead className="text-right">數量</TableHead>
                      <TableHead className="text-right">折扣</TableHead>
                      <TableHead className="text-right">小計</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.items?.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.productName}</div>
                            <div className="text-xs text-muted-foreground">{item.productSku}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.unitPrice)}
                        </TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">
                          {Number(item.discount) > 0 ? `-${formatCurrency(item.discount)}` : '-'}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(item.subtotal)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <Separator className="my-4" />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>商品小計</span>
                    <span>{formatCurrency(order.subtotal)}</span>
                  </div>
                  {Number(order.discountAmount) > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>折扣</span>
                      <span>-{formatCurrency(order.discountAmount)}</span>
                    </div>
                  )}
                  {order.usedPoints > 0 && (
                    <div className="flex justify-between text-sm text-orange-600">
                      <span>點數折抵 ({order.usedPoints} 點)</span>
                      <span>-{formatCurrency(order.pointsDiscount)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>應付金額</span>
                    <span>{formatCurrency(order.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>已付金額</span>
                    <span>{formatCurrency(order.paidAmount)}</span>
                  </div>
                  {Number(order.totalAmount) - Number(order.paidAmount) > 0 && (
                    <div className="flex justify-between text-sm text-destructive">
                      <span>未付金額</span>
                      <span>
                        {formatCurrency(Number(order.totalAmount) - Number(order.paidAmount))}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 付款紀錄 */}
            {order.payments && order.payments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    付款紀錄
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>付款時間</TableHead>
                        <TableHead>付款方式</TableHead>
                        <TableHead>參考號碼</TableHead>
                        <TableHead className="text-right">金額</TableHead>
                        <TableHead>狀態</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {order.payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>
                            {format(new Date(payment.paidAt), 'yyyy/MM/dd HH:mm', {
                              locale: zhTW,
                            })}
                          </TableCell>
                          <TableCell>{payment.paymentMethod?.name || '-'}</TableCell>
                          <TableCell>{payment.referenceNo || '-'}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(payment.amount)}
                          </TableCell>
                          <TableCell>
                            {payment.status === 'COMPLETED' ? (
                              <Badge className="bg-green-500">已完成</Badge>
                            ) : (
                              <Badge variant="outline">{payment.status}</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* 退貨紀錄 */}
            {order.refunds && order.refunds.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    退貨紀錄
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {order.refunds.map((refund) => (
                    <div key={refund.id} className="mb-4 rounded-lg border p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{refund.refundNo}</span>
                        <Badge variant={refund.status === 'COMPLETED' ? 'default' : 'outline'}>
                          {refund.status === 'COMPLETED' ? '已完成' : refund.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">原因：{refund.reason}</p>
                      <p className="text-sm font-medium">
                        退款金額：{formatCurrency(refund.refundAmount)}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* 右側：訂單資訊 */}
          <div className="space-y-6">
            {/* 訂單狀態 */}
            <Card>
              <CardHeader>
                <CardTitle>訂單狀態</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">訂單狀態</span>
                  {getStatusBadge(order.status)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">付款狀態</span>
                  {getPaymentStatusBadge(order.paymentStatus)}
                </div>
                {order.earnedPoints > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">獲得點數</span>
                    <span className="font-medium text-green-600">+{order.earnedPoints} 點</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 會員資訊 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  會員資訊
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {order.customer ? (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground">會員編號</p>
                      <p className="font-medium">{order.customer.code}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">姓名</p>
                      <p className="font-medium">{order.customer.name}</p>
                    </div>
                    {order.customer.phone && (
                      <div>
                        <p className="text-sm text-muted-foreground">電話</p>
                        <p className="font-medium">{order.customer.phone}</p>
                      </div>
                    )}
                    {order.customer.email && (
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium">{order.customer.email}</p>
                      </div>
                    )}
                    <Button variant="outline" size="sm" asChild className="w-full">
                      <Link href={`/customers/${order.customer.id}`}>查看會員詳情</Link>
                    </Button>
                  </>
                ) : (
                  <p className="text-muted-foreground">訪客訂單</p>
                )}
              </CardContent>
            </Card>

            {/* 門市資訊 */}
            {order.store && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Store className="h-5 w-5" />
                    門市資訊
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">門市代碼</p>
                    <p className="font-medium">{order.store.code}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">門市名稱</p>
                    <p className="font-medium">{order.store.name}</p>
                  </div>
                  {order.store.address && (
                    <div>
                      <p className="text-sm text-muted-foreground">地址</p>
                      <p className="font-medium">{order.store.address}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* 操作人員 */}
            <Card>
              <CardHeader>
                <CardTitle>操作人員</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{order.user?.name}</p>
                <p className="text-sm text-muted-foreground">{order.user?.username}</p>
              </CardContent>
            </Card>

            {/* 備註 */}
            {(order.notes || order.internalNotes) && (
              <Card>
                <CardHeader>
                  <CardTitle>備註</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {order.notes && (
                    <div>
                      <p className="text-sm text-muted-foreground">訂單備註</p>
                      <p>{order.notes}</p>
                    </div>
                  )}
                  {order.internalNotes && (
                    <div>
                      <p className="text-sm text-muted-foreground">內部備註</p>
                      <p>{order.internalNotes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* 優惠資訊 */}
            {(order.promotion || order.coupon) && (
              <Card>
                <CardHeader>
                  <CardTitle>優惠資訊</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {order.promotion && (
                    <div>
                      <p className="text-sm text-muted-foreground">促銷活動</p>
                      <p className="font-medium">{order.promotion.name}</p>
                    </div>
                  )}
                  {order.coupon && (
                    <div>
                      <p className="text-sm text-muted-foreground">優惠券</p>
                      <p className="font-medium">{order.coupon.name}</p>
                      <p className="text-xs text-muted-foreground">{order.coupon.code}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* 取消確認對話框 */}
      <DeleteDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        title="取消訂單"
        description={`確定要取消訂單「${order.orderNo}」嗎？此操作無法復原。`}
        confirmText="取消訂單"
        onConfirm={handleCancel}
      />
    </>
  )
}
