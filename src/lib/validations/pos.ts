import { z } from 'zod'

export const openSessionSchema = z.object({
  storeId: z.string().min(1, '店舖 ID 為必填'),
  openingCash: z.number().min(0, '開班金額不可為負數'),
})

export const closeSessionSchema = z.object({
  closingCash: z.number().min(0, '關班金額不可為負數'),
  notes: z.string().optional(),
})

export type OpenSessionFormData = z.infer<typeof openSessionSchema>
export type CloseSessionFormData = z.infer<typeof closeSessionSchema>
