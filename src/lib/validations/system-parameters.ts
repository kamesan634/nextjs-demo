import { z } from 'zod'

/**
 * 系統參數驗證 Schema
 */

// 系統參數資料類型
export const parameterDataTypes = ['STRING', 'NUMBER', 'BOOLEAN', 'JSON'] as const
export type ParameterDataType = (typeof parameterDataTypes)[number]

// 系統參數分類
export const parameterCategories = ['COMPANY', 'TAX', 'INVENTORY', 'SALES', 'SECURITY'] as const
export type ParameterCategory = (typeof parameterCategories)[number]

// 新增系統參數驗證
export const createSystemParameterSchema = z.object({
  code: z
    .string()
    .min(1, '請輸入參數代碼')
    .max(50, '參數代碼長度不能超過 50 字元')
    .regex(/^[A-Z0-9_]+$/, '參數代碼只能包含大寫英文字母、數字和底線'),
  name: z.string().min(1, '請輸入參數名稱').max(100, '參數名稱長度不能超過 100 字元'),
  value: z.string().min(1, '請輸入參數值'),
  dataType: z.enum(parameterDataTypes, { message: '請選擇資料類型' }),
  category: z.enum(parameterCategories, { message: '請選擇分類' }),
  description: z.string().max(500, '描述長度不能超過 500 字元').optional().nullable(),
  isEditable: z.boolean(),
})

// 更新系統參數驗證
export const updateSystemParameterSchema = z.object({
  name: z.string().min(1, '請輸入參數名稱').max(100, '參數名稱長度不能超過 100 字元'),
  value: z.string().min(1, '請輸入參數值'),
  dataType: z.enum(parameterDataTypes, { message: '請選擇資料類型' }),
  category: z.enum(parameterCategories, { message: '請選擇分類' }),
  description: z.string().max(500, '描述長度不能超過 500 字元').optional().nullable(),
  isEditable: z.boolean(),
})

export type CreateSystemParameterFormData = z.infer<typeof createSystemParameterSchema>
export type UpdateSystemParameterFormData = z.infer<typeof updateSystemParameterSchema>
