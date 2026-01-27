import { Suspense } from 'react'
import Link from 'next/link'
import {
  Package,
  AlertTriangle,
  PackageX,
  Warehouse,
  ClipboardList,
  ArrowRightLeft,
} from 'lucide-react'
import { PageHeader } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTableSkeleton } from '@/components/data-table/data-table-skeleton'
import { InventoryTable } from './inventory-table'
import { getInventoryList, getInventoryStats } from '@/actions/inventory'
import { getWarehouses } from '@/actions/warehouses'

export const metadata = {
  title: '庫存管理',
}

interface PageProps {
  searchParams: Promise<{
    page?: string
    pageSize?: string
    search?: string
    warehouseId?: string
    lowStock?: string
  }>
}

/**
 * 庫存管理頁面
 */
export default async function InventoryPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = Number(params.page) || 1
  const pageSize = Number(params.pageSize) || 10
  const search = params.search || ''
  const warehouseId = params.warehouseId || ''
  const lowStock = params.lowStock === 'true'

  return (
    <div className="space-y-6">
      <PageHeader title="庫存管理" description="管理商品庫存與異動">
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/inventory/adjustments">
              <ClipboardList className="mr-2 h-4 w-4" />
              庫存調整
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/inventory/stock-counts">
              <Package className="mr-2 h-4 w-4" />
              盤點作業
            </Link>
          </Button>
        </div>
      </PageHeader>

      {/* 統計卡片 */}
      <Suspense fallback={<StatsCardsSkeleton />}>
        <StatsCards />
      </Suspense>

      {/* 快捷操作 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
          <Link href="/inventory?lowStock=true">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">低庫存警示</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">查看庫存低於安全存量的商品</p>
            </CardContent>
          </Link>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
          <Link href="/inventory/stock-counts/new">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">新建盤點單</CardTitle>
              <ClipboardList className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">建立新的庫存盤點作業</p>
            </CardContent>
          </Link>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
          <Link href="/inventory/adjustments/new">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">庫存調整</CardTitle>
              <ArrowRightLeft className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">調整商品庫存數量</p>
            </CardContent>
          </Link>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
          <Link href="/inventory/movements">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">異動紀錄</CardTitle>
              <Warehouse className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">查看庫存異動歷史紀錄</p>
            </CardContent>
          </Link>
        </Card>
      </div>

      {/* 庫存列表 */}
      <Suspense fallback={<DataTableSkeleton columnCount={8} rowCount={10} />}>
        <InventoryTableWrapper
          page={page}
          pageSize={pageSize}
          search={search}
          warehouseId={warehouseId}
          lowStock={lowStock}
        />
      </Suspense>
    </div>
  )
}

async function StatsCards() {
  const stats = await getInventoryStats()

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">商品總數</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalProducts.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">啟用中的商品</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">庫存總量</CardTitle>
          <Warehouse className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalInventory.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">所有商品庫存</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">低庫存</CardTitle>
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">
            {stats.lowStockCount.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">低於安全存量</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">缺貨</CardTitle>
          <PackageX className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {stats.outOfStockCount.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">庫存為零</p>
        </CardContent>
      </Card>
    </div>
  )
}

function StatsCardsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            <div className="h-4 w-4 animate-pulse rounded bg-muted" />
          </CardHeader>
          <CardContent>
            <div className="h-8 w-16 animate-pulse rounded bg-muted" />
            <div className="mt-1 h-3 w-20 animate-pulse rounded bg-muted" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

async function InventoryTableWrapper({
  page,
  pageSize,
  search,
  warehouseId,
  lowStock,
}: {
  page: number
  pageSize: number
  search: string
  warehouseId: string
  lowStock: boolean
}) {
  const [inventoryData, warehousesData] = await Promise.all([
    getInventoryList({
      page,
      pageSize,
      search,
      warehouseId: warehouseId || undefined,
      lowStock,
    }),
    getWarehouses({ isActive: true }),
  ])

  return (
    <InventoryTable
      data={inventoryData.data}
      pagination={inventoryData.pagination}
      warehouses={warehousesData.data}
    />
  )
}
