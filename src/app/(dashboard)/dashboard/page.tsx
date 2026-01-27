import { Suspense } from 'react'
import {
  ShoppingCart,
  Package,
  Users,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { formatCurrency } from '@/lib/utils'
import { PageHeader } from '@/components/layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FormLoading } from '@/components/forms'

export const metadata = {
  title: '儀表板',
}

/**
 * Dashboard 儀表板頁面
 * 顯示系統關鍵指標和統計數據
 */
export default async function DashboardPage() {
  const session = await auth()

  return (
    <div className="space-y-6">
      <PageHeader
        title={`歡迎回來，${session?.user?.name || '使用者'}`}
        description="這是您的 ERP 系統儀表板，查看今日營運概況"
      />

      <Suspense fallback={<FormLoading message="載入統計資料中..." />}>
        <DashboardStats />
      </Suspense>
    </div>
  )
}

/**
 * 儀表板統計資料元件
 */
async function DashboardStats() {
  // 取得統計資料
  const [orderStats, productStats, customerStats, inventoryAlerts, recentOrders, topProducts] =
    await Promise.all([
      getOrderStats(),
      getProductStats(),
      getCustomerStats(),
      getInventoryAlerts(),
      getRecentOrders(),
      getTopProducts(),
    ])

  return (
    <div className="space-y-6">
      {/* 統計卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* 今日營業額 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今日營業額</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(orderStats.todaySales)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {orderStats.salesGrowth >= 0 ? (
                <>
                  <ArrowUpRight className="mr-1 h-4 w-4 text-green-500" />
                  <span className="text-green-500">+{orderStats.salesGrowth.toFixed(1)}%</span>
                </>
              ) : (
                <>
                  <ArrowDownRight className="mr-1 h-4 w-4 text-red-500" />
                  <span className="text-red-500">{orderStats.salesGrowth.toFixed(1)}%</span>
                </>
              )}
              <span className="ml-1">較昨日</span>
            </div>
          </CardContent>
        </Card>

        {/* 今日訂單數 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今日訂單數</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orderStats.todayOrders}</div>
            <p className="text-xs text-muted-foreground">
              平均客單價 {formatCurrency(orderStats.avgOrderValue)}
            </p>
          </CardContent>
        </Card>

        {/* 商品總數 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">商品總數</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productStats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">啟用中 {productStats.activeProducts} 項</p>
          </CardContent>
        </Card>

        {/* 會員總數 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">會員總數</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customerStats.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              本月新增 {customerStats.newThisMonth} 位
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* 庫存警示 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              庫存警示
            </CardTitle>
            <CardDescription>低於安全庫存量的商品</CardDescription>
          </CardHeader>
          <CardContent>
            {inventoryAlerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">目前沒有庫存警示</p>
            ) : (
              <div className="space-y-3">
                {inventoryAlerts.slice(0, 5).map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium">{alert.productName}</p>
                      <p className="text-xs text-muted-foreground">SKU: {alert.productSku}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-destructive">
                        {alert.quantity} / {alert.safetyStock}
                      </p>
                      <p className="text-xs text-muted-foreground">庫存 / 安全量</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 近期訂單 */}
        <Card>
          <CardHeader>
            <CardTitle>近期訂單</CardTitle>
            <CardDescription>最近 5 筆訂單</CardDescription>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground">目前沒有訂單</p>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium">{order.orderNo}</p>
                      <p className="text-xs text-muted-foreground">
                        {order.customerName || '一般顧客'}
                      </p>
                    </div>
                    <p className="font-medium">{formatCurrency(order.totalAmount)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 熱銷商品 */}
        <Card>
          <CardHeader>
            <CardTitle>熱銷商品</CardTitle>
            <CardDescription>本月銷售量 TOP 5</CardDescription>
          </CardHeader>
          <CardContent>
            {topProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">目前沒有銷售紀錄</p>
            ) : (
              <div className="space-y-3">
                {topProducts.map((product, index) => (
                  <div
                    key={product.productId}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium">
                        {index + 1}
                      </span>
                      <p className="font-medium">{product.productName}</p>
                    </div>
                    <p className="text-muted-foreground">{product.totalQty} 件</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ===================================
// 資料擷取函數
// ===================================

async function getOrderStats() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  // 今日訂單統計
  const todayOrders = await prisma.order.findMany({
    where: {
      orderDate: { gte: today },
      status: { not: 'CANCELLED' },
    },
    select: {
      totalAmount: true,
    },
  })

  // 昨日訂單統計
  const yesterdayOrders = await prisma.order.findMany({
    where: {
      orderDate: { gte: yesterday, lt: today },
      status: { not: 'CANCELLED' },
    },
    select: {
      totalAmount: true,
    },
  })

  const todaySales = todayOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0)
  const yesterdaySales = yesterdayOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0)

  const salesGrowth =
    yesterdaySales > 0 ? ((todaySales - yesterdaySales) / yesterdaySales) * 100 : 0

  return {
    todaySales,
    todayOrders: todayOrders.length,
    avgOrderValue: todayOrders.length > 0 ? todaySales / todayOrders.length : 0,
    salesGrowth,
  }
}

async function getProductStats() {
  const [totalProducts, activeProducts] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { isActive: true } }),
  ])

  return {
    totalProducts,
    activeProducts,
  }
}

async function getCustomerStats() {
  const thisMonth = new Date()
  thisMonth.setDate(1)
  thisMonth.setHours(0, 0, 0, 0)

  const [totalCustomers, newThisMonth] = await Promise.all([
    prisma.customer.count(),
    prisma.customer.count({
      where: {
        joinDate: { gte: thisMonth },
      },
    }),
  ])

  return {
    totalCustomers,
    newThisMonth,
  }
}

async function getInventoryAlerts() {
  const alerts = await prisma.inventory.findMany({
    where: {
      product: {
        isActive: true,
        safetyStock: { gt: 0 },
      },
    },
    include: {
      product: {
        select: {
          sku: true,
          name: true,
          safetyStock: true,
        },
      },
    },
    orderBy: {
      quantity: 'asc',
    },
    take: 10,
  })

  return alerts
    .filter((inv) => inv.quantity < inv.product.safetyStock)
    .map((inv) => ({
      id: inv.id,
      productId: inv.productId,
      productSku: inv.product.sku,
      productName: inv.product.name,
      quantity: inv.quantity,
      safetyStock: inv.product.safetyStock,
    }))
}

async function getRecentOrders() {
  const orders = await prisma.order.findMany({
    where: {
      status: { not: 'CANCELLED' },
    },
    include: {
      customer: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 5,
  })

  return orders.map((order) => ({
    id: order.id,
    orderNo: order.orderNo,
    totalAmount: Number(order.totalAmount),
    customerName: order.customer?.name || null,
    status: order.status,
  }))
}

async function getTopProducts() {
  const thisMonth = new Date()
  thisMonth.setDate(1)
  thisMonth.setHours(0, 0, 0, 0)

  const topProducts = await prisma.orderItem.groupBy({
    by: ['productId'],
    where: {
      order: {
        orderDate: { gte: thisMonth },
        status: { not: 'CANCELLED' },
      },
    },
    _sum: {
      quantity: true,
    },
    orderBy: {
      _sum: {
        quantity: 'desc',
      },
    },
    take: 5,
  })

  // 取得商品名稱
  const productIds = topProducts.map((p) => p.productId)
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true },
  })

  const productMap = new Map(products.map((p) => [p.id, p.name]))

  return topProducts.map((p) => ({
    productId: p.productId,
    productName: productMap.get(p.productId) || '未知商品',
    totalQty: p._sum.quantity || 0,
  }))
}
