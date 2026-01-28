import prisma from '@/lib/prisma'
import { PageHeader } from '@/components/layout'
import { BundleForm } from '../bundle-form'

export const metadata = {
  title: '新增商品組合',
}

export default async function NewBundlePage() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: { id: true, name: true, sku: true, sellingPrice: true },
    orderBy: { name: 'asc' },
  })

  const serializedProducts = products.map((p: (typeof products)[number]) => ({
    ...p,
    sellingPrice: Number(p.sellingPrice),
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="新增商品組合"
        description="建立新的商品組合/套餐"
        backHref="/products/bundles"
      />
      <BundleForm products={serializedProducts} />
    </div>
  )
}
