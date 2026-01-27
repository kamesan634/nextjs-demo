import { z } from 'zod'

/**
 * 商品管理相關的 Zod 驗證 Schema
 */

// 商品分類驗證
export const categorySchema = z.object({
  code: z
    .string()
    .min(1, '請輸入分類代碼')
    .max(20, '分類代碼長度不能超過 20 字元')
    .regex(/^[A-Z0-9_-]+$/i, '分類代碼只能包含英文字母、數字、底線和連字號'),
  name: z.string().min(1, '請輸入分類名稱').max(50, '分類名稱長度不能超過 50 字元'),
  description: z.string().max(200, '分類描述長度不能超過 200 字元').optional().nullable(),
  parentId: z.string().optional().nullable(),
  sortOrder: z.number().int().min(0),
  isActive: z.boolean(),
})

export type CategoryFormData = z.infer<typeof categorySchema>

// 商品驗證
export const productSchema = z.object({
  sku: z
    .string()
    .min(1, '請輸入商品編號')
    .max(50, '商品編號長度不能超過 50 字元')
    .regex(/^[A-Z0-9_-]+$/i, '商品編號只能包含英文字母、數字、底線和連字號'),
  barcode: z.string().max(50, '條碼長度不能超過 50 字元').optional().nullable(),
  name: z.string().min(1, '請輸入商品名稱').max(100, '商品名稱長度不能超過 100 字元'),
  shortName: z.string().max(50, '商品簡稱長度不能超過 50 字元').optional().nullable(),
  description: z.string().max(500, '商品描述長度不能超過 500 字元').optional().nullable(),
  specification: z.string().max(200, '規格說明長度不能超過 200 字元').optional().nullable(),

  // 價格
  costPrice: z.number().min(0, '成本價不能為負數'),
  listPrice: z.number().min(0, '定價不能為負數'),
  sellingPrice: z.number().min(0, '售價不能為負數'),
  minPrice: z.number().min(0, '最低售價不能為負數').optional().nullable(),

  // 庫存設定
  safetyStock: z.number().int().min(0, '安全庫存不能為負數'),
  reorderPoint: z.number().int().min(0, '補貨點不能為負數'),
  reorderQty: z.number().int().min(0, '建議補貨量不能為負數'),

  // 關聯
  categoryId: z.string().min(1, '請選擇商品分類'),
  unitId: z.string().min(1, '請選擇計量單位'),
  taxTypeId: z.string().optional().nullable(),

  // 屬性
  isActive: z.boolean(),
  isSerialControl: z.boolean(),
  isBatchControl: z.boolean(),
  allowNegativeStock: z.boolean(),

  imageUrl: z.string().url('請輸入有效的圖片網址').optional().nullable().or(z.literal('')),
})

export type ProductFormData = z.infer<typeof productSchema>

// 供應商驗證
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
  paymentTerms: z.number().int().min(0, '付款天數不能為負數'),
  creditLimit: z.number().min(0, '信用額度不能為負數').optional().nullable(),
  notes: z.string().max(500, '備註長度不能超過 500 字元').optional().nullable(),
  isActive: z.boolean(),
})

export type SupplierFormData = z.infer<typeof supplierSchema>

// 客戶/會員驗證
export const customerSchema = z.object({
  code: z.string().min(1, '請輸入會員編號').max(20, '會員編號長度不能超過 20 字元'),
  name: z.string().min(1, '請輸入會員姓名').max(50, '會員姓名長度不能超過 50 字元'),
  phone: z.string().max(20, '手機號碼長度不能超過 20 字元').optional().nullable(),
  email: z.string().email('請輸入有效的電子郵件格式').optional().nullable().or(z.literal('')),
  gender: z.enum(['M', 'F', 'O']).optional().nullable(),
  birthday: z.date().optional().nullable(),
  address: z.string().max(200, '地址長度不能超過 200 字元').optional().nullable(),
  levelId: z.string().min(1, '請選擇會員等級'),
  notes: z.string().max(500, '備註長度不能超過 500 字元').optional().nullable(),
  isActive: z.boolean(),
})

export type CustomerFormData = z.infer<typeof customerSchema>
