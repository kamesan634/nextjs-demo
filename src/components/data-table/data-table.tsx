'use client'

import { useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import type { SortDirection, PaginationInfo } from '@/types'

/**
 * 欄位定義類型
 */
export interface ColumnDef<T> {
  id: string
  header: string
  accessorKey?: keyof T
  cell?: (row: T) => React.ReactNode
  sortable?: boolean
  className?: string
}

interface DataTableProps<T> {
  columns: ColumnDef<T>[]
  data: T[]
  pagination?: PaginationInfo
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  onSort?: (field: string, direction: SortDirection) => void
  onSearch?: (search: string) => void
  searchPlaceholder?: string
  sortField?: string
  sortDirection?: SortDirection
  isLoading?: boolean
  emptyMessage?: string
  rowKey?: (row: T) => string
  onRowClick?: (row: T) => void
}

/**
 * 資料表格元件
 * 支援分頁、排序、搜尋功能
 */
export function DataTable<T extends object>({
  columns,
  data,
  pagination,
  onPageChange,
  onPageSizeChange,
  onSort,
  onSearch,
  searchPlaceholder = '搜尋...',
  sortField,
  sortDirection,
  isLoading = false,
  emptyMessage = '無資料',
  rowKey,
  onRowClick,
}: DataTableProps<T>) {
  const [searchValue, setSearchValue] = useState('')

  // 處理搜尋
  const handleSearch = (value: string) => {
    setSearchValue(value)
    onSearch?.(value)
  }

  // 清除搜尋
  const clearSearch = () => {
    setSearchValue('')
    onSearch?.('')
  }

  // 處理排序
  const handleSort = (field: string) => {
    if (!onSort) return

    let direction: SortDirection = 'asc'
    if (sortField === field) {
      direction = sortDirection === 'asc' ? 'desc' : 'asc'
    }
    onSort(field, direction)
  }

  // 取得排序圖示
  const getSortIcon = (field: string) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    )
  }

  // 取得儲存格值
  const getCellValue = (row: T, column: ColumnDef<T>): React.ReactNode => {
    if (column.cell) {
      return column.cell(row)
    }
    if (column.accessorKey) {
      return row[column.accessorKey] as React.ReactNode
    }
    return null
  }

  return (
    <div className="space-y-4">
      {/* 搜尋列 */}
      {onSearch && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchValue && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
              onClick={clearSearch}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      {/* 表格 */}
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={column.id}
                  className={cn(
                    column.sortable && onSort && 'cursor-pointer select-none',
                    column.className
                  )}
                  onClick={() => column.sortable && handleSort(column.id)}
                >
                  <div className="flex items-center">
                    {column.header}
                    {column.sortable && onSort && getSortIcon(column.id)}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  載入中...
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, index) => (
                <TableRow
                  key={rowKey ? rowKey(row) : index}
                  className={cn(onRowClick && 'cursor-pointer hover:bg-muted/50')}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((column) => (
                    <TableCell key={column.id} className={column.className}>
                      {getCellValue(row, column)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 分頁 */}
      {pagination && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            共 {pagination.total} 筆資料，第 {pagination.page} / {pagination.totalPages} 頁
          </div>
          <div className="flex items-center gap-2">
            {/* 每頁筆數選擇 */}
            {onPageSizeChange && (
              <Select
                value={pagination.pageSize.toString()}
                onValueChange={(value) => onPageSizeChange(parseInt(value))}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 筆</SelectItem>
                  <SelectItem value="20">20 筆</SelectItem>
                  <SelectItem value="50">50 筆</SelectItem>
                  <SelectItem value="100">100 筆</SelectItem>
                </SelectContent>
              </Select>
            )}

            {/* 分頁按鈕 */}
            {onPageChange && (
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onPageChange(1)}
                  disabled={!pagination.hasPrevPage}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onPageChange(pagination.page - 1)}
                  disabled={!pagination.hasPrevPage}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onPageChange(pagination.page + 1)}
                  disabled={!pagination.hasNextPage}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onPageChange(pagination.totalPages)}
                  disabled={!pagination.hasNextPage}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
