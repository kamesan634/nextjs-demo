import { PageHeader } from '@/components/layout'
import { ParameterForm } from '../parameter-form'

export const metadata = {
  title: '新增系統參數',
}

export default function NewParameterPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="新增系統參數"
        description="建立新的系統參數"
        backHref="/settings/parameters"
      />
      <ParameterForm />
    </div>
  )
}
