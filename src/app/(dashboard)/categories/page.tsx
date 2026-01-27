import { Suspense } from 'react'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { getCategories } from '@/actions/categories'
import { PageHeader } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { FormLoading } from '@/components/forms'
import { CategoryList } from './category-list'

export const metadata = {
  title: '分類管理',
}

interface PageProps {
  searchParams: Promise<{
    page?: string
    search?: string
  }>
}

/**
 * 分類管理頁面
 */
export default async function CategoriesPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = parseInt(params.page || '1')
  const search = params.search || ''

  return (
    <div className="space-y-6">
      <PageHeader title="分類管理" description="管理商品分類結構">
        <Button asChild>
          <Link href="/categories/new">
            <Plus className="mr-2 h-4 w-4" />
            新增分類
          </Link>
        </Button>
      </PageHeader>

      <Suspense fallback={<FormLoading message="載入分類列表中..." />}>
        <CategoryListData page={page} search={search} />
      </Suspense>
    </div>
  )
}

async function CategoryListData({ page, search }: { page: number; search: string }) {
  const { data, pagination } = await getCategories({ page, search })

  return <CategoryList categories={data} pagination={pagination} />
}
