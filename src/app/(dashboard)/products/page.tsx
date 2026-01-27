import { Suspense } from 'react'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { getProducts } from '@/actions/products'
import { PageHeader } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { FormLoading } from '@/components/forms'
import { ProductList } from './product-list'

export const metadata = {
  title: '商品管理',
}

interface PageProps {
  searchParams: Promise<{
    page?: string
    search?: string
    categoryId?: string
  }>
}

/**
 * 商品管理頁面
 */
export default async function ProductsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = parseInt(params.page || '1')
  const search = params.search || ''
  const categoryId = params.categoryId

  return (
    <div className="space-y-6">
      <PageHeader title="商品管理" description="管理商品主檔與價格資訊">
        <Button asChild>
          <Link href="/products/new">
            <Plus className="mr-2 h-4 w-4" />
            新增商品
          </Link>
        </Button>
      </PageHeader>

      <Suspense fallback={<FormLoading message="載入商品列表中..." />}>
        <ProductListData page={page} search={search} categoryId={categoryId} />
      </Suspense>
    </div>
  )
}

async function ProductListData({
  page,
  search,
  categoryId,
}: {
  page: number
  search: string
  categoryId?: string
}) {
  const { data, pagination } = await getProducts({ page, search, categoryId })

  return <ProductList products={data} pagination={pagination} />
}
