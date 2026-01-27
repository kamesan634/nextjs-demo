'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import { Search, MoreHorizontal, Eye, XCircle, CheckCircle, CreditCard } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DataTablePagination } from '@/components/data-table/data-table-pagination'
import { DeleteDialog } from '@/components/ui/delete-dialog'
import { cancelOrder, updateOrderStatus } from '@/actions/orders'
import type { Decimal } from '@prisma/client/runtime/library'

interface Order {
  id: string
  orderNo: string
  status: string
  paymentStatus: string
  subtotal: Decimal
  discountAmount: Decimal
  totalAmount: Decimal
  paidAmount: Decimal
  earnedPoints: number
  usedPoints: number
  orderDate: Date
  customer: {
    id: string
    code: string
    name: string
    phone: string | null
  } | null
  store: {
    id: string
    code: string
    name: string
  } | null
  user: {
    id: string
    name: string
  }
  _count: {
    items: number
  }
}

interface Store {
  id: string
  code: string
  name: string
}

interface OrdersTableProps {
  data: Order[]
  pagination: {
    total: number
    page: number
    pageSize: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
  stores: Store[]
}

/**
 * 訂單列表元件
 */
export function OrdersTable({ data, pagination, stores }: OrdersTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [searchValue, setSearchValue] = useState(searchParams.get('search') || '')
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null)

  // 更新搜尋參數
  const updateSearchParams = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString())

    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === '') {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    })

    if (
      updates.search !== undefined ||
      updates.status !== undefined ||
      updates.paymentStatus !== undefined ||
      updates.storeId !== undefined
    ) {
      params.set('page', '1')
    }

    startTransition(() => {
      router.push(`/orders?${params.toString()}`)
    })
  }

  // 處理搜尋
  const handleSearch = () => {
    updateSearchParams({ search: searchValue })
  }

  // 處理取消訂單
  const handleCancel = async () => {
    if (!orderToCancel) return

    const result = await cancelOrder(orderToCancel.id)

    if (result.success) {
      toast.success(result.message)
      setCancelDialogOpen(false)
      setOrderToCancel(null)
      router.refresh()
    } else {
      toast.error(result.message)
    }
  }

  // 處理完成訂單
  const handleComplete = async (orderId: string) => {
    const result = await updateOrderStatus(orderId, 'COMPLETED')

    if (result.success) {
      toast.success(result.message)
      router.refresh()
    } else {
      toast.error(result.message)
    }
  }

  // 格式化金額
  const formatCurrency = (amount: Decimal | number) => {
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

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>訂單列表</CardTitle>
              <CardDescription>共 {pagination.total} 筆訂單</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* 搜尋與篩選 */}
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex flex-1 items-center gap-2">
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜尋訂單編號、會員..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-8"
                />
              </div>
              <Button variant="secondary" onClick={handleSearch} disabled={isPending}>
                搜尋
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={searchParams.get('status') || 'all'}
                onValueChange={(value) =>
                  updateSearchParams({ status: value === 'all' ? undefined : value })
                }
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="訂單狀態" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部狀態</SelectItem>
                  <SelectItem value="PENDING">待處理</SelectItem>
                  <SelectItem value="CONFIRMED">已確認</SelectItem>
                  <SelectItem value="COMPLETED">已完成</SelectItem>
                  <SelectItem value="CANCELLED">已取消</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={searchParams.get('paymentStatus') || 'all'}
                onValueChange={(value) =>
                  updateSearchParams({ paymentStatus: value === 'all' ? undefined : value })
                }
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="付款狀態" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="UNPAID">未付款</SelectItem>
                  <SelectItem value="PARTIAL">部分付款</SelectItem>
                  <SelectItem value="PAID">已付款</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={searchParams.get('storeId') || 'all'}
                onValueChange={(value) =>
                  updateSearchParams({ storeId: value === 'all' ? undefined : value })
                }
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="門市" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部門市</SelectItem>
                  {stores.map((store) => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 訂單列表 */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>訂單編號</TableHead>
                  <TableHead>日期</TableHead>
                  <TableHead>會員</TableHead>
                  <TableHead>門市</TableHead>
                  <TableHead className="text-right">金額</TableHead>
                  <TableHead>訂單狀態</TableHead>
                  <TableHead>付款狀態</TableHead>
                  <TableHead className="w-[70px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      沒有找到訂單資料
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        <Link href={`/orders/${order.id}`} className="hover:underline">
                          {order.orderNo}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {format(new Date(order.orderDate), 'yyyy/MM/dd HH:mm', {
                          locale: zhTW,
                        })}
                      </TableCell>
                      <TableCell>
                        {order.customer ? (
                          <div>
                            <div className="font-medium">{order.customer.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {order.customer.phone}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">訪客</span>
                        )}
                      </TableCell>
                      <TableCell>{order.store?.name || '-'}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(order.totalAmount)}
                      </TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>{getPaymentStatusBadge(order.paymentStatus)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">操作選單</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/orders/${order.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                檢視詳情
                              </Link>
                            </DropdownMenuItem>
                            {order.paymentStatus !== 'PAID' && order.status !== 'CANCELLED' && (
                              <DropdownMenuItem asChild>
                                <Link href={`/orders/${order.id}/payment`}>
                                  <CreditCard className="mr-2 h-4 w-4" />
                                  收款
                                </Link>
                              </DropdownMenuItem>
                            )}
                            {order.status === 'PENDING' && (
                              <DropdownMenuItem onClick={() => handleComplete(order.id)}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                完成訂單
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {order.status !== 'CANCELLED' && order.status !== 'COMPLETED' && (
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => {
                                  setOrderToCancel(order)
                                  setCancelDialogOpen(true)
                                }}
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                取消訂單
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* 分頁 */}
          <div className="mt-4">
            <DataTablePagination
              page={pagination.page}
              pageSize={pagination.pageSize}
              total={pagination.total}
              totalPages={pagination.totalPages}
              onPageChange={(page) => updateSearchParams({ page: page.toString() })}
              onPageSizeChange={(pageSize) =>
                updateSearchParams({ pageSize: pageSize.toString(), page: '1' })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* 取消確認對話框 */}
      <DeleteDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        title="取消訂單"
        description={`確定要取消訂單「${orderToCancel?.orderNo}」嗎？此操作無法復原。`}
        confirmText="取消訂單"
        onConfirm={handleCancel}
      />
    </>
  )
}
