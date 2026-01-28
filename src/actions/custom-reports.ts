'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { createCustomReportSchema } from '@/lib/validations/custom-reports'
import type { ActionResult } from '@/types'

/**
 * 取得自訂報表列表
 */
export async function getCustomReports(params?: {
  page?: number
  pageSize?: number
  search?: string
  createdBy?: string
}) {
  const page = params?.page || 1
  const pageSize = params?.pageSize || 10
  const skip = (page - 1) * pageSize

  const where = {
    ...(params?.search && {
      OR: [
        { name: { contains: params.search, mode: 'insensitive' as const } },
        { description: { contains: params.search, mode: 'insensitive' as const } },
      ],
    }),
    ...(params?.createdBy && { createdBy: params.createdBy }),
  }

  const [reports, total] = await Promise.all([
    prisma.customReport.findMany({
      where,
      include: {
        user: { select: { id: true, name: true } },
        _count: { select: { schedules: true } },
      },
      orderBy: { updatedAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.customReport.count({ where }),
  ])

  return {
    data: reports,
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
 * 取得單一自訂報表
 */
export async function getCustomReport(id: string) {
  return prisma.customReport.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true } },
      schedules: true,
    },
  })
}

/**
 * 建立自訂報表
 */
export async function createCustomReport(
  data: Parameters<typeof createCustomReportSchema.parse>[0],
  userId: string
): Promise<ActionResult> {
  try {
    const validated = createCustomReportSchema.safeParse(data)
    if (!validated.success) {
      return {
        success: false,
        message: '驗證失敗',
        errors: validated.error.flatten().fieldErrors as Record<string, string[]>,
      }
    }

    const report = await prisma.customReport.create({
      data: {
        name: validated.data.name,
        description: validated.data.description,
        queryDefinition: validated.data.queryDefinition as Prisma.InputJsonValue,
        chartConfig: validated.data.chartConfig
          ? (validated.data.chartConfig as Prisma.InputJsonValue)
          : Prisma.DbNull,
        isPublic: validated.data.isPublic,
        createdBy: userId,
      },
    })

    revalidatePath('/reports/custom')

    return {
      success: true,
      message: '自訂報表建立成功',
      data: { id: report.id },
    }
  } catch (error) {
    console.error('Create custom report error:', error)
    return { success: false, message: '建立自訂報表失敗' }
  }
}

/**
 * 更新自訂報表
 */
export async function updateCustomReport(
  id: string,
  data: Parameters<typeof createCustomReportSchema.parse>[0]
): Promise<ActionResult> {
  try {
    const validated = createCustomReportSchema.safeParse(data)
    if (!validated.success) {
      return {
        success: false,
        message: '驗證失敗',
        errors: validated.error.flatten().fieldErrors as Record<string, string[]>,
      }
    }

    const existing = await prisma.customReport.findUnique({ where: { id } })
    if (!existing) {
      return { success: false, message: '報表不存在' }
    }

    await prisma.customReport.update({
      where: { id },
      data: {
        name: validated.data.name,
        description: validated.data.description,
        queryDefinition: validated.data.queryDefinition as Prisma.InputJsonValue,
        chartConfig: validated.data.chartConfig
          ? (validated.data.chartConfig as Prisma.InputJsonValue)
          : Prisma.DbNull,
        isPublic: validated.data.isPublic,
      },
    })

    revalidatePath('/reports/custom')

    return { success: true, message: '自訂報表更新成功' }
  } catch (error) {
    console.error('Update custom report error:', error)
    return { success: false, message: '更新自訂報表失敗' }
  }
}

/**
 * 刪除自訂報表
 */
export async function deleteCustomReport(id: string): Promise<ActionResult> {
  try {
    const report = await prisma.customReport.findUnique({ where: { id } })
    if (!report) {
      return { success: false, message: '報表不存在' }
    }

    await prisma.customReport.delete({ where: { id } })

    revalidatePath('/reports/custom')

    return { success: true, message: '自訂報表刪除成功' }
  } catch (error) {
    console.error('Delete custom report error:', error)
    return { success: false, message: '刪除自訂報表失敗' }
  }
}
