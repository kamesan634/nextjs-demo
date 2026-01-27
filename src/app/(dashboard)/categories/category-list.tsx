'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Edit, Trash2, FolderTree } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { deleteCategory } from '@/actions/categories'
import { DataTable, type ColumnDef } from '@/components/data-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ActiveBadge, DeleteDialog } from '@/components/forms'
import type { PaginationInfo } from '@/types'

interface Category {
  id: string
  code: string
  name: string
  description: string | null
  level: number
  sortOrder: number
  isActive: boolean
  parent: {
    id: string
    name: string
  } | null
  _count: {
    products: number
    children: number
  }
}

interface CategoryListProps {
  categories: Category[]
  pagination: PaginationInfo
}

/**
 * 分類列表元件
 */
export function CategoryList({ categories, pagination }: CategoryListProps) {
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
    const result = await deleteCategory(id)
    if (result.success) {
      toast.success(result.message)
      router.refresh()
    } else {
      toast.error(result.message)
    }
  }

  const columns: ColumnDef<Category>[] = [
    {
      id: 'code',
      header: '分類代碼',
      accessorKey: 'code',
      sortable: true,
    },
    {
      id: 'name',
      header: '分類名稱',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <FolderTree className="h-4 w-4 text-muted-foreground" />
          <span style={{ paddingLeft: `${(row.level - 1) * 16}px` }}>{row.name}</span>
        </div>
      ),
      sortable: true,
    },
    {
      id: 'parent',
      header: '上層分類',
      cell: (row) => row.parent?.name || '-',
    },
    {
      id: 'level',
      header: '層級',
      cell: (row) => <Badge variant="outline">第 {row.level} 層</Badge>,
      className: 'text-center',
    },
    {
      id: 'products',
      header: '商品數',
      cell: (row) => row._count.products,
      className: 'text-center',
    },
    {
      id: 'children',
      header: '子分類數',
      cell: (row) => row._count.children,
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
            <Link href={`/categories/${row.id}`}>
              <Edit className="h-4 w-4" />
            </Link>
          </Button>
          <DeleteDialog
            title="確定要刪除此分類嗎？"
            description={`將刪除分類「${row.name}」，此操作無法復原。`}
            onConfirm={() => handleDelete(row.id)}
            trigger={
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                disabled={row._count.products > 0 || row._count.children > 0}
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
    <DataTable<Category>
      columns={columns}
      data={categories}
      pagination={pagination}
      onPageChange={handlePageChange}
      onSearch={handleSearch}
      searchPlaceholder="搜尋分類代碼或名稱..."
      rowKey={(row) => row.id}
      emptyMessage="尚無分類資料"
    />
  )
}
