'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { categorySchema } from '@/lib/validations/products'
import type { ActionResult } from '@/types'

/**
 * 取得所有分類
 */
export async function getCategories(params?: {
  page?: number
  pageSize?: number
  search?: string
  isActive?: boolean
}) {
  const page = params?.page || 1
  const pageSize = params?.pageSize || 20
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

  const [categories, total] = await Promise.all([
    prisma.category.findMany({
      where,
      include: {
        parent: {
          select: { id: true, name: true },
        },
        _count: {
          select: { products: true, children: true },
        },
      },
      orderBy: [{ level: 'asc' }, { sortOrder: 'asc' }],
      skip,
      take: pageSize,
    }),
    prisma.category.count({ where }),
  ])

  return {
    data: categories,
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
 * 取得分類樹狀結構
 */
export async function getCategoryTree() {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: [{ level: 'asc' }, { sortOrder: 'asc' }],
  })

  // 建立樹狀結構
  const categoryMap = new Map<string, (typeof categories)[0] & { children: typeof categories }>()
  const roots: ((typeof categories)[0] & { children: typeof categories })[] = []

  categories.forEach((cat: (typeof categories)[0]) => {
    categoryMap.set(cat.id, { ...cat, children: [] })
  })

  categories.forEach((cat: (typeof categories)[0]) => {
    const node = categoryMap.get(cat.id)!
    if (cat.parentId) {
      const parent = categoryMap.get(cat.parentId)
      if (parent) {
        parent.children.push(node)
      }
    } else {
      roots.push(node)
    }
  })

  return roots
}

/**
 * 取得分類選項 (用於下拉選單)
 */
export async function getCategoryOptions() {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: [{ level: 'asc' }, { sortOrder: 'asc' }],
    include: {
      parent: {
        select: { name: true },
      },
    },
  })

  return categories.map((cat: (typeof categories)[0]) => ({
    value: cat.id,
    label: cat.parent ? `${cat.parent.name} > ${cat.name}` : cat.name,
    level: cat.level,
  }))
}

/**
 * 取得單一分類
 */
export async function getCategory(id: string) {
  return prisma.category.findUnique({
    where: { id },
    include: {
      parent: true,
      children: true,
      _count: {
        select: { products: true },
      },
    },
  })
}

/**
 * 建立分類
 */
export async function createCategory(
  data: Parameters<typeof categorySchema.parse>[0]
): Promise<ActionResult> {
  try {
    const validated = categorySchema.safeParse(data)
    if (!validated.success) {
      return {
        success: false,
        message: '驗證失敗',
        errors: validated.error.flatten().fieldErrors as Record<string, string[]>,
      }
    }

    // 檢查代碼是否重複
    const existingCategory = await prisma.category.findUnique({
      where: { code: validated.data.code },
    })

    if (existingCategory) {
      return {
        success: false,
        message: '此分類代碼已存在',
      }
    }

    // 計算層級
    let level = 1
    if (validated.data.parentId) {
      const parent = await prisma.category.findUnique({
        where: { id: validated.data.parentId },
      })
      if (parent) {
        level = parent.level + 1
      }
    }

    const category = await prisma.category.create({
      data: {
        code: validated.data.code,
        name: validated.data.name,
        description: validated.data.description,
        parentId: validated.data.parentId,
        level,
        sortOrder: validated.data.sortOrder,
        isActive: validated.data.isActive,
      },
    })

    revalidatePath('/categories')

    return {
      success: true,
      message: '分類建立成功',
      data: { id: category.id },
    }
  } catch (error) {
    console.error('Create category error:', error)
    return {
      success: false,
      message: '建立分類失敗',
    }
  }
}

/**
 * 更新分類
 */
export async function updateCategory(
  id: string,
  data: Parameters<typeof categorySchema.parse>[0]
): Promise<ActionResult> {
  try {
    const validated = categorySchema.safeParse(data)
    if (!validated.success) {
      return {
        success: false,
        message: '驗證失敗',
        errors: validated.error.flatten().fieldErrors as Record<string, string[]>,
      }
    }

    const existingCategory = await prisma.category.findUnique({
      where: { id },
    })

    if (!existingCategory) {
      return {
        success: false,
        message: '分類不存在',
      }
    }

    // 檢查代碼是否重複
    const codeExists = await prisma.category.findFirst({
      where: {
        code: validated.data.code,
        NOT: { id },
      },
    })

    if (codeExists) {
      return {
        success: false,
        message: '此分類代碼已被使用',
      }
    }

    // 不能將自己設為父分類
    if (validated.data.parentId === id) {
      return {
        success: false,
        message: '不能將自己設為父分類',
      }
    }

    // 計算層級
    let level = 1
    if (validated.data.parentId) {
      const parent = await prisma.category.findUnique({
        where: { id: validated.data.parentId },
      })
      if (parent) {
        level = parent.level + 1
      }
    }

    await prisma.category.update({
      where: { id },
      data: {
        code: validated.data.code,
        name: validated.data.name,
        description: validated.data.description,
        parentId: validated.data.parentId,
        level,
        sortOrder: validated.data.sortOrder,
        isActive: validated.data.isActive,
      },
    })

    revalidatePath('/categories')

    return {
      success: true,
      message: '分類更新成功',
    }
  } catch (error) {
    console.error('Update category error:', error)
    return {
      success: false,
      message: '更新分類失敗',
    }
  }
}

/**
 * 刪除分類
 */
export async function deleteCategory(id: string): Promise<ActionResult> {
  try {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true, children: true },
        },
      },
    })

    if (!category) {
      return {
        success: false,
        message: '分類不存在',
      }
    }

    if (category._count.children > 0) {
      return {
        success: false,
        message: `此分類有 ${category._count.children} 個子分類，無法刪除`,
      }
    }

    if (category._count.products > 0) {
      return {
        success: false,
        message: `此分類有 ${category._count.products} 個商品，無法刪除`,
      }
    }

    await prisma.category.delete({
      where: { id },
    })

    revalidatePath('/categories')

    return {
      success: true,
      message: '分類刪除成功',
    }
  } catch (error) {
    console.error('Delete category error:', error)
    return {
      success: false,
      message: '刪除分類失敗',
    }
  }
}
