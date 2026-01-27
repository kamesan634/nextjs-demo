import { Suspense } from 'react'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { getWarehouses } from '@/actions/warehouses'
import { PageHeader } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { FormLoading } from '@/components/forms'
import { WarehouseList } from './warehouse-list'

export const metadata = {
  title: '倉庫管理',
}

interface PageProps {
  searchParams: Promise<{
    page?: string
    search?: string
  }>
}

/**
 * 倉庫管理頁面
 */
export default async function WarehousesPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = parseInt(params.page || '1')
  const search = params.search || ''

  return (
    <div className="space-y-6">
      <PageHeader title="倉庫管理" description="管理倉庫據點資訊">
        <Button asChild>
          <Link href="/settings/warehouses/new">
            <Plus className="mr-2 h-4 w-4" />
            新增倉庫
          </Link>
        </Button>
      </PageHeader>

      <Suspense fallback={<FormLoading message="載入倉庫列表中..." />}>
        <WarehouseListData page={page} search={search} />
      </Suspense>
    </div>
  )
}

async function WarehouseListData({ page, search }: { page: number; search: string }) {
  const { data, pagination } = await getWarehouses({ page, search })

  return <WarehouseList warehouses={data} pagination={pagination} />
}
