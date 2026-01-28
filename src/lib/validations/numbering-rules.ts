import { z } from 'zod'

/**
 * 編號規則驗證 Schema
 */

// 日期格式類型
export const dateFormats = ['YYYYMMDD', 'YYYYMM', 'YYYY', ''] as const
export type DateFormat = (typeof dateFormats)[number]

// 重設週期類型
export const resetPeriods = ['DAILY', 'MONTHLY', 'YEARLY', 'NEVER'] as const
export type ResetPeriod = (typeof resetPeriods)[number]

// 新增編號規則驗證
export const createNumberingRuleSchema = z.object({
  code: z
    .string()
    .min(1, '請輸入規則代碼')
    .max(30, '規則代碼長度不能超過 30 字元')
    .regex(/^[A-Z0-9_]+$/, '規則代碼只能包含大寫英文字母、數字和底線'),
  name: z.string().min(1, '請輸入規則名稱').max(100, '規則名稱長度不能超過 100 字元'),
  prefix: z
    .string()
    .min(1, '請輸入前綴')
    .max(10, '前綴長度不能超過 10 字元')
    .regex(/^[A-Z0-9-]+$/, '前綴只能包含大寫英文字母、數字和連字號'),
  dateFormat: z.string().optional().nullable(),
  sequenceLength: z
    .number()
    .int('序號長度必須是整數')
    .min(1, '序號長度最小為 1')
    .max(10, '序號長度最大為 10'),
  resetPeriod: z.enum(resetPeriods).optional().nullable(),
  isActive: z.boolean(),
})

// 更新編號規則驗證
export const updateNumberingRuleSchema = z.object({
  name: z.string().min(1, '請輸入規則名稱').max(100, '規則名稱長度不能超過 100 字元'),
  prefix: z
    .string()
    .min(1, '請輸入前綴')
    .max(10, '前綴長度不能超過 10 字元')
    .regex(/^[A-Z0-9-]+$/, '前綴只能包含大寫英文字母、數字和連字號'),
  dateFormat: z.string().optional().nullable(),
  sequenceLength: z
    .number()
    .int('序號長度必須是整數')
    .min(1, '序號長度最小為 1')
    .max(10, '序號長度最大為 10'),
  resetPeriod: z.enum(resetPeriods).optional().nullable(),
  isActive: z.boolean(),
})

export type CreateNumberingRuleFormData = z.infer<typeof createNumberingRuleSchema>
export type UpdateNumberingRuleFormData = z.infer<typeof updateNumberingRuleSchema>
