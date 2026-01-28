'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Edit, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { deleteSystemParameter } from '@/actions/system-parameters'
import { DataTable, type ColumnDef } from '@/components/data-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DeleteDialog } from '@/components/forms'
import type { PaginationInfo } from '@/types'
import { parameterCategories, type ParameterCategory } from '@/lib/validations/system-parameters'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface SystemParameter {
  id: string
  code: string
  name: string
  value: string
  dataType: string
  category: string
  description: string | null
  isEditable: boolean
}

interface ParameterTableProps {
  parameters: SystemParameter[]
  pagination: PaginationInfo
}

const categoryLabels: Record<string, string> = {
  COMPANY: '公司設定',
  TAX: '稅務設定',
  INVENTORY: '庫存設定',
  SALES: '銷售設定',
  SECURITY: '安全設定',
}

const dataTypeLabels: Record<string, string> = {
  STRING: '文字',
  NUMBER: '數字',
  BOOLEAN: '布林',
  JSON: 'JSON',
}

export function ParameterTable({ parameters, pagination }: ParameterTableProps) {
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

  const handleCategoryChange = (category: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (category && category !== 'all') {
      params.set('category', category)
    } else {
      params.delete('category')
    }
    params.set('page', '1')
    router.push(`?${params.toString()}`)
  }

  const handleDelete = async (id: string) => {
    const result = await deleteSystemParameter(id)
    if (result.success) {
      toast.success(result.message)
      router.refresh()
    } else {
      toast.error(result.message)
    }
  }

  const columns: ColumnDef<SystemParameter>[] = [
    {
      id: 'code',
      header: '參數代碼',
      accessorKey: 'code',
      sortable: true,
      cell: (row) => <code className="text-sm">{row.code}</code>,
    },
    {
      id: 'name',
      header: '參數名稱',
      accessorKey: 'name',
      sortable: true,
    },
    {
      id: 'value',
      header: '參數值',
      cell: (row) => (
        <span className="max-w-[200px] truncate block" title={row.value}>
          {row.value}
        </span>
      ),
    },
    {
      id: 'dataType',
      header: '資料類型',
      cell: (row) => (
        <Badge variant="outline">{dataTypeLabels[row.dataType] || row.dataType}</Badge>
      ),
    },
    {
      id: 'category',
      header: '分類',
      cell: (row) => (
        <Badge variant="secondary">{categoryLabels[row.category] || row.category}</Badge>
      ),
    },
    {
      id: 'isEditable',
      header: '可編輯',
      cell: (row) =>
        row.isEditable ? (
          <Badge variant="default">是</Badge>
        ) : (
          <Badge variant="destructive">否</Badge>
        ),
    },
    {
      id: 'actions',
      header: '操作',
      className: 'w-[100px]',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/settings/parameters/${row.id}`}>
              <Edit className="h-4 w-4" />
            </Link>
          </Button>
          <DeleteDialog
            title="確定要刪除此參數嗎？"
            description={`將刪除參數「${row.name}」，此操作無法復原。`}
            onConfirm={() => handleDelete(row.id)}
            trigger={
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                disabled={!row.isEditable}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            }
          />
        </div>
      ),
    },
  ]

  const currentCategory = searchParams.get('category') || 'all'

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Select value={currentCategory} onValueChange={handleCategoryChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="選擇分類" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部分類</SelectItem>
            {parameterCategories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {categoryLabels[cat]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable<SystemParameter>
        columns={columns}
        data={parameters}
        pagination={pagination}
        onPageChange={handlePageChange}
        onSearch={handleSearch}
        searchPlaceholder="搜尋參數代碼或名稱..."
        rowKey={(row) => row.id}
        emptyMessage="尚無系統參數"
      />
    </div>
  )
}
