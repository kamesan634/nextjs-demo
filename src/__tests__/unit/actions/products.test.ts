/**
 * Products Server Actions 測試
 * 測試商品管理相關的 Server Actions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getProducts,
  getProduct,
  getUnitOptions,
  getTaxTypeOptions,
  createProduct,
  updateProduct,
  deleteProduct,
} from '@/actions/products'
import prisma from '@/lib/prisma'

// Mock revalidatePath
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

describe('Products Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getProducts', () => {
    it('應回傳分頁的商品列表', async () => {
      const mockProducts = [
        {
          id: '1',
          sku: 'P001',
          name: '商品1',
          costPrice: { toNumber: () => 50 },
          listPrice: { toNumber: () => 120 },
          sellingPrice: { toNumber: () => 100 },
          minPrice: null,
          category: { name: '分類1' },
          unit: { name: '個' },
          taxType: { name: '應稅' },
          inventories: [{ quantity: 100 }],
        },
      ]

      vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts as never)
      vi.mocked(prisma.product.count).mockResolvedValue(1)

      const result = await getProducts({ page: 1, pageSize: 10 })

      expect(result.data).toHaveLength(1)
      expect(result.data[0].totalStock).toBe(100)
      expect(result.pagination.total).toBe(1)
    })

    it('應支援搜尋功能', async () => {
      vi.mocked(prisma.product.findMany).mockResolvedValue([])
      vi.mocked(prisma.product.count).mockResolvedValue(0)

      await getProducts({ search: '電腦' })

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ sku: expect.any(Object) }),
              expect.objectContaining({ name: expect.any(Object) }),
              expect.objectContaining({ barcode: expect.any(Object) }),
            ]),
          }),
        })
      )
    })

    it('應支援分類篩選', async () => {
      vi.mocked(prisma.product.findMany).mockResolvedValue([])
      vi.mocked(prisma.product.count).mockResolvedValue(0)

      await getProducts({ categoryId: 'cat-1' })

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ categoryId: 'cat-1' }),
        })
      )
    })

    it('應計算多倉庫總庫存', async () => {
      const mockProducts = [
        {
          id: '1',
          sku: 'P001',
          name: '商品1',
          costPrice: { toNumber: () => 50 },
          listPrice: { toNumber: () => 120 },
          sellingPrice: { toNumber: () => 100 },
          minPrice: null,
          category: null,
          unit: null,
          taxType: null,
          inventories: [{ quantity: 50 }, { quantity: 30 }, { quantity: 20 }],
        },
      ]

      vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts as never)
      vi.mocked(prisma.product.count).mockResolvedValue(1)

      const result = await getProducts()

      expect(result.data[0].totalStock).toBe(100)
    })
  })

  describe('getProduct', () => {
    it('應回傳商品詳情', async () => {
      const mockProduct = {
        id: '1',
        sku: 'P001',
        name: '測試商品',
        costPrice: 50,
        listPrice: 120,
        sellingPrice: 100,
        minPrice: 80,
        category: { name: '分類1' },
        unit: { name: '個' },
        taxType: { name: '應稅' },
        inventories: [],
        supplierPrices: [],
      }

      vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as never)

      const result = await getProduct('1')

      expect(result?.name).toBe('測試商品')
      expect(result?.costPrice).toBe(50)
      expect(result?.minPrice).toBe(80)
    })

    it('商品不存在時應回傳 null', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue(null)

      const result = await getProduct('nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('getUnitOptions', () => {
    it('應回傳計量單位選項', async () => {
      const mockUnits = [
        { id: '1', name: '個' },
        { id: '2', name: '箱' },
      ]

      vi.mocked(prisma.unit.findMany).mockResolvedValue(mockUnits as never)

      const result = await getUnitOptions()

      expect(result).toHaveLength(2)
      expect(result[0].value).toBe('1')
      expect(result[0].label).toBe('個')
    })
  })

  describe('getTaxTypeOptions', () => {
    it('應回傳稅別選項', async () => {
      const mockTaxTypes = [
        { id: '1', name: '應稅', rate: 0.05 },
        { id: '2', name: '免稅', rate: 0 },
      ]

      vi.mocked(prisma.taxType.findMany).mockResolvedValue(mockTaxTypes as never)

      const result = await getTaxTypeOptions()

      expect(result).toHaveLength(2)
      expect(result[0].label).toBe('應稅 (5%)')
    })
  })

  describe('createProduct', () => {
    const validProductData = {
      sku: 'P001',
      name: '新商品',
      costPrice: 50,
      listPrice: 120,
      sellingPrice: 100,
      categoryId: 'cat-1',
      unitId: 'unit-1',
      isActive: true,
      safetyStock: 10,
      reorderPoint: 5,
      reorderQty: 20,
      isSerialControl: false,
      isBatchControl: false,
      allowNegativeStock: false,
    }

    it('應成功建立商品', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.product.create).mockResolvedValue({ id: 'new-id' } as never)

      const result = await createProduct(validProductData)

      expect(result.success).toBe(true)
      expect(result.message).toBe('商品建立成功')
      expect((result.data as { id: string })?.id).toBe('new-id')
    })

    it('SKU 重複時應回傳錯誤', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue({ id: 'existing' } as never)

      const result = await createProduct(validProductData)

      expect(result.success).toBe(false)
      expect(result.message).toBe('此商品編號已存在')
    })

    it('條碼重複時應回傳錯誤', async () => {
      vi.mocked(prisma.product.findUnique)
        .mockResolvedValueOnce(null) // SKU 檢查
        .mockResolvedValueOnce({ id: 'existing' } as never) // 條碼檢查

      const result = await createProduct({
        ...validProductData,
        barcode: '4710088012345',
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('此條碼已被其他商品使用')
    })

    it('驗證失敗時應回傳錯誤', async () => {
      const result = await createProduct({
        sku: '',
        name: '',
        costPrice: -1,
        listPrice: 100,
        sellingPrice: 100,
        categoryId: 'cat-1',
        unitId: 'unit-1',
        isActive: true,
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('驗證失敗')
      expect(result.errors).toBeDefined()
    })
  })

  describe('updateProduct', () => {
    const validProductData = {
      sku: 'P001',
      name: '更新商品',
      costPrice: 60,
      listPrice: 130,
      sellingPrice: 110,
      categoryId: 'cat-1',
      unitId: 'unit-1',
      isActive: true,
      safetyStock: 10,
      reorderPoint: 5,
      reorderQty: 20,
      isSerialControl: false,
      isBatchControl: false,
      allowNegativeStock: false,
    }

    it('應成功更新商品', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue({ id: '1' } as never)
      vi.mocked(prisma.product.findFirst).mockResolvedValue(null)
      vi.mocked(prisma.product.update).mockResolvedValue({ id: '1' } as never)

      const result = await updateProduct('1', validProductData)

      expect(result.success).toBe(true)
      expect(result.message).toBe('商品更新成功')
    })

    it('商品不存在時應回傳錯誤', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue(null)

      const result = await updateProduct('nonexistent', validProductData)

      expect(result.success).toBe(false)
      expect(result.message).toBe('商品不存在')
    })

    it('SKU 被其他商品使用時應回傳錯誤', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue({ id: '1' } as never)
      vi.mocked(prisma.product.findFirst).mockResolvedValue({ id: '2' } as never)

      const result = await updateProduct('1', validProductData)

      expect(result.success).toBe(false)
      expect(result.message).toBe('此商品編號已被使用')
    })

    it('條碼被其他商品使用時應回傳錯誤', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue({ id: '1' } as never)
      vi.mocked(prisma.product.findFirst)
        .mockResolvedValueOnce(null) // SKU 檢查
        .mockResolvedValueOnce({ id: '2' } as never) // 條碼檢查

      const result = await updateProduct('1', {
        ...validProductData,
        barcode: '4710088012345',
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('此條碼已被其他商品使用')
    })
  })

  describe('deleteProduct', () => {
    it('應成功刪除商品', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue({
        id: '1',
        inventories: [],
        orderItems: [],
        purchaseOrderItems: [],
      } as never)
      vi.mocked(prisma.product.delete).mockResolvedValue({ id: '1' } as never)

      const result = await deleteProduct('1')

      expect(result.success).toBe(true)
      expect(result.message).toBe('商品刪除成功')
    })

    it('商品不存在時應回傳錯誤', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue(null)

      const result = await deleteProduct('nonexistent')

      expect(result.success).toBe(false)
      expect(result.message).toBe('商品不存在')
    })

    it('有庫存時不能刪除', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue({
        id: '1',
        inventories: [{ quantity: 10 }],
        orderItems: [],
        purchaseOrderItems: [],
      } as never)

      const result = await deleteProduct('1')

      expect(result.success).toBe(false)
      expect(result.message).toBe('此商品仍有庫存，無法刪除')
    })

    it('有訂單記錄時不能刪除', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue({
        id: '1',
        inventories: [],
        orderItems: [{ id: 'item-1' }],
        purchaseOrderItems: [],
      } as never)

      const result = await deleteProduct('1')

      expect(result.success).toBe(false)
      expect(result.message).toBe('此商品有訂單記錄，無法刪除')
    })

    it('有採購記錄時不能刪除', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue({
        id: '1',
        inventories: [],
        orderItems: [],
        purchaseOrderItems: [{ id: 'po-item-1' }],
      } as never)

      const result = await deleteProduct('1')

      expect(result.success).toBe(false)
      expect(result.message).toBe('此商品有採購記錄，無法刪除')
    })
  })
})
