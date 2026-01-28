import { notFound } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import {
  Pencil,
  Phone,
  Mail,
  MapPin,
  Building2,
  CreditCard,
  FileText,
  Package,
  Banknote,
  Clock,
} from 'lucide-react'
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
import { getSupplier } from '@/actions/suppliers'

export const metadata = {
  title: '供應商詳情',
}

interface PageProps {
  params: Promise<{
    id: string
  }>
}

/**
 * 供應商詳情頁面
 */
export default async function SupplierDetailPage({ params }: PageProps) {
  const { id } = await params
  const supplier = await getSupplier(id)

  if (!supplier) {
    notFound()
  }

  // 格式化金額
  const formatCurrency = (amount: number | { toNumber?: () => number } | null) => {
    if (amount === null) return '-'
    const value = typeof amount === 'number' ? amount : amount.toNumber?.() || 0
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  // 格式化採購單狀態
  const getPurchaseOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge>已完成</Badge>
      case 'PENDING':
        return <Badge variant="outline">待處理</Badge>
      case 'APPROVED':
        return <Badge variant="secondary">已核准</Badge>
      case 'ORDERED':
        return <Badge variant="secondary">已下單</Badge>
      case 'PARTIAL':
        return <Badge variant="secondary">部分入庫</Badge>
      case 'CANCELLED':
        return <Badge variant="destructive">已取消</Badge>
      case 'DRAFT':
        return <Badge variant="outline">草稿</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="供應商詳情"
        description={`檢視供應商「${supplier.name}」的詳細資料`}
        backHref="/suppliers"
      >
        <Button asChild>
          <Link href={`/suppliers/${supplier.id}/edit`}>
            <Pencil className="mr-2 h-4 w-4" />
            編輯
          </Link>
        </Button>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 基本資料 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{supplier.name}</CardTitle>
                <CardDescription>
                  代碼：{supplier.code}
                  {supplier.shortName && ` · 簡稱：${supplier.shortName}`}
                </CardDescription>
              </div>
              <Badge variant={supplier.isActive ? 'default' : 'secondary'} className="h-6">
                {supplier.isActive ? '啟用' : '停用'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5" />
                  統一編號
                </div>
                <div>{supplier.taxId || '未設定'}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">聯絡人</div>
                <div>{supplier.contactPerson || '未設定'}</div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" />
                  電話
                </div>
                <div>{supplier.phone || '未設定'}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">傳真</div>
                <div>{supplier.fax || '未設定'}</div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" />
                  電子郵件
                </div>
                <div>{supplier.email || '未設定'}</div>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  地址
                </div>
                <div>{supplier.address || '未設定'}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 交易條件 */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">交易條件</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">付款天數</span>
              </div>
              <div className="text-xl font-semibold">{supplier.paymentTerms} 天</div>

              <div className="border-t pt-4">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">信用額度</span>
                </div>
                <div className="text-xl font-semibold">{formatCurrency(supplier.creditLimit)}</div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center gap-2">
                  <Banknote className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">銀行資訊</span>
                </div>
                <div className="mt-1 text-sm">
                  {supplier.bankName || supplier.bankAccount ? (
                    <>
                      <div>{supplier.bankName || '-'}</div>
                      <div className="text-muted-foreground">{supplier.bankAccount || '-'}</div>
                    </>
                  ) : (
                    '未設定'
                  )}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">關聯數量</span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <div className="text-lg font-semibold">{supplier._count.purchaseOrders}</div>
                    <div className="text-muted-foreground">採購單</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold">{supplier._count.prices}</div>
                    <div className="text-muted-foreground">商品報價</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {supplier.notes && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">備註</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{supplier.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* 商品報價 */}
      <Card>
        <CardHeader>
          <CardTitle>商品報價</CardTitle>
          <CardDescription>此供應商提供的商品與價格（最近 20 筆）</CardDescription>
        </CardHeader>
        <CardContent>
          {supplier.prices.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">尚無商品報價紀錄</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>商品編號</TableHead>
                  <TableHead>商品名稱</TableHead>
                  <TableHead className="text-right">進貨價格</TableHead>
                  <TableHead className="text-right">最小訂購量</TableHead>
                  <TableHead className="text-right">交貨天數</TableHead>
                  <TableHead>首選</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {supplier.prices.map((price: (typeof supplier.prices)[number]) => (
                  <TableRow key={price.id}>
                    <TableCell className="font-medium">{price.product.sku}</TableCell>
                    <TableCell>{price.product.name}</TableCell>
                    <TableCell className="text-right">{formatCurrency(price.price)}</TableCell>
                    <TableCell className="text-right">{price.minQty}</TableCell>
                    <TableCell className="text-right">{price.leadTime} 天</TableCell>
                    <TableCell>
                      {price.isPreferred && <Badge variant="secondary">首選</Badge>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 最近採購單 */}
      <Card>
        <CardHeader>
          <CardTitle>最近採購單</CardTitle>
          <CardDescription>最近 10 筆採購單紀錄</CardDescription>
        </CardHeader>
        <CardContent>
          {supplier.purchaseOrders.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">尚無採購單紀錄</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>採購單號</TableHead>
                  <TableHead>日期</TableHead>
                  <TableHead className="text-right">金額</TableHead>
                  <TableHead>狀態</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {supplier.purchaseOrders.map((order: (typeof supplier.purchaseOrders)[number]) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.orderNo}</TableCell>
                    <TableCell>
                      {format(new Date(order.orderDate), 'yyyy/MM/dd', { locale: zhTW })}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(order.totalAmount)}
                    </TableCell>
                    <TableCell>{getPurchaseOrderStatusBadge(order.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
