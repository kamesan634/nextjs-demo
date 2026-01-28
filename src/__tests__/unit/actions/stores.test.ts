/**
 * Stores Server Actions 測試
 * 測試門市管理相關的 Server Actions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getStores,
  getStoreOptions,
  getStore,
  createStore,
  updateStore,
  deleteStore,
} from '@/actions/stores'
import prisma from '@/lib/prisma'

// Mock revalidatePath
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

describe('Stores Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getStores', () => {
    it('應回傳分頁的門市列表', async () => {
      const mockStores = [
        {
          id: '1',
          code: 'STORE001',
          name: '台北總店',
          address: '台北市信義區',
          phone: '02-12345678',
          email: 'taipei@example.com',
          manager: '王經理',
          openTime: '09:00',
          closeTime: '21:00',
          isActive: true,
          _count: { users: 5, orders: 100 },
        },
        {
          id: '2',
          code: 'STORE002',
          name: '新竹分店',
          address: '新竹市東區',
          phone: '03-12345678',
          email: 'hsinchu@example.com',
          manager: '李經理',
          openTime: '10:00',
          closeTime: '22:00',
          isActive: true,
          _count: { users: 3, orders: 50 },
        },
      ]

      vi.mocked(prisma.store.findMany).mockResolvedValue(mockStores as never)
      vi.mocked(prisma.store.count).mockResolvedValue(2)

      const result = await getStores({ page: 1, pageSize: 10 })

      expect(result.data).toHaveLength(2)
      expect(result.pagination.total).toBe(2)
      expect(result.pagination.page).toBe(1)
      expect(result.pagination.pageSize).toBe(10)
    })

    it('應支援搜尋功能', async () => {
      vi.mocked(prisma.store.findMany).mockResolvedValue([])
      vi.mocked(prisma.store.count).mockResolvedValue(0)

      await getStores({ search: '台北' })

      expect(prisma.store.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ code: expect.any(Object) }),
              expect.objectContaining({ name: expect.any(Object) }),
            ]),
          }),
        })
      )
    })

    it('應支援 isActive 篩選', async () => {
      vi.mocked(prisma.store.findMany).mockResolvedValue([])
      vi.mocked(prisma.store.count).mockResolvedValue(0)

      await getStores({ isActive: true })

      expect(prisma.store.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isActive: true }),
        })
      )
    })

    it('應使用預設分頁參數', async () => {
      vi.mocked(prisma.store.findMany).mockResolvedValue([])
      vi.mocked(prisma.store.count).mockResolvedValue(0)

      const result = await getStores()

      expect(result.pagination.page).toBe(1)
      expect(result.pagination.pageSize).toBe(10)
    })

    it('應計算正確的分頁資訊', async () => {
      vi.mocked(prisma.store.findMany).mockResolvedValue([])
      vi.mocked(prisma.store.count).mockResolvedValue(25)

      const result = await getStores({ page: 2, pageSize: 10 })

      expect(result.pagination.totalPages).toBe(3)
      expect(result.pagination.hasNextPage).toBe(true)
      expect(result.pagination.hasPrevPage).toBe(true)
    })
  })

  describe('getStoreOptions', () => {
    it('應回傳門市選項列表', async () => {
      const mockStores = [
        { id: '1', code: 'STORE001', name: '台北總店' },
        { id: '2', code: 'STORE002', name: '新竹分店' },
      ]

      vi.mocked(prisma.store.findMany).mockResolvedValue(mockStores as never)

      const result = await getStoreOptions()

      expect(result).toHaveLength(2)
      expect(result[0].value).toBe('1')
      expect(result[0].label).toBe('台北總店 (STORE001)')
      expect(result[1].value).toBe('2')
      expect(result[1].label).toBe('新竹分店 (STORE002)')
    })

    it('應只回傳啟用的門市', async () => {
      vi.mocked(prisma.store.findMany).mockResolvedValue([])

      await getStoreOptions()

      expect(prisma.store.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isActive: true },
        })
      )
    })
  })

  describe('getStore', () => {
    it('應回傳單一門市詳情', async () => {
      const mockStore = {
        id: '1',
        code: 'STORE001',
        name: '台北總店',
        address: '台北市信義區',
        phone: '02-12345678',
        email: 'taipei@example.com',
        manager: '王經理',
        openTime: '09:00',
        closeTime: '21:00',
        isActive: true,
        _count: { users: 5, orders: 100 },
      }

      vi.mocked(prisma.store.findUnique).mockResolvedValue(mockStore as never)

      const result = await getStore('1')

      expect(result).toBeDefined()
      expect(result?.name).toBe('台北總店')
      expect(result?.code).toBe('STORE001')
    })

    it('門市不存在時應回傳 null', async () => {
      vi.mocked(prisma.store.findUnique).mockResolvedValue(null)

      const result = await getStore('nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('createStore', () => {
    const validStoreData = {
      code: 'STORE001',
      name: '台北總店',
      address: '台北市信義區',
      phone: '02-12345678',
      email: 'taipei@example.com',
      manager: '王經理',
      openTime: '09:00',
      closeTime: '21:00',
      isActive: true,
    }

    it('應成功建立門市', async () => {
      vi.mocked(prisma.store.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.store.create).mockResolvedValue({ id: 'new-id' } as never)

      const result = await createStore(validStoreData)

      expect(result.success).toBe(true)
      expect(result.message).toBe('門市建立成功')
      expect((result.data as { id: string })?.id).toBe('new-id')
    })

    it('代碼重複時應回傳錯誤', async () => {
      vi.mocked(prisma.store.findUnique).mockResolvedValue({ id: 'existing' } as never)

      const result = await createStore(validStoreData)

      expect(result.success).toBe(false)
      expect(result.message).toBe('此門市代碼已存在')
    })

    it('驗證失敗時應回傳錯誤', async () => {
      const result = await createStore({
        code: '',
        name: '',
        address: '',
        phone: '',
        manager: '',
        openTime: '',
        closeTime: '',
        isActive: true,
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('驗證失敗')
      expect(result.errors).toBeDefined()
    })

    it('建立失敗時應回傳錯誤', async () => {
      vi.mocked(prisma.store.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.store.create).mockRejectedValue(new Error('Database error'))

      const result = await createStore(validStoreData)

      expect(result.success).toBe(false)
      expect(result.message).toBe('建立門市失敗')
    })

    it('email 為空時應正確處理', async () => {
      vi.mocked(prisma.store.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.store.create).mockResolvedValue({ id: 'new-id' } as never)

      const dataWithoutEmail = { ...validStoreData, email: '' }
      const result = await createStore(dataWithoutEmail)

      expect(result.success).toBe(true)
      expect(prisma.store.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: null,
          }),
        })
      )
    })
  })

  describe('updateStore', () => {
    const validStoreData = {
      code: 'STORE001',
      name: '台北總店更新',
      address: '台北市信義區更新',
      phone: '02-12345679',
      email: 'taipei-updated@example.com',
      manager: '陳經理',
      openTime: '08:00',
      closeTime: '22:00',
      isActive: true,
    }

    it('應成功更新門市', async () => {
      vi.mocked(prisma.store.findUnique).mockResolvedValue({ id: '1', code: 'STORE001' } as never)
      vi.mocked(prisma.store.findFirst).mockResolvedValue(null)
      vi.mocked(prisma.store.update).mockResolvedValue({ id: '1' } as never)

      const result = await updateStore('1', validStoreData)

      expect(result.success).toBe(true)
      expect(result.message).toBe('門市更新成功')
    })

    it('門市不存在時應回傳錯誤', async () => {
      vi.mocked(prisma.store.findUnique).mockResolvedValue(null)

      const result = await updateStore('nonexistent', validStoreData)

      expect(result.success).toBe(false)
      expect(result.message).toBe('門市不存在')
    })

    it('代碼被其他門市使用時應回傳錯誤', async () => {
      vi.mocked(prisma.store.findUnique).mockResolvedValue({ id: '1' } as never)
      vi.mocked(prisma.store.findFirst).mockResolvedValue({ id: '2', code: 'STORE002' } as never)

      const result = await updateStore('1', {
        ...validStoreData,
        code: 'STORE002',
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('此門市代碼已被使用')
    })

    it('驗證失敗時應回傳錯誤', async () => {
      const result = await updateStore('1', {
        code: '',
        name: '',
        address: '',
        phone: '',
        manager: '',
        openTime: '',
        closeTime: '',
        isActive: true,
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('驗證失敗')
      expect(result.errors).toBeDefined()
    })

    it('更新失敗時應回傳錯誤', async () => {
      vi.mocked(prisma.store.findUnique).mockResolvedValue({ id: '1', code: 'STORE001' } as never)
      vi.mocked(prisma.store.findFirst).mockResolvedValue(null)
      vi.mocked(prisma.store.update).mockRejectedValue(new Error('Database error'))

      const result = await updateStore('1', validStoreData)

      expect(result.success).toBe(false)
      expect(result.message).toBe('更新門市失敗')
    })
  })

  describe('deleteStore', () => {
    it('應成功刪除門市', async () => {
      vi.mocked(prisma.store.findUnique).mockResolvedValue({
        id: '1',
        _count: { users: 0, orders: 0 },
      } as never)
      vi.mocked(prisma.store.delete).mockResolvedValue({ id: '1' } as never)

      const result = await deleteStore('1')

      expect(result.success).toBe(true)
      expect(result.message).toBe('門市刪除成功')
    })

    it('門市不存在時應回傳錯誤', async () => {
      vi.mocked(prisma.store.findUnique).mockResolvedValue(null)

      const result = await deleteStore('nonexistent')

      expect(result.success).toBe(false)
      expect(result.message).toBe('門市不存在')
    })

    it('有員工時不能刪除', async () => {
      vi.mocked(prisma.store.findUnique).mockResolvedValue({
        id: '1',
        _count: { users: 5, orders: 0 },
      } as never)

      const result = await deleteStore('1')

      expect(result.success).toBe(false)
      expect(result.message).toContain('5 位員工')
    })

    it('有訂單時不能刪除', async () => {
      vi.mocked(prisma.store.findUnique).mockResolvedValue({
        id: '1',
        _count: { users: 0, orders: 100 },
      } as never)

      const result = await deleteStore('1')

      expect(result.success).toBe(false)
      expect(result.message).toContain('100 筆訂單')
    })

    it('刪除失敗時應回傳錯誤', async () => {
      vi.mocked(prisma.store.findUnique).mockResolvedValue({
        id: '1',
        _count: { users: 0, orders: 0 },
      } as never)
      vi.mocked(prisma.store.delete).mockRejectedValue(new Error('Database error'))

      const result = await deleteStore('1')

      expect(result.success).toBe(false)
      expect(result.message).toBe('刪除門市失敗')
    })
  })
})
