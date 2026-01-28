import { z } from 'zod'

export const createInvoiceSchema = z.object({
  orderId: z.string().min(1, '訂單 ID 為必填'),
  invoiceType: z.enum(['B2B', 'B2C'], { message: '發票類型必須為 B2B 或 B2C' }),
  buyerTaxId: z.string().optional(),
  buyerName: z.string().optional(),
  carrierType: z.enum(['MOBILE', 'CITIZEN', 'NONE']).optional(),
  carrierNo: z.string().optional(),
  donationCode: z.string().optional(),
  amount: z.number().min(0, '金額不可為負數'),
  taxAmount: z.number().min(0, '稅額不可為負數'),
  totalAmount: z.number().min(0, '總金額不可為負數'),
})

export const voidInvoiceSchema = z.object({
  voidReason: z.string().min(1, '作廢原因為必填'),
})

export type CreateInvoiceFormData = z.infer<typeof createInvoiceSchema>
export type VoidInvoiceFormData = z.infer<typeof voidInvoiceSchema>
