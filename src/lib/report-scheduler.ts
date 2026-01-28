'use server'

import prisma from '@/lib/prisma'
import { calculateNextRunAt } from './cron-utils'

/**
 * 報表排程執行器 (Server Actions)
 */

/**
 * 取得需要執行的排程報表
 */
export async function getDueScheduledReports() {
  const now = new Date()

  return prisma.scheduledReport.findMany({
    where: {
      isActive: true,
      nextRunAt: { lte: now },
    },
    include: {
      report: true,
    },
  })
}

/**
 * 更新排程報表執行時間
 */
export async function updateScheduleAfterRun(id: string) {
  const schedule = await prisma.scheduledReport.findUnique({
    where: { id },
  })

  if (!schedule) return

  const nextRunAt = calculateNextRunAt(schedule.schedule)

  await prisma.scheduledReport.update({
    where: { id },
    data: {
      lastRunAt: new Date(),
      nextRunAt,
    },
  })
}
