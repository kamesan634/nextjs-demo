import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getShift } from '@/actions/cashier-shifts'
import { PageHeader } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Decimal } from '@prisma/client/runtime/library'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

interface ShiftData {
  id: string
  shiftNo: string
  status: string
  shiftDate: Date
  startTime: Date
  endTime: Date | null
  openingCash: Decimal
  closingCash: Decimal | null
  expectedCash: Decimal | null
  difference: Decimal | null
  salesCount: number
  salesTotal: Decimal
  notes: string | null
  user: { id: string; username: string; name: string | null }
  store: { id: string; name: string }
}

const statusMap: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  OPEN: { label: '開啟中', variant: 'default' },
  CLOSED: { label: '已結束', variant: 'secondary' },
}

/**
 * 班別詳情頁
 */
export default async function ShiftDetailPage({ params }: PageProps) {
  const { id } = await params
  const result = await getShift(id)

  if (!result.success || !result.data) {
    notFound()
  }

  const shift = result.data as ShiftData
  const status = statusMap[shift.status] || { label: shift.status, variant: 'outline' as const }

  return (
    <div className="space-y-6">
      <PageHeader title="班別詳情" description={`班別編號：${shift.shiftNo}`}>
        <Button variant="outline" asChild>
          <Link href="/pos/shifts">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回列表
          </Link>
        </Button>
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
                <div className="text-sm text-muted-foreground">班別編號</div>
                <div className="font-medium">{shift.shiftNo}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">狀態</div>
                <div>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">收銀員</div>
                <div className="font-medium">{shift.user.username}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">門市</div>
                <div className="font-medium">{shift.store.name}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">開始時間</div>
                <div className="font-medium">
                  {new Date(shift.startTime).toLocaleString('zh-TW')}
                </div>
              </div>
              {shift.endTime && (
                <div>
                  <div className="text-sm text-muted-foreground">結束時間</div>
                  <div className="font-medium">
                    {new Date(shift.endTime).toLocaleString('zh-TW')}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 現金資訊 */}
        <Card>
          <CardHeader>
            <CardTitle>現金資訊</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">期初現金</div>
                <div className="text-lg font-semibold">
                  NT$ {shift.openingCash.toLocaleString()}
                </div>
              </div>
              {shift.closingCash !== null && (
                <div>
                  <div className="text-sm text-muted-foreground">期末現金</div>
                  <div className="text-lg font-semibold">
                    NT$ {shift.closingCash.toLocaleString()}
                  </div>
                </div>
              )}
              {shift.expectedCash !== null && (
                <div>
                  <div className="text-sm text-muted-foreground">預期現金</div>
                  <div className="text-lg font-semibold">
                    NT$ {shift.expectedCash.toLocaleString()}
                  </div>
                </div>
              )}
              {shift.difference !== null && (
                <div>
                  <div className="text-sm text-muted-foreground">差異</div>
                  <div
                    className={`text-lg font-semibold ${
                      Number(shift.difference) > 0
                        ? 'text-green-600'
                        : Number(shift.difference) < 0
                          ? 'text-red-600'
                          : ''
                    }`}
                  >
                    NT$ {Number(shift.difference).toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 銷售統計 */}
        {shift.status === 'CLOSED' && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>銷售統計</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">銷售筆數</div>
                  <div className="text-lg font-semibold">{shift.salesCount} 筆</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">銷售總額</div>
                  <div className="text-lg font-semibold">
                    NT$ {Number(shift.salesTotal).toLocaleString()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 備註 */}
        {shift.notes && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>備註</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{shift.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
