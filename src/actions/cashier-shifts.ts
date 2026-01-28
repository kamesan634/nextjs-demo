'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import type { ActionResult } from '@/types'

interface OpenShiftData {
  userId: string
  storeId: string
  openingCash: number
  notes?: string
}

interface CloseShiftData {
  closingCash: number
  notes?: string
}

interface GetShiftsParams {
  storeId?: string
  userId?: string
  status?: 'OPEN' | 'CLOSED'
  startDate?: Date
  endDate?: Date
  page?: number
  pageSize?: number
}

/**
 * 生成班別編號
 */
async function generateShiftNo(): Promise<string> {
  const today = new Date()
  const dateStr = today.toISOString().split('T')[0].replace(/-/g, '')

  const lastShift = await prisma.cashierShift.findFirst({
    where: {
      shiftNo: {
        startsWith: `SHIFT-${dateStr}-`,
      },
    },
    orderBy: {
      shiftNo: 'desc',
    },
  })

  let sequence = 1
  if (lastShift) {
    const lastSequence = parseInt(lastShift.shiftNo.split('-')[2])
    sequence = lastSequence + 1
  }

  return `SHIFT-${dateStr}-${sequence.toString().padStart(3, '0')}`
}

/**
 * 開啟收銀班別
 */
export async function openShift(data: OpenShiftData): Promise<ActionResult> {
  try {
    // 檢查是否已有開啟的班別
    const existingShift = await prisma.cashierShift.findFirst({
      where: {
        userId: data.userId,
        status: 'OPEN',
      },
    })

    if (existingShift) {
      return {
        success: false,
        message: '您已有一個開啟中的收銀班別',
      }
    }

    // 找或建立當天的 POS Session
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let session = await prisma.pOSSession.findFirst({
      where: {
        userId: data.userId,
        storeId: data.storeId,
        status: 'OPEN',
      },
    })

    if (!session) {
      const sessionNo = `POS-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${Date.now().toString(36)}`
      session = await prisma.pOSSession.create({
        data: {
          sessionNo,
          userId: data.userId,
          storeId: data.storeId,
          openingCash: data.openingCash,
          status: 'OPEN',
        },
      })
    }

    const shiftNo = await generateShiftNo()
    const now = new Date()

    const shift = await prisma.cashierShift.create({
      data: {
        shiftNo,
        sessionId: session.id,
        userId: data.userId,
        storeId: data.storeId,
        shiftDate: now,
        openingCash: data.openingCash,
        status: 'OPEN',
        startTime: now,
        notes: data.notes,
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

    revalidatePath('/pos/shifts')

    return {
      success: true,
      message: '收銀班別已開啟',
      data: shift,
    }
  } catch (error) {
    console.error('Error opening shift:', error)
    return {
      success: false,
      message: '開啟收銀班別失敗',
    }
  }
}

/**
 * 關閉收銀班別
 */
export async function closeShift(id: string, data: CloseShiftData): Promise<ActionResult> {
  try {
    const shift = await prisma.cashierShift.findUnique({
      where: { id },
    })

    if (!shift) {
      return {
        success: false,
        message: '收銀班別不存在',
      }
    }

    if (shift.status === 'CLOSED') {
      return {
        success: false,
        message: '收銀班別已經關閉',
      }
    }

    // 計算預期現金和差異 (salesTotal 是訂單銷售總額)
    const expectedCash = Number(shift.openingCash) + Number(shift.salesTotal)
    const difference = data.closingCash - expectedCash

    const updatedShift = await prisma.cashierShift.update({
      where: { id },
      data: {
        status: 'CLOSED',
        endTime: new Date(),
        closingCash: data.closingCash,
        expectedCash,
        difference,
        notes: data.notes ? `${shift.notes || ''}\n${data.notes}`.trim() : shift.notes,
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

    revalidatePath('/pos/shifts')

    return {
      success: true,
      message: '收銀班別已關閉',
      data: updatedShift,
    }
  } catch (error) {
    console.error('Error closing shift:', error)
    return {
      success: false,
      message: '關閉收銀班別失敗',
    }
  }
}

/**
 * 取得使用者目前的班別
 */
export async function getCurrentShift(userId: string): Promise<ActionResult> {
  try {
    const shift = await prisma.cashierShift.findFirst({
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
      data: shift,
    }
  } catch (error) {
    console.error('Error getting current shift:', error)
    return {
      success: false,
      message: '取得目前班別失敗',
    }
  }
}

/**
 * 取得班別列表（含分頁）
 */
export async function getShifts(params: GetShiftsParams = {}): Promise<ActionResult> {
  try {
    const { storeId, userId, status, startDate, endDate, page = 1, pageSize = 20 } = params

    const where: Record<string, unknown> = {}

    if (storeId) where.storeId = storeId
    if (userId) where.userId = userId
    if (status) where.status = status

    if (startDate || endDate) {
      where.startTime = {}
      if (startDate) where.startTime.gte = startDate
      if (endDate) where.startTime.lte = endDate
    }

    const [shifts, total] = await Promise.all([
      prisma.cashierShift.findMany({
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
          startTime: 'desc',
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.cashierShift.count({ where }),
    ])

    return {
      success: true,
      data: {
        shifts,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    }
  } catch (error) {
    console.error('Error getting shifts:', error)
    return {
      success: false,
      message: '取得班別列表失敗',
    }
  }
}

/**
 * 取得單一班別詳情
 */
export async function getShift(id: string): Promise<ActionResult> {
  try {
    const shift = await prisma.cashierShift.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            name: true,
          },
        },
        store: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    })

    if (!shift) {
      return {
        success: false,
        message: '班別不存在',
      }
    }

    return {
      success: true,
      data: shift,
    }
  } catch (error) {
    console.error('Error getting shift:', error)
    return {
      success: false,
      message: '取得班別詳情失敗',
    }
  }
}
