/**
 * Users Server Actions 測試
 * 測試使用者管理相關的 Server Actions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getUsers, getUser, createUser, updateUser, deleteUser } from '@/actions/users'
import prisma from '@/lib/prisma'

// Mock revalidatePath
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

// Mock bcryptjs
vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed_password'),
  },
}))

describe('Users Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===== getUsers 測試 =====
  describe('getUsers', () => {
    const mockUsers = [
      {
        id: '1',
        username: 'admin',
        email: 'admin@example.com',
        name: '管理員',
        password: 'hashed_password',
        phone: '0912345678',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        role: { id: 'role-1', code: 'ADMIN', name: '管理員' },
        store: null,
      },
      {
        id: '2',
        username: 'cashier',
        email: 'cashier@example.com',
        name: '收銀員',
        password: 'hashed_password',
        phone: '0923456789',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        role: { id: 'role-2', code: 'CASHIER', name: '收銀員' },
        store: { id: 'store-1', code: 'S001', name: '門市一' },
      },
    ]

    it('應回傳分頁的使用者列表', async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValue(mockUsers as never)
      vi.mocked(prisma.user.count).mockResolvedValue(2)

      const result = await getUsers({ page: 1, pageSize: 10 })

      expect(result.data).toHaveLength(2)
      expect(result.pagination.total).toBe(2)
      expect(result.pagination.page).toBe(1)
      expect(result.pagination.pageSize).toBe(10)
      expect(result.pagination.totalPages).toBe(1)
    })

    it('應移除密碼欄位', async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValue(mockUsers as never)
      vi.mocked(prisma.user.count).mockResolvedValue(2)

      const result = await getUsers()

      result.data.forEach((user) => {
        expect(user.password).toBeUndefined()
      })
    })

    it('應使用預設分頁值', async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValue([])
      vi.mocked(prisma.user.count).mockResolvedValue(0)

      const result = await getUsers()

      expect(result.pagination.page).toBe(1)
      expect(result.pagination.pageSize).toBe(10)
    })

    it('應支援搜尋功能', async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValue([])
      vi.mocked(prisma.user.count).mockResolvedValue(0)

      await getUsers({ search: 'admin' })

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ username: expect.any(Object) }),
              expect.objectContaining({ name: expect.any(Object) }),
              expect.objectContaining({ email: expect.any(Object) }),
            ]),
          }),
        })
      )
    })

    it('應支援依啟用狀態篩選', async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValue([])
      vi.mocked(prisma.user.count).mockResolvedValue(0)

      await getUsers({ isActive: true })

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isActive: true }),
        })
      )
    })

    it('應正確計算分頁資訊', async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValue(mockUsers as never)
      vi.mocked(prisma.user.count).mockResolvedValue(25)

      const result = await getUsers({ page: 2, pageSize: 10 })

      expect(result.pagination.total).toBe(25)
      expect(result.pagination.totalPages).toBe(3)
      expect(result.pagination.hasNextPage).toBe(true)
      expect(result.pagination.hasPrevPage).toBe(true)
    })

    it('第一頁應沒有上一頁', async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValue(mockUsers as never)
      vi.mocked(prisma.user.count).mockResolvedValue(25)

      const result = await getUsers({ page: 1, pageSize: 10 })

      expect(result.pagination.hasPrevPage).toBe(false)
      expect(result.pagination.hasNextPage).toBe(true)
    })

    it('最後一頁應沒有下一頁', async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValue(mockUsers as never)
      vi.mocked(prisma.user.count).mockResolvedValue(25)

      const result = await getUsers({ page: 3, pageSize: 10 })

      expect(result.pagination.hasNextPage).toBe(false)
      expect(result.pagination.hasPrevPage).toBe(true)
    })
  })

  // ===== getUser 測試 =====
  describe('getUser', () => {
    it('應回傳使用者詳情', async () => {
      const mockUser = {
        id: '1',
        username: 'admin',
        email: 'admin@example.com',
        name: '管理員',
        password: 'hashed_password',
        phone: '0912345678',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        role: { id: 'role-1', code: 'ADMIN', name: '管理員' },
        store: null,
      }

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as never)

      const result = await getUser('1')

      expect(result?.username).toBe('admin')
      expect(result?.name).toBe('管理員')
      expect(result?.role?.code).toBe('ADMIN')
    })

    it('應移除密碼欄位', async () => {
      const mockUser = {
        id: '1',
        username: 'admin',
        email: 'admin@example.com',
        name: '管理員',
        password: 'hashed_password',
        phone: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        role: { id: 'role-1', code: 'ADMIN', name: '管理員' },
        store: null,
      }

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as never)

      const result = await getUser('1')

      expect(result?.password).toBeUndefined()
    })

    it('使用者不存在時應回傳 null', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

      const result = await getUser('nonexistent')

      expect(result).toBeNull()
    })

    it('應包含角色和門市資訊', async () => {
      const mockUser = {
        id: '1',
        username: 'cashier',
        email: 'cashier@example.com',
        name: '收銀員',
        password: 'hashed_password',
        phone: '0912345678',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        role: { id: 'role-2', code: 'CASHIER', name: '收銀員' },
        store: { id: 'store-1', code: 'S001', name: '門市一' },
      }

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as never)

      const result = await getUser('1')

      expect(result?.role).toBeDefined()
      expect(result?.store).toBeDefined()
      expect(result?.store?.name).toBe('門市一')
    })
  })

  // ===== createUser 測試 =====
  describe('createUser', () => {
    const validUserData = {
      username: 'newuser',
      email: 'newuser@example.com',
      password: 'password123',
      name: '新使用者',
      phone: '0912345678',
      roleId: 'role-1',
      storeId: 'store-1',
      isActive: true,
    }

    it('應成功建立使用者', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue(null)
      vi.mocked(prisma.user.create).mockResolvedValue({ id: 'new-id' } as never)

      const result = await createUser(validUserData)

      expect(result.success).toBe(true)
      expect(result.message).toBe('使用者建立成功')
      expect((result.data as { id: string })?.id).toBe('new-id')
    })

    it('應對密碼進行雜湊', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue(null)
      vi.mocked(prisma.user.create).mockResolvedValue({ id: 'new-id' } as never)

      await createUser(validUserData)

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            password: 'hashed_password',
          }),
        })
      )
    })

    it('帳號重複時應回傳錯誤', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue({
        id: 'existing',
        username: 'newuser',
        email: 'other@example.com',
      } as never)

      const result = await createUser(validUserData)

      expect(result.success).toBe(false)
      expect(result.message).toBe('此帳號已被使用')
    })

    it('電子郵件重複時應回傳錯誤', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue({
        id: 'existing',
        username: 'other',
        email: 'newuser@example.com',
      } as never)

      const result = await createUser(validUserData)

      expect(result.success).toBe(false)
      expect(result.message).toBe('此電子郵件已被使用')
    })

    it('驗證失敗時應回傳錯誤（空帳號）', async () => {
      const result = await createUser({
        ...validUserData,
        username: '',
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('驗證失敗')
      expect(result.errors).toBeDefined()
    })

    it('驗證失敗時應回傳錯誤（帳號格式錯誤）', async () => {
      const result = await createUser({
        ...validUserData,
        username: 'invalid-username!',
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('驗證失敗')
    })

    it('驗證失敗時應回傳錯誤（帳號過短）', async () => {
      const result = await createUser({
        ...validUserData,
        username: 'ab',
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('驗證失敗')
    })

    it('驗證失敗時應回傳錯誤（無效的電子郵件）', async () => {
      const result = await createUser({
        ...validUserData,
        email: 'invalid-email',
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('驗證失敗')
    })

    it('驗證失敗時應回傳錯誤（密碼過短）', async () => {
      const result = await createUser({
        ...validUserData,
        password: '12345',
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('驗證失敗')
    })

    it('驗證失敗時應回傳錯誤（空姓名）', async () => {
      const result = await createUser({
        ...validUserData,
        name: '',
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('驗證失敗')
    })

    it('驗證失敗時應回傳錯誤（未選擇角色）', async () => {
      const result = await createUser({
        ...validUserData,
        roleId: '',
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('驗證失敗')
    })

    it('應允許可選的電話和門市', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue(null)
      vi.mocked(prisma.user.create).mockResolvedValue({ id: 'new-id' } as never)

      const result = await createUser({
        ...validUserData,
        phone: null,
        storeId: null,
      })

      expect(result.success).toBe(true)
    })

    it('資料庫錯誤時應回傳錯誤', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue(null)
      vi.mocked(prisma.user.create).mockRejectedValue(new Error('Database error'))

      const result = await createUser(validUserData)

      expect(result.success).toBe(false)
      expect(result.message).toBe('建立使用者失敗')
    })
  })

  // ===== updateUser 測試 =====
  describe('updateUser', () => {
    const validUpdateData = {
      email: 'updated@example.com',
      name: '更新的名稱',
      phone: '0987654321',
      roleId: 'role-2',
      storeId: 'store-2',
      isActive: true,
    }

    it('應成功更新使用者', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: '1' } as never)
      vi.mocked(prisma.user.findFirst).mockResolvedValue(null)
      vi.mocked(prisma.user.update).mockResolvedValue({ id: '1' } as never)

      const result = await updateUser('1', validUpdateData)

      expect(result.success).toBe(true)
      expect(result.message).toBe('使用者更新成功')
    })

    it('使用者不存在時應回傳錯誤', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

      const result = await updateUser('nonexistent', validUpdateData)

      expect(result.success).toBe(false)
      expect(result.message).toBe('使用者不存在')
    })

    it('電子郵件重複時應回傳錯誤', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: '1' } as never)
      vi.mocked(prisma.user.findFirst).mockResolvedValue({
        id: '2',
        email: 'updated@example.com',
      } as never)

      const result = await updateUser('1', validUpdateData)

      expect(result.success).toBe(false)
      expect(result.message).toBe('此電子郵件已被使用')
    })

    it('提供新密碼時應更新密碼', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: '1' } as never)
      vi.mocked(prisma.user.findFirst).mockResolvedValue(null)
      vi.mocked(prisma.user.update).mockResolvedValue({ id: '1' } as never)

      await updateUser('1', {
        ...validUpdateData,
        password: 'newpassword123',
      })

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            password: 'hashed_password',
          }),
        })
      )
    })

    it('不提供密碼時不應更新密碼', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: '1' } as never)
      vi.mocked(prisma.user.findFirst).mockResolvedValue(null)
      vi.mocked(prisma.user.update).mockResolvedValue({ id: '1' } as never)

      await updateUser('1', validUpdateData)

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.not.objectContaining({
            password: expect.any(String),
          }),
        })
      )
    })

    it('空密碼字串時不應更新密碼', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: '1' } as never)
      vi.mocked(prisma.user.findFirst).mockResolvedValue(null)
      vi.mocked(prisma.user.update).mockResolvedValue({ id: '1' } as never)

      await updateUser('1', {
        ...validUpdateData,
        password: '',
      })

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.not.objectContaining({
            password: expect.any(String),
          }),
        })
      )
    })

    it('驗證失敗時應回傳錯誤（無效的電子郵件）', async () => {
      const result = await updateUser('1', {
        ...validUpdateData,
        email: 'invalid-email',
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('驗證失敗')
    })

    it('驗證失敗時應回傳錯誤（空姓名）', async () => {
      const result = await updateUser('1', {
        ...validUpdateData,
        name: '',
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('驗證失敗')
    })

    it('驗證失敗時應回傳錯誤（密碼過短）', async () => {
      const result = await updateUser('1', {
        ...validUpdateData,
        password: '12345',
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('驗證失敗')
    })

    it('資料庫錯誤時應回傳錯誤', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: '1' } as never)
      vi.mocked(prisma.user.findFirst).mockResolvedValue(null)
      vi.mocked(prisma.user.update).mockRejectedValue(new Error('Database error'))

      const result = await updateUser('1', validUpdateData)

      expect(result.success).toBe(false)
      expect(result.message).toBe('更新使用者失敗')
    })
  })

  // ===== deleteUser 測試 =====
  describe('deleteUser', () => {
    it('應成功刪除使用者', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: '1',
        username: 'regularuser',
      } as never)
      vi.mocked(prisma.user.delete).mockResolvedValue({ id: '1' } as never)

      const result = await deleteUser('1')

      expect(result.success).toBe(true)
      expect(result.message).toBe('使用者刪除成功')
    })

    it('使用者不存在時應回傳錯誤', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

      const result = await deleteUser('nonexistent')

      expect(result.success).toBe(false)
      expect(result.message).toBe('使用者不存在')
    })

    it('不能刪除 admin 帳號', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: '1',
        username: 'admin',
      } as never)

      const result = await deleteUser('1')

      expect(result.success).toBe(false)
      expect(result.message).toBe('無法刪除系統管理員帳號')
    })

    it('應正確呼叫刪除函數', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: '1',
        username: 'testuser',
      } as never)
      vi.mocked(prisma.user.delete).mockResolvedValue({ id: '1' } as never)

      await deleteUser('1')

      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      })
    })

    it('資料庫錯誤時應回傳錯誤', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: '1',
        username: 'testuser',
      } as never)
      vi.mocked(prisma.user.delete).mockRejectedValue(new Error('Database error'))

      const result = await deleteUser('1')

      expect(result.success).toBe(false)
      expect(result.message).toBe('刪除使用者失敗')
    })
  })

  // ===== changePassword 測試 =====
  // 注意：changePassword 函數尚未在 users.ts 中實作
  // 以下為預期的測試案例，待實作後啟用
  describe.skip('changePassword', () => {
    it('應成功變更密碼', async () => {
      // 待實作
    })

    it('使用者不存在時應回傳錯誤', async () => {
      // 待實作
    })

    it('舊密碼錯誤時應回傳錯誤', async () => {
      // 待實作
    })

    it('新密碼過短時應回傳錯誤', async () => {
      // 待實作
    })

    it('應對新密碼進行雜湊', async () => {
      // 待實作
    })
  })
})
