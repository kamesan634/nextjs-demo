'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { warehouseSchema } from '@/lib/validations/system'
import type { ActionResult } from '@/types'

/**
 * 取得所有倉庫
 */
export async function getWarehouses(params?: {
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

  const [warehouses, total] = await Promise.all([
    prisma.warehouse.findMany({
      where,
      include: {
        _count: {
          select: { inventories: true },
        },
      },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
      skip,
      take: pageSize,
    }),
    prisma.warehouse.count({ where }),
  ])

  return {
    data: warehouses,
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
 * 取得倉庫選項 (用於下拉選單)
 */
export async function getWarehouseOptions() {
  const warehouses = await prisma.warehouse.findMany({
    where: { isActive: true },
    select: {
      id: true,
      code: true,
      name: true,
      isDefault: true,
    },
    orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
  })

  return warehouses.map(
    (warehouse: { id: string; code: string; name: string; isDefault: boolean }) => ({
      value: warehouse.id,
      label: `${warehouse.name} (${warehouse.code})${warehouse.isDefault ? ' - 預設' : ''}`,
    })
  )
}

/**
 * 取得單一倉庫
 */
export async function getWarehouse(id: string) {
  return prisma.warehouse.findUnique({
    where: { id },
    include: {
      _count: {
        select: { inventories: true },
      },
    },
  })
}

/**
 * 建立倉庫
 */
export async function createWarehouse(
  data: Parameters<typeof warehouseSchema.parse>[0]
): Promise<ActionResult> {
  try {
    // 驗證資料
    const validated = warehouseSchema.safeParse(data)
    if (!validated.success) {
      return {
        success: false,
        message: '驗證失敗',
        errors: validated.error.flatten().fieldErrors as Record<string, string[]>,
      }
    }

    // 檢查倉庫代碼是否已存在
    const existingWarehouse = await prisma.warehouse.findUnique({
      where: { code: validated.data.code },
    })

    if (existingWarehouse) {
      return {
        success: false,
        message: '此倉庫代碼已存在',
      }
    }

    // 如果設為預設倉庫，先取消其他預設
    if (validated.data.isDefault) {
      await prisma.warehouse.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      })
    }

    // 建立倉庫
    const warehouse = await prisma.warehouse.create({
      data: {
        code: validated.data.code,
        name: validated.data.name,
        address: validated.data.address,
        phone: validated.data.phone,
        manager: validated.data.manager,
        isActive: validated.data.isActive,
        isDefault: validated.data.isDefault,
      },
    })

    revalidatePath('/settings/warehouses')

    return {
      success: true,
      message: '倉庫建立成功',
      data: { id: warehouse.id },
    }
  } catch (error) {
    console.error('Create warehouse error:', error)
    return {
      success: false,
      message: '建立倉庫失敗',
    }
  }
}

/**
 * 更新倉庫
 */
export async function updateWarehouse(
  id: string,
  data: Parameters<typeof warehouseSchema.parse>[0]
): Promise<ActionResult> {
  try {
    // 驗證資料
    const validated = warehouseSchema.safeParse(data)
    if (!validated.success) {
      return {
        success: false,
        message: '驗證失敗',
        errors: validated.error.flatten().fieldErrors as Record<string, string[]>,
      }
    }

    // 檢查倉庫是否存在
    const existingWarehouse = await prisma.warehouse.findUnique({
      where: { id },
    })

    if (!existingWarehouse) {
      return {
        success: false,
        message: '倉庫不存在',
      }
    }

    // 檢查倉庫代碼是否重複
    const codeExists = await prisma.warehouse.findFirst({
      where: {
        code: validated.data.code,
        NOT: { id },
      },
    })

    if (codeExists) {
      return {
        success: false,
        message: '此倉庫代碼已被使用',
      }
    }

    // 如果設為預設倉庫，先取消其他預設
    if (validated.data.isDefault && !existingWarehouse.isDefault) {
      await prisma.warehouse.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      })
    }

    // 更新倉庫
    await prisma.warehouse.update({
      where: { id },
      data: {
        code: validated.data.code,
        name: validated.data.name,
        address: validated.data.address,
        phone: validated.data.phone,
        manager: validated.data.manager,
        isActive: validated.data.isActive,
        isDefault: validated.data.isDefault,
      },
    })

    revalidatePath('/settings/warehouses')

    return {
      success: true,
      message: '倉庫更新成功',
    }
  } catch (error) {
    console.error('Update warehouse error:', error)
    return {
      success: false,
      message: '更新倉庫失敗',
    }
  }
}

/**
 * 刪除倉庫
 */
export async function deleteWarehouse(id: string): Promise<ActionResult> {
  try {
    // 檢查倉庫是否存在
    const warehouse = await prisma.warehouse.findUnique({
      where: { id },
      include: {
        _count: {
          select: { inventories: true },
        },
      },
    })

    if (!warehouse) {
      return {
        success: false,
        message: '倉庫不存在',
      }
    }

    // 預設倉庫不允許刪除
    if (warehouse.isDefault) {
      return {
        success: false,
        message: '無法刪除預設倉庫',
      }
    }

    // 有庫存記錄時不允許刪除
    if (warehouse._count.inventories > 0) {
      return {
        success: false,
        message: `此倉庫仍有 ${warehouse._count.inventories} 筆庫存記錄，無法刪除`,
      }
    }

    await prisma.warehouse.delete({
      where: { id },
    })

    revalidatePath('/settings/warehouses')

    return {
      success: true,
      message: '倉庫刪除成功',
    }
  } catch (error) {
    console.error('Delete warehouse error:', error)
    return {
      success: false,
      message: '刪除倉庫失敗',
    }
  }
}
