import { Suspense } from 'react'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { getGoodsIssues } from '@/actions/goods-issues'
import { PageHeader } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { FormLoading } from '@/components/forms'
import { IssueTable } from './issue-table'

export const metadata = {
  title: '出庫單管理',
}

interface PageProps {
  searchParams: Promise<{
    page?: string
    search?: string
    status?: string
    warehouseId?: string
  }>
}

/**
 * 出庫單列表頁
 */
export default async function IssuesPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = parseInt(params.page || '1')
  const search = params.search || ''
  const status = params.status
  const warehouseId = params.warehouseId

  return (
    <div className="space-y-6">
      <PageHeader title="出庫單管理" description="管理商品出庫記錄">
        <Button asChild>
          <Link href="/inventory/issues/new">
            <Plus className="mr-2 h-4 w-4" />
            新增出庫單
          </Link>
        </Button>
      </PageHeader>

      <Suspense fallback={<FormLoading message="載入出庫單列表中..." />}>
        <IssueListData page={page} search={search} status={status} warehouseId={warehouseId} />
      </Suspense>
    </div>
  )
}

async function IssueListData({
  page,
  search,
  status,
  warehouseId,
}: {
  page: number
  search: string
  status?: string
  warehouseId?: string
}) {
  const result = await getGoodsIssues({
    page,
    pageSize: 10,
    search,
    status,
    warehouseId,
  })

  return <IssueTable data={result.data} pagination={result.pagination} />
}
