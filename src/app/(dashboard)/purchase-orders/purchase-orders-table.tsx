'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import {
  Search,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
  PackageCheck,
} from 'lucide-react'
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
import { deletePurchaseOrder, updatePurchaseOrderStatus } from '@/actions/purchase-orders'
import type { Decimal } from '@prisma/client/runtime/library'

interface PurchaseOrder {
  id: string
  orderNo: string
  status: string
  subtotal: Decimal
  taxAmount: Decimal
  totalAmount: Decimal
  orderDate: Date
  expectedDate: Date | null
  supplier: {
    id: string
    code: string
    name: string
    shortName: string | null
  } | null
  _count: {
    items: number
    receipts: number
  }
}

interface Supplier {
  id: string
  code: string
  name: string
}

interface PurchaseOrdersTableProps {
  data: PurchaseOrder[]
  pagination: {
    total: number
    page: number
    pageSize: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
  suppliers: Supplier[]
}

/**
 * 採購單列表元件
 */
export function PurchaseOrdersTable({ data, pagination, suppliers }: PurchaseOrdersTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [searchValue, setSearchValue] = useState(searchParams.get('search') || '')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [orderToDelete, setOrderToDelete] = useState<PurchaseOrder | null>(null)

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
      updates.supplierId !== undefined
    ) {
      params.set('page', '1')
    }

    startTransition(() => {
      router.push(`/purchase-orders?${params.toString()}`)
    })
  }

  // 處理搜尋
  const handleSearch = () => {
    updateSearchParams({ search: searchValue })
  }

  // 處理刪除
  const handleDelete = async () => {
    if (!orderToDelete) return

    const result = await deletePurchaseOrder(orderToDelete.id)

    if (result.success) {
      toast.success(result.message)
      setDeleteDialogOpen(false)
      setOrderToDelete(null)
      router.refresh()
    } else {
      toast.error(result.message)
    }
  }

  // 處理核准
  const handleApprove = async (orderId: string) => {
    const result = await updatePurchaseOrderStatus(orderId, 'APPROVED')

    if (result.success) {
      toast.success(result.message)
      router.refresh()
    } else {
      toast.error(result.message)
    }
  }

  // 處理取消
  const handleCancel = async (orderId: string) => {
    const result = await updatePurchaseOrderStatus(orderId, 'CANCELLED')

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

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>採購單列表</CardTitle>
              <CardDescription>共 {pagination.total} 筆採購單</CardDescription>
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
                  placeholder="搜尋採購單號、供應商..."
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
                  <SelectValue placeholder="狀態" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部狀態</SelectItem>
                  <SelectItem value="DRAFT">草稿</SelectItem>
                  <SelectItem value="PENDING">待審核</SelectItem>
                  <SelectItem value="APPROVED">已核准</SelectItem>
                  <SelectItem value="ORDERED">已下單</SelectItem>
                  <SelectItem value="PARTIAL">部分收貨</SelectItem>
                  <SelectItem value="COMPLETED">已完成</SelectItem>
                  <SelectItem value="CANCELLED">已取消</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={searchParams.get('supplierId') || 'all'}
                onValueChange={(value) =>
                  updateSearchParams({ supplierId: value === 'all' ? undefined : value })
                }
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="供應商" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部供應商</SelectItem>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 採購單列表 */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>採購單號</TableHead>
                  <TableHead>日期</TableHead>
                  <TableHead>供應商</TableHead>
                  <TableHead className="text-center">商品數</TableHead>
                  <TableHead className="text-right">金額</TableHead>
                  <TableHead>狀態</TableHead>
                  <TableHead className="w-[70px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      沒有找到採購單資料
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        <Link href={`/purchase-orders/${order.id}`} className="hover:underline">
                          {order.orderNo}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div>
                            {format(new Date(order.orderDate), 'yyyy/MM/dd', {
                              locale: zhTW,
                            })}
                          </div>
                          {order.expectedDate && (
                            <div className="text-xs text-muted-foreground">
                              預計：{format(new Date(order.expectedDate), 'MM/dd')}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {order.supplier?.shortName || order.supplier?.name || '-'}
                      </TableCell>
                      <TableCell className="text-center">{order._count.items}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(order.totalAmount)}
                      </TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
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
                              <Link href={`/purchase-orders/${order.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                檢視詳情
                              </Link>
                            </DropdownMenuItem>
                            {order.status === 'DRAFT' && (
                              <DropdownMenuItem asChild>
                                <Link href={`/purchase-orders/${order.id}/edit`}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  編輯
                                </Link>
                              </DropdownMenuItem>
                            )}
                            {(order.status === 'APPROVED' ||
                              order.status === 'ORDERED' ||
                              order.status === 'PARTIAL') && (
                              <DropdownMenuItem asChild>
                                <Link href={`/purchase-orders/${order.id}/receive`}>
                                  <PackageCheck className="mr-2 h-4 w-4" />
                                  驗收入庫
                                </Link>
                              </DropdownMenuItem>
                            )}
                            {order.status === 'PENDING' && (
                              <DropdownMenuItem onClick={() => handleApprove(order.id)}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                核准
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {order.status !== 'CANCELLED' && order.status !== 'COMPLETED' && (
                              <DropdownMenuItem
                                className="text-orange-600"
                                onClick={() => handleCancel(order.id)}
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                取消採購單
                              </DropdownMenuItem>
                            )}
                            {(order.status === 'DRAFT' || order.status === 'CANCELLED') && (
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => {
                                  setOrderToDelete(order)
                                  setDeleteDialogOpen(true)
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                刪除
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

      {/* 刪除確認對話框 */}
      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="刪除採購單"
        description={`確定要刪除採購單「${orderToDelete?.orderNo}」嗎？此操作無法復原。`}
        onConfirm={handleDelete}
      />
    </>
  )
}
