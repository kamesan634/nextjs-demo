import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getProductPriceRules } from '@/actions/price-rules'
import { PageHeader } from '@/components/layout'
import { PriceRuleForm } from './price-rule-form'

export const metadata = {
  title: '價格管理',
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ProductPricesPage({ params }: PageProps) {
  const { id } = await params

  const product = await prisma.product.findUnique({
    where: { id },
    select: { id: true, name: true, sku: true, sellingPrice: true },
  })

  if (!product) {
    notFound()
  }

  const priceRules = await getProductPriceRules(id)

  const memberLevels = await prisma.customerLevel.findMany({
    where: { isActive: true },
    select: { id: true, code: true, name: true },
    orderBy: { sortOrder: 'asc' },
  })

  const serializedRules = priceRules.map((r) => ({
    ...r,
    price: Number(r.price),
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title={`價格管理 - ${product.name}`}
        description={`SKU: ${product.sku} | 售價: $${Number(product.sellingPrice).toLocaleString()}`}
        backHref={`/products/${id}`}
      />
      <PriceRuleForm productId={id} priceRules={serializedRules} memberLevels={memberLevels} />
    </div>
  )
}
