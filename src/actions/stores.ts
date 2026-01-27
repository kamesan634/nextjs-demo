'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { storeSchema } from '@/lib/validations/system'
import type { ActionResult } from '@/types'

/**
 * 取得所有門市
 */
export async function getStores(params?: {
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

  const [stores, total] = await Promise.all([
    prisma.store.findMany({
      where,
      include: {
        _count: {
          select: { users: true, orders: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.store.count({ where }),
  ])

  return {
    data: stores,
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
 * 取得門市選項 (用於下拉選單)
 */
export async function getStoreOptions() {
  const stores = await prisma.store.findMany({
    where: { isActive: true },
    select: {
      id: true,
      code: true,
      name: true,
    },
    orderBy: { name: 'asc' },
  })

  return stores.map((store) => ({
    value: store.id,
    label: `${store.name} (${store.code})`,
  }))
}

/**
 * 取得單一門市
 */
export async function getStore(id: string) {
  return prisma.store.findUnique({
    where: { id },
    include: {
      _count: {
        select: { users: true, orders: true },
      },
    },
  })
}

/**
 * 建立門市
 */
export async function createStore(
  data: Parameters<typeof storeSchema.parse>[0]
): Promise<ActionResult> {
  try {
    // 驗證資料
    const validated = storeSchema.safeParse(data)
    if (!validated.success) {
      return {
        success: false,
        message: '驗證失敗',
        errors: validated.error.flatten().fieldErrors as Record<string, string[]>,
      }
    }

    // 檢查門市代碼是否已存在
    const existingStore = await prisma.store.findUnique({
      where: { code: validated.data.code },
    })

    if (existingStore) {
      return {
        success: false,
        message: '此門市代碼已存在',
      }
    }

    // 建立門市
    const store = await prisma.store.create({
      data: {
        code: validated.data.code,
        name: validated.data.name,
        address: validated.data.address,
        phone: validated.data.phone,
        email: validated.data.email || null,
        manager: validated.data.manager,
        openTime: validated.data.openTime,
        closeTime: validated.data.closeTime,
        isActive: validated.data.isActive,
      },
    })

    revalidatePath('/settings/stores')

    return {
      success: true,
      message: '門市建立成功',
      data: { id: store.id },
    }
  } catch (error) {
    console.error('Create store error:', error)
    return {
      success: false,
      message: '建立門市失敗',
    }
  }
}

/**
 * 更新門市
 */
export async function updateStore(
  id: string,
  data: Parameters<typeof storeSchema.parse>[0]
): Promise<ActionResult> {
  try {
    // 驗證資料
    const validated = storeSchema.safeParse(data)
    if (!validated.success) {
      return {
        success: false,
        message: '驗證失敗',
        errors: validated.error.flatten().fieldErrors as Record<string, string[]>,
      }
    }

    // 檢查門市是否存在
    const existingStore = await prisma.store.findUnique({
      where: { id },
    })

    if (!existingStore) {
      return {
        success: false,
        message: '門市不存在',
      }
    }

    // 檢查門市代碼是否重複
    const codeExists = await prisma.store.findFirst({
      where: {
        code: validated.data.code,
        NOT: { id },
      },
    })

    if (codeExists) {
      return {
        success: false,
        message: '此門市代碼已被使用',
      }
    }

    // 更新門市
    await prisma.store.update({
      where: { id },
      data: {
        code: validated.data.code,
        name: validated.data.name,
        address: validated.data.address,
        phone: validated.data.phone,
        email: validated.data.email || null,
        manager: validated.data.manager,
        openTime: validated.data.openTime,
        closeTime: validated.data.closeTime,
        isActive: validated.data.isActive,
      },
    })

    revalidatePath('/settings/stores')

    return {
      success: true,
      message: '門市更新成功',
    }
  } catch (error) {
    console.error('Update store error:', error)
    return {
      success: false,
      message: '更新門市失敗',
    }
  }
}

/**
 * 刪除門市
 */
export async function deleteStore(id: string): Promise<ActionResult> {
  try {
    // 檢查門市是否存在
    const store = await prisma.store.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true, orders: true },
        },
      },
    })

    if (!store) {
      return {
        success: false,
        message: '門市不存在',
      }
    }

    // 有使用者或訂單時不允許刪除
    if (store._count.users > 0) {
      return {
        success: false,
        message: `此門市仍有 ${store._count.users} 位員工，無法刪除`,
      }
    }

    if (store._count.orders > 0) {
      return {
        success: false,
        message: `此門市仍有 ${store._count.orders} 筆訂單，無法刪除`,
      }
    }

    await prisma.store.delete({
      where: { id },
    })

    revalidatePath('/settings/stores')

    return {
      success: true,
      message: '門市刪除成功',
    }
  } catch (error) {
    console.error('Delete store error:', error)
    return {
      success: false,
      message: '刪除門市失敗',
    }
  }
}
