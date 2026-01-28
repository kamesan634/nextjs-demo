import { Suspense } from 'react'
import { getHoldOrders } from '@/actions/hold-orders'
import { PageHeader } from '@/components/layout'
import { FormLoading } from '@/components/forms'
import { HoldOrderTable, type HoldOrderListItem } from './hold-order-table'
import type { PaginationInfo } from '@/types'

interface HoldOrdersData {
  holdOrders: HoldOrderListItem[]
  pagination: PaginationInfo
}

export const metadata = {
  title: '掛單管理',
}

interface PageProps {
  searchParams: Promise<{
    page?: string
    search?: string
    status?: string
  }>
}

/**
 * 掛單管理頁面
 */
export default async function HoldOrdersPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = parseInt(params.page || '1')
  const search = params.search || ''
  const status = params.status as 'HOLD' | 'RESUMED' | 'EXPIRED' | 'VOIDED' | undefined

  return (
    <div className="space-y-6">
      <PageHeader title="掛單管理" description="管理 POS 掛單紀錄" />

      <Suspense fallback={<FormLoading message="載入掛單列表中..." />}>
        <HoldOrderTableData page={page} search={search} status={status} />
      </Suspense>
    </div>
  )
}

async function HoldOrderTableData({
  page,
  search,
  status,
}: {
  page: number
  search: string
  status?: 'HOLD' | 'RESUMED' | 'EXPIRED' | 'VOIDED'
}) {
  const result = await getHoldOrders({ page, pageSize: 20, status })

  if (!result.success || !result.data) {
    return <div className="text-center text-muted-foreground py-8">載入失敗</div>
  }

  const { holdOrders, pagination } = result.data as HoldOrdersData

  return <HoldOrderTable holdOrders={holdOrders} pagination={pagination} />
}
