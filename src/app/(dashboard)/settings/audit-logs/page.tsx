import { Suspense } from 'react'
import { getAuditLogs } from '@/actions/audit-logs'
import { PageHeader } from '@/components/layout'
import { FormLoading } from '@/components/forms'
import { AuditLogTable } from './audit-log-table'

export const metadata = {
  title: '操作日誌',
}

interface PageProps {
  searchParams: Promise<{
    page?: string
    search?: string
    action?: string
    module?: string
    startDate?: string
    endDate?: string
  }>
}

export default async function AuditLogsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = parseInt(params.page || '1')
  const search = params.search || ''
  const action = params.action
  const moduleFilter = params.module
  const startDate = params.startDate ? new Date(params.startDate) : undefined
  const endDate = params.endDate ? new Date(params.endDate) : undefined

  return (
    <div className="space-y-6">
      <PageHeader title="操作日誌" description="查看系統操作記錄" />

      <Suspense fallback={<FormLoading message="載入操作日誌中..." />}>
        <AuditLogListData
          page={page}
          search={search}
          action={action}
          module={moduleFilter}
          startDate={startDate}
          endDate={endDate}
        />
      </Suspense>
    </div>
  )
}

async function AuditLogListData({
  page,
  search,
  action,
  module,
  startDate,
  endDate,
}: {
  page: number
  search: string
  action?: string
  module?: string
  startDate?: Date
  endDate?: Date
}) {
  const { data, pagination } = await getAuditLogs({
    page,
    search,
    action: action as 'CREATE' | 'UPDATE' | 'DELETE' | undefined,
    module,
    startDate,
    endDate,
  })

  return <AuditLogTable logs={data} pagination={pagination} />
}
