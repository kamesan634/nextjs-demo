'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Edit, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { deleteProductBundle } from '@/actions/product-bundles'
import { DataTable, type ColumnDef } from '@/components/data-table'
import { Button } from '@/components/ui/button'
import { ActiveBadge, DeleteDialog } from '@/components/forms'
import type { PaginationInfo } from '@/types'
import type { Decimal } from '@prisma/client/runtime/library'

interface BundleItem {
  id: string
  quantity: number
  product: {
    id: string
    name: string
    sku: string
    sellingPrice: Decimal
  }
}

interface Bundle {
  id: string
  code: string
  name: string
  description: string | null
  bundlePrice: Decimal
  isActive: boolean
  startDate: Date | null
  endDate: Date | null
  items: BundleItem[]
}

interface BundleTableProps {
  bundles: Bundle[]
  pagination: PaginationInfo
}

export function BundleTable({ bundles, pagination }: BundleTableProps) {
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
    const result = await deleteProductBundle(id)
    if (result.success) {
      toast.success(result.message)
      router.refresh()
    } else {
      toast.error(result.message)
    }
  }

  const columns: ColumnDef<Bundle>[] = [
    {
      id: 'code',
      header: '組合代碼',
      accessorKey: 'code',
      sortable: true,
    },
    {
      id: 'name',
      header: '組合名稱',
      accessorKey: 'name',
      sortable: true,
    },
    {
      id: 'itemCount',
      header: '商品數',
      cell: (row) => row.items.length,
      className: 'text-center',
    },
    {
      id: 'originalPrice',
      header: '原價合計',
      cell: (row) => {
        const total = row.items.reduce(
          (sum, item) => sum + Number(item.product.sellingPrice) * item.quantity,
          0
        )
        return `$${total.toLocaleString()}`
      },
      className: 'text-right',
    },
    {
      id: 'bundlePrice',
      header: '組合價',
      cell: (row) => `$${Number(row.bundlePrice).toLocaleString()}`,
      className: 'text-right',
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
            <Link href={`/products/bundles/${row.id}`}>
              <Edit className="h-4 w-4" />
            </Link>
          </Button>
          <DeleteDialog
            title="確定要刪除此組合嗎？"
            description={`將刪除商品組合「${row.name}」，此操作無法復原。`}
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
    <DataTable<Bundle>
      columns={columns}
      data={bundles}
      pagination={pagination}
      onPageChange={handlePageChange}
      onSearch={handleSearch}
      searchPlaceholder="搜尋組合代碼或名稱..."
      rowKey={(row) => row.id}
      emptyMessage="尚無商品組合"
    />
  )
}
