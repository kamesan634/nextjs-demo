import { z } from 'zod'

/**
 * 商品組合/套餐驗證 Schema
 */

const bundleItemSchema = z.object({
  productId: z.string().min(1, '請選擇商品'),
  quantity: z.number().int().min(1, '數量至少為 1'),
})

export const createProductBundleSchema = z.object({
  code: z
    .string()
    .min(1, '請輸入組合代碼')
    .max(30, '組合代碼長度不能超過 30 字元')
    .regex(/^[A-Z0-9_-]+$/i, '組合代碼只能包含英文字母、數字、底線和連字號'),
  name: z.string().min(1, '請輸入組合名稱').max(100, '組合名稱長度不能超過 100 字元'),
  description: z.string().max(500, '描述長度不能超過 500 字元').optional().nullable(),
  bundlePrice: z.number().min(0, '價格不能小於 0'),
  isActive: z.boolean(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  items: z.array(bundleItemSchema).min(1, '至少需要一個商品項目'),
})

export const updateProductBundleSchema = createProductBundleSchema.omit({ code: true })

export type CreateProductBundleFormData = z.infer<typeof createProductBundleSchema>
export type UpdateProductBundleFormData = z.infer<typeof updateProductBundleSchema>
