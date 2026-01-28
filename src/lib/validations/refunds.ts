import { z } from 'zod'

export const createRefundSchema = z.object({
  orderId: z.string().min(1, '訂單 ID 為必填'),
  reason: z.string().min(1, '退換貨原因為必填'),
  type: z.enum(['REFUND', 'EXCHANGE'], { message: '類型必須為 REFUND 或 EXCHANGE' }),
  items: z
    .array(
      z.object({
        productId: z.string().min(1, '商品 ID 為必填'),
        quantity: z.number().int().positive('數量必須為正整數'),
        unitPrice: z.number().min(0, '單價不可為負數'),
        reason: z.string().optional(),
      })
    )
    .min(1, '至少需要一個退換貨商品'),
  notes: z.string().optional(),
})

export const approveRefundSchema = z.object({
  approvalStatus: z.enum(['APPROVED', 'REJECTED'], {
    message: '審核狀態必須為 APPROVED 或 REJECTED',
  }),
  notes: z.string().optional(),
})

export type CreateRefundFormData = z.infer<typeof createRefundSchema>
export type ApproveRefundFormData = z.infer<typeof approveRefundSchema>
