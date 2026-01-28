import { z } from 'zod'

/**
 * 出庫單驗證 Schema
 */

const goodsIssueItemSchema = z.object({
  productId: z.string().min(1, '請選擇商品'),
  quantity: z.number().int().min(1, '數量至少為 1'),
  notes: z.string().optional().nullable(),
})

export const createGoodsIssueSchema = z.object({
  warehouseId: z.string().min(1, '請選擇倉庫'),
  type: z.enum(['SALES', 'DAMAGE', 'OTHER'], { message: '請選擇出庫類型' }),
  referenceType: z.string().optional().nullable(),
  referenceId: z.string().optional().nullable(),
  issueDate: z.string().optional(),
  notes: z.string().max(500).optional().nullable(),
  items: z.array(goodsIssueItemSchema).min(1, '至少需要一個出庫項目'),
})

export type CreateGoodsIssueFormData = z.infer<typeof createGoodsIssueSchema>
