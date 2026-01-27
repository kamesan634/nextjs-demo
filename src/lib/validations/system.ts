import { z } from 'zod'

/**
 * 系統管理相關的 Zod 驗證 Schema
 */

// ===================================
// 門市管理驗證
// ===================================

export const storeSchema = z.object({
  code: z
    .string()
    .min(1, '請輸入門市代碼')
    .max(20, '門市代碼長度不能超過 20 字元')
    .regex(/^[A-Z0-9_-]+$/i, '門市代碼只能包含英文字母、數字、底線和連字號'),
  name: z.string().min(1, '請輸入門市名稱').max(100, '門市名稱長度不能超過 100 字元'),
  address: z.string().max(200, '地址長度不能超過 200 字元').optional().nullable(),
  phone: z.string().max(20, '電話長度不能超過 20 字元').optional().nullable(),
  email: z.string().email('請輸入有效的電子郵件格式').optional().nullable().or(z.literal('')),
  manager: z.string().max(50, '店長姓名長度不能超過 50 字元').optional().nullable(),
  openTime: z.string().max(10, '營業開始時間格式錯誤').optional().nullable(),
  closeTime: z.string().max(10, '營業結束時間格式錯誤').optional().nullable(),
  isActive: z.boolean(),
})

export type StoreFormData = z.infer<typeof storeSchema>

// ===================================
// 倉庫管理驗證
// ===================================

export const warehouseSchema = z.object({
  code: z
    .string()
    .min(1, '請輸入倉庫代碼')
    .max(20, '倉庫代碼長度不能超過 20 字元')
    .regex(/^[A-Z0-9_-]+$/i, '倉庫代碼只能包含英文字母、數字、底線和連字號'),
  name: z.string().min(1, '請輸入倉庫名稱').max(100, '倉庫名稱長度不能超過 100 字元'),
  address: z.string().max(200, '地址長度不能超過 200 字元').optional().nullable(),
  phone: z.string().max(20, '電話長度不能超過 20 字元').optional().nullable(),
  manager: z.string().max(50, '倉管人員姓名長度不能超過 50 字元').optional().nullable(),
  isActive: z.boolean(),
  isDefault: z.boolean(),
})

export type WarehouseFormData = z.infer<typeof warehouseSchema>
