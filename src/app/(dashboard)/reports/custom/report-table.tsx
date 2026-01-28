'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, Trash2, Calendar, Globe, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { DataTable, type ColumnDef } from '@/components/data-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DeleteDialog } from '@/components/ui/delete-dialog'
import { deleteCustomReport } from '@/actions/custom-reports'

interface Report {
  id: string
  name: string
  description: string | null
  queryDefinition: unknown
  chartConfig: unknown
  isPublic: boolean
  createdAt: Date
  updatedAt: Date
  user: { id: string; name: string | null }
  _count: { schedules: number }
}

interface ReportTableProps {
  reports: Report[]
  pagination: {
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
}

export function ReportTable({ reports, pagination }: ReportTableProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!deleteId) return

    startTransition(async () => {
      const result = await deleteCustomReport(deleteId)
      if (result.success) {
        toast.success(result.message)
        setDeleteId(null)
        router.refresh()
      } else {
        toast.error(result.message)
      }
    })
  }

  const columns: ColumnDef<Report>[] = [
    {
      id: 'name',
      accessorKey: 'name',
      header: '報表名稱',
      cell: (row) => (
        <div>
          <div className="font-medium">{row.name}</div>
          {row.description && (
            <div className="text-sm text-muted-foreground">{row.description}</div>
          )}
        </div>
      ),
    },
    {
      id: 'user',
      header: '建立者',
      cell: (row) => row.user?.name || '-',
    },
    {
      id: 'isPublic',
      accessorKey: 'isPublic',
      header: '公開狀態',
      cell: (row) =>
        row.isPublic ? (
          <Badge variant="outline">
            <Globe className="mr-1 h-3 w-3" />
            公開
          </Badge>
        ) : (
          <Badge variant="secondary">
            <Lock className="mr-1 h-3 w-3" />
            私人
          </Badge>
        ),
    },
    {
      id: 'schedules',
      header: '排程數',
      cell: (row) =>
        row._count.schedules > 0 ? (
          <Badge variant="outline">
            <Calendar className="mr-1 h-3 w-3" />
            {row._count.schedules}
          </Badge>
        ) : (
          '-'
        ),
    },
    {
      id: 'updatedAt',
      accessorKey: 'updatedAt',
      header: '更新時間',
      cell: (row) =>
        new Date(row.updatedAt).toLocaleDateString('zh-TW', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }),
    },
    {
      id: 'actions',
      header: '操作',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/reports/custom/${row.id}`}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setDeleteId(row.id)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <>
      <DataTable
        columns={columns}
        data={reports}
        rowKey={(row) => row.id}
        emptyMessage="尚無自訂報表"
      />

      <DeleteDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDelete}
        title="刪除報表"
        description="確定要刪除此報表嗎？此操作無法復原。"
      />
    </>
  )
}
