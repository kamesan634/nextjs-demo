'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import { DataTable, type ColumnDef } from '@/components/data-table'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { PaginationInfo } from '@/types'

interface AuditLog {
  id: string
  userId: string
  action: string
  module: string
  targetId: string | null
  targetType: string | null
  description: string | null
  ipAddress: string | null
  createdAt: Date
  user: {
    id: string
    name: string
    username: string
  }
}

interface AuditLogTableProps {
  logs: AuditLog[]
  pagination: PaginationInfo
}

const actionLabels: Record<string, string> = {
  CREATE: '建立',
  UPDATE: '更新',
  DELETE: '刪除',
  LOGIN: '登入',
  LOGOUT: '登出',
  VIEW: '檢視',
  EXPORT: '匯出',
}

const actionColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  CREATE: 'default',
  UPDATE: 'secondary',
  DELETE: 'destructive',
  LOGIN: 'outline',
  LOGOUT: 'outline',
  VIEW: 'outline',
  EXPORT: 'secondary',
}

const moduleLabels: Record<string, string> = {
  auth: '認證',
  products: '商品',
  categories: '分類',
  customers: '客戶',
  suppliers: '供應商',
  inventory: '庫存',
  orders: '訂單',
  'purchase-orders': '採購',
  reports: '報表',
  promotions: '促銷',
  settings: '設定',
  pos: 'POS',
}

export function AuditLogTable({ logs, pagination }: AuditLogTableProps) {
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

  const handleActionFilter = (action: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (action && action !== 'all') {
      params.set('action', action)
    } else {
      params.delete('action')
    }
    params.set('page', '1')
    router.push(`?${params.toString()}`)
  }

  const handleModuleFilter = (module: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (module && module !== 'all') {
      params.set('module', module)
    } else {
      params.delete('module')
    }
    params.set('page', '1')
    router.push(`?${params.toString()}`)
  }

  const columns: ColumnDef<AuditLog>[] = [
    {
      id: 'createdAt',
      header: '時間',
      cell: (row) => format(new Date(row.createdAt), 'yyyy/MM/dd HH:mm:ss', { locale: zhTW }),
    },
    {
      id: 'user',
      header: '操作者',
      cell: (row) => row.user.name,
    },
    {
      id: 'action',
      header: '操作類型',
      cell: (row) => (
        <Badge variant={actionColors[row.action] || 'outline'}>
          {actionLabels[row.action] || row.action}
        </Badge>
      ),
    },
    {
      id: 'module',
      header: '模組',
      cell: (row) => <Badge variant="outline">{moduleLabels[row.module] || row.module}</Badge>,
    },
    {
      id: 'description',
      header: '描述',
      cell: (row) => row.description || '-',
    },
    {
      id: 'targetType',
      header: '對象類型',
      cell: (row) => row.targetType || '-',
    },
    {
      id: 'ipAddress',
      header: 'IP 位址',
      cell: (row) => row.ipAddress || '-',
    },
  ]

  const currentAction = searchParams.get('action') || 'all'
  const currentModule = searchParams.get('module') || 'all'

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Select value={currentAction} onValueChange={handleActionFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="操作類型" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部操作</SelectItem>
            {Object.entries(actionLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={currentModule} onValueChange={handleModuleFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="模組" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部模組</SelectItem>
            {Object.entries(moduleLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable<AuditLog>
        columns={columns}
        data={logs}
        pagination={pagination}
        onPageChange={handlePageChange}
        onSearch={handleSearch}
        searchPlaceholder="搜尋操作描述或操作者..."
        rowKey={(row) => row.id}
        emptyMessage="尚無操作日誌"
      />
    </div>
  )
}
