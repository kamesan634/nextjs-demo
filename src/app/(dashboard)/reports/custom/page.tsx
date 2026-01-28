import { Suspense } from 'react'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { getCustomReports } from '@/actions/custom-reports'
import { PageHeader } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { FormLoading } from '@/components/forms'
import { ReportTable } from './report-table'

export const metadata = {
  title: '自訂報表',
}

interface PageProps {
  searchParams: Promise<{
    page?: string
    search?: string
  }>
}

export default async function CustomReportsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = parseInt(params.page || '1')
  const search = params.search || ''

  return (
    <div className="space-y-6">
      <PageHeader title="自訂報表" description="建立和管理自訂報表">
        <Button asChild>
          <Link href="/reports/custom/new">
            <Plus className="mr-2 h-4 w-4" />
            新增報表
          </Link>
        </Button>
      </PageHeader>

      <Suspense fallback={<FormLoading message="載入報表列表中..." />}>
        <ReportListData page={page} search={search} />
      </Suspense>
    </div>
  )
}

async function ReportListData({ page, search }: { page: number; search: string }) {
  const { data, pagination } = await getCustomReports({ page, search })

  return <ReportTable reports={data} pagination={pagination} />
}
