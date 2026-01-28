import { Suspense } from 'react'
import { getCustomerRFMAnalysis } from '@/actions/customer-analysis'
import { PageHeader } from '@/components/layout'
import { FormLoading } from '@/components/forms'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, TrendingUp, DollarSign, Award } from 'lucide-react'
import { RFMChart } from './rfm-chart'

export const metadata = {
  title: '客戶分析報表',
}

/**
 * 客戶分析報表頁
 */
export default async function CustomerReportPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="客戶分析報表" description="基於 RFM 模型的客戶價值分析" />

      <Suspense fallback={<FormLoading message="載入客戶分析資料中..." />}>
        <CustomerAnalysisData />
      </Suspense>
    </div>
  )
}

async function CustomerAnalysisData() {
  const result = await getCustomerRFMAnalysis()

  return (
    <>
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">總客戶數</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{result.stats.totalCustomers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">活躍客戶</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{result.stats.activeCustomers}</div>
            <p className="text-xs text-muted-foreground">
              {((result.stats.activeCustomers / result.stats.totalCustomers) * 100).toFixed(1)}%
              活躍率
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均消費金額</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${result.stats.averageAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">VIP 客戶</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{result.stats.vipCustomers}</div>
            <p className="text-xs text-muted-foreground">
              {((result.stats.vipCustomers / result.stats.totalCustomers) * 100).toFixed(1)}% 占比
            </p>
          </CardContent>
        </Card>
      </div>

      <RFMChart data={result.customers} />
    </>
  )
}
