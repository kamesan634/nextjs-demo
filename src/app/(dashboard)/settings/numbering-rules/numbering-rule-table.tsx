'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Edit, Trash2, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { deleteNumberingRule, resetNumberingRuleSequence } from '@/actions/numbering-rules'
import { DataTable, type ColumnDef } from '@/components/data-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ActiveBadge, DeleteDialog } from '@/components/forms'
import type { PaginationInfo } from '@/types'

interface NumberingRule {
  id: string
  code: string
  name: string
  prefix: string
  dateFormat: string | null
  sequenceLength: number
  currentSequence: number
  resetPeriod: string | null
  lastResetAt: Date | null
  isActive: boolean
}

interface NumberingRuleTableProps {
  rules: NumberingRule[]
  pagination: PaginationInfo
}

const resetPeriodLabels: Record<string, string> = {
  DAILY: '每日',
  MONTHLY: '每月',
  YEARLY: '每年',
  NEVER: '不重設',
}

export function NumberingRuleTable({ rules, pagination }: NumberingRuleTableProps) {
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
    const result = await deleteNumberingRule(id)
    if (result.success) {
      toast.success(result.message)
      router.refresh()
    } else {
      toast.error(result.message)
    }
  }

  const handleReset = async (id: string) => {
    const result = await resetNumberingRuleSequence(id)
    if (result.success) {
      toast.success(result.message)
      router.refresh()
    } else {
      toast.error(result.message)
    }
  }

  const columns: ColumnDef<NumberingRule>[] = [
    {
      id: 'code',
      header: '規則代碼',
      accessorKey: 'code',
      sortable: true,
      cell: (row) => <code className="text-sm">{row.code}</code>,
    },
    {
      id: 'name',
      header: '規則名稱',
      accessorKey: 'name',
      sortable: true,
    },
    {
      id: 'format',
      header: '編號格式',
      cell: (row) => {
        const preview = `${row.prefix}${row.dateFormat ? `[${row.dateFormat}]` : ''}${'0'.repeat(row.sequenceLength)}`
        return <code className="text-sm">{preview}</code>
      },
    },
    {
      id: 'currentSequence',
      header: '目前序號',
      cell: (row) => row.currentSequence,
      className: 'text-center',
    },
    {
      id: 'resetPeriod',
      header: '重設週期',
      cell: (row) => (
        <Badge variant="outline">{resetPeriodLabels[row.resetPeriod || 'NEVER'] || '不重設'}</Badge>
      ),
    },
    {
      id: 'isActive',
      header: '狀態',
      cell: (row) => <ActiveBadge isActive={row.isActive} />,
    },
    {
      id: 'actions',
      header: '操作',
      className: 'w-[140px]',
      cell: (row) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" title="重設序號" onClick={() => handleReset(row.id)}>
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/settings/numbering-rules/${row.id}`}>
              <Edit className="h-4 w-4" />
            </Link>
          </Button>
          <DeleteDialog
            title="確定要刪除此編號規則嗎？"
            description={`將刪除編號規則「${row.name}」，此操作無法復原。`}
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
        </div>
      ),
    },
  ]

  return (
    <DataTable<NumberingRule>
      columns={columns}
      data={rules}
      pagination={pagination}
      onPageChange={handlePageChange}
      onSearch={handleSearch}
      searchPlaceholder="搜尋規則代碼或名稱..."
      rowKey={(row) => row.id}
      emptyMessage="尚無編號規則"
    />
  )
}
