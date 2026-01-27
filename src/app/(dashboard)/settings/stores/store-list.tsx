'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Edit, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { deleteStore } from '@/actions/stores'
import { DataTable, type ColumnDef } from '@/components/data-table'
import { Button } from '@/components/ui/button'
import { ActiveBadge, DeleteDialog } from '@/components/forms'
import type { PaginationInfo } from '@/types'

interface Store {
  id: string
  code: string
  name: string
  address: string | null
  phone: string | null
  manager: string | null
  openTime: string | null
  closeTime: string | null
  isActive: boolean
  _count: {
    users: number
    orders: number
  }
}

interface StoreListProps {
  stores: Store[]
  pagination: PaginationInfo
}

/**
 * 門市列表元件
 */
export function StoreList({ stores, pagination }: StoreListProps) {
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
    const result = await deleteStore(id)
    if (result.success) {
      toast.success(result.message)
      router.refresh()
    } else {
      toast.error(result.message)
    }
  }

  const columns: ColumnDef<Store>[] = [
    {
      id: 'code',
      header: '門市代碼',
      accessorKey: 'code',
      sortable: true,
    },
    {
      id: 'name',
      header: '門市名稱',
      accessorKey: 'name',
      sortable: true,
    },
    {
      id: 'address',
      header: '地址',
      cell: (row) => row.address || '-',
    },
    {
      id: 'phone',
      header: '電話',
      cell: (row) => row.phone || '-',
    },
    {
      id: 'manager',
      header: '店長',
      cell: (row) => row.manager || '-',
    },
    {
      id: 'hours',
      header: '營業時間',
      cell: (row) => (row.openTime && row.closeTime ? `${row.openTime} - ${row.closeTime}` : '-'),
    },
    {
      id: 'users',
      header: '員工數',
      cell: (row) => row._count.users,
      className: 'text-center',
    },
    {
      id: 'isActive',
      header: '狀態',
      cell: (row) => <ActiveBadge isActive={row.isActive} />,
    },
    {
      id: 'actions',
      header: '操作',
      className: 'w-[100px]',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/settings/stores/${row.id}`}>
              <Edit className="h-4 w-4" />
            </Link>
          </Button>
          <DeleteDialog
            title="確定要刪除此門市嗎？"
            description={`將刪除門市「${row.name}」，此操作無法復原。`}
            onConfirm={() => handleDelete(row.id)}
            trigger={
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                disabled={row._count.users > 0 || row._count.orders > 0}
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
    <DataTable<Store>
      columns={columns}
      data={stores}
      pagination={pagination}
      onPageChange={handlePageChange}
      onSearch={handleSearch}
      searchPlaceholder="搜尋門市代碼或名稱..."
      rowKey={(row) => row.id}
      emptyMessage="尚無門市資料"
    />
  )
}
