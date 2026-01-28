import { Suspense } from 'react'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { getRefunds } from '@/actions/refunds'
import { PageHeader } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { FormLoading } from '@/components/forms'
import { RefundTable, type RefundListItem } from './refund-table'
import type { PaginationInfo } from '@/types'

export const metadata = {
  title: '退換貨管理',
}

interface PageProps {
  searchParams: Promise<{
    page?: string
    search?: string
    status?: string
  }>
}

interface RefundsData {
  refunds: RefundListItem[]
  pagination: PaginationInfo
}

/**
 * 退換貨列表頁
 */
export default async function RefundsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = parseInt(params.page || '1')
  const search = params.search || ''
  const status = params.status

  return (
    <div className="space-y-6">
      <PageHeader title="退換貨管理" description="管理訂單退換貨紀錄">
        <Button asChild>
          <Link href="/orders/refunds/new">
            <Plus className="mr-2 h-4 w-4" />
            新增退貨單
          </Link>
        </Button>
      </PageHeader>

      <Suspense fallback={<FormLoading message="載入退換貨列表中..." />}>
        <RefundTableData page={page} search={search} status={status} />
      </Suspense>
    </div>
  )
}

async function RefundTableData({
  page,
  search,
  status,
}: {
  page: number
  search: string
  status?: string
}) {
  const result = await getRefunds({ page, pageSize: 20, search, status })

  if (!result.success || !result.data) {
    return <div className="text-center text-muted-foreground py-8">載入失敗</div>
  }

  const { refunds, pagination } = result.data as RefundsData

  return <RefundTable refunds={refunds} pagination={pagination} />
}
