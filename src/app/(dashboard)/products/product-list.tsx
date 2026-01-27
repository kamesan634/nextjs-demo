'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Edit, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { deleteProduct } from '@/actions/products'
import { DataTable, type ColumnDef } from '@/components/data-table'
import { Button } from '@/components/ui/button'
import { ActiveBadge, DeleteDialog } from '@/components/forms'
import { formatCurrency } from '@/lib/utils'
import type { PaginationInfo } from '@/types'

interface Product {
  id: string
  sku: string
  barcode: string | null
  name: string
  costPrice: number
  listPrice: number
  sellingPrice: number
  isActive: boolean
  category: {
    id: string
    name: string
  }
  unit: {
    id: string
    name: string
  }
  totalStock: number
  safetyStock: number
}

interface ProductListProps {
  products: Product[]
  pagination: PaginationInfo
}

/**
 * 商品列表元件
 */
export function ProductList({ products, pagination }: ProductListProps) {
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
    const result = await deleteProduct(id)
    if (result.success) {
      toast.success(result.message)
      router.refresh()
    } else {
      toast.error(result.message)
    }
  }

  const columns: ColumnDef<Product>[] = [
    {
      id: 'sku',
      header: '商品編號',
      accessorKey: 'sku',
      sortable: true,
    },
    {
      id: 'name',
      header: '商品名稱',
      accessorKey: 'name',
      sortable: true,
    },
    {
      id: 'category',
      header: '分類',
      cell: (row) => row.category.name,
    },
    {
      id: 'costPrice',
      header: '成本價',
      cell: (row) => formatCurrency(row.costPrice),
      className: 'text-right',
    },
    {
      id: 'sellingPrice',
      header: '售價',
      cell: (row) => formatCurrency(row.sellingPrice),
      className: 'text-right',
    },
    {
      id: 'stock',
      header: '庫存',
      cell: (row) => (
        <span className={row.totalStock <= row.safetyStock ? 'font-medium text-destructive' : ''}>
          {row.totalStock} {row.unit.name}
        </span>
      ),
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
            <Link href={`/products/${row.id}`}>
              <Edit className="h-4 w-4" />
            </Link>
          </Button>
          <DeleteDialog
            title="確定要刪除此商品嗎？"
            description={`將刪除商品「${row.name}」，此操作無法復原。`}
            onConfirm={() => handleDelete(row.id)}
            trigger={
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                disabled={row.totalStock > 0}
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
    <DataTable<Product>
      columns={columns}
      data={products}
      pagination={pagination}
      onPageChange={handlePageChange}
      onSearch={handleSearch}
      searchPlaceholder="搜尋商品編號、名稱或條碼..."
      rowKey={(row) => row.id}
      emptyMessage="尚無商品資料"
    />
  )
}
