'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Play, Pause, Mail, FileSpreadsheet, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { DataTable, type ColumnDef } from '@/components/data-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DeleteDialog } from '@/components/ui/delete-dialog'
import { deleteScheduledReport, toggleScheduledReport } from '@/actions/scheduled-reports'
import { parseCronToReadable } from '@/lib/cron-utils'

interface Schedule {
  id: string
  reportId: string
  schedule: string
  recipients: unknown
  format: string
  lastRunAt: Date | null
  nextRunAt: Date | null
  isActive: boolean
  createdAt: Date
  report: { id: string; name: string }
}

interface ScheduleTableProps {
  schedules: Schedule[]
  pagination: {
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
}

export function ScheduleTable({ schedules }: ScheduleTableProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!deleteId) return

    startTransition(async () => {
      const result = await deleteScheduledReport(deleteId)
      if (result.success) {
        toast.success(result.message)
        setDeleteId(null)
        router.refresh()
      } else {
        toast.error(result.message)
      }
    })
  }

  const handleToggle = (id: string) => {
    startTransition(async () => {
      const result = await toggleScheduledReport(id)
      if (result.success) {
        toast.success(result.message)
        router.refresh()
      } else {
        toast.error(result.message)
      }
    })
  }

  const columns: ColumnDef<Schedule>[] = [
    {
      id: 'reportName',
      header: '報表名稱',
      cell: (row) => <span className="font-medium">{row.report.name}</span>,
    },
    {
      id: 'schedule',
      accessorKey: 'schedule',
      header: '執行頻率',
      cell: (row) => parseCronToReadable(row.schedule),
    },
    {
      id: 'format',
      accessorKey: 'format',
      header: '格式',
      cell: (row) =>
        row.format === 'EXCEL' ? (
          <Badge variant="outline">
            <FileSpreadsheet className="mr-1 h-3 w-3" />
            Excel
          </Badge>
        ) : (
          <Badge variant="outline">
            <FileText className="mr-1 h-3 w-3" />
            PDF
          </Badge>
        ),
    },
    {
      id: 'recipients',
      header: '收件者',
      cell: (row) => {
        const recipients = row.recipients as string[]
        return (
          <div className="flex items-center">
            <Mail className="mr-1 h-4 w-4 text-muted-foreground" />
            <span>{recipients?.length || 0} 人</span>
          </div>
        )
      },
    },
    {
      id: 'nextRunAt',
      accessorKey: 'nextRunAt',
      header: '下次執行',
      cell: (row) =>
        row.nextRunAt
          ? new Date(row.nextRunAt).toLocaleString('zh-TW', {
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })
          : '-',
    },
    {
      id: 'lastRunAt',
      accessorKey: 'lastRunAt',
      header: '上次執行',
      cell: (row) =>
        row.lastRunAt
          ? new Date(row.lastRunAt).toLocaleString('zh-TW', {
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })
          : '-',
    },
    {
      id: 'isActive',
      accessorKey: 'isActive',
      header: '狀態',
      cell: (row) =>
        row.isActive ? (
          <Badge variant="default">啟用中</Badge>
        ) : (
          <Badge variant="secondary">已停用</Badge>
        ),
    },
    {
      id: 'actions',
      header: '操作',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleToggle(row.id)}
            disabled={isPending}
          >
            {row.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
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
        data={schedules}
        rowKey={(row) => row.id}
        emptyMessage="尚無排程報表"
      />

      <DeleteDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDelete}
        title="刪除排程"
        description="確定要刪除此排程嗎？此操作無法復原。"
      />
    </>
  )
}
