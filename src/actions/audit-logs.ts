'use server'

import prisma from '@/lib/prisma'
import type { AuditAction } from '@/types'

/**
 * 取得操作日誌
 */
export async function getAuditLogs(params?: {
  page?: number
  pageSize?: number
  search?: string
  userId?: string
  action?: AuditAction
  module?: string
  startDate?: Date
  endDate?: Date
}) {
  const page = params?.page || 1
  const pageSize = params?.pageSize || 20
  const skip = (page - 1) * pageSize

  const where = {
    ...(params?.userId && { userId: params.userId }),
    ...(params?.action && { action: params.action }),
    ...(params?.module && { module: params.module }),
    ...(params?.search && {
      OR: [
        { description: { contains: params.search, mode: 'insensitive' as const } },
        { targetType: { contains: params.search, mode: 'insensitive' as const } },
        { user: { name: { contains: params.search, mode: 'insensitive' as const } } },
      ],
    }),
    ...((params?.startDate || params?.endDate) && {
      createdAt: {
        ...(params?.startDate && { gte: params.startDate }),
        ...(params?.endDate && { lte: params.endDate }),
      },
    }),
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.auditLog.count({ where }),
  ])

  return {
    data: logs,
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
 * 取得單一操作日誌
 */
export async function getAuditLog(id: string) {
  return prisma.auditLog.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          username: true,
        },
      },
    },
  })
}

/**
 * 取得使用者的操作日誌
 */
export async function getUserAuditLogs(userId: string, limit: number = 10) {
  return prisma.auditLog.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}

/**
 * 取得模組的操作日誌
 */
export async function getModuleAuditLogs(module: string, limit: number = 10) {
  return prisma.auditLog.findMany({
    where: { module },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          username: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}

/**
 * 取得特定對象的操作日誌
 */
export async function getTargetAuditLogs(targetId: string, targetType: string) {
  return prisma.auditLog.findMany({
    where: { targetId, targetType },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          username: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}

/**
 * 取得可用的模組列表
 */
export async function getAvailableModules() {
  const modules = await prisma.auditLog.findMany({
    select: { module: true },
    distinct: ['module'],
    orderBy: { module: 'asc' },
  })
  return modules.map((m: { module: string }) => m.module)
}

/**
 * 取得操作日誌統計
 */
export async function getAuditLogStats(startDate?: Date, endDate?: Date) {
  const where = {
    ...((startDate || endDate) && {
      createdAt: {
        ...(startDate && { gte: startDate }),
        ...(endDate && { lte: endDate }),
      },
    }),
  }

  const [actionCounts, moduleCounts, total] = await Promise.all([
    prisma.auditLog.groupBy({
      by: ['action'],
      _count: { action: true },
      where,
    }),
    prisma.auditLog.groupBy({
      by: ['module'],
      _count: { module: true },
      where,
    }),
    prisma.auditLog.count({ where }),
  ])

  return {
    total,
    byAction: actionCounts.map((a: { action: string; _count: { action: number } }) => ({
      action: a.action,
      count: a._count.action,
    })),
    byModule: moduleCounts.map((m: { module: string; _count: { module: number } }) => ({
      module: m.module,
      count: m._count.module,
    })),
  }
}
