import { PageHeader } from '@/components/layout'
import { getCategoryOptions } from '@/actions/categories'
import { getUnitOptions, getTaxTypeOptions } from '@/actions/products'
import { ProductForm } from '../product-form'

export const metadata = {
  title: '新增商品',
}

/**
 * 新增商品頁面
 */
export default async function NewProductPage() {
  const [categoryOptions, unitOptions, taxTypeOptions] = await Promise.all([
    getCategoryOptions(),
    getUnitOptions(),
    getTaxTypeOptions(),
  ])

  return (
    <div className="space-y-6">
      <PageHeader title="新增商品" description="建立新的商品資料" />

      <div className="max-w-4xl">
        <ProductForm
          categoryOptions={categoryOptions}
          unitOptions={unitOptions}
          taxTypeOptions={taxTypeOptions}
        />
      </div>
    </div>
  )
}
