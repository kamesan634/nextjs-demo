import { Suspense } from 'react'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { getProductBundles } from '@/actions/product-bundles'
import { PageHeader } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { FormLoading } from '@/components/forms'
import { BundleTable } from './bundle-table'

export const metadata = {
  title: '商品組合管理',
}

interface PageProps {
  searchParams: Promise<{
    page?: string
    search?: string
  }>
}

export default async function BundlesPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = parseInt(params.page || '1')
  const search = params.search || ''

  return (
    <div className="space-y-6">
      <PageHeader title="商品組合管理" description="管理商品組合/套餐">
        <Button asChild>
          <Link href="/products/bundles/new">
            <Plus className="mr-2 h-4 w-4" />
            新增組合
          </Link>
        </Button>
      </PageHeader>

      <Suspense fallback={<FormLoading message="載入商品組合列表中..." />}>
        <BundleListData page={page} search={search} />
      </Suspense>
    </div>
  )
}

async function BundleListData({ page, search }: { page: number; search: string }) {
  const { data, pagination } = await getProductBundles({ page, search })

  return <BundleTable bundles={data} pagination={pagination} />
}
