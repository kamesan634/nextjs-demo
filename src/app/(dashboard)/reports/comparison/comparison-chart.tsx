'use client'

import { useState, useTransition } from 'react'
import {
  ArrowUp,
  ArrowDown,
  Minus,
  TrendingUp,
  ShoppingCart,
  DollarSign,
  Users,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { TrendChart } from '@/components/reports/trend-chart'
import { PeriodSelector } from '@/components/reports/period-selector'
import { getComparisonData } from '@/actions/comparison-reports'

interface ComparisonChartProps {
  initialTrends: { month: string; sales: number; orders: number; profit: number }[]
}

type MetricType = 'sales' | 'orders' | 'profit' | 'customers'

const metrics: { value: MetricType; label: string; icon: React.ReactNode }[] = [
  { value: 'sales', label: '銷售額', icon: <DollarSign className="h-4 w-4" /> },
  { value: 'orders', label: '訂單數', icon: <ShoppingCart className="h-4 w-4" /> },
  { value: 'profit', label: '毛利', icon: <TrendingUp className="h-4 w-4" /> },
  { value: 'customers', label: '新客戶', icon: <Users className="h-4 w-4" /> },
]

const ChangeIndicator = ({ change }: { change: number }) => {
  if (change > 0) {
    return (
      <Badge variant="default" className="bg-green-500">
        <ArrowUp className="mr-1 h-3 w-3" />+{change.toFixed(2)}%
      </Badge>
    )
  }
  if (change < 0) {
    return (
      <Badge variant="destructive">
        <ArrowDown className="mr-1 h-3 w-3" />
        {change.toFixed(2)}%
      </Badge>
    )
  }
  return (
    <Badge variant="secondary">
      <Minus className="mr-1 h-3 w-3" />
      0%
    </Badge>
  )
}

export function ComparisonChart({ initialTrends }: ComparisonChartProps) {
  const [isPending, startTransition] = useTransition()
  const [metric, setMetric] = useState<MetricType>('sales')
  const [period1, setPeriod1] = useState<{ startDate: Date; endDate: Date }>({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
    endDate: new Date(new Date().getFullYear(), new Date().getMonth(), 0),
  })
  const [period2, setPeriod2] = useState<{ startDate: Date; endDate: Date }>({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    endDate: new Date(),
  })
  const [comparisonResult, setComparisonResult] = useState<{
    period1: { value: number; count: number }
    period2: { value: number; count: number }
    change: number
  } | null>(null)

  const handleCompare = () => {
    startTransition(async () => {
      const result = await getComparisonData({
        period1Start: period1.startDate,
        period1End: period1.endDate,
        period2Start: period2.startDate,
        period2End: period2.endDate,
        metric,
      })
      setComparisonResult({
        period1: { value: result.period1.value, count: result.period1.count },
        period2: { value: result.period2.value, count: result.period2.count },
        change: result.change,
      })
    })
  }

  const formatValue = (value: number) => {
    if (metric === 'sales' || metric === 'profit') {
      return `NT$ ${value.toLocaleString()}`
    }
    return value.toLocaleString()
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>比較設定</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">比較指標</label>
              <Select value={metric} onValueChange={(v) => setMetric(v as MetricType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {metrics.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      <div className="flex items-center">
                        {m.icon}
                        <span className="ml-2">{m.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">期間 1</label>
              <PeriodSelector
                onChange={(start, end) =>
                  setPeriod1({ startDate: new Date(start), endDate: new Date(end) })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">期間 2</label>
              <PeriodSelector
                onChange={(start, end) =>
                  setPeriod2({ startDate: new Date(start), endDate: new Date(end) })
                }
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleCompare} disabled={isPending} className="w-full">
                {isPending ? '比較中...' : '開始比較'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {comparisonResult && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">期間 1</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatValue(comparisonResult.period1.value)}
              </div>
              <p className="text-sm text-muted-foreground">
                {period1.startDate.toLocaleDateString('zh-TW')} -{' '}
                {period1.endDate.toLocaleDateString('zh-TW')}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">期間 2</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatValue(comparisonResult.period2.value)}
              </div>
              <p className="text-sm text-muted-foreground">
                {period2.startDate.toLocaleDateString('zh-TW')} -{' '}
                {period2.endDate.toLocaleDateString('zh-TW')}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">變化</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <ChangeIndicator change={comparisonResult.change} />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">相較於期間 1</p>
            </CardContent>
          </Card>
        </div>
      )}

      <TrendChart
        title="銷售趨勢 (近 12 個月)"
        description="每月銷售額和訂單數"
        data={initialTrends}
        xKey="month"
        lines={[
          { key: 'sales', name: '銷售額', color: '#0088FE' },
          { key: 'orders', name: '訂單數', color: '#00C49F' },
        ]}
        height={350}
      />
    </div>
  )
}
