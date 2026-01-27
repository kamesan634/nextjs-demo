'use server'

import { signIn, signOut } from '@/lib/auth'
import { loginSchema, type LoginFormData } from '@/lib/validations/auth'
import { AuthError } from 'next-auth'
import type { ActionResult } from '@/types'

/**
 * 登入 Server Action
 * 處理使用者登入請求
 */
export async function login(formData: LoginFormData): Promise<ActionResult> {
  try {
    // 驗證表單資料
    const validatedData = loginSchema.safeParse(formData)
    if (!validatedData.success) {
      return {
        success: false,
        message: '驗證失敗',
        errors: validatedData.error.flatten().fieldErrors as Record<string, string[]>,
      }
    }

    // 執行登入
    await signIn('credentials', {
      username: validatedData.data.username,
      password: validatedData.data.password,
      redirect: false,
    })

    return {
      success: true,
      message: '登入成功',
    }
  } catch (error) {
    // 處理認證錯誤
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return {
            success: false,
            message: '帳號或密碼錯誤',
          }
        case 'AccessDenied':
          return {
            success: false,
            message: '存取被拒絕',
          }
        default:
          return {
            success: false,
            message: error.message || '登入失敗，請稍後再試',
          }
      }
    }

    // 處理其他錯誤
    console.error('Login error:', error)
    return {
      success: false,
      message: '系統錯誤，請稍後再試',
    }
  }
}

/**
 * 登出 Server Action
 * 處理使用者登出請求
 */
export async function logout(): Promise<ActionResult> {
  try {
    await signOut({ redirect: false })
    return {
      success: true,
      message: '已登出',
    }
  } catch (error) {
    console.error('Logout error:', error)
    return {
      success: false,
      message: '登出失敗',
    }
  }
}
