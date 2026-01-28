'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Edit, CheckCircle, XCircle } from 'lucide-react'
import { DataTable, type ColumnDef } from '@/components/data-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { PaginationInfo } from '@/types'
import { completeGoodsIssue, cancelGoodsIssue } from '@/actions/goods-issues'
import { toast } from 'sonner'

interface GoodsIssue {
  id: string
  issueNo: string
  warehouse: { id: string; name: string }
  type: string
  status: string
  issueDate: Date
  items: Array<{ id: string; quantity: number }>
}

interface IssueTableProps {
  data: GoodsIssue[]
  pagination: PaginationInfo
}

const issueTypeMap: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'destructive' }
> = {
  SALES: { label: '銷售出庫', variant: 'default' },
  DAMAGE: { label: '損耗出庫', variant: 'destructive' },
  OTHER: { label: '其他出庫', variant: 'secondary' },
}

const issueStatusMap: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  PENDING: { label: '待處理', variant: 'outline' },
  COMPLETED: { label: '已完成', variant: 'default' },
  CANCELLED: { label: '已取消', variant: 'destructive' },
}

export function IssueTable({ data, pagination }: IssueTableProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const handleComplete = async (id: string) => {
    if (!confirm('確定要完成此出庫單？此操作將扣減庫存。')) return

    setLoading(id)
    const result = await completeGoodsIssue(id)
    setLoading(null)

    if (result.success) {
      toast.success(result.message)
      router.refresh()
    } else {
      toast.error(result.message)
    }
  }

  const handleCancel = async (id: string) => {
    if (!confirm('確定要取消此出庫單？')) return

    setLoading(id)
    const result = await cancelGoodsIssue(id)
    setLoading(null)

    if (result.success) {
      toast.success(result.message)
      router.refresh()
    } else {
      toast.error(result.message)
    }
  }

  const columns: ColumnDef<GoodsIssue>[] = [
    {
      id: 'issueNo',
      accessorKey: 'issueNo',
      header: '出庫單號',
      cell: (row) => (
        <Link
          href={`/inventory/issues/${row.id}`}
          className="font-medium text-primary hover:underline"
        >
          {row.issueNo}
        </Link>
      ),
    },
    {
      id: 'warehouse',
      header: '倉庫',
      cell: (row) => row.warehouse.name,
    },
    {
      id: 'type',
      accessorKey: 'type',
      header: '出庫類型',
      cell: (row) => {
        const type = issueTypeMap[row.type]
        return <Badge variant={type.variant}>{type.label}</Badge>
      },
    },
    {
      id: 'status',
      accessorKey: 'status',
      header: '狀態',
      cell: (row) => {
        const status = issueStatusMap[row.status]
        return <Badge variant={status.variant}>{status.label}</Badge>
      },
    },
    {
      id: 'issueDate',
      accessorKey: 'issueDate',
      header: '出庫日期',
      cell: (row) => new Date(row.issueDate).toLocaleDateString('zh-TW'),
    },
    {
      id: 'itemsCount',
      header: '項目數',
      cell: (row) => row.items.length,
    },
    {
      id: 'actions',
      header: '操作',
      cell: (row) => {
        const isPending = row.status === 'PENDING'
        const isLoading = loading === row.id

        return (
          <div className="flex items-center gap-2">
            {isPending && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleComplete(row.id)}
                  disabled={isLoading}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  完成
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCancel(row.id)}
                  disabled={isLoading}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  取消
                </Button>
              </>
            )}
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/inventory/issues/${row.id}`}>
                <Edit className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        )
      },
    },
  ]

  return <DataTable columns={columns} data={data} pagination={pagination} />
}
