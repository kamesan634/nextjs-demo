'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Eye } from 'lucide-react'
import Link from 'next/link'
import { DataTable, type ColumnDef } from '@/components/data-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { PaginationInfo } from '@/types'

export interface ShiftListItem {
  id: string
  shiftNo: string
  startTime: Date
  endTime: Date | null
  openingCash: number
  closingCash: number | null
  salesTotal: number
  salesCount: number
  difference: number | null
  status: string
  user: {
    id: string
    username: string
    name: string | null
  }
  store: {
    id: string
    name: string
  }
}

interface ShiftTableProps {
  shifts: ShiftListItem[]
  pagination: PaginationInfo
}

const statusMap: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  OPEN: { label: '開啟中', variant: 'default' },
  CLOSED: { label: '已結束', variant: 'secondary' },
}

/**
 * 班別列表元件
 */
export function ShiftTable({ shifts, pagination }: ShiftTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', page.toString())
    router.push(`?${params.toString()}`)
  }

  const handleSearch = (search: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (search) {
      params.set('search', search)
    } else {
      params.delete('search')
    }
    params.set('page', '1')
    router.push(`?${params.toString()}`)
  }

  const columns: ColumnDef<ShiftListItem>[] = [
    {
      id: 'shiftNo',
      header: '班別編號',
      accessorKey: 'shiftNo',
      sortable: true,
    },
    {
      id: 'user',
      header: '收銀員',
      cell: (row) => row.user.name || row.user.username,
    },
    {
      id: 'store',
      header: '門市',
      cell: (row) => row.store.name,
    },
    {
      id: 'shiftDate',
      header: '班別日期',
      cell: (row) => new Date(row.startTime).toLocaleDateString('zh-TW'),
      sortable: true,
    },
    {
      id: 'openingCash',
      header: '期初現金',
      cell: (row) => `NT$ ${row.openingCash.toLocaleString()}`,
      className: 'text-right',
    },
    {
      id: 'closingCash',
      header: '期末現金',
      cell: (row) => (row.closingCash !== null ? `NT$ ${row.closingCash.toLocaleString()}` : '-'),
      className: 'text-right',
    },
    {
      id: 'salesTotal',
      header: '銷售總額',
      cell: (row) => `NT$ ${Number(row.salesTotal).toLocaleString()}`,
      className: 'text-right',
    },
    {
      id: 'difference',
      header: '差異',
      cell: (row) => {
        if (row.difference === null) return '-'
        const diff = Number(row.difference)
        const color = diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : ''
        return <span className={color}>NT$ {diff.toLocaleString()}</span>
      },
      className: 'text-right',
    },
    {
      id: 'status',
      header: '狀態',
      cell: (row) => {
        const status = statusMap[row.status] || { label: row.status, variant: 'outline' as const }
        return <Badge variant={status.variant}>{status.label}</Badge>
      },
    },
    {
      id: 'actions',
      header: '操作',
      className: 'w-[80px]',
      cell: (row) => (
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/pos/shifts/${row.id}`}>
            <Eye className="h-4 w-4" />
          </Link>
        </Button>
      ),
    },
  ]

  return (
    <DataTable<ShiftListItem>
      columns={columns}
      data={shifts}
      pagination={pagination}
      onPageChange={handlePageChange}
      onSearch={handleSearch}
      searchPlaceholder="搜尋班別編號..."
      rowKey={(row) => row.id}
      emptyMessage="尚無班別資料"
    />
  )
}
