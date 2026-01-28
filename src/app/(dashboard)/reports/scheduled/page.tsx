import { Suspense } from 'react'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { getScheduledReports } from '@/actions/scheduled-reports'
import { PageHeader } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { FormLoading } from '@/components/forms'
import { ScheduleTable } from './schedule-table'

export const metadata = {
  title: '排程報表',
}

interface PageProps {
  searchParams: Promise<{
    page?: string
    reportId?: string
  }>
}

export default async function ScheduledReportsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = parseInt(params.page || '1')
  const reportId = params.reportId

  return (
    <div className="space-y-6">
      <PageHeader title="排程報表" description="管理報表自動執行排程">
        <Button asChild>
          <Link href="/reports/scheduled/new">
            <Plus className="mr-2 h-4 w-4" />
            新增排程
          </Link>
        </Button>
      </PageHeader>

      <Suspense fallback={<FormLoading message="載入排程列表中..." />}>
        <ScheduleListData page={page} reportId={reportId} />
      </Suspense>
    </div>
  )
}

async function ScheduleListData({ page, reportId }: { page: number; reportId?: string }) {
  const { data, pagination } = await getScheduledReports({ page, reportId })

  return <ScheduleTable schedules={data} pagination={pagination} />
}
