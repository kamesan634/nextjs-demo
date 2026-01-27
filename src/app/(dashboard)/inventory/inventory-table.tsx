'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Search, AlertTriangle, ArrowRightLeft } from 'lucide-react'

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DataTablePagination } from '@/components/data-table/data-table-pagination'
import { Progress } from '@/components/ui/progress'
import type { Decimal } from '@prisma/client/runtime/library'

interface InventoryItem {
  id: string
  productId: string
  quantity: number
  reservedQty: number
  availableQty: number
  product: {
    id: string
    sku: string
    name: string
    barcode: string | null
    safetyStock: number
    reorderPoint: number
    sellingPrice: Decimal
    category: {
      id: string
      name: string
    }
  }
  warehouse: {
    id: string
    code: string
    name: string
  } | null
  store: {
    id: string
    code: string
    name: string
  } | null
}

interface Warehouse {
  id: string
  code: string
  name: string
}

interface InventoryTableProps {
  data: InventoryItem[]
  pagination: {
    total: number
    page: number
    pageSize: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
  warehouses: Warehouse[]
}

/**
 * 庫存列表元件
 */
export function InventoryTable({ data, pagination, warehouses }: InventoryTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [searchValue, setSearchValue] = useState(searchParams.get('search') || '')

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
      updates.warehouseId !== undefined ||
      updates.lowStock !== undefined
    ) {
      params.set('page', '1')
    }

    startTransition(() => {
      router.push(`/inventory?${params.toString()}`)
    })
  }

  // 處理搜尋
  const handleSearch = () => {
    updateSearchParams({ search: searchValue })
  }

  // 取得庫存狀態
  const getStockStatus = (quantity: number, safetyStock: number) => {
    if (quantity <= 0) {
      return { label: '缺貨', variant: 'destructive' as const, color: 'text-red-600' }
    }
    if (quantity <= safetyStock) {
      return { label: '低庫存', variant: 'outline' as const, color: 'text-yellow-600' }
    }
    return { label: '正常', variant: 'secondary' as const, color: 'text-green-600' }
  }

  // 計算庫存百分比（以安全庫存的2倍為100%）
  const getStockPercentage = (quantity: number, safetyStock: number) => {
    if (safetyStock === 0) return 100
    const maxStock = safetyStock * 2
    return Math.min(100, Math.round((quantity / maxStock) * 100))
  }

  // 取得進度條顏色
  const getProgressColor = (percentage: number, safetyStock: number, quantity: number) => {
    if (quantity <= 0) return 'bg-red-500'
    if (quantity <= safetyStock) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>庫存列表</CardTitle>
            <CardDescription>共 {pagination.total} 筆庫存紀錄</CardDescription>
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
                placeholder="搜尋商品編號、名稱、條碼..."
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
              value={searchParams.get('warehouseId') || 'all'}
              onValueChange={(value) =>
                updateSearchParams({ warehouseId: value === 'all' ? undefined : value })
              }
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="倉庫" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部倉庫</SelectItem>
                {warehouses.map((wh) => (
                  <SelectItem key={wh.id} value={wh.id}>
                    {wh.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant={searchParams.get('lowStock') === 'true' ? 'default' : 'outline'}
              size="sm"
              onClick={() =>
                updateSearchParams({
                  lowStock: searchParams.get('lowStock') === 'true' ? undefined : 'true',
                })
              }
            >
              <AlertTriangle className="mr-1 h-4 w-4" />
              低庫存
            </Button>
          </div>
        </div>

        {/* 庫存列表 */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>商品編號</TableHead>
                <TableHead>商品名稱</TableHead>
                <TableHead>分類</TableHead>
                <TableHead>倉庫/門市</TableHead>
                <TableHead className="text-right">庫存數量</TableHead>
                <TableHead className="text-right">安全存量</TableHead>
                <TableHead className="w-[150px]">庫存狀態</TableHead>
                <TableHead className="w-[80px]">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    沒有找到庫存資料
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item) => {
                  const status = getStockStatus(item.quantity, item.product.safetyStock)
                  const percentage = getStockPercentage(item.quantity, item.product.safetyStock)

                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.product.sku}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.product.name}</div>
                          {item.product.barcode && (
                            <div className="text-xs text-muted-foreground">
                              {item.product.barcode}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{item.product.category.name}</TableCell>
                      <TableCell>{item.warehouse?.name || item.store?.name || '-'}</TableCell>
                      <TableCell className="text-right">
                        <div className="space-y-1">
                          <div className="font-medium">{item.quantity.toLocaleString()}</div>
                          {item.reservedQty > 0 && (
                            <div className="text-xs text-muted-foreground">
                              預留: {item.reservedQty}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {item.product.safetyStock.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <Badge variant={status.variant}>{status.label}</Badge>
                          <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className={`h-full transition-all ${getProgressColor(
                                percentage,
                                item.product.safetyStock,
                                item.quantity
                              )}`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" asChild>
                          <Link
                            href={`/inventory/adjustments/new?productId=${item.product.id}&warehouseId=${item.warehouse?.id || ''}`}
                          >
                            <ArrowRightLeft className="h-4 w-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
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
  )
}
