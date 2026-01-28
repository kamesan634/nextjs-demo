import { Suspense } from 'react'
import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import { PageHeader } from '@/components/layout'
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
import { getInventoryMovements } from '@/actions/inventory'

export const metadata = {
  title: '庫存異動紀錄',
}

interface PageProps {
  searchParams: Promise<{
    page?: string
    pageSize?: string
    productId?: string
    movementType?: string
  }>
}

/**
 * 庫存異動紀錄頁面
 */
export default async function MovementsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = Number(params.page) || 1
  const pageSize = Number(params.pageSize) || 20

  return (
    <div className="space-y-6">
      <PageHeader title="庫存異動紀錄" description="查看所有庫存異動歷史" backHref="/inventory" />

      <Suspense fallback={<DataTableSkeleton columnCount={8} rowCount={10} />}>
        <MovementsTableWrapper
          page={page}
          pageSize={pageSize}
          productId={params.productId}
          movementType={params.movementType}
        />
      </Suspense>
    </div>
  )
}

async function MovementsTableWrapper({
  page,
  pageSize,
  productId,
  movementType,
}: {
  page: number
  pageSize: number
  productId?: string
  movementType?: string
}) {
  const data = await getInventoryMovements({
    page,
    pageSize,
    productId,
    movementType,
  })

  // 格式化異動類型
  const getMovementTypeLabel = (type: string) => {
    switch (type) {
      case 'IN':
        return { label: '入庫', variant: 'default' as const }
      case 'OUT':
        return { label: '出庫', variant: 'destructive' as const }
      case 'ADJUST':
        return { label: '調整', variant: 'outline' as const }
      case 'TRANSFER':
        return { label: '調撥', variant: 'secondary' as const }
      default:
        return { label: type, variant: 'secondary' as const }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>異動紀錄</CardTitle>
        <CardDescription>共 {data.pagination.total} 筆紀錄</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>時間</TableHead>
                <TableHead>商品</TableHead>
                <TableHead>異動類型</TableHead>
                <TableHead className="text-right">異動數量</TableHead>
                <TableHead className="text-right">異動前</TableHead>
                <TableHead className="text-right">異動後</TableHead>
                <TableHead>來源單據</TableHead>
                <TableHead>原因/備註</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    沒有異動紀錄
                  </TableCell>
                </TableRow>
              ) : (
                data.data.map(
                  (mov: {
                    id: string
                    createdAt: Date
                    product: { name: string; sku: string }
                    movementType: string
                    quantity: number
                    beforeQty: number
                    afterQty: number
                    referenceType: string | null
                    referenceId: string | null
                    reason: string | null
                    notes: string | null
                  }) => {
                    const typeInfo = getMovementTypeLabel(mov.movementType)
                    return (
                      <TableRow key={mov.id}>
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(mov.createdAt), 'yyyy/MM/dd HH:mm', { locale: zhTW })}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{mov.product.name}</div>
                            <div className="text-xs text-muted-foreground">{mov.product.sku}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={typeInfo.variant}>{typeInfo.label}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={mov.quantity > 0 ? 'text-green-600' : 'text-red-600'}>
                            {mov.quantity > 0 ? '+' : ''}
                            {mov.quantity}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">{mov.beforeQty}</TableCell>
                        <TableCell className="text-right">{mov.afterQty}</TableCell>
                        <TableCell>
                          {mov.referenceType && mov.referenceId ? (
                            <span className="text-xs">
                              {mov.referenceType}: {mov.referenceId}
                            </span>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-muted-foreground">
                          {mov.reason || mov.notes || '-'}
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
