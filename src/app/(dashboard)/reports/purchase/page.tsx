'use client'

import { useState, useEffect, useTransition } from 'react'
import { subDays, startOfMonth, endOfMonth } from 'date-fns'
import {
  FileText,
  TrendingUp,
  Users,
  Package,
  Calendar,
  RefreshCw,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react'
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
import { getPurchaseReport } from '@/actions/reports'
import { formatCurrency } from '@/lib/utils'

type PurchaseReportData = Awaited<ReturnType<typeof getPurchaseReport>>

/**
 * 採購報表頁面
 */
export default function PurchaseReportPage() {
  const [isPending, startTransition] = useTransition()
  const [dateRange, setDateRange] = useState('month')
  const [reportData, setReportData] = useState<PurchaseReportData | null>(null)

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
        const data = await getPurchaseReport({ startDate, endDate })
        setReportData(data)
      })
    }
    loadReportData()
  }, [dateRange])

  const loadReport = () => {
    const { startDate, endDate } = getDateRange()
    startTransition(async () => {
      const data = await getPurchaseReport({ startDate, endDate })
      setReportData(data)
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader title="採購報表" description="查看採購數據與供應商分析">
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
            <CardTitle className="text-sm font-medium">採購總額</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(reportData?.summary.totalPurchase || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">採購單數</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData?.summary.orderCount || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均採購金額</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(reportData?.summary.averageOrderValue || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">供應商數</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData?.topSuppliers.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 供應商排名 */}
        <Card>
          <CardHeader>
            <CardTitle>供應商採購排名</CardTitle>
            <CardDescription>採購金額 Top 10</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>供應商</TableHead>
                  <TableHead className="text-right">單數</TableHead>
                  <TableHead className="text-right">金額</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData?.topSuppliers.map(
                  (
                    supplier: NonNullable<typeof reportData>['topSuppliers'][number],
                    index: number
                  ) => (
                    <TableRow key={supplier.supplierId}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground text-sm">{index + 1}.</span>
                          <div>
                            <div className="font-medium">{supplier.supplierName}</div>
                            <div className="text-xs text-muted-foreground">
                              {supplier.supplierCode}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{supplier.orderCount}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(supplier.totalAmount)}
                      </TableCell>
                    </TableRow>
                  )
                )}
                {(!reportData?.topSuppliers || reportData.topSuppliers.length === 0) && (
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

        {/* 採購狀態統計 */}
        <Card>
          <CardHeader>
            <CardTitle>採購單狀態統計</CardTitle>
            <CardDescription>各狀態數量與金額</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {reportData?.statusStats.map(
              (stat: NonNullable<typeof reportData>['statusStats'][number]) => {
                const total = reportData.summary.orderCount || 1
                const percentage = (stat.count / total) * 100
                return (
                  <div key={stat.status} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(stat.status)}
                        <span>{getStatusName(stat.status)}</span>
                      </div>
                      <span className="text-muted-foreground">
                        {stat.count} 筆 / {formatCurrency(stat.amount)}
                      </span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                )
              }
            )}
            {(!reportData?.statusStats || reportData.statusStats.length === 0) && (
              <div className="text-center text-muted-foreground py-8">暫無資料</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'COMPLETED':
    case 'RECEIVED':
      return <CheckCircle className="h-4 w-4 text-green-500" />
    case 'PENDING':
    case 'ORDERED':
      return <Clock className="h-4 w-4 text-yellow-500" />
    case 'CANCELLED':
      return <XCircle className="h-4 w-4 text-red-500" />
    default:
      return <FileText className="h-4 w-4 text-muted-foreground" />
  }
}

function getStatusName(status: string) {
  const names: Record<string, string> = {
    DRAFT: '草稿',
    PENDING: '待審核',
    APPROVED: '已核准',
    ORDERED: '已下單',
    PARTIAL_RECEIVED: '部分收貨',
    RECEIVED: '已收貨',
    COMPLETED: '已完成',
    CANCELLED: '已取消',
  }
  return names[status] || status
}
