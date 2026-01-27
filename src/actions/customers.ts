'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { customerSchema, customerLevelSchema } from '@/lib/validations/business'
import type { ActionResult } from '@/types'

// ===================================
// 會員等級相關 Actions
// ===================================

/**
 * 取得所有會員等級
 */
export async function getCustomerLevels(params?: {
  page?: number
  pageSize?: number
  search?: string
  isActive?: boolean
}) {
  const page = params?.page || 1
  const pageSize = params?.pageSize || 10
  const skip = (page - 1) * pageSize

  const where = {
    ...(params?.search && {
      OR: [
        { code: { contains: params.search, mode: 'insensitive' as const } },
        { name: { contains: params.search, mode: 'insensitive' as const } },
      ],
    }),
    ...(params?.isActive !== undefined && { isActive: params.isActive }),
  }

  const [levels, total] = await Promise.all([
    prisma.customerLevel.findMany({
      where,
      include: {
        _count: {
          select: { customers: true },
        },
      },
      orderBy: { sortOrder: 'asc' },
      skip,
      take: pageSize,
    }),
    prisma.customerLevel.count({ where }),
  ])

  return {
    data: levels,
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
 * 取得所有啟用的會員等級（供下拉選單使用）
 */
export async function getActiveCustomerLevels() {
  return prisma.customerLevel.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    select: {
      id: true,
      code: true,
      name: true,
      discountRate: true,
      pointsMultiplier: true,
    },
  })
}

/**
 * 取得單一會員等級
 */
export async function getCustomerLevel(id: string) {
  return prisma.customerLevel.findUnique({
    where: { id },
    include: {
      _count: {
        select: { customers: true },
      },
    },
  })
}

/**
 * 建立會員等級
 */
export async function createCustomerLevel(
  data: Parameters<typeof customerLevelSchema.parse>[0]
): Promise<ActionResult> {
  try {
    const validated = customerLevelSchema.safeParse(data)
    if (!validated.success) {
      return {
        success: false,
        message: '驗證失敗',
        errors: validated.error.flatten().fieldErrors as Record<string, string[]>,
      }
    }

    // 檢查代碼是否已存在
    const existing = await prisma.customerLevel.findUnique({
      where: { code: validated.data.code },
    })

    if (existing) {
      return {
        success: false,
        message: '此等級代碼已被使用',
      }
    }

    const level = await prisma.customerLevel.create({
      data: validated.data,
    })

    revalidatePath('/customers')

    return {
      success: true,
      message: '會員等級建立成功',
      data: { id: level.id },
    }
  } catch (error) {
    console.error('Create customer level error:', error)
    return {
      success: false,
      message: '建立會員等級失敗',
    }
  }
}

/**
 * 更新會員等級
 */
export async function updateCustomerLevel(
  id: string,
  data: Parameters<typeof customerLevelSchema.parse>[0]
): Promise<ActionResult> {
  try {
    const validated = customerLevelSchema.safeParse(data)
    if (!validated.success) {
      return {
        success: false,
        message: '驗證失敗',
        errors: validated.error.flatten().fieldErrors as Record<string, string[]>,
      }
    }

    const existing = await prisma.customerLevel.findUnique({
      where: { id },
    })

    if (!existing) {
      return {
        success: false,
        message: '會員等級不存在',
      }
    }

    // 檢查代碼是否重複
    const codeExists = await prisma.customerLevel.findFirst({
      where: {
        code: validated.data.code,
        NOT: { id },
      },
    })

    if (codeExists) {
      return {
        success: false,
        message: '此等級代碼已被使用',
      }
    }

    await prisma.customerLevel.update({
      where: { id },
      data: validated.data,
    })

    revalidatePath('/customers')

    return {
      success: true,
      message: '會員等級更新成功',
    }
  } catch (error) {
    console.error('Update customer level error:', error)
    return {
      success: false,
      message: '更新會員等級失敗',
    }
  }
}

/**
 * 刪除會員等級
 */
export async function deleteCustomerLevel(id: string): Promise<ActionResult> {
  try {
    const level = await prisma.customerLevel.findUnique({
      where: { id },
      include: {
        _count: {
          select: { customers: true },
        },
      },
    })

    if (!level) {
      return {
        success: false,
        message: '會員等級不存在',
      }
    }

    if (level._count.customers > 0) {
      return {
        success: false,
        message: `此等級下還有 ${level._count.customers} 位會員，無法刪除`,
      }
    }

    await prisma.customerLevel.delete({
      where: { id },
    })

    revalidatePath('/customers')

    return {
      success: true,
      message: '會員等級刪除成功',
    }
  } catch (error) {
    console.error('Delete customer level error:', error)
    return {
      success: false,
      message: '刪除會員等級失敗',
    }
  }
}

// ===================================
// 客戶/會員相關 Actions
// ===================================

/**
 * 取得所有客戶/會員
 */
export async function getCustomers(params?: {
  page?: number
  pageSize?: number
  search?: string
  levelId?: string
  isActive?: boolean
}) {
  const page = params?.page || 1
  const pageSize = params?.pageSize || 10
  const skip = (page - 1) * pageSize

  const where = {
    ...(params?.search && {
      OR: [
        { code: { contains: params.search, mode: 'insensitive' as const } },
        { name: { contains: params.search, mode: 'insensitive' as const } },
        { phone: { contains: params.search, mode: 'insensitive' as const } },
        { email: { contains: params.search, mode: 'insensitive' as const } },
      ],
    }),
    ...(params?.levelId && { levelId: params.levelId }),
    ...(params?.isActive !== undefined && { isActive: params.isActive }),
  }

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      include: {
        level: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        _count: {
          select: { orders: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.customer.count({ where }),
  ])

  return {
    data: customers,
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
 * 取得單一客戶/會員
 */
export async function getCustomer(id: string) {
  return prisma.customer.findUnique({
    where: { id },
    include: {
      level: true,
      orders: {
        take: 10,
        orderBy: { orderDate: 'desc' },
        select: {
          id: true,
          orderNo: true,
          totalAmount: true,
          status: true,
          orderDate: true,
        },
      },
      pointsLogs: {
        take: 10,
        orderBy: { createdAt: 'desc' },
      },
      _count: {
        select: { orders: true, pointsLogs: true },
      },
    },
  })
}

/**
 * 依手機號碼查詢會員
 */
export async function getCustomerByPhone(phone: string) {
  return prisma.customer.findUnique({
    where: { phone },
    include: {
      level: {
        select: {
          id: true,
          code: true,
          name: true,
          discountRate: true,
        },
      },
    },
  })
}

/**
 * 建立客戶/會員
 */
export async function createCustomer(
  data: Parameters<typeof customerSchema.parse>[0]
): Promise<ActionResult> {
  try {
    const validated = customerSchema.safeParse(data)
    if (!validated.success) {
      return {
        success: false,
        message: '驗證失敗',
        errors: validated.error.flatten().fieldErrors as Record<string, string[]>,
      }
    }

    // 檢查編號是否已存在
    const codeExists = await prisma.customer.findUnique({
      where: { code: validated.data.code },
    })

    if (codeExists) {
      return {
        success: false,
        message: '此會員編號已被使用',
      }
    }

    // 檢查手機號碼是否已存在
    if (validated.data.phone) {
      const phoneExists = await prisma.customer.findUnique({
        where: { phone: validated.data.phone },
      })

      if (phoneExists) {
        return {
          success: false,
          message: '此手機號碼已被使用',
        }
      }
    }

    // 處理生日欄位
    const customerData = {
      ...validated.data,
      birthday: validated.data.birthday ? new Date(validated.data.birthday) : null,
      email: validated.data.email || null,
    }

    const customer = await prisma.customer.create({
      data: customerData,
    })

    revalidatePath('/customers')

    return {
      success: true,
      message: '會員建立成功',
      data: { id: customer.id },
    }
  } catch (error) {
    console.error('Create customer error:', error)
    return {
      success: false,
      message: '建立會員失敗',
    }
  }
}

/**
 * 更新客戶/會員
 */
export async function updateCustomer(
  id: string,
  data: Parameters<typeof customerSchema.parse>[0]
): Promise<ActionResult> {
  try {
    const validated = customerSchema.safeParse(data)
    if (!validated.success) {
      return {
        success: false,
        message: '驗證失敗',
        errors: validated.error.flatten().fieldErrors as Record<string, string[]>,
      }
    }

    const existing = await prisma.customer.findUnique({
      where: { id },
    })

    if (!existing) {
      return {
        success: false,
        message: '會員不存在',
      }
    }

    // 檢查編號是否重複
    const codeExists = await prisma.customer.findFirst({
      where: {
        code: validated.data.code,
        NOT: { id },
      },
    })

    if (codeExists) {
      return {
        success: false,
        message: '此會員編號已被使用',
      }
    }

    // 檢查手機號碼是否重複
    if (validated.data.phone) {
      const phoneExists = await prisma.customer.findFirst({
        where: {
          phone: validated.data.phone,
          NOT: { id },
        },
      })

      if (phoneExists) {
        return {
          success: false,
          message: '此手機號碼已被使用',
        }
      }
    }

    // 處理生日欄位
    const customerData = {
      ...validated.data,
      birthday: validated.data.birthday ? new Date(validated.data.birthday) : null,
      email: validated.data.email || null,
    }

    await prisma.customer.update({
      where: { id },
      data: customerData,
    })

    revalidatePath('/customers')

    return {
      success: true,
      message: '會員更新成功',
    }
  } catch (error) {
    console.error('Update customer error:', error)
    return {
      success: false,
      message: '更新會員失敗',
    }
  }
}

/**
 * 刪除客戶/會員
 */
export async function deleteCustomer(id: string): Promise<ActionResult> {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        _count: {
          select: { orders: true },
        },
      },
    })

    if (!customer) {
      return {
        success: false,
        message: '會員不存在',
      }
    }

    if (customer._count.orders > 0) {
      return {
        success: false,
        message: `此會員有 ${customer._count.orders} 筆訂單紀錄，無法刪除`,
      }
    }

    // 先刪除相關的點數紀錄
    await prisma.pointsLog.deleteMany({
      where: { customerId: id },
    })

    // 刪除優惠券使用紀錄
    await prisma.couponUsage.deleteMany({
      where: { customerId: id },
    })

    // 刪除會員
    await prisma.customer.delete({
      where: { id },
    })

    revalidatePath('/customers')

    return {
      success: true,
      message: '會員刪除成功',
    }
  } catch (error) {
    console.error('Delete customer error:', error)
    return {
      success: false,
      message: '刪除會員失敗',
    }
  }
}

/**
 * 調整會員點數
 */
export async function adjustCustomerPoints(
  customerId: string,
  data: {
    type: 'EARN' | 'REDEEM' | 'ADJUST'
    points: number
    description?: string
  }
): Promise<ActionResult> {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    })

    if (!customer) {
      return {
        success: false,
        message: '會員不存在',
      }
    }

    // 計算點數變化
    const pointsChange = data.type === 'REDEEM' ? -Math.abs(data.points) : data.points
    const newTotalPoints = customer.totalPoints + (data.type === 'EARN' ? data.points : 0)
    const newAvailablePoints = Math.max(0, customer.availablePoints + pointsChange)

    // 檢查可用點數是否足夠
    if (data.type === 'REDEEM' && customer.availablePoints < Math.abs(data.points)) {
      return {
        success: false,
        message: '可用點數不足',
      }
    }

    // 更新會員點數並建立點數紀錄
    await prisma.$transaction([
      prisma.customer.update({
        where: { id: customerId },
        data: {
          totalPoints: newTotalPoints,
          availablePoints: newAvailablePoints,
        },
      }),
      prisma.pointsLog.create({
        data: {
          customerId,
          type: data.type,
          points: pointsChange,
          balance: newAvailablePoints,
          description:
            data.description ||
            (data.type === 'EARN' ? '點數獲得' : data.type === 'REDEEM' ? '點數兌換' : '點數調整'),
        },
      }),
    ])

    revalidatePath('/customers')

    return {
      success: true,
      message: '點數調整成功',
    }
  } catch (error) {
    console.error('Adjust customer points error:', error)
    return {
      success: false,
      message: '點數調整失敗',
    }
  }
}

/**
 * 產生下一個會員編號
 */
export async function generateCustomerCode(): Promise<string> {
  const lastCustomer = await prisma.customer.findFirst({
    where: {
      code: {
        startsWith: 'C',
      },
    },
    orderBy: { code: 'desc' },
    select: { code: true },
  })

  if (!lastCustomer) {
    return 'C00001'
  }

  const lastNumber = parseInt(lastCustomer.code.slice(1), 10) || 0
  const nextNumber = lastNumber + 1
  return `C${nextNumber.toString().padStart(5, '0')}`
}
