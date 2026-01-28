import { Suspense } from 'react'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { getNumberingRules } from '@/actions/numbering-rules'
import { PageHeader } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { FormLoading } from '@/components/forms'
import { NumberingRuleTable } from './numbering-rule-table'

export const metadata = {
  title: '編號規則設定',
}

interface PageProps {
  searchParams: Promise<{
    page?: string
    search?: string
  }>
}

export default async function NumberingRulesPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = parseInt(params.page || '1')
  const search = params.search || ''

  return (
    <div className="space-y-6">
      <PageHeader title="編號規則設定" description="管理各類單據的自動編號規則">
        <Button asChild>
          <Link href="/settings/numbering-rules/new">
            <Plus className="mr-2 h-4 w-4" />
            新增規則
          </Link>
        </Button>
      </PageHeader>

      <Suspense fallback={<FormLoading message="載入編號規則列表中..." />}>
        <RuleListData page={page} search={search} />
      </Suspense>
    </div>
  )
}

async function RuleListData({ page, search }: { page: number; search: string }) {
  const { data, pagination } = await getNumberingRules({ page, search })

  return <NumberingRuleTable rules={data} pagination={pagination} />
}
