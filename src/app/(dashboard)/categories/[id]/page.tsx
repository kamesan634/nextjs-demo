import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/layout'
import { getCategory, getCategoryOptions } from '@/actions/categories'
import { CategoryForm } from '../category-form'

export const metadata = {
  title: '編輯分類',
}

interface PageProps {
  params: Promise<{ id: string }>
}

/**
 * 編輯分類頁面
 */
export default async function EditCategoryPage({ params }: PageProps) {
  const { id } = await params
  const [category, parentOptions] = await Promise.all([getCategory(id), getCategoryOptions()])

  if (!category) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <PageHeader title="編輯分類" description={`編輯分類「${category.name}」的資料`} />

      <div className="max-w-2xl">
        <CategoryForm category={category} parentOptions={parentOptions} />
      </div>
    </div>
  )
}
