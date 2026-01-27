import { PageHeader } from '@/components/layout'
import { getCategoryOptions } from '@/actions/categories'
import { CategoryForm } from '../category-form'

export const metadata = {
  title: '新增分類',
}

/**
 * 新增分類頁面
 */
export default async function NewCategoryPage() {
  const parentOptions = await getCategoryOptions()

  return (
    <div className="space-y-6">
      <PageHeader title="新增分類" description="建立新的商品分類" />

      <div className="max-w-2xl">
        <CategoryForm parentOptions={parentOptions} />
      </div>
    </div>
  )
}
