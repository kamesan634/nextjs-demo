import { Suspense } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import { Plus, Eye } from 'lucide-react'
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
import { getStockCounts } from '@/actions/inventory'

export const metadata = {
  title: '盤點作業',
}

interface PageProps {
  searchParams: Promise<{
    page?: string
    pageSize?: string
    status?: string
  }>
}

/**
 * 盤點作業頁面
 */
export default async function StockCountsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = Number(params.page) || 1
  const pageSize = Number(params.pageSize) || 10

  return (
    <div className="space-y-6">
      <PageHeader title="盤點作業" description="管理庫存盤點單" backHref="/inventory">
        <Button asChild>
          <Link href="/inventory/stock-counts/new">
            <Plus className="mr-2 h-4 w-4" />
            新建盤點單
          </Link>
        </Button>
      </PageHeader>

      <Suspense fallback={<DataTableSkeleton columnCount={7} rowCount={10} />}>
        <StockCountsTableWrapper page={page} pageSize={pageSize} status={params.status} />
      </Suspense>
    </div>
  )
}

async function StockCountsTableWrapper({
  page,
  pageSize,
  status,
}: {
  page: number
  pageSize: number
  status?: string
}) {
  const data = await getStockCounts({ page, pageSize, status })

  // 格式化狀態
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return { label: '草稿', variant: 'outline' as const }
      case 'IN_PROGRESS':
        return { label: '進行中', variant: 'secondary' as const }
      case 'COMPLETED':
        return { label: '已完成', variant: 'default' as const }
      case 'CANCELLED':
        return { label: '已取消', variant: 'destructive' as const }
      default:
        return { label: status, variant: 'secondary' as const }
    }
  }

  // 格式化盤點類型
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'FULL':
        return '全盤'
      case 'CYCLE':
        return '循環盤'
      case 'SPOT':
        return '抽盤'
      default:
        return type
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>盤點單列表</CardTitle>
        <CardDescription>共 {data.pagination.total} 筆紀錄</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>盤點單號</TableHead>
                <TableHead>倉庫</TableHead>
                <TableHead>類型</TableHead>
                <TableHead>盤點日期</TableHead>
                <TableHead>商品數</TableHead>
                <TableHead>狀態</TableHead>
                <TableHead className="w-[80px]">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    沒有盤點紀錄
                  </TableCell>
                </TableRow>
              ) : (
                data.data.map(
                  (count: {
                    id: string
                    countNo: string
                    warehouse: { name: string }
                    type: string
                    countDate: Date
                    _count: { items: number }
                    status: string
                  }) => {
                    const statusInfo = getStatusLabel(count.status)
                    return (
                      <TableRow key={count.id}>
                        <TableCell className="font-medium">{count.countNo}</TableCell>
                        <TableCell>{count.warehouse.name}</TableCell>
                        <TableCell>{getTypeLabel(count.type)}</TableCell>
                        <TableCell>
                          {format(new Date(count.countDate), 'yyyy/MM/dd', { locale: zhTW })}
                        </TableCell>
                        <TableCell>{count._count.items} 項</TableCell>
                        <TableCell>
                          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/inventory/stock-counts/${count.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                        </TableCell>
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
