import { PageHeader } from '@/components/layout'
import { NumberingRuleForm } from '../numbering-rule-form'

export const metadata = {
  title: '新增編號規則',
}

export default function NewNumberingRulePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="新增編號規則"
        description="建立新的自動編號規則"
        backHref="/settings/numbering-rules"
      />
      <NumberingRuleForm />
    </div>
  )
}
