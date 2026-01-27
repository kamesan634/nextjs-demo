/**
 * Auth Server Actions 測試
 * 測試認證相關的 Server Actions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { login, logout } from '@/actions/auth'
import { signIn, signOut } from '@/lib/auth'

// Mock @/lib/auth
vi.mock('@/lib/auth', () => ({
  signIn: vi.fn(),
  signOut: vi.fn(),
}))

// Mock next-auth - 使用動態類創建避免 hoisting 問題
vi.mock('next-auth', async () => {
  return {
    AuthError: class AuthError extends Error {
      type: string
      constructor(type: string, message?: string) {
        super(message || type)
        this.type = type
        this.name = 'AuthError'
      }
    },
  }
})

// 創建 AuthError 實例的輔助函數
async function createAuthError(type: string, message?: string) {
  const { AuthError } = await import('next-auth')
  const error = new AuthError(type)
  if (message) {
    error.message = message
  }
  return error
}

describe('Auth Server Actions', () => {
  const mockSignIn = vi.mocked(signIn)
  const mockSignOut = vi.mocked(signOut)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('login', () => {
    it('成功登入時應回傳成功訊息', async () => {
      mockSignIn.mockResolvedValue({ ok: true } as never)

      const result = await login({
        username: 'testuser',
        password: 'password123',
      })

      expect(result.success).toBe(true)
      expect(result.message).toBe('登入成功')
      expect(mockSignIn).toHaveBeenCalledWith('credentials', {
        username: 'testuser',
        password: 'password123',
        redirect: false,
      })
    })

    it('驗證失敗時應回傳錯誤（空帳號）', async () => {
      const result = await login({
        username: '',
        password: 'password123',
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('驗證失敗')
      expect(result.errors).toBeDefined()
      expect(mockSignIn).not.toHaveBeenCalled()
    })

    it('驗證失敗時應回傳錯誤（空密碼）', async () => {
      const result = await login({
        username: 'testuser',
        password: '',
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('驗證失敗')
      expect(result.errors).toBeDefined()
      expect(mockSignIn).not.toHaveBeenCalled()
    })

    it('驗證失敗時應回傳錯誤（帳號過長）', async () => {
      const result = await login({
        username: 'a'.repeat(51),
        password: 'password123',
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('驗證失敗')
      expect(result.errors).toBeDefined()
    })

    it('CredentialsSignin 錯誤應回傳帳號或密碼錯誤', async () => {
      const error = await createAuthError('CredentialsSignin')
      mockSignIn.mockRejectedValue(error)

      const result = await login({
        username: 'testuser',
        password: 'wrongpassword',
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('帳號或密碼錯誤')
    })

    it('AccessDenied 錯誤應回傳存取被拒絕', async () => {
      const error = await createAuthError('AccessDenied')
      mockSignIn.mockRejectedValue(error)

      const result = await login({
        username: 'testuser',
        password: 'password123',
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('存取被拒絕')
    })

    it('其他 AuthError 應回傳對應訊息', async () => {
      const error = await createAuthError('CallbackRouteError', '回調錯誤')
      mockSignIn.mockRejectedValue(error)

      const result = await login({
        username: 'testuser',
        password: 'password123',
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('回調錯誤')
    })

    it('非 AuthError 應回傳系統錯誤訊息', async () => {
      mockSignIn.mockRejectedValue(new Error('Unknown error'))

      const result = await login({
        username: 'testuser',
        password: 'password123',
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('系統錯誤，請稍後再試')
    })
  })

  describe('logout', () => {
    it('成功登出時應回傳成功訊息', async () => {
      mockSignOut.mockResolvedValue(undefined as never)

      const result = await logout()

      expect(result.success).toBe(true)
      expect(result.message).toBe('已登出')
      expect(mockSignOut).toHaveBeenCalledWith({ redirect: false })
    })

    it('登出失敗時應回傳錯誤訊息', async () => {
      mockSignOut.mockRejectedValue(new Error('Logout failed'))

      const result = await logout()

      expect(result.success).toBe(false)
      expect(result.message).toBe('登出失敗')
    })
  })
})
