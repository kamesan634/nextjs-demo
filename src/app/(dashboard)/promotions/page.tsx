import { Suspense } from 'react'
import Link from 'next/link'
import { Plus, Tag, Ticket, TrendingUp, Calendar } from 'lucide-react'
import { PageHeader } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DataTableSkeleton } from '@/components/data-table/data-table-skeleton'
import { PromotionsTable } from './promotions-table'
import { CouponsTable } from './coupons-table'
import { getPromotions, getCoupons } from '@/actions/promotions'

export const metadata = {
  title: '促銷管理',
}

interface PageProps {
  searchParams: Promise<{
    tab?: string
    page?: string
    pageSize?: string
    search?: string
    type?: string
    isActive?: string
  }>
}

/**
 * 促銷管理頁面
 */
export default async function PromotionsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const tab = params.tab || 'promotions'
  const page = Number(params.page) || 1
  const pageSize = Number(params.pageSize) || 10
  const search = params.search || ''
  const type = params.type || ''
  const isActive =
    params.isActive === 'true' ? true : params.isActive === 'false' ? false : undefined

  return (
    <div className="space-y-6">
      <PageHeader title="促銷管理" description="管理促銷活動與優惠券">
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/promotions/coupons/new">
              <Ticket className="mr-2 h-4 w-4" />
              新增優惠券
            </Link>
          </Button>
          <Button asChild>
            <Link href="/promotions/new">
              <Plus className="mr-2 h-4 w-4" />
              新增促銷活動
            </Link>
          </Button>
        </div>
      </PageHeader>

      {/* 統計卡片 */}
      <Suspense fallback={<StatsCardsSkeleton />}>
        <StatsCards />
      </Suspense>

      {/* 標籤頁 */}
      <Tabs defaultValue={tab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="promotions" asChild>
            <Link href="/promotions?tab=promotions">
              <Tag className="mr-2 h-4 w-4" />
              促銷活動
            </Link>
          </TabsTrigger>
          <TabsTrigger value="coupons" asChild>
            <Link href="/promotions?tab=coupons">
              <Ticket className="mr-2 h-4 w-4" />
              優惠券
            </Link>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="promotions">
          <Suspense fallback={<DataTableSkeleton columnCount={7} rowCount={10} />}>
            <PromotionsTableWrapper
              page={page}
              pageSize={pageSize}
              search={search}
              type={type}
              isActive={isActive}
            />
          </Suspense>
        </TabsContent>

        <TabsContent value="coupons">
          <Suspense fallback={<DataTableSkeleton columnCount={7} rowCount={10} />}>
            <CouponsTableWrapper
              page={page}
              pageSize={pageSize}
              search={search}
              isActive={isActive}
            />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  )
}

async function StatsCards() {
  const [promotionsData, couponsData] = await Promise.all([
    getPromotions({ pageSize: 1 }),
    getCoupons({ pageSize: 1 }),
  ])

  const now = new Date()
  const [activePromotions, activeCoupons] = await Promise.all([
    getPromotions({ isActive: true, pageSize: 1 }),
    getCoupons({ isActive: true, pageSize: 1 }),
  ])

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">促銷活動</CardTitle>
          <Tag className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{promotionsData.pagination.total}</div>
          <p className="text-xs text-muted-foreground">總促銷活動數</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">進行中活動</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {activePromotions.pagination.total}
          </div>
          <p className="text-xs text-muted-foreground">啟用中的促銷活動</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">優惠券</CardTitle>
          <Ticket className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{couponsData.pagination.total}</div>
          <p className="text-xs text-muted-foreground">總優惠券數</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">有效優惠券</CardTitle>
          <Calendar className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{activeCoupons.pagination.total}</div>
          <p className="text-xs text-muted-foreground">有效期內的優惠券</p>
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

async function PromotionsTableWrapper({
  page,
  pageSize,
  search,
  type,
  isActive,
}: {
  page: number
  pageSize: number
  search: string
  type: string
  isActive?: boolean
}) {
  const data = await getPromotions({
    page,
    pageSize,
    search,
    type: type || undefined,
    isActive,
  })

  return <PromotionsTable data={data.data} pagination={data.pagination} />
}

async function CouponsTableWrapper({
  page,
  pageSize,
  search,
  isActive,
}: {
  page: number
  pageSize: number
  search: string
  isActive?: boolean
}) {
  const data = await getCoupons({
    page,
    pageSize,
    search,
    isActive,
  })

  return <CouponsTable data={data.data} pagination={data.pagination} />
}
