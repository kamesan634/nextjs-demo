'use client'

import { useState, useEffect, useTransition } from 'react'
import { Package, AlertTriangle, Warehouse, RefreshCw, DollarSign } from 'lucide-react'
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
import { getInventoryReport } from '@/actions/reports'
import { getWarehouses } from '@/actions/warehouses'
import { formatCurrency } from '@/lib/utils'

type InventoryReportData = Awaited<ReturnType<typeof getInventoryReport>>
type Warehouse = { id: string; code: string; name: string }

/**
 * 庫存報表頁面
 */
export default function InventoryReportPage() {
  const [isPending, startTransition] = useTransition()
  const [warehouseId, setWarehouseId] = useState<string>('all')
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [reportData, setReportData] = useState<InventoryReportData | null>(null)

  useEffect(() => {
    // 載入倉庫列表
    getWarehouses({ pageSize: 100 }).then((result) => {
      setWarehouses(
        result.data.map((w: (typeof result.data)[number]) => ({
          id: w.id,
          code: w.code,
          name: w.name,
        }))
      )
    })
  }, [])

  useEffect(() => {
    const loadReport = () => {
      startTransition(async () => {
        const data = await getInventoryReport({
          warehouseId: warehouseId === 'all' ? undefined : warehouseId,
        })
        setReportData(data)
      })
    }
    loadReport()
  }, [warehouseId])

  const loadReport = () => {
    startTransition(async () => {
      const data = await getInventoryReport({
        warehouseId: warehouseId === 'all' ? undefined : warehouseId,
      })
      setReportData(data)
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader title="庫存報表" description="查看庫存狀況與分析">
        <div className="flex items-center gap-2">
          <Select value={warehouseId} onValueChange={setWarehouseId}>
            <SelectTrigger className="w-[180px]">
              <Warehouse className="h-4 w-4 mr-2" />
              <SelectValue placeholder="選擇倉庫" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部倉庫</SelectItem>
              {warehouses.map((wh) => (
                <SelectItem key={wh.id} value={wh.id}>
                  {wh.name}
                </SelectItem>
              ))}
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
            <CardTitle className="text-sm font-medium">庫存總量</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(reportData?.summary.totalQuantity || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {reportData?.summary.productCount || 0} 種商品
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">可用庫存</CardTitle>
            <Package className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(reportData?.summary.availableQuantity || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              保留: {(reportData?.summary.reservedQty || 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">庫存價值</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(reportData?.summary.totalValue || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">低庫存警告</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {reportData?.lowStockProducts.length || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">需要補貨</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 低庫存商品 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              低庫存商品
            </CardTitle>
            <CardDescription>庫存低於安全庫存的商品</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>商品</TableHead>
                  <TableHead>倉庫</TableHead>
                  <TableHead className="text-right">庫存</TableHead>
                  <TableHead className="text-right">安全庫存</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData?.lowStockProducts.map(
                  (item: NonNullable<typeof reportData>['lowStockProducts'][number]) => (
                    <TableRow key={`${item.productId}-${item.warehouseCode}`}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.productName}</div>
                          <div className="text-xs text-muted-foreground">{item.productCode}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.warehouseName}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={
                            item.quantity <= 0 ? 'text-red-500 font-bold' : 'text-yellow-600'
                          }
                        >
                          {item.quantity}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {item.safetyStock}
                      </TableCell>
                    </TableRow>
                  )
                )}
                {(!reportData?.lowStockProducts || reportData.lowStockProducts.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      <div className="flex flex-col items-center py-4">
                        <Package className="h-8 w-8 mb-2 text-green-500" />
                        <span>庫存充足，無需補貨</span>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* 倉庫庫存分布 */}
        <Card>
          <CardHeader>
            <CardTitle>倉庫庫存分布</CardTitle>
            <CardDescription>各倉庫庫存佔比</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {reportData?.warehouseInventory.map(
              (wh: NonNullable<typeof reportData>['warehouseInventory'][number]) => {
                const total = reportData.summary.totalQuantity || 1
                const percentage = (wh.totalQuantity / total) * 100
                return (
                  <div key={wh.warehouseId} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{wh.warehouseName}</span>
                      <span className="text-muted-foreground">
                        {wh.totalQuantity.toLocaleString()} ({wh.productCount} 品項)
                      </span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                )
              }
            )}
            {(!reportData?.warehouseInventory || reportData.warehouseInventory.length === 0) && (
              <div className="text-center text-muted-foreground py-8">暫無資料</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
