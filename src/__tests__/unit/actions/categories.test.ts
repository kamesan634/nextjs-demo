/**
 * Categories Server Actions 測試
 * 測試分類管理相關的 Server Actions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getCategories,
  getCategoryTree,
  getCategoryOptions,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} from '@/actions/categories'
import prisma from '@/lib/prisma'

// Mock revalidatePath
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

describe('Categories Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getCategories', () => {
    it('應回傳分頁的分類列表', async () => {
      const mockCategories = [
        {
          id: '1',
          code: 'CAT001',
          name: '分類1',
          level: 1,
          parent: null,
          _count: { products: 5, children: 2 },
        },
        {
          id: '2',
          code: 'CAT002',
          name: '分類2',
          level: 1,
          parent: null,
          _count: { products: 3, children: 0 },
        },
      ]

      vi.mocked(prisma.category.findMany).mockResolvedValue(mockCategories as never)
      vi.mocked(prisma.category.count).mockResolvedValue(2)

      const result = await getCategories({ page: 1, pageSize: 10 })

      expect(result.data).toHaveLength(2)
      expect(result.pagination.total).toBe(2)
      expect(result.pagination.page).toBe(1)
      expect(result.pagination.pageSize).toBe(10)
    })

    it('應支援搜尋功能', async () => {
      vi.mocked(prisma.category.findMany).mockResolvedValue([])
      vi.mocked(prisma.category.count).mockResolvedValue(0)

      await getCategories({ search: '電子' })

      expect(prisma.category.findMany).toHaveBeenCalledWith(
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
      vi.mocked(prisma.category.findMany).mockResolvedValue([])
      vi.mocked(prisma.category.count).mockResolvedValue(0)

      await getCategories({ isActive: true })

      expect(prisma.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isActive: true }),
        })
      )
    })

    it('應使用預設分頁參數', async () => {
      vi.mocked(prisma.category.findMany).mockResolvedValue([])
      vi.mocked(prisma.category.count).mockResolvedValue(0)

      const result = await getCategories()

      expect(result.pagination.page).toBe(1)
      expect(result.pagination.pageSize).toBe(20)
    })
  })

  describe('getCategoryTree', () => {
    it('應回傳樹狀結構的分類', async () => {
      const mockCategories = [
        {
          id: '1',
          code: 'CAT001',
          name: '父分類',
          level: 1,
          parentId: null,
          isActive: true,
          sortOrder: 1,
        },
        {
          id: '2',
          code: 'CAT002',
          name: '子分類',
          level: 2,
          parentId: '1',
          isActive: true,
          sortOrder: 1,
        },
      ]

      vi.mocked(prisma.category.findMany).mockResolvedValue(mockCategories as never)

      const result = await getCategoryTree()

      expect(result).toHaveLength(1)
      expect(result[0].children).toHaveLength(1)
      expect(result[0].children[0].name).toBe('子分類')
    })

    it('應只回傳啟用的分類', async () => {
      vi.mocked(prisma.category.findMany).mockResolvedValue([])

      await getCategoryTree()

      expect(prisma.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isActive: true },
        })
      )
    })
  })

  describe('getCategoryOptions', () => {
    it('應回傳分類選項列表', async () => {
      const mockCategories = [
        { id: '1', name: '分類1', level: 1, parent: null },
        { id: '2', name: '子分類', level: 2, parent: { name: '分類1' } },
      ]

      vi.mocked(prisma.category.findMany).mockResolvedValue(mockCategories as never)

      const result = await getCategoryOptions()

      expect(result).toHaveLength(2)
      expect(result[0].label).toBe('分類1')
      expect(result[1].label).toBe('分類1 > 子分類')
    })
  })

  describe('getCategory', () => {
    it('應回傳單一分類詳情', async () => {
      const mockCategory = {
        id: '1',
        code: 'CAT001',
        name: '測試分類',
        parent: null,
        children: [],
        _count: { products: 5 },
      }

      vi.mocked(prisma.category.findUnique).mockResolvedValue(mockCategory as never)

      const result = await getCategory('1')

      expect(result).toBeDefined()
      expect(result?.name).toBe('測試分類')
    })

    it('分類不存在時應回傳 null', async () => {
      vi.mocked(prisma.category.findUnique).mockResolvedValue(null)

      const result = await getCategory('nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('createCategory', () => {
    it('應成功建立分類', async () => {
      vi.mocked(prisma.category.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.category.create).mockResolvedValue({ id: 'new-id' } as never)

      const result = await createCategory({
        code: 'CAT001',
        name: '新分類',
        isActive: true,
        sortOrder: 1,
      })

      expect(result.success).toBe(true)
      expect(result.message).toBe('分類建立成功')
      expect(result.data?.id).toBe('new-id')
    })

    it('代碼重複時應回傳錯誤', async () => {
      vi.mocked(prisma.category.findUnique).mockResolvedValue({ id: 'existing' } as never)

      const result = await createCategory({
        code: 'CAT001',
        name: '新分類',
        isActive: true,
        sortOrder: 1,
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('此分類代碼已存在')
    })

    it('有父分類時應正確計算層級', async () => {
      vi.mocked(prisma.category.findUnique)
        .mockResolvedValueOnce(null) // 代碼檢查
        .mockResolvedValueOnce({ id: 'parent', level: 1 } as never) // 父分類

      vi.mocked(prisma.category.create).mockResolvedValue({ id: 'new-id' } as never)

      await createCategory({
        code: 'CAT002',
        name: '子分類',
        parentId: 'parent',
        isActive: true,
        sortOrder: 1,
      })

      expect(prisma.category.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ level: 2 }),
        })
      )
    })

    it('驗證失敗時應回傳錯誤', async () => {
      const result = await createCategory({
        code: '',
        name: '',
        isActive: true,
        sortOrder: 1,
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('驗證失敗')
      expect(result.errors).toBeDefined()
    })
  })

  describe('updateCategory', () => {
    it('應成功更新分類', async () => {
      vi.mocked(prisma.category.findUnique).mockResolvedValue({ id: '1', code: 'CAT001' } as never)
      vi.mocked(prisma.category.findFirst).mockResolvedValue(null)
      vi.mocked(prisma.category.update).mockResolvedValue({ id: '1' } as never)

      const result = await updateCategory('1', {
        code: 'CAT001',
        name: '更新分類',
        isActive: true,
        sortOrder: 1,
      })

      expect(result.success).toBe(true)
      expect(result.message).toBe('分類更新成功')
    })

    it('分類不存在時應回傳錯誤', async () => {
      vi.mocked(prisma.category.findUnique).mockResolvedValue(null)

      const result = await updateCategory('nonexistent', {
        code: 'CAT001',
        name: '更新分類',
        isActive: true,
        sortOrder: 1,
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('分類不存在')
    })

    it('代碼被其他分類使用時應回傳錯誤', async () => {
      vi.mocked(prisma.category.findUnique).mockResolvedValue({ id: '1' } as never)
      vi.mocked(prisma.category.findFirst).mockResolvedValue({ id: '2', code: 'CAT002' } as never)

      const result = await updateCategory('1', {
        code: 'CAT002',
        name: '更新分類',
        isActive: true,
        sortOrder: 1,
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('此分類代碼已被使用')
    })

    it('不能將自己設為父分類', async () => {
      vi.mocked(prisma.category.findUnique).mockResolvedValue({ id: '1' } as never)
      vi.mocked(prisma.category.findFirst).mockResolvedValue(null)

      const result = await updateCategory('1', {
        code: 'CAT001',
        name: '更新分類',
        parentId: '1',
        isActive: true,
        sortOrder: 1,
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('不能將自己設為父分類')
    })
  })

  describe('deleteCategory', () => {
    it('應成功刪除分類', async () => {
      vi.mocked(prisma.category.findUnique).mockResolvedValue({
        id: '1',
        _count: { products: 0, children: 0 },
      } as never)
      vi.mocked(prisma.category.delete).mockResolvedValue({ id: '1' } as never)

      const result = await deleteCategory('1')

      expect(result.success).toBe(true)
      expect(result.message).toBe('分類刪除成功')
    })

    it('分類不存在時應回傳錯誤', async () => {
      vi.mocked(prisma.category.findUnique).mockResolvedValue(null)

      const result = await deleteCategory('nonexistent')

      expect(result.success).toBe(false)
      expect(result.message).toBe('分類不存在')
    })

    it('有子分類時不能刪除', async () => {
      vi.mocked(prisma.category.findUnique).mockResolvedValue({
        id: '1',
        _count: { products: 0, children: 3 },
      } as never)

      const result = await deleteCategory('1')

      expect(result.success).toBe(false)
      expect(result.message).toContain('3 個子分類')
    })

    it('有商品時不能刪除', async () => {
      vi.mocked(prisma.category.findUnique).mockResolvedValue({
        id: '1',
        _count: { products: 5, children: 0 },
      } as never)

      const result = await deleteCategory('1')

      expect(result.success).toBe(false)
      expect(result.message).toContain('5 個商品')
    })
  })
})
