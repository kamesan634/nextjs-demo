'use client'

import { useRouter } from 'next/navigation'
import {
  BarChart3,
  TrendingUp,
  Package,
  ShoppingCart,
  DollarSign,
  FileText,
  ArrowRight,
} from 'lucide-react'
import { PageHeader } from '@/components/layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * 報表中心首頁
 * 提供各類報表的入口
 */
export default function ReportsPage() {
  const router = useRouter()

  const reportModules = [
    {
      id: 'sales',
      title: '銷售報表',
      description: '查看銷售數據、熱銷商品、付款方式統計等',
      icon: ShoppingCart,
      href: '/reports/sales',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      id: 'inventory',
      title: '庫存報表',
      description: '查看庫存狀況、低庫存警告、倉庫分布等',
      icon: Package,
      href: '/reports/inventory',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      id: 'purchase',
      title: '採購報表',
      description: '查看採購統計、供應商排名、採購趨勢等',
      icon: FileText,
      href: '/reports/purchase',
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
    {
      id: 'profit',
      title: '利潤分析',
      description: '查看毛利分析、商品利潤排名、分類利潤等',
      icon: DollarSign,
      href: '/reports/profit',
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="報表中心" description="查看各類營運報表與數據分析" />

      {/* 報表模組卡片 */}
      <div className="grid gap-6 md:grid-cols-2">
        {reportModules.map((module) => {
          const Icon = module.icon
          return (
            <Card
              key={module.id}
              className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
              onClick={() => router.push(module.href)}
            >
              <CardHeader className="flex flex-row items-center gap-4">
                <div className={`p-3 rounded-lg ${module.bgColor}`}>
                  <Icon className={`h-6 w-6 ${module.color}`} />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">{module.title}</CardTitle>
                  <CardDescription className="mt-1">{module.description}</CardDescription>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
            </Card>
          )
        })}
      </div>

      {/* 快速統計 */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">快速概覽</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <QuickStatCard title="本月營業額" icon={TrendingUp} href="/reports/sales" />
          <QuickStatCard title="低庫存商品" icon={Package} href="/reports/inventory" />
          <QuickStatCard title="本月採購額" icon={FileText} href="/reports/purchase" />
          <QuickStatCard title="毛利率" icon={BarChart3} href="/reports/profit" />
        </div>
      </div>
    </div>
  )
}

function QuickStatCard({
  title,
  icon: Icon,
  href,
}: {
  title: string
  icon: React.ComponentType<{ className?: string }>
  href: string
}) {
  const router = useRouter()

  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-sm hover:border-primary/30"
      onClick={() => router.push(href)}
    >
      <CardContent className="flex items-center gap-3 p-4">
        <Icon className="h-5 w-5 text-muted-foreground" />
        <span className="text-sm font-medium">{title}</span>
      </CardContent>
    </Card>
  )
}
