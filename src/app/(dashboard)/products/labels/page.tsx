import { Suspense } from 'react'
import prisma from '@/lib/prisma'
import { PageHeader } from '@/components/layout'
import { FormLoading } from '@/components/forms'
import { LabelPreview } from './label-preview'

export const metadata = {
  title: '商品標籤列印',
}

interface PageProps {
  searchParams: Promise<{
    search?: string
    categoryId?: string
  }>
}

export default async function LabelsPage({ searchParams }: PageProps) {
  const params = await searchParams

  return (
    <div className="space-y-6">
      <PageHeader title="商品標籤列印" description="選擇商品並列印標籤" backHref="/products" />

      <Suspense fallback={<FormLoading message="載入商品列表中..." />}>
        <LabelPageData search={params.search} categoryId={params.categoryId} />
      </Suspense>
    </div>
  )
}

async function LabelPageData({ search, categoryId }: { search?: string; categoryId?: string }) {
  const where = {
    isActive: true,
    ...(search && {
      OR: [
        { sku: { contains: search, mode: 'insensitive' as const } },
        { name: { contains: search, mode: 'insensitive' as const } },
        { barcode: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
    ...(categoryId && { categoryId }),
  }

  const products = await prisma.product.findMany({
    where,
    select: {
      id: true,
      sku: true,
      barcode: true,
      name: true,
      sellingPrice: true,
      unit: { select: { name: true } },
    },
    orderBy: { name: 'asc' },
    take: 100,
  })

  const categories = await prisma.category.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  const serializedProducts = products.map((p) => ({
    id: p.id,
    sku: p.sku,
    barcode: p.barcode,
    name: p.name,
    price: Number(p.sellingPrice),
    unit: p.unit.name,
  }))

  return <LabelPreview products={serializedProducts} categories={categories} />
}
