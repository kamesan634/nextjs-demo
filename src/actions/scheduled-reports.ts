'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import {
  createScheduledReportSchema,
  type CreateScheduledReportFormData,
  type UpdateScheduledReportFormData,
} from '@/lib/validations/scheduled-reports'
import type { ActionResult } from '@/types'

/**
 * 取得排程報表列表
 */
export async function getScheduledReports(params?: {
  page?: number
  pageSize?: number
  reportId?: string
}) {
  const page = params?.page || 1
  const pageSize = params?.pageSize || 10
  const skip = (page - 1) * pageSize

  const where = {
    ...(params?.reportId && { reportId: params.reportId }),
  }

  const [schedules, total] = await Promise.all([
    prisma.scheduledReport.findMany({
      where,
      include: {
        report: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.scheduledReport.count({ where }),
  ])

  return {
    data: schedules,
    pagination: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      hasNextPage: page < Math.ceil(total / pageSize),
      hasPrevPage: page > 1,
    },
  }
}

/**
 * 建立排程報表
 */
export async function createScheduledReport(
  data: CreateScheduledReportFormData
): Promise<ActionResult> {
  try {
    const validated = createScheduledReportSchema.safeParse(data)
    if (!validated.success) {
      return {
        success: false,
        message: '驗證失敗',
        errors: validated.error.flatten().fieldErrors as Record<string, string[]>,
      }
    }

    const schedule = await prisma.scheduledReport.create({
      data: {
        reportId: validated.data.reportId,
        schedule: validated.data.schedule,
        recipients: validated.data.recipients as unknown as object,
        format: validated.data.format,
        isActive: validated.data.isActive,
        nextRunAt: calculateNextRunAt(validated.data.schedule),
      },
    })

    revalidatePath('/reports/scheduled')

    return {
      success: true,
      message: '排程報表建立成功',
      data: { id: schedule.id },
    }
  } catch (error) {
    console.error('Create scheduled report error:', error)
    return { success: false, message: '建立排程報表失敗' }
  }
}

/**
 * 更新排程報表
 */
export async function updateScheduledReport(
  id: string,
  data: Partial<UpdateScheduledReportFormData>
): Promise<ActionResult> {
  try {
    const existing = await prisma.scheduledReport.findUnique({ where: { id } })
    if (!existing) {
      return { success: false, message: '排程不存在' }
    }

    await prisma.scheduledReport.update({
      where: { id },
      data: {
        ...(data.schedule && { schedule: data.schedule }),
        ...(data.recipients && { recipients: data.recipients as unknown as object }),
        ...(data.format && { format: data.format }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.schedule && { nextRunAt: calculateNextRunAt(data.schedule) }),
      },
    })

    revalidatePath('/reports/scheduled')

    return { success: true, message: '排程報表更新成功' }
  } catch (error) {
    console.error('Update scheduled report error:', error)
    return { success: false, message: '更新排程報表失敗' }
  }
}

/**
 * 刪除排程報表
 */
export async function deleteScheduledReport(id: string): Promise<ActionResult> {
  try {
    await prisma.scheduledReport.delete({ where: { id } })

    revalidatePath('/reports/scheduled')

    return { success: true, message: '排程報表刪除成功' }
  } catch (error) {
    console.error('Delete scheduled report error:', error)
    return { success: false, message: '刪除排程報表失敗' }
  }
}

/**
 * 切換排程啟用狀態
 */
export async function toggleScheduledReport(id: string): Promise<ActionResult> {
  try {
    const schedule = await prisma.scheduledReport.findUnique({ where: { id } })
    if (!schedule) {
      return { success: false, message: '排程不存在' }
    }

    await prisma.scheduledReport.update({
      where: { id },
      data: { isActive: !schedule.isActive },
    })

    revalidatePath('/reports/scheduled')

    return {
      success: true,
      message: `排程已${schedule.isActive ? '停用' : '啟用'}`,
    }
  } catch (error) {
    console.error('Toggle scheduled report error:', error)
    return { success: false, message: '切換排程狀態失敗' }
  }
}

/**
 * 計算下次執行時間 (簡化版)
 */
function calculateNextRunAt(cronExpression: string): Date {
  // 簡化實作：基於 cron 表達式計算下次執行時間
  const parts = cronExpression.split(' ')
  const now = new Date()
  const next = new Date(now)

  // 取 hour 和 minute
  const minute = parts[0] === '*' ? 0 : parseInt(parts[0])
  const hour = parts[1] === '*' ? 0 : parseInt(parts[1])

  next.setHours(hour, minute, 0, 0)

  if (next <= now) {
    next.setDate(next.getDate() + 1)
  }

  return next
}
