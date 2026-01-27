import { Suspense } from 'react'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { getStores } from '@/actions/stores'
import { PageHeader } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { FormLoading } from '@/components/forms'
import { StoreList } from './store-list'

export const metadata = {
  title: '門市管理',
}

interface PageProps {
  searchParams: Promise<{
    page?: string
    search?: string
  }>
}

/**
 * 門市管理頁面
 */
export default async function StoresPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = parseInt(params.page || '1')
  const search = params.search || ''

  return (
    <div className="space-y-6">
      <PageHeader title="門市管理" description="管理門市據點資訊">
        <Button asChild>
          <Link href="/settings/stores/new">
            <Plus className="mr-2 h-4 w-4" />
            新增門市
          </Link>
        </Button>
      </PageHeader>

      <Suspense fallback={<FormLoading message="載入門市列表中..." />}>
        <StoreListData page={page} search={search} />
      </Suspense>
    </div>
  )
}

async function StoreListData({ page, search }: { page: number; search: string }) {
  const { data, pagination } = await getStores({ page, search })

  return <StoreList stores={data} pagination={pagination} />
}
