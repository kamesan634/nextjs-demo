import { notFound } from 'next/navigation'
import { getNumberingRule } from '@/actions/numbering-rules'
import { PageHeader } from '@/components/layout'
import { NumberingRuleForm } from '../numbering-rule-form'

export const metadata = {
  title: '編輯編號規則',
}

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditNumberingRulePage({ params }: PageProps) {
  const { id } = await params
  const rule = await getNumberingRule(id)

  if (!rule) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="編輯編號規則"
        description={`編輯規則: ${rule.code}`}
        backHref="/settings/numbering-rules"
      />
      <NumberingRuleForm rule={rule} />
    </div>
  )
}
