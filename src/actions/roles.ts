'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import type { Prisma } from '@prisma/client'
import { createRoleSchema, updateRoleSchema } from '@/lib/validations/auth'
import type { ActionResult } from '@/types'

/**
 * 取得所有角色
 */
export async function getRoles() {
  const roles = await prisma.role.findMany({
    include: {
      permissions: true,
      _count: {
        select: { users: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  return roles
}

/**
 * 取得角色選項 (用於下拉選單)
 */
export async function getRoleOptions() {
  const roles = await prisma.role.findMany({
    select: {
      id: true,
      code: true,
      name: true,
    },
    orderBy: { name: 'asc' },
  })

  return roles.map((role: { id: string; code: string; name: string }) => ({
    value: role.id,
    label: role.name,
    code: role.code,
  }))
}

/**
 * 取得單一角色
 */
export async function getRole(id: string) {
  return prisma.role.findUnique({
    where: { id },
    include: {
      permissions: true,
    },
  })
}

/**
 * 建立角色
 */
export async function createRole(
  data: Parameters<typeof createRoleSchema.parse>[0]
): Promise<ActionResult> {
  try {
    // 驗證資料
    const validated = createRoleSchema.safeParse(data)
    if (!validated.success) {
      return {
        success: false,
        message: '驗證失敗',
        errors: validated.error.flatten().fieldErrors as Record<string, string[]>,
      }
    }

    // 檢查角色代碼是否已存在
    const existingRole = await prisma.role.findUnique({
      where: { code: validated.data.code },
    })

    if (existingRole) {
      return {
        success: false,
        message: '此角色代碼已存在',
      }
    }

    // 建立角色和權限
    const role = await prisma.role.create({
      data: {
        code: validated.data.code,
        name: validated.data.name,
        description: validated.data.description,
        permissions: {
          create: validated.data.permissions.map((p) => ({
            module: p.module,
            action: p.action,
          })),
        },
      },
    })

    revalidatePath('/settings/roles')

    return {
      success: true,
      message: '角色建立成功',
      data: { id: role.id },
    }
  } catch (error) {
    console.error('Create role error:', error)
    return {
      success: false,
      message: '建立角色失敗',
    }
  }
}

/**
 * 更新角色
 */
export async function updateRole(
  id: string,
  data: Parameters<typeof updateRoleSchema.parse>[0]
): Promise<ActionResult> {
  try {
    // 驗證資料
    const validated = updateRoleSchema.safeParse(data)
    if (!validated.success) {
      return {
        success: false,
        message: '驗證失敗',
        errors: validated.error.flatten().fieldErrors as Record<string, string[]>,
      }
    }

    // 檢查角色是否存在
    const existingRole = await prisma.role.findUnique({
      where: { id },
    })

    if (!existingRole) {
      return {
        success: false,
        message: '角色不存在',
      }
    }

    // 系統內建角色不允許修改代碼
    if (existingRole.isSystem) {
      // 只更新名稱和描述，不更新權限
      await prisma.role.update({
        where: { id },
        data: {
          name: validated.data.name,
          description: validated.data.description,
        },
      })
    } else {
      // 更新角色和權限
      await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // 刪除舊權限
        await tx.rolePermission.deleteMany({
          where: { roleId: id },
        })

        // 更新角色和新增權限
        await tx.role.update({
          where: { id },
          data: {
            name: validated.data.name,
            description: validated.data.description,
            permissions: {
              create: validated.data.permissions.map((p) => ({
                module: p.module,
                action: p.action,
              })),
            },
          },
        })
      })
    }

    revalidatePath('/settings/roles')

    return {
      success: true,
      message: '角色更新成功',
    }
  } catch (error) {
    console.error('Update role error:', error)
    return {
      success: false,
      message: '更新角色失敗',
    }
  }
}

/**
 * 刪除角色
 */
export async function deleteRole(id: string): Promise<ActionResult> {
  try {
    // 檢查角色是否存在
    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true },
        },
      },
    })

    if (!role) {
      return {
        success: false,
        message: '角色不存在',
      }
    }

    // 系統內建角色不允許刪除
    if (role.isSystem) {
      return {
        success: false,
        message: '無法刪除系統內建角色',
      }
    }

    // 有使用者使用此角色時不允許刪除
    if (role._count.users > 0) {
      return {
        success: false,
        message: `此角色仍有 ${role._count.users} 位使用者，無法刪除`,
      }
    }

    // 刪除角色 (權限會因 onDelete: Cascade 自動刪除)
    await prisma.role.delete({
      where: { id },
    })

    revalidatePath('/settings/roles')

    return {
      success: true,
      message: '角色刪除成功',
    }
  } catch (error) {
    console.error('Delete role error:', error)
    return {
      success: false,
      message: '刪除角色失敗',
    }
  }
}
