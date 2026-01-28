import { PageHeader } from '@/components/layout'
import { ReportBuilder } from '../builder'

export const metadata = {
  title: '新增自訂報表',
}

export default function NewCustomReportPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="新增自訂報表" description="建立自訂查詢報表" />
      <ReportBuilder />
    </div>
  )
}
