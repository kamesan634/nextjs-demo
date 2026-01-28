import { Suspense } from 'react'
import { getSalesTrend } from '@/actions/comparison-reports'
import { PageHeader } from '@/components/layout'
import { FormLoading } from '@/components/forms'
import { ComparisonChart } from './comparison-chart'

export const metadata = {
  title: '同期比較',
}

export default async function ComparisonReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="同期比較" description="比較不同時期的銷售數據" />

      <Suspense fallback={<FormLoading message="載入比較資料中..." />}>
        <ComparisonData />
      </Suspense>
    </div>
  )
}

async function ComparisonData() {
  const trends = await getSalesTrend(12)

  return <ComparisonChart initialTrends={trends} />
}
