import { Suspense } from 'react'
import { PageHeader } from '@/components/layout'
import { DataTableSkeleton } from '@/components/data-table/data-table-skeleton'
import { CustomersTable } from './customers-table'
import { getCustomers, getActiveCustomerLevels } from '@/actions/customers'

export const metadata = {
  title: '會員管理',
}

interface PageProps {
  searchParams: Promise<{
    page?: string
    pageSize?: string
    search?: string
    levelId?: string
    isActive?: string
  }>
}

/**
 * 會員管理頁面
 */
export default async function CustomersPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = Number(params.page) || 1
  const pageSize = Number(params.pageSize) || 10
  const search = params.search || ''
  const levelId = params.levelId || ''
  const isActive =
    params.isActive === 'true' ? true : params.isActive === 'false' ? false : undefined

  return (
    <div className="space-y-6">
      <PageHeader title="會員管理" description="管理客戶與會員資料" />

      <Suspense fallback={<DataTableSkeleton columnCount={7} rowCount={10} />}>
        <CustomersTableWrapper
          page={page}
          pageSize={pageSize}
          search={search}
          levelId={levelId}
          isActive={isActive}
        />
      </Suspense>
    </div>
  )
}

async function CustomersTableWrapper({
  page,
  pageSize,
  search,
  levelId,
  isActive,
}: {
  page: number
  pageSize: number
  search: string
  levelId: string
  isActive?: boolean
}) {
  const [customersData, levels] = await Promise.all([
    getCustomers({ page, pageSize, search, levelId: levelId || undefined, isActive }),
    getActiveCustomerLevels(),
  ])

  return (
    <CustomersTable
      data={customersData.data}
      pagination={customersData.pagination}
      levels={levels}
    />
  )
}
