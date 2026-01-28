'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { deleteRefund } from '@/actions/refunds'
import { DataTable, type ColumnDef } from '@/components/data-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DeleteDialog } from '@/components/forms'
import type { PaginationInfo } from '@/types'

export interface RefundListItem {
  id: string
  refundNo: string
  type: string
  reason: string
  subtotal: number
  refundAmount: number
  status: string
  createdAt: Date
  order: {
    id: string
    orderNo: string
    customer: {
      id: string
      name: string
    } | null
  }
}

interface RefundTableProps {
  refunds: RefundListItem[]
  pagination: PaginationInfo
}

const statusMap: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  PENDING: { label: '待處理', variant: 'outline' },
  APPROVED: { label: '已核准', variant: 'default' },
  COMPLETED: { label: '已完成', variant: 'secondary' },
  REJECTED: { label: '已駁回', variant: 'destructive' },
}

const typeMap: Record<string, { label: string; variant: 'default' | 'secondary' }> = {
  REFUND: { label: '退貨', variant: 'default' },
  EXCHANGE: { label: '換貨', variant: 'secondary' },
}

/**
 * 退換貨列表元件
 */
export function RefundTable({ refunds, pagination }: RefundTableProps) {
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

  const handleDelete = async (id: string) => {
    const result = await deleteRefund(id)
    if (result.success) {
      toast.success(result.message)
      router.refresh()
    } else {
      toast.error(result.message)
    }
  }

  const columns: ColumnDef<RefundListItem>[] = [
    {
      id: 'refundNo',
      header: '退貨單號',
      accessorKey: 'refundNo',
      sortable: true,
    },
    {
      id: 'orderNo',
      header: '原訂單',
      cell: (row) => (
        <Link href={`/orders/${row.order.id}`} className="text-blue-600 hover:underline">
          {row.order.orderNo}
        </Link>
      ),
    },
    {
      id: 'customer',
      header: '客戶',
      cell: (row) => row.order.customer?.name || '-',
    },
    {
      id: 'type',
      header: '類型',
      cell: (row) => {
        const type = typeMap[row.type] || { label: row.type, variant: 'default' as const }
        return <Badge variant={type.variant}>{type.label}</Badge>
      },
    },
    {
      id: 'reason',
      header: '退貨原因',
      cell: (row) => (
        <div className="max-w-[200px] truncate" title={row.reason}>
          {row.reason}
        </div>
      ),
    },
    {
      id: 'subtotal',
      header: '退貨小計',
      cell: (row) => `NT$ ${Number(row.subtotal).toLocaleString()}`,
      className: 'text-right',
    },
    {
      id: 'refundAmount',
      header: '退款金額',
      cell: (row) => `NT$ ${Number(row.refundAmount).toLocaleString()}`,
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
      id: 'createdAt',
      header: '退貨日期',
      cell: (row) => new Date(row.createdAt).toLocaleDateString('zh-TW'),
      sortable: true,
    },
    {
      id: 'actions',
      header: '操作',
      className: 'w-[100px]',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/orders/refunds/${row.id}`}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
          {row.status === 'PENDING' && (
            <DeleteDialog
              title="確定要刪除此退貨單嗎？"
              description={`將刪除退貨單「${row.refundNo}」，此操作無法復原。`}
              onConfirm={() => handleDelete(row.id)}
              trigger={
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              }
            />
          )}
        </div>
      ),
    },
  ]

  return (
    <DataTable<RefundListItem>
      columns={columns}
      data={refunds}
      pagination={pagination}
      onPageChange={handlePageChange}
      onSearch={handleSearch}
      searchPlaceholder="搜尋退貨單號或訂單編號..."
      rowKey={(row) => row.id}
      emptyMessage="尚無退換貨資料"
    />
  )
}
