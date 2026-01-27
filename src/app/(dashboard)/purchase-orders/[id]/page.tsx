'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import {
  ArrowLeft,
  Package,
  Building2,
  CheckCircle,
  XCircle,
  Pencil,
  PackageCheck,
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
import { getPurchaseOrder, updatePurchaseOrderStatus } from '@/actions/purchase-orders'
import type { Decimal } from '@prisma/client/runtime/library'

/**
 * 採購單詳情頁面
 */
export default function PurchaseOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [order, setOrder] = useState<Awaited<ReturnType<typeof getPurchaseOrder>> | null>(null)
  const [loading, setLoading] = useState(true)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [orderId, setOrderId] = useState<string>('')

  const loadOrder = async (id: string) => {
    setLoading(true)
    const data = await getPurchaseOrder(id)
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

  // 取得狀態標籤
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <Badge variant="outline">草稿</Badge>
      case 'PENDING':
        return <Badge variant="secondary">待審核</Badge>
      case 'APPROVED':
        return <Badge className="bg-blue-500">已核准</Badge>
      case 'ORDERED':
        return <Badge className="bg-purple-500">已下單</Badge>
      case 'PARTIAL':
        return <Badge className="bg-orange-500">部分收貨</Badge>
      case 'COMPLETED':
        return <Badge className="bg-green-500">已完成</Badge>
      case 'CANCELLED':
        return <Badge variant="destructive">已取消</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // 處理核准
  const handleApprove = async () => {
    const result = await updatePurchaseOrderStatus(orderId, 'APPROVED')
    if (result.success) {
      toast.success(result.message)
      loadOrder(orderId)
    } else {
      toast.error(result.message)
    }
  }

  // 處理取消
  const handleCancel = async () => {
    const result = await updatePurchaseOrderStatus(orderId, 'CANCELLED')
    if (result.success) {
      toast.success(result.message)
      setCancelDialogOpen(false)
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
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="text-xl font-semibold">採購單不存在</h2>
        <p className="mt-2 text-muted-foreground">找不到指定的採購單</p>
        <Button asChild className="mt-4">
          <Link href="/purchase-orders">返回採購單列表</Link>
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
              <Link href="/purchase-orders">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">採購單 {order.orderNo}</h1>
              <p className="text-sm text-muted-foreground">
                {format(new Date(order.orderDate), 'yyyy/MM/dd', { locale: zhTW })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {order.status === 'DRAFT' && (
              <Button asChild>
                <Link href={`/purchase-orders/${orderId}/edit`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  編輯
                </Link>
              </Button>
            )}
            {order.status === 'PENDING' && (
              <Button onClick={handleApprove}>
                <CheckCircle className="mr-2 h-4 w-4" />
                核准
              </Button>
            )}
            {(order.status === 'APPROVED' ||
              order.status === 'ORDERED' ||
              order.status === 'PARTIAL') && (
              <Button asChild>
                <Link href={`/purchase-orders/${orderId}/receive`}>
                  <PackageCheck className="mr-2 h-4 w-4" />
                  驗收入庫
                </Link>
              </Button>
            )}
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" />
              列印
            </Button>
            {order.status !== 'CANCELLED' && order.status !== 'COMPLETED' && (
              <Button variant="destructive" onClick={() => setCancelDialogOpen(true)}>
                <XCircle className="mr-2 h-4 w-4" />
                取消
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* 左側：採購明細 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 商品明細 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  採購明細
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
                      <TableHead className="text-right">已收</TableHead>
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
                          {item.receivedQty}
                          {item.receivedQty >= item.quantity && (
                            <CheckCircle className="ml-1 inline h-4 w-4 text-green-500" />
                          )}
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
                    <span>小計</span>
                    <span>{formatCurrency(order.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>稅額</span>
                    <span>{formatCurrency(order.taxAmount)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>總金額</span>
                    <span>{formatCurrency(order.totalAmount)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 驗收紀錄 */}
            {order.receipts && order.receipts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PackageCheck className="h-5 w-5" />
                    驗收紀錄
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {order.receipts.map((receipt) => (
                    <div key={receipt.id} className="mb-4 rounded-lg border p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{receipt.receiptNo}</span>
                        <Badge variant={receipt.status === 'COMPLETED' ? 'default' : 'outline'}>
                          {receipt.status === 'COMPLETED' ? '已完成' : receipt.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        倉庫：{receipt.warehouse?.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        驗收日期：{format(new Date(receipt.receiptDate), 'yyyy/MM/dd')}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* 右側：採購資訊 */}
          <div className="space-y-6">
            {/* 採購單狀態 */}
            <Card>
              <CardHeader>
                <CardTitle>採購單狀態</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">狀態</span>
                  {getStatusBadge(order.status)}
                </div>
                {order.expectedDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">預計交貨日</span>
                    <span>{format(new Date(order.expectedDate), 'yyyy/MM/dd')}</span>
                  </div>
                )}
                {order.approvedAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">核准日期</span>
                    <span>{format(new Date(order.approvedAt), 'yyyy/MM/dd')}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 供應商資訊 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  供應商資訊
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {order.supplier ? (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground">供應商編號</p>
                      <p className="font-medium">{order.supplier.code}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">供應商名稱</p>
                      <p className="font-medium">{order.supplier.name}</p>
                    </div>
                    {order.supplier.contactPerson && (
                      <div>
                        <p className="text-sm text-muted-foreground">聯絡人</p>
                        <p className="font-medium">{order.supplier.contactPerson}</p>
                      </div>
                    )}
                    {order.supplier.phone && (
                      <div>
                        <p className="text-sm text-muted-foreground">電話</p>
                        <p className="font-medium">{order.supplier.phone}</p>
                      </div>
                    )}
                    <Button variant="outline" size="sm" asChild className="w-full">
                      <Link href={`/suppliers/${order.supplier.id}`}>查看供應商詳情</Link>
                    </Button>
                  </>
                ) : (
                  <p className="text-muted-foreground">無供應商資訊</p>
                )}
              </CardContent>
            </Card>

            {/* 備註 */}
            {order.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>備註</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{order.notes}</p>
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
        title="取消採購單"
        description={`確定要取消採購單「${order.orderNo}」嗎？`}
        confirmText="取消採購單"
        onConfirm={handleCancel}
      />
    </>
  )
}
