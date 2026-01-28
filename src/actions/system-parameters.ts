'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import {
  createSystemParameterSchema,
  updateSystemParameterSchema,
  type ParameterCategory,
} from '@/lib/validations/system-parameters'
import type { ActionResult } from '@/types'

/**
 * 取得所有系統參數
 */
export async function getSystemParameters(params?: {
  page?: number
  pageSize?: number
  search?: string
  category?: ParameterCategory
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
    ...(params?.category && { category: params.category }),
  }

  const [parameters, total] = await Promise.all([
    prisma.systemParameter.findMany({
      where,
      orderBy: [{ category: 'asc' }, { code: 'asc' }],
      skip,
      take: pageSize,
    }),
    prisma.systemParameter.count({ where }),
  ])

  return {
    data: parameters,
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
 * 取得單一系統參數
 */
export async function getSystemParameter(id: string) {
  return prisma.systemParameter.findUnique({
    where: { id },
  })
}

/**
 * 依代碼取得系統參數
 */
export async function getSystemParameterByCode(code: string) {
  return prisma.systemParameter.findUnique({
    where: { code },
  })
}

/**
 * 取得分類下的所有參數
 */
export async function getSystemParametersByCategory(category: ParameterCategory) {
  return prisma.systemParameter.findMany({
    where: { category },
    orderBy: { code: 'asc' },
  })
}

/**
 * 建立系統參數
 */
export async function createSystemParameter(
  data: Parameters<typeof createSystemParameterSchema.parse>[0]
): Promise<ActionResult> {
  try {
    const validated = createSystemParameterSchema.safeParse(data)
    if (!validated.success) {
      return {
        success: false,
        message: '驗證失敗',
        errors: validated.error.flatten().fieldErrors as Record<string, string[]>,
      }
    }

    // 檢查代碼是否已存在
    const existing = await prisma.systemParameter.findUnique({
      where: { code: validated.data.code },
    })

    if (existing) {
      return {
        success: false,
        message: '此參數代碼已存在',
      }
    }

    // 驗證值的格式
    const valueValidation = validateParameterValue(validated.data.value, validated.data.dataType)
    if (!valueValidation.valid) {
      return {
        success: false,
        message: valueValidation.message,
      }
    }

    const parameter = await prisma.systemParameter.create({
      data: {
        code: validated.data.code,
        name: validated.data.name,
        value: validated.data.value,
        dataType: validated.data.dataType,
        category: validated.data.category,
        description: validated.data.description,
        isEditable: validated.data.isEditable,
      },
    })

    revalidatePath('/settings/parameters')

    return {
      success: true,
      message: '系統參數建立成功',
      data: { id: parameter.id },
    }
  } catch (error) {
    console.error('Create system parameter error:', error)
    return {
      success: false,
      message: '建立系統參數失敗',
    }
  }
}

/**
 * 更新系統參數
 */
export async function updateSystemParameter(
  id: string,
  data: Parameters<typeof updateSystemParameterSchema.parse>[0]
): Promise<ActionResult> {
  try {
    const validated = updateSystemParameterSchema.safeParse(data)
    if (!validated.success) {
      return {
        success: false,
        message: '驗證失敗',
        errors: validated.error.flatten().fieldErrors as Record<string, string[]>,
      }
    }

    const existing = await prisma.systemParameter.findUnique({
      where: { id },
    })

    if (!existing) {
      return {
        success: false,
        message: '系統參數不存在',
      }
    }

    if (!existing.isEditable) {
      return {
        success: false,
        message: '此參數不可編輯',
      }
    }

    // 驗證值的格式
    const valueValidation = validateParameterValue(validated.data.value, validated.data.dataType)
    if (!valueValidation.valid) {
      return {
        success: false,
        message: valueValidation.message,
      }
    }

    await prisma.systemParameter.update({
      where: { id },
      data: {
        name: validated.data.name,
        value: validated.data.value,
        dataType: validated.data.dataType,
        category: validated.data.category,
        description: validated.data.description,
        isEditable: validated.data.isEditable,
      },
    })

    revalidatePath('/settings/parameters')

    return {
      success: true,
      message: '系統參數更新成功',
    }
  } catch (error) {
    console.error('Update system parameter error:', error)
    return {
      success: false,
      message: '更新系統參數失敗',
    }
  }
}

/**
 * 刪除系統參數
 */
export async function deleteSystemParameter(id: string): Promise<ActionResult> {
  try {
    const parameter = await prisma.systemParameter.findUnique({
      where: { id },
    })

    if (!parameter) {
      return {
        success: false,
        message: '系統參數不存在',
      }
    }

    if (!parameter.isEditable) {
      return {
        success: false,
        message: '此參數不可刪除',
      }
    }

    await prisma.systemParameter.delete({
      where: { id },
    })

    revalidatePath('/settings/parameters')

    return {
      success: true,
      message: '系統參數刪除成功',
    }
  } catch (error) {
    console.error('Delete system parameter error:', error)
    return {
      success: false,
      message: '刪除系統參數失敗',
    }
  }
}

/**
 * 驗證參數值格式
 */
function validateParameterValue(
  value: string,
  dataType: string
): { valid: boolean; message: string } {
  switch (dataType) {
    case 'NUMBER':
      if (isNaN(Number(value))) {
        return { valid: false, message: '參數值必須是有效的數字' }
      }
      break
    case 'BOOLEAN':
      if (value !== 'true' && value !== 'false') {
        return { valid: false, message: '參數值必須是 true 或 false' }
      }
      break
    case 'JSON':
      try {
        JSON.parse(value)
      } catch {
        return { valid: false, message: '參數值必須是有效的 JSON 格式' }
      }
      break
  }
  return { valid: true, message: '' }
}

/**
 * 取得參數值 (帶類型轉換)
 */
export async function getParameterValue<T = string>(code: string, defaultValue?: T): Promise<T> {
  const param = await prisma.systemParameter.findUnique({
    where: { code },
  })

  if (!param) {
    return defaultValue as T
  }

  switch (param.dataType) {
    case 'NUMBER':
      return Number(param.value) as T
    case 'BOOLEAN':
      return (param.value === 'true') as T
    case 'JSON':
      return JSON.parse(param.value) as T
    default:
      return param.value as T
  }
}
