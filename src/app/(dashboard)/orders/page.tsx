import { Suspense } from 'react'
import Link from 'next/link'
import { Plus, ShoppingCart, CheckCircle, Clock, XCircle } from 'lucide-react'
import { PageHeader } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTableSkeleton } from '@/components/data-table/data-table-skeleton'
import { OrdersTable } from './orders-table'
import { getOrders, getOrderStats } from '@/actions/orders'
import { getStores } from '@/actions/stores'

export const metadata = {
  title: '訂單管理',
}

interface PageProps {
  searchParams: Promise<{
    page?: string
    pageSize?: string
    search?: string
    status?: string
    paymentStatus?: string
    storeId?: string
  }>
}

/**
 * 訂單管理頁面
 */
export default async function OrdersPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = Number(params.page) || 1
  const pageSize = Number(params.pageSize) || 10
  const search = params.search || ''
  const status = params.status || ''
  const paymentStatus = params.paymentStatus || ''
  const storeId = params.storeId || ''

  return (
    <div className="space-y-6">
      <PageHeader title="訂單管理" description="管理銷售訂單">
        <Button asChild>
          <Link href="/orders/new">
            <Plus className="mr-2 h-4 w-4" />
            新增訂單
          </Link>
        </Button>
      </PageHeader>

      {/* 統計卡片 */}
      <Suspense fallback={<StatsCardsSkeleton />}>
        <StatsCards />
      </Suspense>

      {/* 訂單列表 */}
      <Suspense fallback={<DataTableSkeleton columnCount={8} rowCount={10} />}>
        <OrdersTableWrapper
          page={page}
          pageSize={pageSize}
          search={search}
          status={status}
          paymentStatus={paymentStatus}
          storeId={storeId}
        />
      </Suspense>
    </div>
  )
}

async function StatsCards() {
  const stats = await getOrderStats()

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
          <CardTitle className="text-sm font-medium">總訂單數</CardTitle>
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalOrders.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">所有訂單</p>
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
          <p className="text-xs text-muted-foreground">已完成訂單</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">待處理</CardTitle>
          <Clock className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">
            {stats.pendingOrders.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">待處理訂單</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">總營收</CardTitle>
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
          <p className="text-xs text-muted-foreground">已完成訂單金額</p>
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

async function OrdersTableWrapper({
  page,
  pageSize,
  search,
  status,
  paymentStatus,
  storeId,
}: {
  page: number
  pageSize: number
  search: string
  status: string
  paymentStatus: string
  storeId: string
}) {
  const [ordersData, storesData] = await Promise.all([
    getOrders({
      page,
      pageSize,
      search,
      status: status || undefined,
      paymentStatus: paymentStatus || undefined,
      storeId: storeId || undefined,
    }),
    getStores({ isActive: true }),
  ])

  return (
    <OrdersTable
      data={ordersData.data}
      pagination={ordersData.pagination}
      stores={storesData.data}
    />
  )
}
