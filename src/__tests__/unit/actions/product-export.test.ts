/**
 * Product Export Server Actions 測試
 * 測試商品匯出相關的 Server Actions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { exportProducts } from '@/actions/product-export'
import prisma from '@/lib/prisma'
import * as excelLib from '@/lib/excel'

// Mock excel 模組
vi.mock('@/lib/excel', () => ({
  createExcelBuffer: vi.fn(),
  productHeaderMapping: {
    sku: '商品編號',
    barcode: '條碼',
    name: '商品名稱',
    shortName: '簡稱',
    categoryCode: '分類代碼',
    unitCode: '單位代碼',
    costPrice: '成本價',
    listPrice: '定價',
    sellingPrice: '售價',
    safetyStock: '安全庫存',
    reorderPoint: '補貨點',
    reorderQty: '建議補貨量',
    description: '描述',
  },
}))

describe('Product Export Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===== exportProducts 測試 =====
  describe('exportProducts', () => {
    const mockProducts = [
      {
        id: '1',
        sku: 'SKU001',
        barcode: '4710000000001',
        name: '商品1',
        shortName: '商品1',
        categoryId: 'cat1',
        unitId: 'unit1',
        costPrice: { toNumber: () => 50 },
        listPrice: { toNumber: () => 120 },
        sellingPrice: { toNumber: () => 100 },
        safetyStock: 10,
        reorderPoint: 5,
        reorderQty: 20,
        description: '測試商品1',
        category: { code: 'CAT001' },
        unit: { code: 'PCS' },
      },
      {
        id: '2',
        sku: 'SKU002',
        barcode: null,
        name: '商品2',
        shortName: null,
        categoryId: 'cat1',
        unitId: 'unit1',
        costPrice: { toNumber: () => 80 },
        listPrice: { toNumber: () => 200 },
        sellingPrice: { toNumber: () => 180 },
        safetyStock: 5,
        reorderPoint: 2,
        reorderQty: 10,
        description: null,
        category: { code: 'CAT002' },
        unit: { code: 'BOX' },
      },
    ]

    it('應成功匯出所有商品', async () => {
      const mockBuffer = Buffer.from('mock excel data')
      vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts as never)
      vi.mocked(excelLib.createExcelBuffer).mockReturnValue(mockBuffer)

      const result = await exportProducts()

      expect(result).toBeInstanceOf(Buffer)
      expect(prisma.product.findMany).toHaveBeenCalled()
      expect(excelLib.createExcelBuffer).toHaveBeenCalled()
    })

    it('應正確轉換商品資料格式', async () => {
      const mockBuffer = Buffer.from('mock excel data')
      vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts as never)
      vi.mocked(excelLib.createExcelBuffer).mockReturnValue(mockBuffer)

      await exportProducts()

      expect(excelLib.createExcelBuffer).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            sku: 'SKU001',
            barcode: '4710000000001',
            name: '商品1',
            shortName: '商品1',
            categoryCode: 'CAT001',
            unitCode: 'PCS',
            costPrice: 50,
            listPrice: 120,
            sellingPrice: 100,
            safetyStock: 10,
            reorderPoint: 5,
            reorderQty: 20,
            description: '測試商品1',
          }),
          expect.objectContaining({
            sku: 'SKU002',
            barcode: '',
            name: '商品2',
            shortName: '',
            categoryCode: 'CAT002',
            unitCode: 'BOX',
            costPrice: 80,
            description: '',
          }),
        ]),
        '商品清單',
        expect.any(Object)
      )
    })

    it('應支援分類篩選', async () => {
      const mockBuffer = Buffer.from('mock excel data')
      vi.mocked(prisma.product.findMany).mockResolvedValue([])
      vi.mocked(excelLib.createExcelBuffer).mockReturnValue(mockBuffer)

      await exportProducts({ categoryId: 'cat1' })

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            categoryId: 'cat1',
          }),
        })
      )
    })

    it('應支援啟用狀態篩選', async () => {
      const mockBuffer = Buffer.from('mock excel data')
      vi.mocked(prisma.product.findMany).mockResolvedValue([])
      vi.mocked(excelLib.createExcelBuffer).mockReturnValue(mockBuffer)

      await exportProducts({ isActive: true })

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: true,
          }),
        })
      )
    })

    it('應支援搜尋功能', async () => {
      const mockBuffer = Buffer.from('mock excel data')
      vi.mocked(prisma.product.findMany).mockResolvedValue([])
      vi.mocked(excelLib.createExcelBuffer).mockReturnValue(mockBuffer)

      await exportProducts({ search: '商品' })

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ sku: expect.any(Object) }),
              expect.objectContaining({ name: expect.any(Object) }),
            ]),
          }),
        })
      )
    })

    it('應支援多條件組合篩選', async () => {
      const mockBuffer = Buffer.from('mock excel data')
      vi.mocked(prisma.product.findMany).mockResolvedValue([])
      vi.mocked(excelLib.createExcelBuffer).mockReturnValue(mockBuffer)

      await exportProducts({
        categoryId: 'cat1',
        isActive: true,
        search: '商品',
      })

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            categoryId: 'cat1',
            isActive: true,
            OR: expect.any(Array),
          }),
        })
      )
    })

    it('應依 SKU 排序', async () => {
      const mockBuffer = Buffer.from('mock excel data')
      vi.mocked(prisma.product.findMany).mockResolvedValue([])
      vi.mocked(excelLib.createExcelBuffer).mockReturnValue(mockBuffer)

      await exportProducts()

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { sku: 'asc' },
        })
      )
    })

    it('無商品時應回傳空的 Excel', async () => {
      const mockBuffer = Buffer.from('mock excel data')
      vi.mocked(prisma.product.findMany).mockResolvedValue([])
      vi.mocked(excelLib.createExcelBuffer).mockReturnValue(mockBuffer)

      const result = await exportProducts()

      expect(result).toBeInstanceOf(Buffer)
      expect(excelLib.createExcelBuffer).toHaveBeenCalledWith([], '商品清單', expect.any(Object))
    })

    it('應包含 category 和 unit 的 include', async () => {
      const mockBuffer = Buffer.from('mock excel data')
      vi.mocked(prisma.product.findMany).mockResolvedValue([])
      vi.mocked(excelLib.createExcelBuffer).mockReturnValue(mockBuffer)

      await exportProducts()

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            category: expect.any(Object),
            unit: expect.any(Object),
          }),
        })
      )
    })

    it('無參數時應不加任何篩選條件', async () => {
      const mockBuffer = Buffer.from('mock excel data')
      vi.mocked(prisma.product.findMany).mockResolvedValue([])
      vi.mocked(excelLib.createExcelBuffer).mockReturnValue(mockBuffer)

      await exportProducts()

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
        })
      )
    })

    it('isActive 為 false 時應正確篩選', async () => {
      const mockBuffer = Buffer.from('mock excel data')
      vi.mocked(prisma.product.findMany).mockResolvedValue([])
      vi.mocked(excelLib.createExcelBuffer).mockReturnValue(mockBuffer)

      await exportProducts({ isActive: false })

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: false,
          }),
        })
      )
    })
  })
})
