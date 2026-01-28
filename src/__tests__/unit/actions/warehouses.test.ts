/**
 * Warehouses Server Actions 測試
 * 測試倉庫管理相關的 Server Actions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getWarehouses,
  getWarehouseOptions,
  getWarehouse,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
} from '@/actions/warehouses'
import prisma from '@/lib/prisma'

// Mock revalidatePath
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

describe('Warehouses Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getWarehouses', () => {
    it('應回傳分頁的倉庫列表', async () => {
      const mockWarehouses = [
        {
          id: '1',
          code: 'WH001',
          name: '倉庫1',
          address: '地址1',
          phone: '0912345678',
          manager: '管理員1',
          isActive: true,
          isDefault: true,
          _count: { inventories: 10 },
        },
        {
          id: '2',
          code: 'WH002',
          name: '倉庫2',
          address: '地址2',
          phone: '0987654321',
          manager: '管理員2',
          isActive: true,
          isDefault: false,
          _count: { inventories: 5 },
        },
      ]

      vi.mocked(prisma.warehouse.findMany).mockResolvedValue(mockWarehouses as never)
      vi.mocked(prisma.warehouse.count).mockResolvedValue(2)

      const result = await getWarehouses({ page: 1, pageSize: 10 })

      expect(result.data).toHaveLength(2)
      expect(result.pagination.total).toBe(2)
      expect(result.pagination.page).toBe(1)
      expect(result.pagination.pageSize).toBe(10)
    })

    it('應支援搜尋功能', async () => {
      vi.mocked(prisma.warehouse.findMany).mockResolvedValue([])
      vi.mocked(prisma.warehouse.count).mockResolvedValue(0)

      await getWarehouses({ search: '主倉' })

      expect(prisma.warehouse.findMany).toHaveBeenCalledWith(
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
      vi.mocked(prisma.warehouse.findMany).mockResolvedValue([])
      vi.mocked(prisma.warehouse.count).mockResolvedValue(0)

      await getWarehouses({ isActive: true })

      expect(prisma.warehouse.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isActive: true }),
        })
      )
    })

    it('應使用預設分頁參數', async () => {
      vi.mocked(prisma.warehouse.findMany).mockResolvedValue([])
      vi.mocked(prisma.warehouse.count).mockResolvedValue(0)

      const result = await getWarehouses()

      expect(result.pagination.page).toBe(1)
      expect(result.pagination.pageSize).toBe(10)
    })

    it('應正確計算分頁資訊', async () => {
      vi.mocked(prisma.warehouse.findMany).mockResolvedValue([])
      vi.mocked(prisma.warehouse.count).mockResolvedValue(25)

      const result = await getWarehouses({ page: 2, pageSize: 10 })

      expect(result.pagination.totalPages).toBe(3)
      expect(result.pagination.hasNextPage).toBe(true)
      expect(result.pagination.hasPrevPage).toBe(true)
    })
  })

  describe('getWarehouseOptions', () => {
    it('應回傳倉庫選項列表', async () => {
      const mockWarehouses = [
        { id: '1', code: 'WH001', name: '主倉庫', isDefault: true },
        { id: '2', code: 'WH002', name: '副倉庫', isDefault: false },
      ]

      vi.mocked(prisma.warehouse.findMany).mockResolvedValue(mockWarehouses as never)

      const result = await getWarehouseOptions()

      expect(result).toHaveLength(2)
      expect(result[0].label).toBe('主倉庫 (WH001) - 預設')
      expect(result[1].label).toBe('副倉庫 (WH002)')
      expect(result[0].value).toBe('1')
    })

    it('應只查詢啟用的倉庫', async () => {
      vi.mocked(prisma.warehouse.findMany).mockResolvedValue([])

      await getWarehouseOptions()

      expect(prisma.warehouse.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isActive: true },
        })
      )
    })
  })

  describe('getWarehouse', () => {
    it('應回傳單一倉庫詳情', async () => {
      const mockWarehouse = {
        id: '1',
        code: 'WH001',
        name: '測試倉庫',
        address: '測試地址',
        phone: '0912345678',
        manager: '管理員',
        isActive: true,
        isDefault: false,
        _count: { inventories: 10 },
      }

      vi.mocked(prisma.warehouse.findUnique).mockResolvedValue(mockWarehouse as never)

      const result = await getWarehouse('1')

      expect(result).toBeDefined()
      expect(result?.name).toBe('測試倉庫')
      expect(result?.code).toBe('WH001')
    })

    it('倉庫不存在時應回傳 null', async () => {
      vi.mocked(prisma.warehouse.findUnique).mockResolvedValue(null)

      const result = await getWarehouse('nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('createWarehouse', () => {
    it('應成功建立倉庫', async () => {
      vi.mocked(prisma.warehouse.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.warehouse.create).mockResolvedValue({ id: 'new-id' } as never)

      const result = await createWarehouse({
        code: 'WH001',
        name: '新倉庫',
        address: '新地址',
        phone: '0912345678',
        manager: '管理員',
        isActive: true,
        isDefault: false,
      })

      expect(result.success).toBe(true)
      expect(result.message).toBe('倉庫建立成功')
      expect((result.data as { id: string })?.id).toBe('new-id')
    })

    it('代碼重複時應回傳錯誤', async () => {
      vi.mocked(prisma.warehouse.findUnique).mockResolvedValue({ id: 'existing' } as never)

      const result = await createWarehouse({
        code: 'WH001',
        name: '新倉庫',
        address: '新地址',
        phone: '0912345678',
        manager: '管理員',
        isActive: true,
        isDefault: false,
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('此倉庫代碼已存在')
    })

    it('設為預設倉庫時應取消其他預設', async () => {
      vi.mocked(prisma.warehouse.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.warehouse.updateMany).mockResolvedValue({ count: 1 } as never)
      vi.mocked(prisma.warehouse.create).mockResolvedValue({ id: 'new-id' } as never)

      await createWarehouse({
        code: 'WH001',
        name: '新倉庫',
        address: '新地址',
        phone: '0912345678',
        manager: '管理員',
        isActive: true,
        isDefault: true,
      })

      expect(prisma.warehouse.updateMany).toHaveBeenCalledWith({
        where: { isDefault: true },
        data: { isDefault: false },
      })
    })

    it('驗證失敗時應回傳錯誤', async () => {
      const result = await createWarehouse({
        code: '',
        name: '',
        isActive: true,
        isDefault: false,
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('驗證失敗')
      expect(result.errors).toBeDefined()
    })

    it('發生例外時應回傳錯誤', async () => {
      vi.mocked(prisma.warehouse.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.warehouse.create).mockRejectedValue(new Error('Database error'))

      const result = await createWarehouse({
        code: 'WH001',
        name: '新倉庫',
        address: '新地址',
        phone: '0912345678',
        manager: '管理員',
        isActive: true,
        isDefault: false,
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('建立倉庫失敗')
    })
  })

  describe('updateWarehouse', () => {
    it('應成功更新倉庫', async () => {
      vi.mocked(prisma.warehouse.findUnique).mockResolvedValue({
        id: '1',
        code: 'WH001',
        isDefault: false,
      } as never)
      vi.mocked(prisma.warehouse.findFirst).mockResolvedValue(null)
      vi.mocked(prisma.warehouse.update).mockResolvedValue({ id: '1' } as never)

      const result = await updateWarehouse('1', {
        code: 'WH001',
        name: '更新倉庫',
        address: '更新地址',
        phone: '0912345678',
        manager: '管理員',
        isActive: true,
        isDefault: false,
      })

      expect(result.success).toBe(true)
      expect(result.message).toBe('倉庫更新成功')
    })

    it('倉庫不存在時應回傳錯誤', async () => {
      vi.mocked(prisma.warehouse.findUnique).mockResolvedValue(null)

      const result = await updateWarehouse('nonexistent', {
        code: 'WH001',
        name: '更新倉庫',
        address: '更新地址',
        phone: '0912345678',
        manager: '管理員',
        isActive: true,
        isDefault: false,
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('倉庫不存在')
    })

    it('代碼被其他倉庫使用時應回傳錯誤', async () => {
      vi.mocked(prisma.warehouse.findUnique).mockResolvedValue({ id: '1' } as never)
      vi.mocked(prisma.warehouse.findFirst).mockResolvedValue({ id: '2', code: 'WH002' } as never)

      const result = await updateWarehouse('1', {
        code: 'WH002',
        name: '更新倉庫',
        address: '更新地址',
        phone: '0912345678',
        manager: '管理員',
        isActive: true,
        isDefault: false,
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('此倉庫代碼已被使用')
    })

    it('設為預設倉庫時應取消其他預設', async () => {
      vi.mocked(prisma.warehouse.findUnique).mockResolvedValue({
        id: '1',
        code: 'WH001',
        isDefault: false,
      } as never)
      vi.mocked(prisma.warehouse.findFirst).mockResolvedValue(null)
      vi.mocked(prisma.warehouse.updateMany).mockResolvedValue({ count: 1 } as never)
      vi.mocked(prisma.warehouse.update).mockResolvedValue({ id: '1' } as never)

      await updateWarehouse('1', {
        code: 'WH001',
        name: '更新倉庫',
        address: '更新地址',
        phone: '0912345678',
        manager: '管理員',
        isActive: true,
        isDefault: true,
      })

      expect(prisma.warehouse.updateMany).toHaveBeenCalledWith({
        where: { isDefault: true },
        data: { isDefault: false },
      })
    })

    it('已是預設倉庫時不應重複取消其他預設', async () => {
      vi.mocked(prisma.warehouse.findUnique).mockResolvedValue({
        id: '1',
        code: 'WH001',
        isDefault: true,
      } as never)
      vi.mocked(prisma.warehouse.findFirst).mockResolvedValue(null)
      vi.mocked(prisma.warehouse.update).mockResolvedValue({ id: '1' } as never)

      await updateWarehouse('1', {
        code: 'WH001',
        name: '更新倉庫',
        address: '更新地址',
        phone: '0912345678',
        manager: '管理員',
        isActive: true,
        isDefault: true,
      })

      expect(prisma.warehouse.updateMany).not.toHaveBeenCalled()
    })

    it('驗證失敗時應回傳錯誤', async () => {
      const result = await updateWarehouse('1', {
        code: '',
        name: '',
        isActive: true,
        isDefault: false,
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('驗證失敗')
      expect(result.errors).toBeDefined()
    })

    it('發生例外時應回傳錯誤', async () => {
      vi.mocked(prisma.warehouse.findUnique).mockResolvedValue({
        id: '1',
        code: 'WH001',
        isDefault: false,
      } as never)
      vi.mocked(prisma.warehouse.findFirst).mockResolvedValue(null)
      vi.mocked(prisma.warehouse.update).mockRejectedValue(new Error('Database error'))

      const result = await updateWarehouse('1', {
        code: 'WH001',
        name: '更新倉庫',
        address: '更新地址',
        phone: '0912345678',
        manager: '管理員',
        isActive: true,
        isDefault: false,
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('更新倉庫失敗')
    })
  })

  describe('deleteWarehouse', () => {
    it('應成功刪除倉庫', async () => {
      vi.mocked(prisma.warehouse.findUnique).mockResolvedValue({
        id: '1',
        isDefault: false,
        _count: { inventories: 0 },
      } as never)
      vi.mocked(prisma.warehouse.delete).mockResolvedValue({ id: '1' } as never)

      const result = await deleteWarehouse('1')

      expect(result.success).toBe(true)
      expect(result.message).toBe('倉庫刪除成功')
    })

    it('倉庫不存在時應回傳錯誤', async () => {
      vi.mocked(prisma.warehouse.findUnique).mockResolvedValue(null)

      const result = await deleteWarehouse('nonexistent')

      expect(result.success).toBe(false)
      expect(result.message).toBe('倉庫不存在')
    })

    it('預設倉庫不能刪除', async () => {
      vi.mocked(prisma.warehouse.findUnique).mockResolvedValue({
        id: '1',
        isDefault: true,
        _count: { inventories: 0 },
      } as never)

      const result = await deleteWarehouse('1')

      expect(result.success).toBe(false)
      expect(result.message).toBe('無法刪除預設倉庫')
    })

    it('有庫存記錄時不能刪除', async () => {
      vi.mocked(prisma.warehouse.findUnique).mockResolvedValue({
        id: '1',
        isDefault: false,
        _count: { inventories: 5 },
      } as never)

      const result = await deleteWarehouse('1')

      expect(result.success).toBe(false)
      expect(result.message).toContain('5 筆庫存記錄')
    })

    it('發生例外時應回傳錯誤', async () => {
      vi.mocked(prisma.warehouse.findUnique).mockResolvedValue({
        id: '1',
        isDefault: false,
        _count: { inventories: 0 },
      } as never)
      vi.mocked(prisma.warehouse.delete).mockRejectedValue(new Error('Database error'))

      const result = await deleteWarehouse('1')

      expect(result.success).toBe(false)
      expect(result.message).toBe('刪除倉庫失敗')
    })
  })
})
