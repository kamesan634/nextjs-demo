'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { segmentInfo, type CustomerRFMScore } from '@/lib/rfm-analysis'

interface RFMChartProps {
  data: CustomerRFMScore[]
}

export function RFMChart({ data }: RFMChartProps) {
  // 按分群統計
  const segmentCounts = data.reduce(
    (acc, customer) => {
      acc[customer.segment] = (acc[customer.segment] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  // 排序客戶 (按總分排序)
  const sortedCustomers = [...data].sort((a, b) => {
    const scoreA = a.recencyScore + a.frequencyScore + a.monetaryScore
    const scoreB = b.recencyScore + b.frequencyScore + b.monetaryScore
    return scoreB - scoreA
  })

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>客戶分群統計</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {Object.entries(segmentCounts).map(([segment, count]) => {
              const info = segmentInfo[segment]
              return (
                <div key={segment} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{info.label}</span>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{info.description}</p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>客戶 RFM 詳細資料</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>客戶名稱</TableHead>
                <TableHead>上次消費日</TableHead>
                <TableHead className="text-right">消費次數</TableHead>
                <TableHead className="text-right">總消費金額</TableHead>
                <TableHead className="text-center">R 分數</TableHead>
                <TableHead className="text-center">F 分數</TableHead>
                <TableHead className="text-center">M 分數</TableHead>
                <TableHead>客戶分群</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedCustomers.map((customer) => {
                const info = segmentInfo[customer.segment]
                return (
                  <TableRow key={customer.customerId}>
                    <TableCell className="font-medium">{customer.customerName}</TableCell>
                    <TableCell>
                      {customer.lastPurchaseDate
                        ? new Date(customer.lastPurchaseDate).toLocaleDateString('zh-TW')
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right">{customer.purchaseCount}</TableCell>
                    <TableCell className="text-right">
                      ${customer.totalAmount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={customer.recencyScore >= 4 ? 'default' : 'outline'}>
                        {customer.recencyScore}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={customer.frequencyScore >= 4 ? 'default' : 'outline'}>
                        {customer.frequencyScore}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={customer.monetaryScore >= 4 ? 'default' : 'outline'}>
                        {customer.monetaryScore}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={info.color}>{info.label}</span>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
