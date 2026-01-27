'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Edit, Trash2, Star } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { deleteWarehouse } from '@/actions/warehouses'
import { DataTable, type ColumnDef } from '@/components/data-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ActiveBadge, DeleteDialog } from '@/components/forms'
import type { PaginationInfo } from '@/types'

interface Warehouse {
  id: string
  code: string
  name: string
  address: string | null
  phone: string | null
  manager: string | null
  isActive: boolean
  isDefault: boolean
  _count: {
    inventories: number
  }
}

interface WarehouseListProps {
  warehouses: Warehouse[]
  pagination: PaginationInfo
}

/**
 * 倉庫列表元件
 */
export function WarehouseList({ warehouses, pagination }: WarehouseListProps) {
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
    const result = await deleteWarehouse(id)
    if (result.success) {
      toast.success(result.message)
      router.refresh()
    } else {
      toast.error(result.message)
    }
  }

  const columns: ColumnDef<Warehouse>[] = [
    {
      id: 'code',
      header: '倉庫代碼',
      cell: (row) => (
        <div className="flex items-center gap-2">
          {row.code}
          {row.isDefault && (
            <Badge variant="secondary" className="gap-1">
              <Star className="h-3 w-3" />
              預設
            </Badge>
          )}
        </div>
      ),
      sortable: true,
    },
    {
      id: 'name',
      header: '倉庫名稱',
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
      header: '倉管人員',
      cell: (row) => row.manager || '-',
    },
    {
      id: 'inventories',
      header: '庫存品項',
      cell: (row) => row._count.inventories,
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
            <Link href={`/settings/warehouses/${row.id}`}>
              <Edit className="h-4 w-4" />
            </Link>
          </Button>
          <DeleteDialog
            title="確定要刪除此倉庫嗎？"
            description={`將刪除倉庫「${row.name}」，此操作無法復原。`}
            onConfirm={() => handleDelete(row.id)}
            trigger={
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                disabled={row.isDefault || row._count.inventories > 0}
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
    <DataTable<Warehouse>
      columns={columns}
      data={warehouses}
      pagination={pagination}
      onPageChange={handlePageChange}
      onSearch={handleSearch}
      searchPlaceholder="搜尋倉庫代碼或名稱..."
      rowKey={(row) => row.id}
      emptyMessage="尚無倉庫資料"
    />
  )
}
