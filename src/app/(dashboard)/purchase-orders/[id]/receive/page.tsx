'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, PackageCheck, Warehouse } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  getPurchaseOrder,
  createPurchaseReceipt,
  completePurchaseReceipt,
} from '@/actions/purchase-orders'
import { getWarehouses } from '@/actions/warehouses'

interface ReceiptItem {
  productId: string
  productName: string
  productSku: string
  expectedQty: number
  receivedQty: number
  acceptedQty: number
  rejectedQty: number
}

interface Warehouse {
  id: string
  code: string
  name: string
}

/**
 * 採購驗收頁面
 */
export default function PurchaseOrderReceivePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [order, setOrder] = useState<Awaited<ReturnType<typeof getPurchaseOrder>> | null>(null)
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [orderId, setOrderId] = useState<string>('')

  const [warehouseId, setWarehouseId] = useState<string>('')
  const [items, setItems] = useState<ReceiptItem[]>([])
  const [notes, setNotes] = useState('')

  const loadData = async (id: string) => {
    setLoading(true)
    const [orderData, warehousesData] = await Promise.all([
      getPurchaseOrder(id),
      getWarehouses({ isActive: true }),
    ])
    setOrder(orderData)
    setWarehouses(warehousesData.data || [])

    // 初始化驗收項目
    if (orderData?.items) {
      setItems(
        orderData.items.map((item: NonNullable<typeof orderData.items>[number]) => ({
          productId: item.productId,
          productName: item.productName,
          productSku: item.productSku,
          expectedQty: item.quantity - item.receivedQty,
          receivedQty: item.quantity - item.receivedQty,
          acceptedQty: item.quantity - item.receivedQty,
          rejectedQty: 0,
        }))
      )
    }

    // 預設選擇第一個倉庫
    if (warehousesData.data && warehousesData.data.length > 0) {
      setWarehouseId(warehousesData.data[0].id)
    }

    setLoading(false)
  }

  useEffect(() => {
    params.then((p) => {
      setOrderId(p.id)
      loadData(p.id)
    })
  }, [params])

  // 更新收貨數量
  const updateReceivedQty = (productId: string, qty: number) => {
    setItems(
      items.map((item) =>
        item.productId === productId
          ? {
              ...item,
              receivedQty: Math.max(0, qty),
              acceptedQty: Math.max(0, qty),
              rejectedQty: 0,
            }
          : item
      )
    )
  }

  // 更新合格數量
  const updateAcceptedQty = (productId: string, qty: number) => {
    setItems(
      items.map((item) =>
        item.productId === productId
          ? {
              ...item,
              acceptedQty: Math.min(Math.max(0, qty), item.receivedQty),
              rejectedQty: item.receivedQty - Math.min(Math.max(0, qty), item.receivedQty),
            }
          : item
      )
    )
  }

  // 提交驗收
  const handleSubmit = async () => {
    if (!warehouseId) {
      toast.error('請選擇入庫倉庫')
      return
    }

    // 檢查是否有要驗收的項目
    const hasItems = items.some((item) => item.acceptedQty > 0)
    if (!hasItems) {
      toast.error('請至少驗收一項商品')
      return
    }

    setSubmitting(true)

    const result = await createPurchaseReceipt({
      purchaseOrderId: orderId,
      warehouseId,
      items: items
        .filter((item) => item.receivedQty > 0)
        .map((item) => ({
          productId: item.productId,
          expectedQty: item.expectedQty,
          receivedQty: item.receivedQty,
          acceptedQty: item.acceptedQty,
          rejectedQty: item.rejectedQty,
        })),
      notes: notes || undefined,
    })

    if (result.success && result.data?.id) {
      // 完成驗收並入庫
      const completeResult = await completePurchaseReceipt(result.data.id)
      if (completeResult.success) {
        toast.success('驗收完成，庫存已更新')
        router.push(`/purchase-orders/${orderId}`)
      } else {
        toast.error(completeResult.message)
      }
    } else {
      toast.error(result.message)
    }

    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 animate-pulse rounded bg-muted" />
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded bg-muted" />
              ))}
            </div>
          </CardContent>
        </Card>
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
    <div className="space-y-6">
      {/* 頁面標題 */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/purchase-orders/${orderId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">採購驗收</h1>
          <p className="text-sm text-muted-foreground">採購單號：{order.orderNo}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 左側：驗收明細 */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PackageCheck className="h-5 w-5" />
                驗收明細
              </CardTitle>
              <CardDescription>供應商：{order.supplier?.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>商品</TableHead>
                    <TableHead className="text-right">待收</TableHead>
                    <TableHead className="text-right w-[100px]">實收</TableHead>
                    <TableHead className="text-right w-[100px]">合格</TableHead>
                    <TableHead className="text-right">不良</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.productId}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.productName}</div>
                          <div className="text-xs text-muted-foreground">{item.productSku}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{item.expectedQty}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          max={item.expectedQty}
                          value={item.receivedQty}
                          onChange={(e) =>
                            updateReceivedQty(item.productId, Number(e.target.value))
                          }
                          className="h-8 w-20 text-right"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          max={item.receivedQty}
                          value={item.acceptedQty}
                          onChange={(e) =>
                            updateAcceptedQty(item.productId, Number(e.target.value))
                          }
                          className="h-8 w-20 text-right"
                        />
                      </TableCell>
                      <TableCell className="text-right text-destructive">
                        {item.rejectedQty > 0 ? item.rejectedQty : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* 備註 */}
          <Card>
            <CardHeader>
              <CardTitle>驗收備註</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="輸入驗收備註..."
                rows={3}
              />
            </CardContent>
          </Card>
        </div>

        {/* 右側：倉庫選擇 */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Warehouse className="h-5 w-5" />
                入庫倉庫
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={warehouseId} onValueChange={setWarehouseId}>
                <SelectTrigger>
                  <SelectValue placeholder="選擇倉庫" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((warehouse) => (
                    <SelectItem key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* 驗收摘要 */}
          <Card>
            <CardHeader>
              <CardTitle>驗收摘要</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">待收總數</span>
                <span>{items.reduce((sum, i) => sum + i.expectedQty, 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">實收總數</span>
                <span>{items.reduce((sum, i) => sum + i.receivedQty, 0)}</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>合格總數</span>
                <span>{items.reduce((sum, i) => sum + i.acceptedQty, 0)}</span>
              </div>
              <div className="flex justify-between text-destructive">
                <span>不良總數</span>
                <span>{items.reduce((sum, i) => sum + i.rejectedQty, 0)}</span>
              </div>
            </CardContent>
          </Card>

          {/* 提交按鈕 */}
          <Button
            className="w-full"
            size="lg"
            onClick={handleSubmit}
            disabled={submitting || !warehouseId}
          >
            {submitting ? '處理中...' : '確認驗收入庫'}
          </Button>
        </div>
      </div>
    </div>
  )
}
