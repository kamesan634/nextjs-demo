'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import { Search, MoreHorizontal, Eye, Pencil, Trash2, Power, PowerOff, Copy } from 'lucide-react'
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
import { deleteCoupon, updateCoupon } from '@/actions/promotions'
import type { Decimal } from '@prisma/client/runtime/library'

interface Coupon {
  id: string
  code: string
  name: string
  description: string | null
  discountType: string
  discountValue: Decimal
  minPurchase: Decimal | null
  maxDiscount: Decimal | null
  usageLimit: number | null
  usedCount: number
  startDate: Date
  endDate: Date
  isActive: boolean
  _count: {
    usages: number
    orders: number
  }
}

interface CouponsTableProps {
  data: Coupon[]
  pagination: {
    total: number
    page: number
    pageSize: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

/**
 * 優惠券列表元件
 */
export function CouponsTable({ data, pagination }: CouponsTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [searchValue, setSearchValue] = useState(searchParams.get('search') || '')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [couponToDelete, setCouponToDelete] = useState<Coupon | null>(null)

  // 更新搜尋參數
  const updateSearchParams = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', 'coupons')

    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === '') {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    })

    if (updates.search !== undefined || updates.isActive !== undefined) {
      params.set('page', '1')
    }

    startTransition(() => {
      router.push(`/promotions?${params.toString()}`)
    })
  }

  // 處理搜尋
  const handleSearch = () => {
    updateSearchParams({ search: searchValue })
  }

  // 處理刪除
  const handleDelete = async () => {
    if (!couponToDelete) return

    const result = await deleteCoupon(couponToDelete.id)

    if (result.success) {
      toast.success(result.message)
      setDeleteDialogOpen(false)
      setCouponToDelete(null)
      router.refresh()
    } else {
      toast.error(result.message)
    }
  }

  // 處理啟用/停用
  const handleToggleActive = async (coupon: Coupon) => {
    const result = await updateCoupon(coupon.id, { isActive: !coupon.isActive })

    if (result.success) {
      toast.success(coupon.isActive ? '優惠券已停用' : '優惠券已啟用')
      router.refresh()
    } else {
      toast.error(result.message)
    }
  }

  // 複製優惠碼
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast.success('優惠碼已複製')
  }

  // 取得狀態
  const getStatus = (coupon: Coupon) => {
    const now = new Date()
    const start = new Date(coupon.startDate)
    const end = new Date(coupon.endDate)

    if (!coupon.isActive) {
      return <Badge variant="outline">已停用</Badge>
    }
    if (now < start) {
      return <Badge variant="secondary">未開始</Badge>
    }
    if (now > end) {
      return <Badge variant="destructive">已過期</Badge>
    }
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return <Badge variant="destructive">已用完</Badge>
    }
    return <Badge className="bg-green-500">有效</Badge>
  }

  // 格式化折扣值
  const formatDiscount = (type: string, value: Decimal) => {
    if (type === 'PERCENTAGE') {
      return `${Number(value)}% 折扣`
    }
    return `折 NT$${Number(value)}`
  }

  // 格式化金額
  const formatCurrency = (amount: Decimal | null) => {
    if (!amount) return '-'
    return `NT$${Number(amount).toLocaleString()}`
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>優惠券列表</CardTitle>
              <CardDescription>共 {pagination.total} 筆優惠券</CardDescription>
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
                  placeholder="搜尋優惠碼、名稱..."
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
                value={searchParams.get('isActive') || 'all'}
                onValueChange={(value) =>
                  updateSearchParams({ isActive: value === 'all' ? undefined : value })
                }
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="狀態" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="true">啟用</SelectItem>
                  <SelectItem value="false">停用</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 優惠券列表 */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>優惠碼 / 名稱</TableHead>
                  <TableHead>折扣</TableHead>
                  <TableHead>低消</TableHead>
                  <TableHead>期間</TableHead>
                  <TableHead className="text-center">使用次數</TableHead>
                  <TableHead>狀態</TableHead>
                  <TableHead className="w-[70px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      沒有找到優惠券
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((coupon) => (
                    <TableRow key={coupon.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="font-medium font-mono">{coupon.code}</div>
                            <div className="text-sm text-muted-foreground">{coupon.name}</div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleCopyCode(coupon.code)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatDiscount(coupon.discountType, coupon.discountValue)}
                      </TableCell>
                      <TableCell>{formatCurrency(coupon.minPurchase)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{format(new Date(coupon.startDate), 'yyyy/MM/dd')}</div>
                          <div className="text-muted-foreground">
                            ~ {format(new Date(coupon.endDate), 'MM/dd')}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {coupon.usedCount}
                        {coupon.usageLimit && (
                          <span className="text-muted-foreground"> / {coupon.usageLimit}</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatus(coupon)}</TableCell>
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
                              <Link href={`/promotions/coupons/${coupon.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                檢視詳情
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/promotions/coupons/${coupon.id}/edit`}>
                                <Pencil className="mr-2 h-4 w-4" />
                                編輯
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleActive(coupon)}>
                              {coupon.isActive ? (
                                <>
                                  <PowerOff className="mr-2 h-4 w-4" />
                                  停用
                                </>
                              ) : (
                                <>
                                  <Power className="mr-2 h-4 w-4" />
                                  啟用
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setCouponToDelete(coupon)
                                setDeleteDialogOpen(true)
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              刪除
                            </DropdownMenuItem>
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
        title="刪除優惠券"
        description={`確定要刪除優惠券「${couponToDelete?.name}」嗎？此操作無法復原。`}
        onConfirm={handleDelete}
      />
    </>
  )
}
