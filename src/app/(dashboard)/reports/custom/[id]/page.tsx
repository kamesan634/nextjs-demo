import { notFound } from 'next/navigation'
import { getCustomReport } from '@/actions/custom-reports'
import { PageHeader } from '@/components/layout'
import { ReportBuilder } from '../builder'

export const metadata = {
  title: '編輯自訂報表',
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditCustomReportPage({ params }: PageProps) {
  const { id } = await params
  const report = await getCustomReport(id)

  if (!report) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <PageHeader title="編輯自訂報表" description={`編輯 ${report.name}`} />
      <ReportBuilder report={report} />
    </div>
  )
}
