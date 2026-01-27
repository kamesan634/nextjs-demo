import { z } from 'zod'

/**
 * 認證相關的 Zod 驗證 Schema
 */

// 登入表單驗證
export const loginSchema = z.object({
  username: z.string().min(1, '請輸入帳號').max(50, '帳號長度不能超過 50 字元'),
  password: z.string().min(1, '請輸入密碼').max(100, '密碼長度不能超過 100 字元'),
})

export type LoginFormData = z.infer<typeof loginSchema>

// 使用者建立驗證
export const createUserSchema = z.object({
  username: z
    .string()
    .min(3, '帳號至少需要 3 個字元')
    .max(50, '帳號長度不能超過 50 字元')
    .regex(/^[a-zA-Z0-9_]+$/, '帳號只能包含英文字母、數字和底線'),
  email: z.string().min(1, '請輸入電子郵件').email('請輸入有效的電子郵件格式'),
  password: z.string().min(6, '密碼至少需要 6 個字元').max(100, '密碼長度不能超過 100 字元'),
  name: z.string().min(1, '請輸入姓名').max(100, '姓名長度不能超過 100 字元'),
  phone: z.string().max(20, '電話長度不能超過 20 字元').optional().nullable(),
  roleId: z.string().min(1, '請選擇角色'),
  storeId: z.string().optional().nullable(),
  isActive: z.boolean(),
})

export type CreateUserFormData = z.infer<typeof createUserSchema>

// 使用者更新驗證
export const updateUserSchema = z.object({
  email: z.string().min(1, '請輸入電子郵件').email('請輸入有效的電子郵件格式'),
  password: z
    .string()
    .min(6, '密碼至少需要 6 個字元')
    .max(100, '密碼長度不能超過 100 字元')
    .optional()
    .or(z.literal('')),
  name: z.string().min(1, '請輸入姓名').max(100, '姓名長度不能超過 100 字元'),
  phone: z.string().max(20, '電話長度不能超過 20 字元').optional().nullable(),
  roleId: z.string().min(1, '請選擇角色'),
  storeId: z.string().optional().nullable(),
  isActive: z.boolean(),
})

export type UpdateUserFormData = z.infer<typeof updateUserSchema>

// 角色建立驗證
export const createRoleSchema = z.object({
  code: z
    .string()
    .min(1, '請輸入角色代碼')
    .max(20, '角色代碼長度不能超過 20 字元')
    .regex(/^[A-Z_]+$/, '角色代碼只能包含大寫英文字母和底線'),
  name: z.string().min(1, '請輸入角色名稱').max(50, '角色名稱長度不能超過 50 字元'),
  description: z.string().max(200, '角色描述長度不能超過 200 字元').optional().nullable(),
  permissions: z.array(
    z.object({
      module: z.string(),
      action: z.string(),
    })
  ),
})

export type CreateRoleFormData = z.infer<typeof createRoleSchema>

// 角色更新驗證
export const updateRoleSchema = z.object({
  name: z.string().min(1, '請輸入角色名稱').max(50, '角色名稱長度不能超過 50 字元'),
  description: z.string().max(200, '角色描述長度不能超過 200 字元').optional().nullable(),
  permissions: z.array(
    z.object({
      module: z.string(),
      action: z.string(),
    })
  ),
})

export type UpdateRoleFormData = z.infer<typeof updateRoleSchema>
