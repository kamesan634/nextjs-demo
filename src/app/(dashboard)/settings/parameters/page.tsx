import { Suspense } from 'react'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { getSystemParameters } from '@/actions/system-parameters'
import { PageHeader } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { FormLoading } from '@/components/forms'
import { ParameterTable } from './parameter-table'
import type { ParameterCategory } from '@/lib/validations/system-parameters'

export const metadata = {
  title: '系統參數設定',
}

interface PageProps {
  searchParams: Promise<{
    page?: string
    search?: string
    category?: ParameterCategory
  }>
}

export default async function ParametersPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = parseInt(params.page || '1')
  const search = params.search || ''
  const category = params.category

  return (
    <div className="space-y-6">
      <PageHeader title="系統參數設定" description="管理系統全域參數設定">
        <Button asChild>
          <Link href="/settings/parameters/new">
            <Plus className="mr-2 h-4 w-4" />
            新增參數
          </Link>
        </Button>
      </PageHeader>

      <Suspense fallback={<FormLoading message="載入參數列表中..." />}>
        <ParameterListData page={page} search={search} category={category} />
      </Suspense>
    </div>
  )
}

async function ParameterListData({
  page,
  search,
  category,
}: {
  page: number
  search: string
  category?: ParameterCategory
}) {
  const { data, pagination } = await getSystemParameters({ page, search, category })

  return <ParameterTable parameters={data} pagination={pagination} />
}
