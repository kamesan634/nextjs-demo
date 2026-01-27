import { Suspense } from 'react'
import { PageHeader } from '@/components/layout'
import { DataTableSkeleton } from '@/components/data-table/data-table-skeleton'
import { SuppliersTable } from './suppliers-table'
import { getSuppliers } from '@/actions/suppliers'

export const metadata = {
  title: '供應商管理',
}

interface PageProps {
  searchParams: Promise<{
    page?: string
    pageSize?: string
    search?: string
    isActive?: string
  }>
}

/**
 * 供應商管理頁面
 */
export default async function SuppliersPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = Number(params.page) || 1
  const pageSize = Number(params.pageSize) || 10
  const search = params.search || ''
  const isActive =
    params.isActive === 'true' ? true : params.isActive === 'false' ? false : undefined

  return (
    <div className="space-y-6">
      <PageHeader title="供應商管理" description="管理供應商資料與價格" />

      <Suspense fallback={<DataTableSkeleton columnCount={7} rowCount={10} />}>
        <SuppliersTableWrapper
          page={page}
          pageSize={pageSize}
          search={search}
          isActive={isActive}
        />
      </Suspense>
    </div>
  )
}

async function SuppliersTableWrapper({
  page,
  pageSize,
  search,
  isActive,
}: {
  page: number
  pageSize: number
  search: string
  isActive?: boolean
}) {
  const suppliersData = await getSuppliers({ page, pageSize, search, isActive })

  return <SuppliersTable data={suppliersData.data} pagination={suppliersData.pagination} />
}
