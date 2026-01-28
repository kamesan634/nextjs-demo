import { z } from 'zod'

export const createHoldOrderSchema = z.object({
  storeId: z.string().min(1, '店舖 ID 為必填'),
  items: z.string().min(1, '商品項目為必填'),
  subtotal: z.number().min(0, '小計金額不可為負數'),
  discount: z.number().min(0, '折扣金額不可為負數').default(0),
  totalAmount: z.number().min(0, '總金額不可為負數'),
  reason: z.string().optional(),
  customerId: z.string().optional(),
})

export const resumeHoldOrderSchema = z.object({
  holdOrderId: z.string().min(1, '掛單 ID 為必填'),
})

export type CreateHoldOrderFormData = z.infer<typeof createHoldOrderSchema>
export type ResumeHoldOrderFormData = z.infer<typeof resumeHoldOrderSchema>
