import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getProductBundle } from '@/actions/product-bundles'
import { PageHeader } from '@/components/layout'
import { BundleForm } from '../bundle-form'

export const metadata = {
  title: '編輯商品組合',
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditBundlePage({ params }: PageProps) {
  const { id } = await params
  const bundle = await getProductBundle(id)

  if (!bundle) {
    notFound()
  }

  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: { id: true, name: true, sku: true, sellingPrice: true },
    orderBy: { name: 'asc' },
  })

  const serializedBundle = {
    ...bundle,
    bundlePrice: Number(bundle.bundlePrice),
    items: bundle.items.map((i) => ({
      ...i,
      product: {
        ...i.product,
        sellingPrice: Number(i.product.sellingPrice),
      },
    })),
  }

  const serializedProducts = products.map((p) => ({
    ...p,
    sellingPrice: Number(p.sellingPrice),
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="編輯商品組合"
        description={`編輯組合: ${bundle.code}`}
        backHref="/products/bundles"
      />
      <BundleForm bundle={serializedBundle} products={serializedProducts} />
    </div>
  )
}
