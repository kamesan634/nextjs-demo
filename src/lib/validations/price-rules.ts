import { z } from 'zod'

/**
 * 價格規則驗證 Schema
 */

export const priceRuleTypes = ['QUANTITY', 'MEMBER_LEVEL', 'PROMOTION'] as const
export type PriceRuleType = (typeof priceRuleTypes)[number]

export const createPriceRuleSchema = z.object({
  productId: z.string().min(1, '請選擇商品'),
  ruleType: z.enum(priceRuleTypes, { message: '請選擇規則類型' }),
  minQuantity: z.number().int().min(1).optional().nullable(),
  memberLevelId: z.string().optional().nullable(),
  price: z.number().min(0, '價格不能小於 0'),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  isActive: z.boolean(),
})

export const updatePriceRuleSchema = createPriceRuleSchema.omit({ productId: true })

export type CreatePriceRuleFormData = z.infer<typeof createPriceRuleSchema>
export type UpdatePriceRuleFormData = z.infer<typeof updatePriceRuleSchema>
