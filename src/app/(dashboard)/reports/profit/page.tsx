'use client'

import { useState, useEffect, useTransition } from 'react'
import { subDays, startOfMonth, endOfMonth } from 'date-fns'
import { DollarSign, TrendingUp, TrendingDown, Calendar, RefreshCw, Percent } from 'lucide-react'
import { PageHeader } from '@/components/layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { getProfitReport } from '@/actions/reports'
import { formatCurrency } from '@/lib/utils'

type ProfitReportData = Awaited<ReturnType<typeof getProfitReport>>

/**
 * 利潤分析報表頁面
 */
export default function ProfitReportPage() {
  const [isPending, startTransition] = useTransition()
  const [dateRange, setDateRange] = useState('month')
  const [reportData, setReportData] = useState<ProfitReportData | null>(null)

  const getDateRange = () => {
    const now = new Date()
    switch (dateRange) {
      case 'week':
        return { startDate: subDays(now, 7), endDate: new Date() }
      case 'month':
        return { startDate: startOfMonth(now), endDate: endOfMonth(now) }
      case 'quarter':
        return { startDate: subDays(now, 90), endDate: new Date() }
      case 'year':
        return { startDate: subDays(now, 365), endDate: new Date() }
      default:
        return { startDate: startOfMonth(now), endDate: endOfMonth(now) }
    }
  }

  useEffect(() => {
    const loadReportData = () => {
      const { startDate, endDate } = getDateRange()
      startTransition(async () => {
        const data = await getProfitReport({ startDate, endDate })
        setReportData(data)
      })
    }
    loadReportData()
  }, [dateRange])

  const loadReport = () => {
    const { startDate, endDate } = getDateRange()
    startTransition(async () => {
      const data = await getProfitReport({ startDate, endDate })
      setReportData(data)
    })
  }

  const profitMargin = reportData?.summary.profitMargin || 0
  const isPositiveMargin = profitMargin >= 0

  return (
    <div className="space-y-6">
      <PageHeader title="利潤分析" description="查看毛利與利潤數據分析">
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[150px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">近7天</SelectItem>
              <SelectItem value="month">本月</SelectItem>
              <SelectItem value="quarter">近3個月</SelectItem>
              <SelectItem value="year">近1年</SelectItem>
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
            <CardTitle className="text-sm font-medium">總營收</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(reportData?.summary.totalRevenue || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">總成本</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(reportData?.summary.totalCost || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">毛利</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${isPositiveMargin ? 'text-green-600' : 'text-red-600'}`}
            >
              {formatCurrency(reportData?.summary.grossProfit || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">毛利率</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${isPositiveMargin ? 'text-green-600' : 'text-red-600'}`}
            >
              {profitMargin.toFixed(1)}%
            </div>
            <Progress
              value={Math.min(Math.abs(profitMargin), 100)}
              className={`h-2 mt-2 ${isPositiveMargin ? '' : '[&>div]:bg-red-500'}`}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 分類利潤分析 */}
        <Card>
          <CardHeader>
            <CardTitle>分類利潤分析</CardTitle>
            <CardDescription>各商品分類的毛利排名</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>分類</TableHead>
                  <TableHead className="text-right">營收</TableHead>
                  <TableHead className="text-right">毛利</TableHead>
                  <TableHead className="text-right">毛利率</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData?.categoryProfits.map((cat) => (
                  <TableRow key={cat.category}>
                    <TableCell className="font-medium">{cat.category}</TableCell>
                    <TableCell className="text-right">{formatCurrency(cat.revenue)}</TableCell>
                    <TableCell
                      className={`text-right ${cat.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}
                    >
                      {formatCurrency(cat.profit)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={
                          cat.margin >= 20
                            ? 'default'
                            : cat.margin >= 10
                              ? 'secondary'
                              : 'destructive'
                        }
                      >
                        {cat.margin.toFixed(1)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {(!reportData?.categoryProfits || reportData.categoryProfits.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      暫無資料
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* 商品利潤排名 */}
        <Card>
          <CardHeader>
            <CardTitle>商品利潤排名 Top 10</CardTitle>
            <CardDescription>毛利金額最高的商品</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>商品</TableHead>
                  <TableHead className="text-right">數量</TableHead>
                  <TableHead className="text-right">毛利</TableHead>
                  <TableHead className="text-right">毛利率</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData?.topProfitProducts.map((product, index) => (
                  <TableRow key={product.productId}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-sm">{index + 1}.</span>
                        <span className="font-medium truncate max-w-[150px]">{product.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{product.quantity}</TableCell>
                    <TableCell
                      className={`text-right ${product.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}
                    >
                      {formatCurrency(product.profit)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={
                          product.margin >= 20
                            ? 'default'
                            : product.margin >= 10
                              ? 'secondary'
                              : 'destructive'
                        }
                      >
                        {product.margin.toFixed(1)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {(!reportData?.topProfitProducts || reportData.topProfitProducts.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      暫無資料
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
