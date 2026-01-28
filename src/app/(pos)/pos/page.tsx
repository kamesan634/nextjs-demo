import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { ProductGrid } from './components/product-grid'
import { Cart } from './components/cart'
import { ProductSearch } from './components/product-search'
import { CustomerSearch } from './components/customer-search'

export const metadata = {
  title: 'POS 收銀台',
}

export default async function POSPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  // 載入商品
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: {
      id: true,
      sku: true,
      barcode: true,
      name: true,
      shortName: true,
      sellingPrice: true,
      imageUrl: true,
      category: { select: { id: true, name: true } },
      unit: { select: { name: true } },
    },
    orderBy: { name: 'asc' },
  })

  // 載入分類
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { sortOrder: 'asc' },
  })

  // 載入付款方式
  const paymentMethods = await prisma.paymentMethod.findMany({
    where: { isActive: true },
    select: { id: true, code: true, name: true },
    orderBy: { sortOrder: 'asc' },
  })

  const serializedProducts = products.map((p) => ({
    ...p,
    sellingPrice: Number(p.sellingPrice),
  }))

  return (
    <div className="flex h-screen">
      {/* 左側 - 商品區域 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 頂部搜尋列 */}
        <div className="border-b p-3 flex items-center gap-3">
          <ProductSearch />
          <CustomerSearch />
          <a
            href="/dashboard"
            className="text-sm text-muted-foreground hover:text-foreground ml-auto"
          >
            返回後台
          </a>
        </div>

        {/* 商品網格 */}
        <div className="flex-1 overflow-y-auto p-3">
          <ProductGrid products={serializedProducts} categories={categories} />
        </div>
      </div>

      {/* 右側 - 購物車 */}
      <div className="w-[420px] border-l flex flex-col bg-card">
        <Cart
          paymentMethods={paymentMethods}
          userId={session.user.id}
          storeId={session.user.store?.id || ''}
        />
      </div>
    </div>
  )
}
