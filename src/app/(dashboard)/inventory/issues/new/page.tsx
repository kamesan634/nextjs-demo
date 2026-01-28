import { PageHeader } from '@/components/layout'
import { IssueForm } from '../issue-form'
import prisma from '@/lib/prisma'

export const metadata = {
  title: '新增出庫單',
}

/**
 * 新增出庫單頁
 */
export default async function NewIssuePage() {
  // 載入倉庫列表
  const warehouses = await prisma.warehouse.findMany({
    where: { isActive: true },
    select: { id: true, code: true, name: true },
    orderBy: { name: 'asc' },
  })

  // 載入商品列表
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: {
      id: true,
      sku: true,
      name: true,
      unit: { select: { name: true } },
    },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="space-y-6">
      <PageHeader title="新增出庫單" description="建立新的商品出庫記錄" />
      <IssueForm warehouses={warehouses} products={products} />
    </div>
  )
}
