'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Eye, Phone, Mail, Award } from 'lucide-react'
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
import { deleteCustomer } from '@/actions/customers'
import type { Decimal } from '@prisma/client/runtime/library'

interface Customer {
  id: string
  code: string
  name: string
  phone: string | null
  email: string | null
  gender: string | null
  birthday: Date | null
  totalPoints: number
  availablePoints: number
  totalSpent: Decimal
  orderCount: number
  isActive: boolean
  joinDate: Date
  level: {
    id: string
    code: string
    name: string
  }
  _count: {
    orders: number
  }
}

interface Level {
  id: string
  code: string
  name: string
  discountRate: Decimal
  pointsMultiplier: Decimal
}

interface CustomersTableProps {
  data: Customer[]
  pagination: {
    total: number
    page: number
    pageSize: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
  levels: Level[]
}

/**
 * 會員列表元件
 */
export function CustomersTable({ data, pagination, levels }: CustomersTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [searchValue, setSearchValue] = useState(searchParams.get('search') || '')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null)

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

    // 如果搜尋條件改變，重置到第一頁
    if (
      updates.search !== undefined ||
      updates.levelId !== undefined ||
      updates.isActive !== undefined
    ) {
      params.set('page', '1')
    }

    startTransition(() => {
      router.push(`/customers?${params.toString()}`)
    })
  }

  // 處理搜尋
  const handleSearch = () => {
    updateSearchParams({ search: searchValue })
  }

  // 處理刪除
  const handleDelete = async () => {
    if (!customerToDelete) return

    const result = await deleteCustomer(customerToDelete.id)

    if (result.success) {
      toast.success(result.message)
      setDeleteDialogOpen(false)
      setCustomerToDelete(null)
      router.refresh()
    } else {
      toast.error(result.message)
    }
  }

  // 格式化性別
  const formatGender = (gender: string | null) => {
    switch (gender) {
      case 'M':
        return '男'
      case 'F':
        return '女'
      case 'O':
        return '其他'
      default:
        return '-'
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

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>會員列表</CardTitle>
              <CardDescription>共 {pagination.total} 位會員</CardDescription>
            </div>
            <Button asChild>
              <Link href="/customers/new">
                <Plus className="mr-2 h-4 w-4" />
                新增會員
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* 搜尋與篩選 */}
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex flex-1 items-center gap-2">
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜尋編號、姓名、電話..."
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
            <div className="flex items-center gap-2">
              <Select
                value={searchParams.get('levelId') || 'all'}
                onValueChange={(value) =>
                  updateSearchParams({ levelId: value === 'all' ? undefined : value })
                }
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="會員等級" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部等級</SelectItem>
                  {levels.map((level) => (
                    <SelectItem key={level.id} value={level.id}>
                      {level.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={searchParams.get('isActive') || 'all'}
                onValueChange={(value) =>
                  updateSearchParams({ isActive: value === 'all' ? undefined : value })
                }
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="狀態" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部狀態</SelectItem>
                  <SelectItem value="true">啟用</SelectItem>
                  <SelectItem value="false">停用</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 會員列表 */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>會員編號</TableHead>
                  <TableHead>姓名</TableHead>
                  <TableHead>聯絡方式</TableHead>
                  <TableHead>等級</TableHead>
                  <TableHead className="text-right">可用點數</TableHead>
                  <TableHead className="text-right">累計消費</TableHead>
                  <TableHead>狀態</TableHead>
                  <TableHead className="w-[70px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      沒有找到會員資料
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">{customer.code}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{customer.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatGender(customer.gender)}
                            {customer.birthday && (
                              <>
                                {' '}
                                · {format(new Date(customer.birthday), 'M/d', {
                                  locale: zhTW,
                                })}{' '}
                                生日
                              </>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {customer.phone && (
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="h-3 w-3" />
                              {customer.phone}
                            </div>
                          )}
                          {customer.email && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {customer.email}
                            </div>
                          )}
                          {!customer.phone && !customer.email && (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Award className="h-4 w-4 text-yellow-500" />
                          <span>{customer.level.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {customer.availablePoints.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(customer.totalSpent)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={customer.isActive ? 'default' : 'secondary'}>
                          {customer.isActive ? '啟用' : '停用'}
                        </Badge>
                      </TableCell>
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
                              <Link href={`/customers/${customer.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                檢視詳情
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/customers/${customer.id}/edit`}>
                                <Pencil className="mr-2 h-4 w-4" />
                                編輯
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setCustomerToDelete(customer)
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
        title="刪除會員"
        description={`確定要刪除會員「${customerToDelete?.name}」嗎？此操作無法復原。`}
        onConfirm={handleDelete}
      />
    </>
  )
}
