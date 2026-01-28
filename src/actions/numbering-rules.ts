'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import {
  createNumberingRuleSchema,
  updateNumberingRuleSchema,
} from '@/lib/validations/numbering-rules'
import type { ActionResult } from '@/types'

/**
 * 取得所有編號規則
 */
export async function getNumberingRules(params?: {
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

  const [rules, total] = await Promise.all([
    prisma.numberingRule.findMany({
      where,
      orderBy: { code: 'asc' },
      skip,
      take: pageSize,
    }),
    prisma.numberingRule.count({ where }),
  ])

  return {
    data: rules,
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
 * 取得單一編號規則
 */
export async function getNumberingRule(id: string) {
  return prisma.numberingRule.findUnique({
    where: { id },
  })
}

/**
 * 依代碼取得編號規則
 */
export async function getNumberingRuleByCode(code: string) {
  return prisma.numberingRule.findUnique({
    where: { code },
  })
}

/**
 * 建立編號規則
 */
export async function createNumberingRule(
  data: Parameters<typeof createNumberingRuleSchema.parse>[0]
): Promise<ActionResult> {
  try {
    const validated = createNumberingRuleSchema.safeParse(data)
    if (!validated.success) {
      return {
        success: false,
        message: '驗證失敗',
        errors: validated.error.flatten().fieldErrors as Record<string, string[]>,
      }
    }

    // 檢查代碼是否已存在
    const existing = await prisma.numberingRule.findUnique({
      where: { code: validated.data.code },
    })

    if (existing) {
      return {
        success: false,
        message: '此規則代碼已存在',
      }
    }

    const rule = await prisma.numberingRule.create({
      data: {
        code: validated.data.code,
        name: validated.data.name,
        prefix: validated.data.prefix,
        dateFormat: validated.data.dateFormat || null,
        sequenceLength: validated.data.sequenceLength,
        resetPeriod: validated.data.resetPeriod || null,
        isActive: validated.data.isActive,
        currentSequence: 0,
      },
    })

    revalidatePath('/settings/numbering-rules')

    return {
      success: true,
      message: '編號規則建立成功',
      data: { id: rule.id },
    }
  } catch (error) {
    console.error('Create numbering rule error:', error)
    return {
      success: false,
      message: '建立編號規則失敗',
    }
  }
}

/**
 * 更新編號規則
 */
export async function updateNumberingRule(
  id: string,
  data: Parameters<typeof updateNumberingRuleSchema.parse>[0]
): Promise<ActionResult> {
  try {
    const validated = updateNumberingRuleSchema.safeParse(data)
    if (!validated.success) {
      return {
        success: false,
        message: '驗證失敗',
        errors: validated.error.flatten().fieldErrors as Record<string, string[]>,
      }
    }

    const existing = await prisma.numberingRule.findUnique({
      where: { id },
    })

    if (!existing) {
      return {
        success: false,
        message: '編號規則不存在',
      }
    }

    await prisma.numberingRule.update({
      where: { id },
      data: {
        name: validated.data.name,
        prefix: validated.data.prefix,
        dateFormat: validated.data.dateFormat || null,
        sequenceLength: validated.data.sequenceLength,
        resetPeriod: validated.data.resetPeriod || null,
        isActive: validated.data.isActive,
      },
    })

    revalidatePath('/settings/numbering-rules')

    return {
      success: true,
      message: '編號規則更新成功',
    }
  } catch (error) {
    console.error('Update numbering rule error:', error)
    return {
      success: false,
      message: '更新編號規則失敗',
    }
  }
}

/**
 * 刪除編號規則
 */
export async function deleteNumberingRule(id: string): Promise<ActionResult> {
  try {
    const rule = await prisma.numberingRule.findUnique({
      where: { id },
    })

    if (!rule) {
      return {
        success: false,
        message: '編號規則不存在',
      }
    }

    await prisma.numberingRule.delete({
      where: { id },
    })

    revalidatePath('/settings/numbering-rules')

    return {
      success: true,
      message: '編號規則刪除成功',
    }
  } catch (error) {
    console.error('Delete numbering rule error:', error)
    return {
      success: false,
      message: '刪除編號規則失敗',
    }
  }
}

/**
 * 重設編號規則序號
 */
export async function resetNumberingRuleSequence(id: string): Promise<ActionResult> {
  try {
    const rule = await prisma.numberingRule.findUnique({
      where: { id },
    })

    if (!rule) {
      return {
        success: false,
        message: '編號規則不存在',
      }
    }

    await prisma.numberingRule.update({
      where: { id },
      data: {
        currentSequence: 0,
        lastResetAt: new Date(),
      },
    })

    revalidatePath('/settings/numbering-rules')

    return {
      success: true,
      message: '編號規則序號已重設',
    }
  } catch (error) {
    console.error('Reset numbering rule sequence error:', error)
    return {
      success: false,
      message: '重設編號規則序號失敗',
    }
  }
}
