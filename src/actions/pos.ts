'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import type { ActionResult } from '@/types'

interface OpenSessionData {
  userId: string
  storeId: string
  openingCash: number
}

interface SessionHistoryParams {
  storeId?: string
  userId?: string
  status?: 'OPEN' | 'CLOSED'
  page?: number
  pageSize?: number
}

/**
 * 生成 POS Session 編號 (POS-YYYYMMDD-001 格式)
 */
async function generateSessionNo(): Promise<string> {
  const today = new Date()
  const dateStr = today.toISOString().split('T')[0].replace(/-/g, '')

  const lastSession = await prisma.pOSSession.findFirst({
    where: {
      sessionNo: {
        startsWith: `POS-${dateStr}-`,
      },
    },
    orderBy: {
      sessionNo: 'desc',
    },
  })

  let sequence = 1
  if (lastSession) {
    const lastSequence = parseInt(lastSession.sessionNo.split('-')[2])
    sequence = lastSequence + 1
  }

  return `POS-${dateStr}-${sequence.toString().padStart(3, '0')}`
}

/**
 * 開啟 POS Session
 */
export async function openSession(data: OpenSessionData): Promise<ActionResult> {
  try {
    // 檢查是否已有開啟的 session
    const existingSession = await prisma.pOSSession.findFirst({
      where: {
        userId: data.userId,
        status: 'OPEN',
      },
    })

    if (existingSession) {
      return {
        success: false,
        message: '您已有一個開啟中的 POS Session',
      }
    }

    const sessionNo = await generateSessionNo()

    const session = await prisma.pOSSession.create({
      data: {
        sessionNo,
        userId: data.userId,
        storeId: data.storeId,
        openingCash: data.openingCash,
        status: 'OPEN',
      },
    })

    revalidatePath('/pos')
    revalidatePath('/pos/shifts')

    return {
      success: true,
      message: 'POS Session 已開啟',
      data: session,
    }
  } catch (error) {
    console.error('Error opening session:', error)
    return {
      success: false,
      message: '開啟 POS Session 失敗',
    }
  }
}

/**
 * 關閉 POS Session
 */
export async function closeSession(id: string, closingCash: number): Promise<ActionResult> {
  try {
    const session = await prisma.pOSSession.findUnique({
      where: { id },
    })

    if (!session) {
      return {
        success: false,
        message: 'POS Session 不存在',
      }
    }

    if (session.status === 'CLOSED') {
      return {
        success: false,
        message: 'POS Session 已經關閉',
      }
    }

    const updatedSession = await prisma.pOSSession.update({
      where: { id },
      data: {
        status: 'CLOSED',
        closingCash,
        closedAt: new Date(),
      },
    })

    revalidatePath('/pos')
    revalidatePath('/pos/shifts')

    return {
      success: true,
      message: 'POS Session 已關閉',
      data: updatedSession,
    }
  } catch (error) {
    console.error('Error closing session:', error)
    return {
      success: false,
      message: '關閉 POS Session 失敗',
    }
  }
}

/**
 * 取得使用者目前開啟的 Session
 */
export async function getCurrentSession(userId: string): Promise<ActionResult> {
  try {
    const session = await prisma.pOSSession.findFirst({
      where: {
        userId,
        status: 'OPEN',
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        store: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return {
      success: true,
      data: session,
    }
  } catch (error) {
    console.error('Error getting current session:', error)
    return {
      success: false,
      message: '取得目前 Session 失敗',
    }
  }
}

/**
 * 取得 Session 歷史列表（含分頁）
 */
export async function getSessionHistory(params: SessionHistoryParams = {}): Promise<ActionResult> {
  try {
    const { storeId, userId, status, page = 1, pageSize = 20 } = params

    const where: Prisma.POSSessionWhereInput = {}

    if (storeId) where.storeId = storeId
    if (userId) where.userId = userId
    if (status) where.status = status

    const [sessions, total] = await Promise.all([
      prisma.pOSSession.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
          store: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          openedAt: 'desc',
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.pOSSession.count({ where }),
    ])

    return {
      success: true,
      data: {
        sessions,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    }
  } catch (error) {
    console.error('Error getting session history:', error)
    return {
      success: false,
      message: '取得 Session 歷史失敗',
    }
  }
}
