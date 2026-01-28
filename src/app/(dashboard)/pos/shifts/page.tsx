import { Suspense } from 'react'
import { getShifts } from '@/actions/cashier-shifts'
import { PageHeader } from '@/components/layout'
import { FormLoading } from '@/components/forms'
import { ShiftTable, type ShiftListItem } from './shift-table'
import type { PaginationInfo } from '@/types'

interface ShiftsData {
  shifts: ShiftListItem[]
  pagination: PaginationInfo
}

export const metadata = {
  title: '班別管理',
}

interface PageProps {
  searchParams: Promise<{
    page?: string
    search?: string
    status?: string
  }>
}

/**
 * 班別管理列表頁
 */
export default async function ShiftsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = parseInt(params.page || '1')
  const search = params.search || ''
  const status = params.status as 'OPEN' | 'CLOSED' | undefined

  return (
    <div className="space-y-6">
      <PageHeader title="班別管理" description="管理收銀班別紀錄" />

      <Suspense fallback={<FormLoading message="載入班別列表中..." />}>
        <ShiftTableData page={page} search={search} status={status} />
      </Suspense>
    </div>
  )
}

async function ShiftTableData({
  page,
  search,
  status,
}: {
  page: number
  search: string
  status?: 'OPEN' | 'CLOSED'
}) {
  const result = await getShifts({ page, pageSize: 20, status })

  if (!result.success || !result.data) {
    return <div className="text-center text-muted-foreground py-8">載入失敗</div>
  }

  const { shifts, pagination } = result.data as ShiftsData

  return <ShiftTable shifts={shifts} pagination={pagination} />
}
