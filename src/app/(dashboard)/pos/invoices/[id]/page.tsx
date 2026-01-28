import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getInvoice } from '@/actions/invoices'
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

interface InvoiceData {
  id: string
  invoiceNo: string
  status: string
  invoiceType: string
  issuedAt: Date
  buyerTaxId: string | null
  buyerName: string | null
  carrierType: string | null
  carrierNo: string | null
  amount: Decimal
  taxAmount: Decimal
  totalAmount: Decimal
  voidedAt: Date | null
  voidReason: string | null
  order: {
    id: string
    orderNo: string
    orderDate: Date
    customer: { id: string; name: string; email: string | null; phone: string | null } | null
    store: { id: string; name: string; code: string; address: string | null } | null
    user: { id: string; username: string } | null
    items: Array<{
      id: string
      productName: string
      quantity: number
      unitPrice: Decimal
      product: { id: string; name: string; sku: string }
    }>
  }
}

const statusMap: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  ISSUED: { label: '已開立', variant: 'default' },
  VOIDED: { label: '已作廢', variant: 'destructive' },
}

const typeMap: Record<string, string> = {
  B2B: '三聯式',
  B2C: '二聯式',
}

/**
 * 發票詳情頁
 */
export default async function InvoiceDetailPage({ params }: PageProps) {
  const { id } = await params
  const result = await getInvoice(id)

  if (!result.success || !result.data) {
    notFound()
  }

  const invoice = result.data as InvoiceData
  const status = statusMap[invoice.status] || { label: invoice.status, variant: 'outline' as const }
  const totalAmount = Number(invoice.amount) + Number(invoice.taxAmount || 0)

  return (
    <div className="space-y-6">
      <PageHeader title="發票詳情" description={`發票號碼：${invoice.invoiceNo}`}>
        <Button variant="outline" asChild>
          <Link href="/pos/invoices">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回列表
          </Link>
        </Button>
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 發票資訊 */}
        <Card>
          <CardHeader>
            <CardTitle>發票資訊</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">發票號碼</div>
                <div className="font-medium">{invoice.invoiceNo}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">狀態</div>
                <div>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">發票類型</div>
                <div className="font-medium">
                  {typeMap[invoice.invoiceType] || invoice.invoiceType}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">開立日期</div>
                <div className="font-medium">
                  {new Date(invoice.issuedAt).toLocaleString('zh-TW')}
                </div>
              </div>
              {invoice.buyerTaxId && (
                <div>
                  <div className="text-sm text-muted-foreground">統一編號</div>
                  <div className="font-medium">{invoice.buyerTaxId}</div>
                </div>
              )}
              {invoice.carrierType && (
                <div>
                  <div className="text-sm text-muted-foreground">載具類型</div>
                  <div className="font-medium">{invoice.carrierType}</div>
                </div>
              )}
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
                    href={`/orders/${invoice.order.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    {invoice.order.orderNo}
                  </Link>
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">訂單日期</div>
                <div className="font-medium">
                  {new Date(invoice.order.orderDate).toLocaleDateString('zh-TW')}
                </div>
              </div>
              {invoice.order.customer && (
                <div>
                  <div className="text-sm text-muted-foreground">客戶</div>
                  <div className="font-medium">{invoice.order.customer.name}</div>
                </div>
              )}
              {invoice.order.store && (
                <div>
                  <div className="text-sm text-muted-foreground">門市</div>
                  <div className="font-medium">{invoice.order.store.name}</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 買方資訊 */}
        {invoice.buyerName && (
          <Card>
            <CardHeader>
              <CardTitle>買方資訊</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">買方名稱</div>
                <div className="font-medium">{invoice.buyerName}</div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 金額資訊 */}
        <Card>
          <CardHeader>
            <CardTitle>金額資訊</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">未稅金額</span>
                <span className="font-medium">NT$ {invoice.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">稅額</span>
                <span className="font-medium">
                  NT$ {invoice.taxAmount !== null ? Number(invoice.taxAmount).toLocaleString() : 0}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="font-semibold">總金額</span>
                <span className="text-lg font-bold">NT$ {totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 作廢資訊 */}
        {invoice.status === 'VOIDED' && invoice.voidReason && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>作廢資訊</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">作廢日期</div>
                  <div className="font-medium">
                    {invoice.voidedAt ? new Date(invoice.voidedAt).toLocaleString('zh-TW') : '-'}
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="text-sm text-muted-foreground">作廢原因</div>
                  <div className="font-medium whitespace-pre-wrap">{invoice.voidReason}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 訂單明細 */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>訂單明細</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {invoice.order.items.map((item) => (
                <div key={item.id} className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">{item.productName}</div>
                    <div className="text-sm text-muted-foreground">
                      NT$ {Number(item.unitPrice).toLocaleString()} × {item.quantity}
                    </div>
                  </div>
                  <div className="font-medium">
                    NT$ {(Number(item.unitPrice) * item.quantity).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
