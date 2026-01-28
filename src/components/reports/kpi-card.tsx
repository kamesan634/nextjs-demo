import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowDown, ArrowUp, LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface KPICardProps {
  title: string
  value: string | number
  change?: number
  icon?: LucideIcon
  className?: string
}

/**
 * KPI 卡片元件
 */
export function KPICard({ title, value, change, icon: Icon, className }: KPICardProps) {
  const hasChange = typeof change === 'number'
  const isPositive = hasChange && change > 0
  const isNegative = hasChange && change < 0

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {hasChange && (
          <p
            className={cn(
              'text-xs flex items-center gap-1 mt-1',
              isPositive && 'text-green-600',
              isNegative && 'text-red-600'
            )}
          >
            {isPositive && <ArrowUp className="h-3 w-3" />}
            {isNegative && <ArrowDown className="h-3 w-3" />}
            <span>
              {isPositive && '+'}
              {change.toFixed(1)}% 相較上期
            </span>
          </p>
        )}
      </CardContent>
    </Card>
  )
}
