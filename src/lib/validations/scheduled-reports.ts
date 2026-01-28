import { z } from 'zod'

/**
 * 排程報表驗證 Schema
 */

export const createScheduledReportSchema = z.object({
  reportId: z.string().min(1, '請選擇報表'),
  schedule: z
    .string()
    .min(1, '請輸入排程 (cron 格式)')
    .regex(/^[\d*,/-]+ [\d*,/-]+ [\d*,/-]+ [\d*,/-]+ [\d*,/-]+$/, '請輸入有效的 cron 格式'),
  recipients: z.array(z.string().email('請輸入有效的電子郵件')).min(1, '請至少輸入一個收件者'),
  format: z.enum(['EXCEL', 'PDF']),
  isActive: z.boolean(),
})

export const updateScheduledReportSchema = createScheduledReportSchema.omit({ reportId: true })

export type CreateScheduledReportFormData = z.infer<typeof createScheduledReportSchema>
export type UpdateScheduledReportFormData = z.infer<typeof updateScheduledReportSchema>
