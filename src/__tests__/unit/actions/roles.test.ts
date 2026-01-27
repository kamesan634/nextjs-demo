/**
 * Roles Server Actions 測試
 * 測試角色管理相關的 Server Actions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getRoles,
  getRoleOptions,
  getRole,
  createRole,
  updateRole,
  deleteRole,
} from '@/actions/roles'
import prisma from '@/lib/prisma'

// Mock revalidatePath
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

describe('Roles Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getRoles', () => {
    it('應回傳所有角色列表', async () => {
      const mockRoles = [
        { id: '1', code: 'ADMIN', name: '管理員', permissions: [], _count: { users: 5 } },
        { id: '2', code: 'CASHIER', name: '收銀員', permissions: [], _count: { users: 10 } },
      ]

      vi.mocked(prisma.role.findMany).mockResolvedValue(mockRoles as never)

      const result = await getRoles()

      expect(result).toHaveLength(2)
      expect(result[0].code).toBe('ADMIN')
    })
  })

  describe('getRoleOptions', () => {
    it('應回傳角色選項列表', async () => {
      const mockRoles = [
        { id: '1', code: 'ADMIN', name: '管理員' },
        { id: '2', code: 'CASHIER', name: '收銀員' },
      ]

      vi.mocked(prisma.role.findMany).mockResolvedValue(mockRoles as never)

      const result = await getRoleOptions()

      expect(result).toHaveLength(2)
      expect(result[0].value).toBe('1')
      expect(result[0].label).toBe('管理員')
      expect(result[0].code).toBe('ADMIN')
    })
  })

  describe('getRole', () => {
    it('應回傳角色詳情', async () => {
      const mockRole = {
        id: '1',
        code: 'ADMIN',
        name: '管理員',
        permissions: [
          { module: 'products', action: 'read' },
          { module: 'products', action: 'write' },
        ],
      }

      vi.mocked(prisma.role.findUnique).mockResolvedValue(mockRole as never)

      const result = await getRole('1')

      expect(result?.name).toBe('管理員')
      expect(result?.permissions).toHaveLength(2)
    })

    it('角色不存在時應回傳 null', async () => {
      vi.mocked(prisma.role.findUnique).mockResolvedValue(null)

      const result = await getRole('nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('createRole', () => {
    const validRoleData = {
      code: 'MANAGER',
      name: '經理',
      description: '門市經理',
      permissions: [
        { module: 'products', action: 'read' },
        { module: 'orders', action: 'write' },
      ],
    }

    it('應成功建立角色', async () => {
      vi.mocked(prisma.role.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.role.create).mockResolvedValue({ id: 'new-id' } as never)

      const result = await createRole(validRoleData)

      expect(result.success).toBe(true)
      expect(result.message).toBe('角色建立成功')
      expect(result.data?.id).toBe('new-id')
    })

    it('應正確建立角色權限', async () => {
      vi.mocked(prisma.role.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.role.create).mockResolvedValue({ id: 'new-id' } as never)

      await createRole(validRoleData)

      expect(prisma.role.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            permissions: expect.objectContaining({
              create: expect.arrayContaining([
                expect.objectContaining({ module: 'products', action: 'read' }),
                expect.objectContaining({ module: 'orders', action: 'write' }),
              ]),
            }),
          }),
        })
      )
    })

    it('代碼重複時應回傳錯誤', async () => {
      vi.mocked(prisma.role.findUnique).mockResolvedValue({ id: 'existing' } as never)

      const result = await createRole(validRoleData)

      expect(result.success).toBe(false)
      expect(result.message).toBe('此角色代碼已存在')
    })

    it('驗證失敗時應回傳錯誤（代碼格式錯誤）', async () => {
      const result = await createRole({
        code: 'invalid-code', // 應該是大寫
        name: '經理',
        permissions: [],
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('驗證失敗')
    })

    it('驗證失敗時應回傳錯誤（空名稱）', async () => {
      const result = await createRole({
        code: 'MANAGER',
        name: '',
        permissions: [],
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('驗證失敗')
    })
  })

  describe('updateRole', () => {
    const validUpdateData = {
      name: '高級經理',
      description: '區域經理',
      permissions: [
        { module: 'products', action: 'read' },
        { module: 'products', action: 'write' },
        { module: 'orders', action: 'read' },
      ],
    }

    it('應成功更新非系統角色', async () => {
      vi.mocked(prisma.role.findUnique).mockResolvedValue({ id: '1', isSystem: false } as never)
      vi.mocked(prisma.$transaction).mockResolvedValue([{}, {}] as never)

      const result = await updateRole('1', validUpdateData)

      expect(result.success).toBe(true)
      expect(result.message).toBe('角色更新成功')
    })

    it('系統角色只應更新名稱和描述', async () => {
      vi.mocked(prisma.role.findUnique).mockResolvedValue({ id: '1', isSystem: true } as never)
      vi.mocked(prisma.role.update).mockResolvedValue({ id: '1' } as never)

      await updateRole('1', validUpdateData)

      expect(prisma.role.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: '高級經理',
            description: '區域經理',
          }),
        })
      )
      // 系統角色不應更新權限，所以不應呼叫 $transaction
      expect(prisma.$transaction).not.toHaveBeenCalled()
    })

    it('角色不存在時應回傳錯誤', async () => {
      vi.mocked(prisma.role.findUnique).mockResolvedValue(null)

      const result = await updateRole('nonexistent', validUpdateData)

      expect(result.success).toBe(false)
      expect(result.message).toBe('角色不存在')
    })

    it('驗證失敗時應回傳錯誤', async () => {
      const result = await updateRole('1', {
        name: '',
        permissions: [],
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('驗證失敗')
    })
  })

  describe('deleteRole', () => {
    it('應成功刪除角色', async () => {
      vi.mocked(prisma.role.findUnique).mockResolvedValue({
        id: '1',
        isSystem: false,
        _count: { users: 0 },
      } as never)
      vi.mocked(prisma.role.delete).mockResolvedValue({ id: '1' } as never)

      const result = await deleteRole('1')

      expect(result.success).toBe(true)
      expect(result.message).toBe('角色刪除成功')
    })

    it('角色不存在時應回傳錯誤', async () => {
      vi.mocked(prisma.role.findUnique).mockResolvedValue(null)

      const result = await deleteRole('nonexistent')

      expect(result.success).toBe(false)
      expect(result.message).toBe('角色不存在')
    })

    it('系統角色不能刪除', async () => {
      vi.mocked(prisma.role.findUnique).mockResolvedValue({
        id: '1',
        isSystem: true,
        _count: { users: 0 },
      } as never)

      const result = await deleteRole('1')

      expect(result.success).toBe(false)
      expect(result.message).toBe('無法刪除系統內建角色')
    })

    it('有使用者使用時不能刪除', async () => {
      vi.mocked(prisma.role.findUnique).mockResolvedValue({
        id: '1',
        isSystem: false,
        _count: { users: 5 },
      } as never)

      const result = await deleteRole('1')

      expect(result.success).toBe(false)
      expect(result.message).toContain('5 位使用者')
    })
  })
})
