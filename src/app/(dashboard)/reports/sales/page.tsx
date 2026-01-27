'use client'

import { useState, useEffect, useTransition } from 'react'
import { subDays, startOfMonth, endOfMonth } from 'date-fns'
import { ShoppingCart, TrendingUp, CreditCard, Package, Calendar, RefreshCw } from 'lucide-react'
import { PageHeader } from '@/components/layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { getSalesReport } from '@/actions/reports'
import { formatCurrency } from '@/lib/utils'

type SalesReportData = Awaited<ReturnType<typeof getSalesReport>>

/**
 * 銷售報表頁面
 */
export default function SalesReportPage() {
  const [isPending, startTransition] = useTransition()
  const [dateRange, setDateRange] = useState('month')
  const [reportData, setReportData] = useState<SalesReportData | null>(null)

  const getDateRange = () => {
    const now = new Date()
    switch (dateRange) {
      case 'today':
        return { startDate: new Date(now.setHours(0, 0, 0, 0)), endDate: new Date() }
      case 'week':
        return { startDate: subDays(now, 7), endDate: new Date() }
      case 'month':
        return { startDate: startOfMonth(now), endDate: endOfMonth(now) }
      case 'quarter':
        return { startDate: subDays(now, 90), endDate: new Date() }
      default:
        return { startDate: startOfMonth(now), endDate: endOfMonth(now) }
    }
  }

  useEffect(() => {
    const loadReportData = () => {
      const { startDate, endDate } = getDateRange()
      startTransition(async () => {
        const data = await getSalesReport({ startDate, endDate })
        setReportData(data)
      })
    }
    loadReportData()
  }, [dateRange])

  const loadReport = () => {
    const { startDate, endDate } = getDateRange()
    startTransition(async () => {
      const data = await getSalesReport({ startDate, endDate })
      setReportData(data)
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader title="銷售報表" description="查看銷售數據與分析">
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[150px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">今日</SelectItem>
              <SelectItem value="week">近7天</SelectItem>
              <SelectItem value="month">本月</SelectItem>
              <SelectItem value="quarter">近3個月</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={loadReport} disabled={isPending}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isPending ? 'animate-spin' : ''}`} />
            重新整理
          </Button>
        </div>
      </PageHeader>

      {/* 統計卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">總營業額</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(reportData?.summary.totalSales || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">訂單數</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData?.summary.orderCount || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均客單價</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(reportData?.summary.averageOrderValue || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">折扣金額</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(reportData?.summary.totalDiscount || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 熱銷商品 */}
        <Card>
          <CardHeader>
            <CardTitle>熱銷商品 Top 10</CardTitle>
            <CardDescription>銷售金額排名</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>商品</TableHead>
                  <TableHead className="text-right">數量</TableHead>
                  <TableHead className="text-right">金額</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData?.topProducts.map((product, index) => (
                  <TableRow key={product.productId}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-sm">{index + 1}.</span>
                        <div>
                          <div className="font-medium">{product.productName}</div>
                          <div className="text-xs text-muted-foreground">{product.productCode}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{product.quantity}</TableCell>
                    <TableCell className="text-right">{formatCurrency(product.revenue)}</TableCell>
                  </TableRow>
                ))}
                {(!reportData?.topProducts || reportData.topProducts.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      暫無資料
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* 付款方式統計 */}
        <Card>
          <CardHeader>
            <CardTitle>付款方式統計</CardTitle>
            <CardDescription>各付款方式佔比</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {reportData?.paymentStats.map((stat) => {
              const total = reportData.summary.totalSales || 1
              const percentage = (stat.amount / total) * 100
              return (
                <div key={stat.method} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>{getPaymentMethodName(stat.method)}</span>
                    <span className="text-muted-foreground">
                      {formatCurrency(stat.amount)} ({stat.count} 筆)
                    </span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              )
            })}
            {(!reportData?.paymentStats || reportData.paymentStats.length === 0) && (
              <div className="text-center text-muted-foreground py-8">暫無資料</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function getPaymentMethodName(method: string) {
  const names: Record<string, string> = {
    CASH: '現金',
    CREDIT_CARD: '信用卡',
    DEBIT_CARD: '金融卡',
    LINE_PAY: 'LINE Pay',
    APPLE_PAY: 'Apple Pay',
    OTHER: '其他',
  }
  return names[method] || method
}
