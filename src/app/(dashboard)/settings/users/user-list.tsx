'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Edit, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { deleteUser } from '@/actions/users'
import { DataTable, type ColumnDef } from '@/components/data-table'
import { Button } from '@/components/ui/button'
import { ActiveBadge, DeleteDialog } from '@/components/forms'
import { formatDateTime } from '@/lib/utils'
import type { PaginationInfo } from '@/types'

interface User {
  id: string
  username: string
  email: string
  name: string
  phone: string | null
  isActive: boolean
  lastLoginAt: Date | null
  createdAt: Date
  role: {
    id: string
    name: string
  }
  store: {
    id: string
    name: string
  } | null
}

interface UserListProps {
  users: User[]
  pagination: PaginationInfo
}

/**
 * 使用者列表元件
 */
export function UserList({ users, pagination }: UserListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // 處理分頁變更
  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', page.toString())
    router.push(`?${params.toString()}`)
  }

  // 處理搜尋
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

  // 處理刪除
  const handleDelete = async (id: string) => {
    const result = await deleteUser(id)
    if (result.success) {
      toast.success(result.message)
      router.refresh()
    } else {
      toast.error(result.message)
    }
  }

  // 欄位定義
  const columns: ColumnDef<User>[] = [
    {
      id: 'username',
      header: '帳號',
      accessorKey: 'username',
      sortable: true,
    },
    {
      id: 'name',
      header: '姓名',
      accessorKey: 'name',
      sortable: true,
    },
    {
      id: 'email',
      header: '電子郵件',
      accessorKey: 'email',
    },
    {
      id: 'role',
      header: '角色',
      cell: (row) => row.role.name,
    },
    {
      id: 'store',
      header: '所屬門市',
      cell: (row) => row.store?.name || '-',
    },
    {
      id: 'isActive',
      header: '狀態',
      cell: (row) => <ActiveBadge isActive={row.isActive} />,
    },
    {
      id: 'lastLoginAt',
      header: '最後登入',
      cell: (row) => (row.lastLoginAt ? formatDateTime(row.lastLoginAt) : '-'),
    },
    {
      id: 'actions',
      header: '操作',
      className: 'w-[100px]',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/settings/users/${row.id}`}>
              <Edit className="h-4 w-4" />
            </Link>
          </Button>
          <DeleteDialog
            title="確定要刪除此使用者嗎？"
            description={`將刪除使用者「${row.name}」，此操作無法復原。`}
            onConfirm={() => handleDelete(row.id)}
            trigger={
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                disabled={row.username === 'admin'}
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
    <DataTable<User>
      columns={columns}
      data={users}
      pagination={pagination}
      onPageChange={handlePageChange}
      onSearch={handleSearch}
      searchPlaceholder="搜尋帳號、姓名或電子郵件..."
      rowKey={(row) => row.id}
      emptyMessage="尚無使用者資料"
    />
  )
}
