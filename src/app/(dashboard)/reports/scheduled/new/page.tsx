import prisma from '@/lib/prisma'
import { PageHeader } from '@/components/layout'
import { ScheduleForm } from '../schedule-form'

export const metadata = {
  title: '新增排程報表',
}

export default async function NewScheduledReportPage() {
  const reports = await prisma.customReport.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="space-y-6">
      <PageHeader title="新增排程報表" description="設定報表自動執行排程" />
      <ScheduleForm reports={reports} />
    </div>
  )
}
