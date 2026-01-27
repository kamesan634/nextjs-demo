import { notFound } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import {
  Pencil,
  Phone,
  Mail,
  MapPin,
  Award,
  Calendar,
  CreditCard,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
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
import { getCustomer } from '@/actions/customers'

export const metadata = {
  title: '會員詳情',
}

interface PageProps {
  params: Promise<{
    id: string
  }>
}

/**
 * 會員詳情頁面
 */
export default async function CustomerDetailPage({ params }: PageProps) {
  const { id } = await params
  const customer = await getCustomer(id)

  if (!customer) {
    notFound()
  }

  // 格式化性別
  const formatGender = (gender: string | null) => {
    switch (gender) {
      case 'M':
        return '男'
      case 'F':
        return '女'
      case 'O':
        return '其他'
      default:
        return '未設定'
    }
  }

  // 格式化金額
  const formatCurrency = (amount: number | { toNumber?: () => number }) => {
    const value = typeof amount === 'number' ? amount : amount.toNumber?.() || 0
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  // 格式化訂單狀態
  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge>已完成</Badge>
      case 'PENDING':
        return <Badge variant="outline">待處理</Badge>
      case 'CONFIRMED':
        return <Badge variant="secondary">已確認</Badge>
      case 'CANCELLED':
        return <Badge variant="destructive">已取消</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // 格式化點數類型
  const getPointsTypeLabel = (type: string) => {
    switch (type) {
      case 'EARN':
        return '獲得'
      case 'REDEEM':
        return '兌換'
      case 'EXPIRE':
        return '過期'
      case 'ADJUST':
        return '調整'
      default:
        return type
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="會員詳情"
        description={`檢視會員「${customer.name}」的詳細資料`}
        backHref="/customers"
      >
        <Button asChild>
          <Link href={`/customers/${customer.id}/edit`}>
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
                <CardTitle>{customer.name}</CardTitle>
                <CardDescription>會員編號：{customer.code}</CardDescription>
              </div>
              <Badge variant={customer.isActive ? 'default' : 'secondary'} className="h-6">
                {customer.isActive ? '啟用' : '停用'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">性別</div>
                <div>{formatGender(customer.gender)}</div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  生日
                </div>
                <div>
                  {customer.birthday
                    ? format(new Date(customer.birthday), 'yyyy/MM/dd', { locale: zhTW })
                    : '未設定'}
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" />
                  手機
                </div>
                <div>{customer.phone || '未設定'}</div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" />
                  電子郵件
                </div>
                <div>{customer.email || '未設定'}</div>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  地址
                </div>
                <div>{customer.address || '未設定'}</div>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <div className="text-sm text-muted-foreground">備註</div>
                <div>{customer.notes || '無'}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 會員資訊 */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-500" />
                <CardTitle className="text-lg">{customer.level.name}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-2xl font-bold">
                    {customer.availablePoints.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">可用點數</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{customer.totalPoints.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">累計點數</div>
                </div>
              </div>
              <div className="border-t pt-4">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">累計消費</span>
                </div>
                <div className="text-xl font-semibold">{formatCurrency(customer.totalSpent)}</div>
              </div>
              <div className="border-t pt-4">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">訂單數量</span>
                </div>
                <div className="text-xl font-semibold">{customer._count.orders} 筆</div>
              </div>
              <div className="border-t pt-4">
                <div className="text-sm text-muted-foreground">加入日期</div>
                <div>{format(new Date(customer.joinDate), 'yyyy/MM/dd', { locale: zhTW })}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 最近訂單 */}
      <Card>
        <CardHeader>
          <CardTitle>最近訂單</CardTitle>
          <CardDescription>最近 10 筆訂單紀錄</CardDescription>
        </CardHeader>
        <CardContent>
          {customer.orders.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">尚無訂單紀錄</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>訂單編號</TableHead>
                  <TableHead>日期</TableHead>
                  <TableHead>金額</TableHead>
                  <TableHead>狀態</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customer.orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.orderNo}</TableCell>
                    <TableCell>
                      {format(new Date(order.orderDate), 'yyyy/MM/dd HH:mm', { locale: zhTW })}
                    </TableCell>
                    <TableCell>{formatCurrency(order.totalAmount)}</TableCell>
                    <TableCell>{getOrderStatusBadge(order.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 點數紀錄 */}
      <Card>
        <CardHeader>
          <CardTitle>點數紀錄</CardTitle>
          <CardDescription>最近 10 筆點數異動紀錄</CardDescription>
        </CardHeader>
        <CardContent>
          {customer.pointsLogs.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">尚無點數紀錄</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>日期</TableHead>
                  <TableHead>類型</TableHead>
                  <TableHead className="text-right">點數</TableHead>
                  <TableHead className="text-right">餘額</TableHead>
                  <TableHead>說明</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customer.pointsLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      {format(new Date(log.createdAt), 'yyyy/MM/dd HH:mm', { locale: zhTW })}
                    </TableCell>
                    <TableCell>{getPointsTypeLabel(log.type)}</TableCell>
                    <TableCell className="text-right">
                      <span
                        className={`inline-flex items-center gap-1 ${
                          log.points > 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {log.points > 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {log.points > 0 ? '+' : ''}
                        {log.points.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{log.balance.toLocaleString()}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {log.description || '-'}
                    </TableCell>
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
