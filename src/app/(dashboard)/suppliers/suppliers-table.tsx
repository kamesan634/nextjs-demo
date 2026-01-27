'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  Phone,
  Mail,
  Building2,
  CreditCard,
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
import { deleteSupplier } from '@/actions/suppliers'
import type { Decimal } from '@prisma/client/runtime/library'

interface Supplier {
  id: string
  code: string
  name: string
  shortName: string | null
  contactPerson: string | null
  phone: string | null
  email: string | null
  address: string | null
  taxId: string | null
  paymentTerms: number
  creditLimit: Decimal | null
  isActive: boolean
  _count: {
    purchaseOrders: number
    prices: number
  }
}

interface SuppliersTableProps {
  data: Supplier[]
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
 * 供應商列表元件
 */
export function SuppliersTable({ data, pagination }: SuppliersTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [searchValue, setSearchValue] = useState(searchParams.get('search') || '')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null)

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
    if (updates.search !== undefined || updates.isActive !== undefined) {
      params.set('page', '1')
    }

    startTransition(() => {
      router.push(`/suppliers?${params.toString()}`)
    })
  }

  // 處理搜尋
  const handleSearch = () => {
    updateSearchParams({ search: searchValue })
  }

  // 處理刪除
  const handleDelete = async () => {
    if (!supplierToDelete) return

    const result = await deleteSupplier(supplierToDelete.id)

    if (result.success) {
      toast.success(result.message)
      setDeleteDialogOpen(false)
      setSupplierToDelete(null)
      router.refresh()
    } else {
      toast.error(result.message)
    }
  }

  // 格式化金額
  const formatCurrency = (amount: Decimal | number | null) => {
    if (amount === null) return '-'
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
              <CardTitle>供應商列表</CardTitle>
              <CardDescription>共 {pagination.total} 家供應商</CardDescription>
            </div>
            <Button asChild>
              <Link href="/suppliers/new">
                <Plus className="mr-2 h-4 w-4" />
                新增供應商
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
                  placeholder="搜尋代碼、名稱、統編..."
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

          {/* 供應商列表 */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>代碼</TableHead>
                  <TableHead>名稱</TableHead>
                  <TableHead>聯絡人</TableHead>
                  <TableHead>聯絡方式</TableHead>
                  <TableHead className="text-right">付款天數</TableHead>
                  <TableHead className="text-right">信用額度</TableHead>
                  <TableHead>狀態</TableHead>
                  <TableHead className="w-[70px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      沒有找到供應商資料
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell className="font-medium">{supplier.code}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{supplier.name}</div>
                          {supplier.shortName && (
                            <div className="text-xs text-muted-foreground">
                              {supplier.shortName}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{supplier.contactPerson || '-'}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {supplier.phone && (
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="h-3 w-3" />
                              {supplier.phone}
                            </div>
                          )}
                          {supplier.email && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {supplier.email}
                            </div>
                          )}
                          {!supplier.phone && !supplier.email && (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{supplier.paymentTerms} 天</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(supplier.creditLimit)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={supplier.isActive ? 'default' : 'secondary'}>
                          {supplier.isActive ? '啟用' : '停用'}
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
                              <Link href={`/suppliers/${supplier.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                檢視詳情
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/suppliers/${supplier.id}/edit`}>
                                <Pencil className="mr-2 h-4 w-4" />
                                編輯
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setSupplierToDelete(supplier)
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
        title="刪除供應商"
        description={`確定要刪除供應商「${supplierToDelete?.name}」嗎？此操作無法復原。`}
        onConfirm={handleDelete}
      />
    </>
  )
}
