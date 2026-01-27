'use server'

import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { createUserSchema, updateUserSchema } from '@/lib/validations/auth'
import type { ActionResult } from '@/types'

/**
 * 取得所有使用者
 */
export async function getUsers(params?: {
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
        { username: { contains: params.search, mode: 'insensitive' as const } },
        { name: { contains: params.search, mode: 'insensitive' as const } },
        { email: { contains: params.search, mode: 'insensitive' as const } },
      ],
    }),
    ...(params?.isActive !== undefined && { isActive: params.isActive }),
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        role: true,
        store: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.user.count({ where }),
  ])

  return {
    data: users.map((u) => ({
      ...u,
      password: undefined, // 移除密碼欄位
    })),
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
 * 取得單一使用者
 */
export async function getUser(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      role: true,
      store: true,
    },
  })

  if (user) {
    return { ...user, password: undefined }
  }

  return null
}

/**
 * 建立使用者
 */
export async function createUser(
  data: Parameters<typeof createUserSchema.parse>[0]
): Promise<ActionResult> {
  try {
    // 驗證資料
    const validated = createUserSchema.safeParse(data)
    if (!validated.success) {
      return {
        success: false,
        message: '驗證失敗',
        errors: validated.error.flatten().fieldErrors as Record<string, string[]>,
      }
    }

    // 檢查帳號是否已存在
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username: validated.data.username }, { email: validated.data.email }],
      },
    })

    if (existingUser) {
      return {
        success: false,
        message:
          existingUser.username === validated.data.username
            ? '此帳號已被使用'
            : '此電子郵件已被使用',
      }
    }

    // 雜湊密碼
    const hashedPassword = await bcrypt.hash(validated.data.password, 10)

    // 建立使用者
    const user = await prisma.user.create({
      data: {
        username: validated.data.username,
        email: validated.data.email,
        password: hashedPassword,
        name: validated.data.name,
        phone: validated.data.phone,
        roleId: validated.data.roleId,
        storeId: validated.data.storeId,
        isActive: validated.data.isActive,
      },
    })

    revalidatePath('/settings/users')

    return {
      success: true,
      message: '使用者建立成功',
      data: { id: user.id },
    }
  } catch (error) {
    console.error('Create user error:', error)
    return {
      success: false,
      message: '建立使用者失敗',
    }
  }
}

/**
 * 更新使用者
 */
export async function updateUser(
  id: string,
  data: Parameters<typeof updateUserSchema.parse>[0]
): Promise<ActionResult> {
  try {
    // 驗證資料
    const validated = updateUserSchema.safeParse(data)
    if (!validated.success) {
      return {
        success: false,
        message: '驗證失敗',
        errors: validated.error.flatten().fieldErrors as Record<string, string[]>,
      }
    }

    // 檢查使用者是否存在
    const existingUser = await prisma.user.findUnique({
      where: { id },
    })

    if (!existingUser) {
      return {
        success: false,
        message: '使用者不存在',
      }
    }

    // 檢查電子郵件是否重複
    const emailExists = await prisma.user.findFirst({
      where: {
        email: validated.data.email,
        NOT: { id },
      },
    })

    if (emailExists) {
      return {
        success: false,
        message: '此電子郵件已被使用',
      }
    }

    // 準備更新資料
    const updateData: Record<string, unknown> = {
      email: validated.data.email,
      name: validated.data.name,
      phone: validated.data.phone,
      roleId: validated.data.roleId,
      storeId: validated.data.storeId,
      isActive: validated.data.isActive,
    }

    // 如果有提供新密碼，則更新密碼
    if (validated.data.password) {
      updateData.password = await bcrypt.hash(validated.data.password, 10)
    }

    await prisma.user.update({
      where: { id },
      data: updateData,
    })

    revalidatePath('/settings/users')

    return {
      success: true,
      message: '使用者更新成功',
    }
  } catch (error) {
    console.error('Update user error:', error)
    return {
      success: false,
      message: '更新使用者失敗',
    }
  }
}

/**
 * 刪除使用者
 */
export async function deleteUser(id: string): Promise<ActionResult> {
  try {
    // 檢查使用者是否存在
    const user = await prisma.user.findUnique({
      where: { id },
    })

    if (!user) {
      return {
        success: false,
        message: '使用者不存在',
      }
    }

    // 不允許刪除 admin 帳號
    if (user.username === 'admin') {
      return {
        success: false,
        message: '無法刪除系統管理員帳號',
      }
    }

    await prisma.user.delete({
      where: { id },
    })

    revalidatePath('/settings/users')

    return {
      success: true,
      message: '使用者刪除成功',
    }
  } catch (error) {
    console.error('Delete user error:', error)
    return {
      success: false,
      message: '刪除使用者失敗',
    }
  }
}
