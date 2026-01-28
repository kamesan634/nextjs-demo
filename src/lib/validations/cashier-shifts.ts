import { z } from 'zod'

export const openShiftSchema = z.object({
  sessionId: z.string().min(1, '班別 ID 為必填'),
  storeId: z.string().min(1, '店舖 ID 為必填'),
  openingCash: z.number().min(0, '開班金額不可為負數'),
})

export const closeShiftSchema = z.object({
  closingCash: z.number().min(0, '關班金額不可為負數'),
  notes: z.string().optional(),
})

export type OpenShiftFormData = z.infer<typeof openShiftSchema>
export type CloseShiftFormData = z.infer<typeof closeShiftSchema>
