'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, XCircle } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { voidHoldOrder } from '@/actions/hold-orders'
import { DataTable, type ColumnDef } from '@/components/data-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DeleteDialog } from '@/components/forms'
import type { PaginationInfo } from '@/types'

export interface HoldOrderListItem {
  id: string
  holdNo: string
  status: string
  totalAmount: number
  createdAt: Date
  reason: string | null
  user: {
    id: string
    username: string
    name: string | null
  }
  store: {
    id: string
    name: string
  }
  customer?: {
    id: string
    name: string
  } | null
}

interface HoldOrderTableProps {
  holdOrders: HoldOrderListItem[]
  pagination: PaginationInfo
}

const statusMap: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  HOLD: { label: '掛單中', variant: 'default' },
  RESUMED: { label: '已恢復', variant: 'secondary' },
  EXPIRED: { label: '已過期', variant: 'destructive' },
  VOIDED: { label: '已作廢', variant: 'outline' },
}

/**
 * 掛單列表元件
 */
export function HoldOrderTable({ holdOrders, pagination }: HoldOrderTableProps) {
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

  const handleVoid = async (id: string) => {
    const result = await voidHoldOrder(id)
    if (result.success) {
      toast.success(result.message)
      router.refresh()
    } else {
      toast.error(result.message)
    }
  }

  const columns: ColumnDef<HoldOrderListItem>[] = [
    {
      id: 'holdNo',
      header: '掛單編號',
      accessorKey: 'holdNo',
      sortable: true,
    },
    {
      id: 'store',
      header: '門市',
      cell: (row) => row.store.name,
    },
    {
      id: 'user',
      header: '操作員',
      cell: (row) => row.user.name || row.user.username,
    },
    {
      id: 'customer',
      header: '客戶',
      cell: (row) => row.customer?.name || '-',
    },
    {
      id: 'totalAmount',
      header: '金額',
      cell: (row) => `NT$ ${row.totalAmount.toLocaleString()}`,
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
      header: '掛單時間',
      cell: (row) => new Date(row.createdAt).toLocaleString('zh-TW'),
      sortable: true,
    },
    {
      id: 'actions',
      header: '操作',
      className: 'w-[100px]',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/pos/hold-orders/${row.id}`}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
          {row.status === 'HOLD' && (
            <DeleteDialog
              title="確定要作廢此掛單嗎？"
              description={`將作廢掛單「${row.holdNo}」，此操作無法復原。`}
              onConfirm={() => handleVoid(row.id)}
              trigger={
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              }
            />
          )}
        </div>
      ),
    },
  ]

  return (
    <DataTable<HoldOrderListItem>
      columns={columns}
      data={holdOrders}
      pagination={pagination}
      onPageChange={handlePageChange}
      onSearch={handleSearch}
      searchPlaceholder="搜尋掛單編號..."
      rowKey={(row) => row.id}
      emptyMessage="尚無掛單資料"
    />
  )
}
