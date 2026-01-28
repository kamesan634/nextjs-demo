import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react'
import { getRefund } from '@/actions/refunds'
import { PageHeader } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Decimal } from '@prisma/client/runtime/library'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

interface RefundData {
  id: string
  refundNo: string
  status: string
  type: string
  reason: string
  createdAt: Date
  subtotal: Decimal
  refundAmount: Decimal
  notes: string | null
  approvalStatus: string | null
  approvedAt: Date | null
  order: {
    id: string
    orderNo: string
    orderDate: Date
    customer: { id: string; name: string } | null
    store: { id: string; name: string } | null
  }
  items: Array<{
    id: string
    productName: string
    quantity: number
    unitPrice: Decimal
    reason: string | null
    product: { id: string; name: string; sku: string; imageUrl: string | null }
  }>
}

const statusMap: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  PENDING: { label: '待處理', variant: 'outline' },
  APPROVED: { label: '已核准', variant: 'default' },
  COMPLETED: { label: '已完成', variant: 'secondary' },
  REJECTED: { label: '已駁回', variant: 'destructive' },
}

const typeMap: Record<string, { label: string; variant: 'default' | 'secondary' }> = {
  REFUND: { label: '退貨', variant: 'default' },
  EXCHANGE: { label: '換貨', variant: 'secondary' },
}

/**
 * 退換貨詳情頁
 */
export default async function RefundDetailPage({ params }: PageProps) {
  const { id } = await params
  const result = await getRefund(id)

  if (!result.success || !result.data) {
    notFound()
  }

  const refund = result.data as RefundData
  const status = statusMap[refund.status] || { label: refund.status, variant: 'outline' as const }
  const type = typeMap[refund.type] || { label: refund.type, variant: 'default' as const }

  return (
    <div className="space-y-6">
      <PageHeader title="退換貨詳情" description={`退貨單號：${refund.refundNo}`}>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/orders/refunds">
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回列表
            </Link>
          </Button>
          {refund.status === 'PENDING' && (
            <>
              <Button variant="default">
                <CheckCircle className="mr-2 h-4 w-4" />
                核准
              </Button>
              <Button variant="destructive">
                <XCircle className="mr-2 h-4 w-4" />
                駁回
              </Button>
            </>
          )}
        </div>
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 基本資訊 */}
        <Card>
          <CardHeader>
            <CardTitle>基本資訊</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">退貨單號</div>
                <div className="font-medium">{refund.refundNo}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">狀態</div>
                <div>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">類型</div>
                <div>
                  <Badge variant={type.variant}>{type.label}</Badge>
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">退貨日期</div>
                <div className="font-medium">
                  {new Date(refund.createdAt).toLocaleDateString('zh-TW')}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 訂單資訊 */}
        <Card>
          <CardHeader>
            <CardTitle>訂單資訊</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">訂單編號</div>
                <div className="font-medium">
                  <Link
                    href={`/orders/${refund.order.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    {refund.order.orderNo}
                  </Link>
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">訂單日期</div>
                <div className="font-medium">
                  {new Date(refund.order.orderDate).toLocaleDateString('zh-TW')}
                </div>
              </div>
              {refund.order.customer && (
                <div>
                  <div className="text-sm text-muted-foreground">客戶</div>
                  <div className="font-medium">{refund.order.customer.name}</div>
                </div>
              )}
              {refund.order.store && (
                <div>
                  <div className="text-sm text-muted-foreground">門市</div>
                  <div className="font-medium">{refund.order.store.name}</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 退貨原因 */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>退貨原因</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{refund.reason}</p>
          </CardContent>
        </Card>

        {/* 退貨明細 */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>退貨明細</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {refund.items.map((item) => (
                <div key={item.id} className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-medium">{item.productName}</div>
                    <div className="text-sm text-muted-foreground">SKU: {item.product.sku}</div>
                    {item.reason && (
                      <div className="text-sm text-muted-foreground mt-1">原因: {item.reason}</div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      NT$ {(Number(item.unitPrice) * item.quantity).toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      NT$ {Number(item.unitPrice).toLocaleString()} × {item.quantity}
                    </div>
                  </div>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between items-center pt-2">
                <span className="font-semibold">退貨小計</span>
                <span className="font-semibold">
                  NT$ {Number(refund.subtotal).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold">退款金額</span>
                <span className="text-lg font-bold text-red-600">
                  NT$ {Number(refund.refundAmount).toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 核准資訊 */}
        {refund.approvedAt && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>核准資訊</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">核准狀態</div>
                  <div className="font-medium">
                    <Badge
                      variant={refund.approvalStatus === 'APPROVED' ? 'default' : 'destructive'}
                    >
                      {refund.approvalStatus === 'APPROVED' ? '已核准' : '已駁回'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">核准時間</div>
                  <div className="font-medium">
                    {new Date(refund.approvedAt).toLocaleString('zh-TW')}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 備註 */}
        {refund.notes && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>備註</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{refund.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
