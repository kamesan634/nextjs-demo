import { Suspense } from 'react'
import { getInvoices } from '@/actions/invoices'
import { PageHeader } from '@/components/layout'
import { FormLoading } from '@/components/forms'
import { InvoiceTable, type InvoiceListItem } from './invoice-table'
import type { PaginationInfo } from '@/types'

interface InvoicesData {
  invoices: InvoiceListItem[]
  pagination: PaginationInfo
}

export const metadata = {
  title: '發票管理',
}

interface PageProps {
  searchParams: Promise<{
    page?: string
    search?: string
    status?: string
  }>
}

/**
 * 發票管理列表頁
 */
export default async function InvoicesPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = parseInt(params.page || '1')
  const search = params.search || ''
  const status = params.status as 'ISSUED' | 'VOIDED' | undefined

  return (
    <div className="space-y-6">
      <PageHeader title="發票管理" description="管理電子發票紀錄" />

      <Suspense fallback={<FormLoading message="載入發票列表中..." />}>
        <InvoiceTableData page={page} search={search} status={status} />
      </Suspense>
    </div>
  )
}

async function InvoiceTableData({
  page,
  search,
  status,
}: {
  page: number
  search: string
  status?: 'ISSUED' | 'VOIDED'
}) {
  const result = await getInvoices({ page, pageSize: 20, status })

  if (!result.success || !result.data) {
    return <div className="text-center text-muted-foreground py-8">載入失敗</div>
  }

  const { invoices, pagination } = result.data as InvoicesData

  return <InvoiceTable invoices={invoices} pagination={pagination} />
}
