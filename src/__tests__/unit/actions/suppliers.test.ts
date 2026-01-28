/**
 * Suppliers Server Actions 測試
 * 測試供應商管理相關的 Server Actions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getSuppliers,
  getActiveSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  generateSupplierCode,
  getSupplierPrices,
  upsertSupplierPrice,
  deleteSupplierPrice,
} from '@/actions/suppliers'
import prisma from '@/lib/prisma'

// Mock revalidatePath
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

describe('Suppliers Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getSuppliers', () => {
    it('應回傳分頁的供應商列表', async () => {
      const mockSuppliers = [
        { id: '1', code: 'S001', name: '供應商A', _count: { purchaseOrders: 5, prices: 10 } },
        { id: '2', code: 'S002', name: '供應商B', _count: { purchaseOrders: 3, prices: 8 } },
      ]

      vi.mocked(prisma.supplier.findMany).mockResolvedValue(mockSuppliers as never)
      vi.mocked(prisma.supplier.count).mockResolvedValue(2)

      const result = await getSuppliers({ page: 1, pageSize: 10 })

      expect(result.data).toHaveLength(2)
      expect(result.pagination.total).toBe(2)
    })

    it('應支援搜尋功能', async () => {
      vi.mocked(prisma.supplier.findMany).mockResolvedValue([])
      vi.mocked(prisma.supplier.count).mockResolvedValue(0)

      await getSuppliers({ search: '電子' })

      expect(prisma.supplier.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
          }),
        })
      )
    })

    it('應支援 isActive 篩選', async () => {
      vi.mocked(prisma.supplier.findMany).mockResolvedValue([])
      vi.mocked(prisma.supplier.count).mockResolvedValue(0)

      await getSuppliers({ isActive: true })

      expect(prisma.supplier.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isActive: true }),
        })
      )
    })
  })

  describe('getActiveSuppliers', () => {
    it('應只回傳啟用的供應商', async () => {
      vi.mocked(prisma.supplier.findMany).mockResolvedValue([])

      await getActiveSuppliers()

      expect(prisma.supplier.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isActive: true },
        })
      )
    })
  })

  describe('getSupplier', () => {
    it('應回傳供應商詳情', async () => {
      const mockSupplier = {
        id: '1',
        code: 'S001',
        name: '測試供應商',
        prices: [],
        purchaseOrders: [],
        _count: { purchaseOrders: 5, prices: 10 },
      }

      vi.mocked(prisma.supplier.findUnique).mockResolvedValue(mockSupplier as never)

      const result = await getSupplier('1')

      expect(result?.name).toBe('測試供應商')
    })

    it('供應商不存在時應回傳 null', async () => {
      vi.mocked(prisma.supplier.findUnique).mockResolvedValue(null)

      const result = await getSupplier('nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('createSupplier', () => {
    const validSupplierData = {
      code: 'S001',
      name: '新供應商',
      contactPerson: '張三',
      phone: '0223456789',
      paymentTerms: 30,
      isActive: true,
    }

    it('應成功建立供應商', async () => {
      vi.mocked(prisma.supplier.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.supplier.create).mockResolvedValue({ id: 'new-id' } as never)

      const result = await createSupplier(validSupplierData)

      expect(result.success).toBe(true)
      expect(result.message).toBe('供應商建立成功')
      expect((result.data as { id: string })?.id).toBe('new-id')
    })

    it('代碼重複時應回傳錯誤', async () => {
      vi.mocked(prisma.supplier.findUnique).mockResolvedValue({ id: 'existing' } as never)

      const result = await createSupplier(validSupplierData)

      expect(result.success).toBe(false)
      expect(result.message).toBe('此供應商代碼已被使用')
    })

    it('驗證失敗時應回傳錯誤', async () => {
      const result = await createSupplier({
        code: '',
        name: '',
        contactPerson: '',
        phone: '',
        isActive: true,
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('驗證失敗')
    })
  })

  describe('updateSupplier', () => {
    const validSupplierData = {
      code: 'S001',
      name: '更新供應商',
      contactPerson: '李四',
      phone: '0223456789',
      paymentTerms: 30,
      isActive: true,
    }

    it('應成功更新供應商', async () => {
      vi.mocked(prisma.supplier.findUnique).mockResolvedValue({ id: '1' } as never)
      vi.mocked(prisma.supplier.findFirst).mockResolvedValue(null)
      vi.mocked(prisma.supplier.update).mockResolvedValue({ id: '1' } as never)

      const result = await updateSupplier('1', validSupplierData)

      expect(result.success).toBe(true)
      expect(result.message).toBe('供應商更新成功')
    })

    it('供應商不存在時應回傳錯誤', async () => {
      vi.mocked(prisma.supplier.findUnique).mockResolvedValue(null)

      const result = await updateSupplier('nonexistent', validSupplierData)

      expect(result.success).toBe(false)
      expect(result.message).toBe('供應商不存在')
    })

    it('代碼被其他供應商使用時應回傳錯誤', async () => {
      vi.mocked(prisma.supplier.findUnique).mockResolvedValue({ id: '1' } as never)
      vi.mocked(prisma.supplier.findFirst).mockResolvedValue({ id: '2' } as never)

      const result = await updateSupplier('1', validSupplierData)

      expect(result.success).toBe(false)
      expect(result.message).toBe('此供應商代碼已被使用')
    })
  })

  describe('deleteSupplier', () => {
    it('應成功刪除供應商', async () => {
      vi.mocked(prisma.supplier.findUnique).mockResolvedValue({
        id: '1',
        _count: { purchaseOrders: 0, prices: 5 },
      } as never)
      vi.mocked(prisma.supplierPrice.deleteMany).mockResolvedValue({ count: 5 } as never)
      vi.mocked(prisma.supplier.delete).mockResolvedValue({ id: '1' } as never)

      const result = await deleteSupplier('1')

      expect(result.success).toBe(true)
      expect(result.message).toBe('供應商刪除成功')
    })

    it('供應商不存在時應回傳錯誤', async () => {
      vi.mocked(prisma.supplier.findUnique).mockResolvedValue(null)

      const result = await deleteSupplier('nonexistent')

      expect(result.success).toBe(false)
      expect(result.message).toBe('供應商不存在')
    })

    it('有採購單時不能刪除', async () => {
      vi.mocked(prisma.supplier.findUnique).mockResolvedValue({
        id: '1',
        _count: { purchaseOrders: 5, prices: 10 },
      } as never)

      const result = await deleteSupplier('1')

      expect(result.success).toBe(false)
      expect(result.message).toContain('5 筆採購單')
    })
  })

  describe('generateSupplierCode', () => {
    it('無供應商時應回傳 S00001', async () => {
      vi.mocked(prisma.supplier.findFirst).mockResolvedValue(null)

      const result = await generateSupplierCode()

      expect(result).toBe('S00001')
    })

    it('有供應商時應產生下一個編號', async () => {
      vi.mocked(prisma.supplier.findFirst).mockResolvedValue({ code: 'S00005' } as never)

      const result = await generateSupplierCode()

      expect(result).toBe('S00006')
    })
  })

  // ===== 供應商價格測試 =====
  describe('Supplier Price Actions', () => {
    describe('getSupplierPrices', () => {
      it('應回傳供應商的商品價格列表', async () => {
        const mockPrices = [
          { id: '1', price: 100, product: { id: 'p1', sku: 'P001', name: '商品1' } },
          { id: '2', price: 200, product: { id: 'p2', sku: 'P002', name: '商品2' } },
        ]

        vi.mocked(prisma.supplierPrice.findMany).mockResolvedValue(mockPrices as never)
        vi.mocked(prisma.supplierPrice.count).mockResolvedValue(2)

        const result = await getSupplierPrices('supplier-1', { page: 1, pageSize: 10 })

        expect(result.data).toHaveLength(2)
        expect(result.pagination.total).toBe(2)
      })

      it('應支援搜尋商品', async () => {
        vi.mocked(prisma.supplierPrice.findMany).mockResolvedValue([])
        vi.mocked(prisma.supplierPrice.count).mockResolvedValue(0)

        await getSupplierPrices('supplier-1', { search: '電腦' })

        expect(prisma.supplierPrice.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              supplierId: 'supplier-1',
              product: expect.any(Object),
            }),
          })
        )
      })
    })

    describe('upsertSupplierPrice', () => {
      it('應成功新增供應商價格', async () => {
        vi.mocked(prisma.supplier.findUnique).mockResolvedValue({ id: 'supplier-1' } as never)
        vi.mocked(prisma.product.findUnique).mockResolvedValue({ id: 'product-1' } as never)
        vi.mocked(prisma.supplierPrice.upsert).mockResolvedValue({ id: '1' } as never)

        const result = await upsertSupplierPrice({
          supplierId: 'supplier-1',
          productId: 'product-1',
          price: 100,
        })

        expect(result.success).toBe(true)
        expect(result.message).toBe('供應商價格設定成功')
      })

      it('設為首選供應商時應取消其他首選', async () => {
        vi.mocked(prisma.supplier.findUnique).mockResolvedValue({ id: 'supplier-1' } as never)
        vi.mocked(prisma.product.findUnique).mockResolvedValue({ id: 'product-1' } as never)
        vi.mocked(prisma.supplierPrice.updateMany).mockResolvedValue({ count: 1 } as never)
        vi.mocked(prisma.supplierPrice.upsert).mockResolvedValue({ id: '1' } as never)

        await upsertSupplierPrice({
          supplierId: 'supplier-1',
          productId: 'product-1',
          price: 100,
          isPreferred: true,
        })

        expect(prisma.supplierPrice.updateMany).toHaveBeenCalled()
      })

      it('供應商不存在時應回傳錯誤', async () => {
        vi.mocked(prisma.supplier.findUnique).mockResolvedValue(null)
        vi.mocked(prisma.product.findUnique).mockResolvedValue({ id: 'product-1' } as never)

        const result = await upsertSupplierPrice({
          supplierId: 'nonexistent',
          productId: 'product-1',
          price: 100,
        })

        expect(result.success).toBe(false)
        expect(result.message).toBe('供應商不存在')
      })

      it('商品不存在時應回傳錯誤', async () => {
        vi.mocked(prisma.supplier.findUnique).mockResolvedValue({ id: 'supplier-1' } as never)
        vi.mocked(prisma.product.findUnique).mockResolvedValue(null)

        const result = await upsertSupplierPrice({
          supplierId: 'supplier-1',
          productId: 'nonexistent',
          price: 100,
        })

        expect(result.success).toBe(false)
        expect(result.message).toBe('商品不存在')
      })
    })

    describe('deleteSupplierPrice', () => {
      it('應成功刪除供應商價格', async () => {
        vi.mocked(prisma.supplierPrice.delete).mockResolvedValue({ id: '1' } as never)

        const result = await deleteSupplierPrice('supplier-1', 'product-1')

        expect(result.success).toBe(true)
        expect(result.message).toBe('供應商價格刪除成功')
      })

      it('刪除失敗時應回傳錯誤', async () => {
        vi.mocked(prisma.supplierPrice.delete).mockRejectedValue(new Error('Not found'))

        const result = await deleteSupplierPrice('nonexistent', 'product-1')

        expect(result.success).toBe(false)
        expect(result.message).toBe('刪除供應商價格失敗')
      })
    })
  })
})
