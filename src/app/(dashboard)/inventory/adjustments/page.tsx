import { Suspense } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import { Plus } from 'lucide-react'
import { PageHeader } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DataTableSkeleton } from '@/components/data-table/data-table-skeleton'
import { getStockAdjustments } from '@/actions/inventory'

export const metadata = {
  title: '庫存調整',
}

interface PageProps {
  searchParams: Promise<{
    page?: string
    pageSize?: string
  }>
}

/**
 * 庫存調整紀錄頁面
 */
export default async function AdjustmentsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = Number(params.page) || 1
  const pageSize = Number(params.pageSize) || 10

  return (
    <div className="space-y-6">
      <PageHeader title="庫存調整" description="查看庫存調整紀錄" backHref="/inventory">
        <Button asChild>
          <Link href="/inventory/adjustments/new">
            <Plus className="mr-2 h-4 w-4" />
            新增調整
          </Link>
        </Button>
      </PageHeader>

      <Suspense fallback={<DataTableSkeleton columnCount={7} rowCount={10} />}>
        <AdjustmentsTableWrapper page={page} pageSize={pageSize} />
      </Suspense>
    </div>
  )
}

async function AdjustmentsTableWrapper({ page, pageSize }: { page: number; pageSize: number }) {
  const data = await getStockAdjustments({ page, pageSize })

  // 格式化調整類型
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'ADD':
        return { label: '盤盈', variant: 'default' as const }
      case 'SUBTRACT':
        return { label: '盤虧', variant: 'destructive' as const }
      case 'DAMAGE':
        return { label: '報損', variant: 'outline' as const }
      default:
        return { label: type, variant: 'secondary' as const }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>調整紀錄</CardTitle>
        <CardDescription>共 {data.pagination.total} 筆紀錄</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>調整單號</TableHead>
                <TableHead>日期</TableHead>
                <TableHead>商品</TableHead>
                <TableHead>類型</TableHead>
                <TableHead className="text-right">調整數量</TableHead>
                <TableHead className="text-right">調整後</TableHead>
                <TableHead>原因</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    沒有調整紀錄
                  </TableCell>
                </TableRow>
              ) : (
                data.data.map(
                  (adj: {
                    id: string
                    adjustmentNo: string
                    createdAt: Date
                    product: { name: string; sku: string }
                    type: string
                    quantity: number
                    beforeQty: number
                    afterQty: number
                    reason: string | null
                  }) => {
                    const typeInfo = getTypeLabel(adj.type)
                    return (
                      <TableRow key={adj.id}>
                        <TableCell className="font-medium">{adj.adjustmentNo}</TableCell>
                        <TableCell>
                          {format(new Date(adj.createdAt), 'yyyy/MM/dd HH:mm', { locale: zhTW })}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{adj.product.name}</div>
                            <div className="text-xs text-muted-foreground">{adj.product.sku}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={typeInfo.variant}>{typeInfo.label}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={adj.type === 'ADD' ? 'text-green-600' : 'text-red-600'}>
                            {adj.type === 'ADD' ? '+' : '-'}
                            {adj.quantity}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {adj.beforeQty} → {adj.afterQty}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{adj.reason || '-'}</TableCell>
                      </TableRow>
                    )
                  }
                )
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
