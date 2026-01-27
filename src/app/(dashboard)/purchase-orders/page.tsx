import { Suspense } from 'react'
import Link from 'next/link'
import { Plus, Package, Clock, CheckCircle, TruckIcon } from 'lucide-react'
import { PageHeader } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTableSkeleton } from '@/components/data-table/data-table-skeleton'
import { PurchaseOrdersTable } from './purchase-orders-table'
import { getPurchaseOrders, getPurchaseOrderStats } from '@/actions/purchase-orders'
import { getSuppliers } from '@/actions/suppliers'

export const metadata = {
  title: '採購管理',
}

interface PageProps {
  searchParams: Promise<{
    page?: string
    pageSize?: string
    search?: string
    status?: string
    supplierId?: string
  }>
}

/**
 * 採購管理頁面
 */
export default async function PurchaseOrdersPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = Number(params.page) || 1
  const pageSize = Number(params.pageSize) || 10
  const search = params.search || ''
  const status = params.status || ''
  const supplierId = params.supplierId || ''

  return (
    <div className="space-y-6">
      <PageHeader title="採購管理" description="管理採購訂單">
        <Button asChild>
          <Link href="/purchase-orders/new">
            <Plus className="mr-2 h-4 w-4" />
            新增採購單
          </Link>
        </Button>
      </PageHeader>

      {/* 統計卡片 */}
      <Suspense fallback={<StatsCardsSkeleton />}>
        <StatsCards />
      </Suspense>

      {/* 採購單列表 */}
      <Suspense fallback={<DataTableSkeleton columnCount={7} rowCount={10} />}>
        <PurchaseOrdersTableWrapper
          page={page}
          pageSize={pageSize}
          search={search}
          status={status}
          supplierId={supplierId}
        />
      </Suspense>
    </div>
  )
}

async function StatsCards() {
  const stats = await getPurchaseOrderStats()

  // 格式化金額
  const formatCurrency = (amount: number | { toNumber?: () => number }) => {
    const value = typeof amount === 'number' ? amount : amount.toNumber?.() || 0
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">總採購單</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalOrders.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">所有採購單</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">待審核</CardTitle>
          <Clock className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">
            {stats.pendingOrders.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">待審核採購單</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">進行中</CardTitle>
          <TruckIcon className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {stats.approvedOrders.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">已核准/收貨中</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">已完成</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {stats.completedOrders.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">已完成採購</p>
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

async function PurchaseOrdersTableWrapper({
  page,
  pageSize,
  search,
  status,
  supplierId,
}: {
  page: number
  pageSize: number
  search: string
  status: string
  supplierId: string
}) {
  const [ordersData, suppliersData] = await Promise.all([
    getPurchaseOrders({
      page,
      pageSize,
      search,
      status: status || undefined,
      supplierId: supplierId || undefined,
    }),
    getSuppliers({ isActive: true }),
  ])

  return (
    <PurchaseOrdersTable
      data={ordersData.data}
      pagination={ordersData.pagination}
      suppliers={suppliersData.data}
    />
  )
}
