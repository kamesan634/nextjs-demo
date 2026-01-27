import { z } from 'zod'

/**
 * 業務相關的 Zod 驗證 Schema
 * 包含：客戶/會員、供應商、會員等級
 */

// ===================================
// 會員等級驗證
// ===================================

export const customerLevelSchema = z.object({
  code: z
    .string()
    .min(1, '請輸入等級代碼')
    .max(20, '等級代碼長度不能超過 20 字元')
    .regex(/^[A-Z0-9_-]+$/i, '等級代碼只能包含英文字母、數字、底線和連字號'),
  name: z.string().min(1, '請輸入等級名稱').max(50, '等級名稱長度不能超過 50 字元'),
  discountRate: z.number().min(0, '折扣率不能小於 0').max(1, '折扣率不能大於 1'),
  pointsMultiplier: z.number().min(0, '點數倍率不能小於 0').max(10, '點數倍率不能超過 10'),
  minPoints: z.number().int('升級所需點數必須是整數').min(0, '升級所需點數不能小於 0'),
  benefits: z.string().max(500, '會員權益描述長度不能超過 500 字元').optional().nullable(),
  sortOrder: z.number().int('排序順序必須是整數').min(0, '排序順序不能小於 0'),
  isActive: z.boolean(),
})

export type CustomerLevelFormData = z.infer<typeof customerLevelSchema>

// ===================================
// 客戶/會員驗證
// ===================================

export const customerSchema = z.object({
  code: z
    .string()
    .min(1, '請輸入會員編號')
    .max(20, '會員編號長度不能超過 20 字元')
    .regex(/^[A-Z0-9_-]+$/i, '會員編號只能包含英文字母、數字、底線和連字號'),
  name: z.string().min(1, '請輸入會員姓名').max(50, '會員姓名長度不能超過 50 字元'),
  phone: z.string().max(20, '手機號碼長度不能超過 20 字元').optional().nullable(),
  email: z.string().email('請輸入有效的電子郵件格式').optional().nullable().or(z.literal('')),
  gender: z.enum(['M', 'F', 'O']).optional().nullable(),
  birthday: z.string().optional().nullable(),
  address: z.string().max(200, '地址長度不能超過 200 字元').optional().nullable(),
  levelId: z.string().min(1, '請選擇會員等級'),
  totalPoints: z.number().int('累計點數必須是整數').min(0, '累計點數不能小於 0'),
  availablePoints: z.number().int('可用點數必須是整數').min(0, '可用點數不能小於 0'),
  notes: z.string().max(500, '備註長度不能超過 500 字元').optional().nullable(),
  isActive: z.boolean(),
})

export type CustomerFormData = z.infer<typeof customerSchema>

// ===================================
// 供應商驗證
// ===================================

export const supplierSchema = z.object({
  code: z
    .string()
    .min(1, '請輸入供應商代碼')
    .max(20, '供應商代碼長度不能超過 20 字元')
    .regex(/^[A-Z0-9_-]+$/i, '供應商代碼只能包含英文字母、數字、底線和連字號'),
  name: z.string().min(1, '請輸入供應商名稱').max(100, '供應商名稱長度不能超過 100 字元'),
  shortName: z.string().max(50, '供應商簡稱長度不能超過 50 字元').optional().nullable(),
  contactPerson: z.string().max(50, '聯絡人姓名長度不能超過 50 字元').optional().nullable(),
  phone: z.string().max(20, '電話長度不能超過 20 字元').optional().nullable(),
  fax: z.string().max(20, '傳真長度不能超過 20 字元').optional().nullable(),
  email: z.string().email('請輸入有效的電子郵件格式').optional().nullable().or(z.literal('')),
  address: z.string().max(200, '地址長度不能超過 200 字元').optional().nullable(),
  taxId: z.string().max(20, '統一編號長度不能超過 20 字元').optional().nullable(),
  bankName: z.string().max(50, '銀行名稱長度不能超過 50 字元').optional().nullable(),
  bankAccount: z.string().max(50, '銀行帳號長度不能超過 50 字元').optional().nullable(),
  paymentTerms: z
    .number()
    .int('付款天數必須是整數')
    .min(0, '付款天數不能小於 0')
    .max(365, '付款天數不能超過 365 天'),
  creditLimit: z.number().min(0, '信用額度不能小於 0').optional().nullable(),
  notes: z.string().max(500, '備註長度不能超過 500 字元').optional().nullable(),
  isActive: z.boolean(),
})

export type SupplierFormData = z.infer<typeof supplierSchema>
