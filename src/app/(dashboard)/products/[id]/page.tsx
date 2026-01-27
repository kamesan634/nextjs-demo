import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/layout'
import { getProduct, getUnitOptions, getTaxTypeOptions } from '@/actions/products'
import { getCategoryOptions } from '@/actions/categories'
import { ProductForm } from '../product-form'

export const metadata = {
  title: '編輯商品',
}

interface PageProps {
  params: Promise<{ id: string }>
}

/**
 * 編輯商品頁面
 */
export default async function EditProductPage({ params }: PageProps) {
  const { id } = await params
  const [product, categoryOptions, unitOptions, taxTypeOptions] = await Promise.all([
    getProduct(id),
    getCategoryOptions(),
    getUnitOptions(),
    getTaxTypeOptions(),
  ])

  if (!product) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <PageHeader title="編輯商品" description={`編輯商品「${product.name}」的資料`} />

      <div className="max-w-4xl">
        <ProductForm
          product={product}
          categoryOptions={categoryOptions}
          unitOptions={unitOptions}
          taxTypeOptions={taxTypeOptions}
        />
      </div>
    </div>
  )
}
