'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import { Search, MoreHorizontal, Eye, Pencil, Trash2, Power, PowerOff } from 'lucide-react'
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
import { deletePromotion, updatePromotion } from '@/actions/promotions'
import type { Decimal } from '@prisma/client/runtime/library'

interface Promotion {
  id: string
  code: string
  name: string
  description: string | null
  type: string
  discountType: string | null
  discountValue: Decimal | null
  startDate: Date
  endDate: Date
  isActive: boolean
  _count: {
    products: number
    orders: number
  }
}

interface PromotionsTableProps {
  data: Promotion[]
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
 * 促銷活動列表元件
 */
export function PromotionsTable({ data, pagination }: PromotionsTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [searchValue, setSearchValue] = useState(searchParams.get('search') || '')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [promotionToDelete, setPromotionToDelete] = useState<Promotion | null>(null)

  // 更新搜尋參數
  const updateSearchParams = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', 'promotions')

    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === '') {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    })

    if (
      updates.search !== undefined ||
      updates.type !== undefined ||
      updates.isActive !== undefined
    ) {
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
    if (!promotionToDelete) return

    const result = await deletePromotion(promotionToDelete.id)

    if (result.success) {
      toast.success(result.message)
      setDeleteDialogOpen(false)
      setPromotionToDelete(null)
      router.refresh()
    } else {
      toast.error(result.message)
    }
  }

  // 處理啟用/停用
  const handleToggleActive = async (promotion: Promotion) => {
    const result = await updatePromotion(promotion.id, { isActive: !promotion.isActive })

    if (result.success) {
      toast.success(promotion.isActive ? '促銷活動已停用' : '促銷活動已啟用')
      router.refresh()
    } else {
      toast.error(result.message)
    }
  }

  // 取得類型標籤
  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'DISCOUNT':
        return <Badge variant="secondary">折扣</Badge>
      case 'GIFT':
        return <Badge variant="outline">贈品</Badge>
      case 'BUNDLE':
        return <Badge className="bg-purple-500">組合</Badge>
      case 'POINTS':
        return <Badge className="bg-orange-500">點數加倍</Badge>
      default:
        return <Badge variant="outline">{type}</Badge>
    }
  }

  // 取得狀態
  const getStatus = (promotion: Promotion) => {
    const now = new Date()
    const start = new Date(promotion.startDate)
    const end = new Date(promotion.endDate)

    if (!promotion.isActive) {
      return <Badge variant="outline">已停用</Badge>
    }
    if (now < start) {
      return <Badge variant="secondary">未開始</Badge>
    }
    if (now > end) {
      return <Badge variant="destructive">已結束</Badge>
    }
    return <Badge className="bg-green-500">進行中</Badge>
  }

  // 格式化折扣值
  const formatDiscount = (type: string | null, value: Decimal | null) => {
    if (!type || !value) return '-'
    if (type === 'PERCENTAGE') {
      return `${Number(value)}%`
    }
    return `NT$${Number(value)}`
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>促銷活動列表</CardTitle>
              <CardDescription>共 {pagination.total} 筆促銷活動</CardDescription>
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
                  placeholder="搜尋代碼、名稱..."
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
                value={searchParams.get('type') || 'all'}
                onValueChange={(value) =>
                  updateSearchParams({ type: value === 'all' ? undefined : value })
                }
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="類型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部類型</SelectItem>
                  <SelectItem value="DISCOUNT">折扣</SelectItem>
                  <SelectItem value="GIFT">贈品</SelectItem>
                  <SelectItem value="BUNDLE">組合</SelectItem>
                  <SelectItem value="POINTS">點數加倍</SelectItem>
                </SelectContent>
              </Select>
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

          {/* 促銷活動列表 */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>代碼 / 名稱</TableHead>
                  <TableHead>類型</TableHead>
                  <TableHead>折扣</TableHead>
                  <TableHead>期間</TableHead>
                  <TableHead className="text-center">商品數</TableHead>
                  <TableHead>狀態</TableHead>
                  <TableHead className="w-[70px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      沒有找到促銷活動
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((promotion) => (
                    <TableRow key={promotion.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{promotion.code}</div>
                          <div className="text-sm text-muted-foreground">{promotion.name}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getTypeBadge(promotion.type)}</TableCell>
                      <TableCell>
                        {formatDiscount(promotion.discountType, promotion.discountValue)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{format(new Date(promotion.startDate), 'yyyy/MM/dd')}</div>
                          <div className="text-muted-foreground">
                            ~ {format(new Date(promotion.endDate), 'MM/dd')}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{promotion._count.products}</TableCell>
                      <TableCell>{getStatus(promotion)}</TableCell>
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
                              <Link href={`/promotions/${promotion.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                檢視詳情
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/promotions/${promotion.id}/edit`}>
                                <Pencil className="mr-2 h-4 w-4" />
                                編輯
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleActive(promotion)}>
                              {promotion.isActive ? (
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
                                setPromotionToDelete(promotion)
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
        title="刪除促銷活動"
        description={`確定要刪除促銷活動「${promotionToDelete?.name}」嗎？此操作無法復原。`}
        onConfirm={handleDelete}
      />
    </>
  )
}
