/**
 * Product Bundles Server Actions 測試
 * 測試商品組合相關的 Server Actions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getProductBundles,
  getProductBundle,
  createProductBundle,
  updateProductBundle,
  deleteProductBundle,
} from '@/actions/product-bundles'
import prisma from '@/lib/prisma'

// Mock revalidatePath
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

describe('Product Bundles Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===== getProductBundles 測試 =====
  describe('getProductBundles', () => {
    it('應回傳分頁的商品組合列表', async () => {
      const mockBundles = [
        {
          id: '1',
          code: 'BUNDLE001',
          name: '超值套餐',
          bundlePrice: 299,
          isActive: true,
          items: [
            { product: { id: 'p1', name: '商品1', sku: 'SKU001', sellingPrice: 100 }, quantity: 2 },
            { product: { id: 'p2', name: '商品2', sku: 'SKU002', sellingPrice: 150 }, quantity: 1 },
          ],
        },
      ]

      vi.mocked(prisma.productBundle.findMany).mockResolvedValue(mockBundles as never)
      vi.mocked(prisma.productBundle.count).mockResolvedValue(1)

      const result = await getProductBundles({ page: 1, pageSize: 10 })

      expect(result.data).toHaveLength(1)
      expect(result.data[0].code).toBe('BUNDLE001')
      expect(result.pagination.total).toBe(1)
      expect(result.pagination.page).toBe(1)
      expect(result.pagination.pageSize).toBe(10)
    })

    it('應支援搜尋功能', async () => {
      vi.mocked(prisma.productBundle.findMany).mockResolvedValue([])
      vi.mocked(prisma.productBundle.count).mockResolvedValue(0)

      await getProductBundles({ search: '超值' })

      expect(prisma.productBundle.findMany).toHaveBeenCalledWith(
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

    it('應支援啟用狀態篩選', async () => {
      vi.mocked(prisma.productBundle.findMany).mockResolvedValue([])
      vi.mocked(prisma.productBundle.count).mockResolvedValue(0)

      await getProductBundles({ isActive: true })

      expect(prisma.productBundle.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: true,
          }),
        })
      )
    })

    it('應正確計算分頁資訊', async () => {
      vi.mocked(prisma.productBundle.findMany).mockResolvedValue([])
      vi.mocked(prisma.productBundle.count).mockResolvedValue(25)

      const result = await getProductBundles({ page: 2, pageSize: 10 })

      expect(result.pagination.totalPages).toBe(3)
      expect(result.pagination.hasNextPage).toBe(true)
      expect(result.pagination.hasPrevPage).toBe(true)
    })

    it('無參數時應使用預設值', async () => {
      vi.mocked(prisma.productBundle.findMany).mockResolvedValue([])
      vi.mocked(prisma.productBundle.count).mockResolvedValue(0)

      const result = await getProductBundles()

      expect(result.pagination.page).toBe(1)
      expect(result.pagination.pageSize).toBe(10)
    })
  })

  // ===== getProductBundle 測試 =====
  describe('getProductBundle', () => {
    it('應回傳商品組合詳情', async () => {
      const mockBundle = {
        id: '1',
        code: 'BUNDLE001',
        name: '超值套餐',
        description: '包含多種商品',
        bundlePrice: 299,
        isActive: true,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        items: [
          {
            product: {
              id: 'p1',
              name: '商品1',
              sku: 'SKU001',
              sellingPrice: 100,
              imageUrl: null,
            },
            quantity: 2,
          },
        ],
      }

      vi.mocked(prisma.productBundle.findUnique).mockResolvedValue(mockBundle as never)

      const result = await getProductBundle('1')

      expect(result?.name).toBe('超值套餐')
      expect(result?.bundlePrice).toBe(299)
      expect(result?.items).toHaveLength(1)
    })

    it('商品組合不存在時應回傳 null', async () => {
      vi.mocked(prisma.productBundle.findUnique).mockResolvedValue(null)

      const result = await getProductBundle('nonexistent')

      expect(result).toBeNull()
    })
  })

  // ===== createProductBundle 測試 =====
  describe('createProductBundle', () => {
    const validBundleData = {
      code: 'BUNDLE001',
      name: '超值套餐',
      description: '包含多種優惠商品',
      bundlePrice: 299,
      isActive: true,
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      items: [
        { productId: 'p1', quantity: 2 },
        { productId: 'p2', quantity: 1 },
      ],
    }

    it('應成功建立商品組合', async () => {
      vi.mocked(prisma.productBundle.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.productBundle.create).mockResolvedValue({ id: 'new-id' } as never)

      const result = await createProductBundle(validBundleData)

      expect(result.success).toBe(true)
      expect(result.message).toBe('商品組合建立成功')
      expect((result.data as { id: string })?.id).toBe('new-id')
    })

    it('代碼重複時應回傳錯誤', async () => {
      vi.mocked(prisma.productBundle.findUnique).mockResolvedValue({ id: 'existing' } as never)

      const result = await createProductBundle(validBundleData)

      expect(result.success).toBe(false)
      expect(result.message).toBe('此組合代碼已存在')
    })

    it('驗證失敗時應回傳錯誤 - 缺少必填欄位', async () => {
      const result = await createProductBundle({
        code: '',
        name: '',
        bundlePrice: 0,
        isActive: true,
        items: [],
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('驗證失敗')
      expect(result.errors).toBeDefined()
    })

    it('驗證失敗時應回傳錯誤 - 無效代碼格式', async () => {
      const result = await createProductBundle({
        ...validBundleData,
        code: 'invalid code!',
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('驗證失敗')
    })

    it('驗證失敗時應回傳錯誤 - 價格小於0', async () => {
      const result = await createProductBundle({
        ...validBundleData,
        bundlePrice: -100,
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('驗證失敗')
    })

    it('驗證失敗時應回傳錯誤 - 沒有商品項目', async () => {
      const result = await createProductBundle({
        ...validBundleData,
        items: [],
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('驗證失敗')
    })

    it('應正確處理可選欄位', async () => {
      vi.mocked(prisma.productBundle.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.productBundle.create).mockResolvedValue({ id: 'new-id' } as never)

      const result = await createProductBundle({
        code: 'BUNDLE002',
        name: '簡易套餐',
        bundlePrice: 199,
        isActive: false,
        items: [{ productId: 'p1', quantity: 1 }],
      })

      expect(result.success).toBe(true)
    })

    it('資料庫錯誤時應回傳失敗訊息', async () => {
      vi.mocked(prisma.productBundle.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.productBundle.create).mockRejectedValue(new Error('DB Error'))

      const result = await createProductBundle(validBundleData)

      expect(result.success).toBe(false)
      expect(result.message).toBe('建立商品組合失敗')
    })
  })

  // ===== updateProductBundle 測試 =====
  describe('updateProductBundle', () => {
    const validUpdateData = {
      name: '更新套餐',
      description: '更新後的描述',
      bundlePrice: 399,
      isActive: true,
      startDate: '2024-02-01',
      endDate: '2024-11-30',
      items: [
        { productId: 'p1', quantity: 3 },
        { productId: 'p3', quantity: 2 },
      ],
    }

    it('應成功更新商品組合', async () => {
      vi.mocked(prisma.productBundle.findUnique).mockResolvedValue({ id: '1' } as never)
      vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
        if (typeof callback === 'function') {
          return callback(prisma)
        }
        return Promise.all(callback)
      })

      const result = await updateProductBundle('1', validUpdateData)

      expect(result.success).toBe(true)
      expect(result.message).toBe('商品組合更新成功')
    })

    it('商品組合不存在時應回傳錯誤', async () => {
      vi.mocked(prisma.productBundle.findUnique).mockResolvedValue(null)

      const result = await updateProductBundle('nonexistent', validUpdateData)

      expect(result.success).toBe(false)
      expect(result.message).toBe('商品組合不存在')
    })

    it('驗證失敗時應回傳錯誤', async () => {
      const result = await updateProductBundle('1', {
        name: '',
        bundlePrice: -1,
        isActive: true,
        items: [],
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('驗證失敗')
      expect(result.errors).toBeDefined()
    })

    it('更新時應刪除舊項目並建立新項目', async () => {
      vi.mocked(prisma.productBundle.findUnique).mockResolvedValue({ id: '1' } as never)

      const mockTx = {
        productBundleItem: {
          deleteMany: vi.fn().mockResolvedValue({ count: 2 }),
        },
        productBundle: {
          update: vi.fn().mockResolvedValue({ id: '1' }),
        },
      }

      vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
        if (typeof callback === 'function') {
          return callback(mockTx as never)
        }
        return Promise.all(callback)
      })

      await updateProductBundle('1', validUpdateData)

      expect(mockTx.productBundleItem.deleteMany).toHaveBeenCalledWith({
        where: { bundleId: '1' },
      })
      expect(mockTx.productBundle.update).toHaveBeenCalled()
    })

    it('資料庫錯誤時應回傳失敗訊息', async () => {
      vi.mocked(prisma.productBundle.findUnique).mockResolvedValue({ id: '1' } as never)
      vi.mocked(prisma.$transaction).mockRejectedValue(new Error('DB Error'))

      const result = await updateProductBundle('1', validUpdateData)

      expect(result.success).toBe(false)
      expect(result.message).toBe('更新商品組合失敗')
    })
  })

  // ===== deleteProductBundle 測試 =====
  describe('deleteProductBundle', () => {
    it('應成功刪除商品組合', async () => {
      vi.mocked(prisma.productBundle.findUnique).mockResolvedValue({ id: '1' } as never)
      vi.mocked(prisma.productBundle.delete).mockResolvedValue({ id: '1' } as never)

      const result = await deleteProductBundle('1')

      expect(result.success).toBe(true)
      expect(result.message).toBe('商品組合刪除成功')
    })

    it('商品組合不存在時應回傳錯誤', async () => {
      vi.mocked(prisma.productBundle.findUnique).mockResolvedValue(null)

      const result = await deleteProductBundle('nonexistent')

      expect(result.success).toBe(false)
      expect(result.message).toBe('商品組合不存在')
    })

    it('資料庫錯誤時應回傳失敗訊息', async () => {
      vi.mocked(prisma.productBundle.findUnique).mockResolvedValue({ id: '1' } as never)
      vi.mocked(prisma.productBundle.delete).mockRejectedValue(new Error('DB Error'))

      const result = await deleteProductBundle('1')

      expect(result.success).toBe(false)
      expect(result.message).toBe('刪除商品組合失敗')
    })
  })
})
