/**
 * Product Import Server Actions 測試
 * 測試商品匯入相關的 Server Actions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { importProducts } from '@/actions/product-import'
import prisma from '@/lib/prisma'
import * as excelLib from '@/lib/excel'

// Mock excel 模組
vi.mock('@/lib/excel', () => ({
  parseExcelBuffer: vi.fn(),
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

// Helper function to create mock FormData with file
function createMockFormData(fileContent?: ArrayBuffer, fileName?: string): FormData {
  const formData = new FormData()
  if (fileContent !== undefined) {
    const blob = new Blob([fileContent], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const file = new File([blob], fileName || 'test.xlsx', { type: blob.type })
    formData.append('file', file)
  }
  return formData
}

describe('Product Import Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===== importProducts 測試 =====
  describe('importProducts', () => {
    const mockCategory = { id: 'cat1', code: 'CAT001', name: '分類1' }
    const mockUnit = { id: 'unit1', code: 'PCS', name: '個' }

    const validRows = [
      {
        sku: 'SKU001',
        name: '商品1',
        categoryCode: 'CAT001',
        unitCode: 'PCS',
        costPrice: 50,
        listPrice: 120,
        sellingPrice: 100,
        safetyStock: 10,
        reorderPoint: 5,
        reorderQty: 20,
      },
    ]

    it('應成功匯入新商品', async () => {
      const formData = createMockFormData(new ArrayBuffer(8))
      vi.mocked(excelLib.parseExcelBuffer).mockReturnValue(validRows)
      vi.mocked(prisma.category.findUnique).mockResolvedValue(mockCategory as never)
      vi.mocked(prisma.unit.findUnique).mockResolvedValue(mockUnit as never)
      vi.mocked(prisma.product.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.product.create).mockResolvedValue({ id: 'new-id' } as never)

      const result = await importProducts(formData)

      expect(result.success).toBe(true)
      expect(result.data?.total).toBe(1)
      expect(result.data?.success).toBe(1)
      expect(result.data?.failed).toBe(0)
    })

    it('應成功更新現有商品', async () => {
      const formData = createMockFormData(new ArrayBuffer(8))
      vi.mocked(excelLib.parseExcelBuffer).mockReturnValue(validRows)
      vi.mocked(prisma.category.findUnique).mockResolvedValue(mockCategory as never)
      vi.mocked(prisma.unit.findUnique).mockResolvedValue(mockUnit as never)
      vi.mocked(prisma.product.findUnique).mockResolvedValue({
        id: 'existing-id',
        sku: 'SKU001',
      } as never)
      vi.mocked(prisma.product.update).mockResolvedValue({ id: 'existing-id' } as never)

      const result = await importProducts(formData)

      expect(result.success).toBe(true)
      expect(result.data?.success).toBe(1)
      expect(prisma.product.update).toHaveBeenCalled()
    })

    it('沒有選擇檔案時應回傳錯誤', async () => {
      const formData = new FormData()

      const result = await importProducts(formData)

      expect(result.success).toBe(false)
      expect(result.message).toBe('請選擇檔案')
    })

    it('檔案內容為空時應回傳錯誤', async () => {
      const formData = createMockFormData(new ArrayBuffer(8))
      vi.mocked(excelLib.parseExcelBuffer).mockReturnValue([])

      const result = await importProducts(formData)

      expect(result.success).toBe(false)
      expect(result.message).toBe('檔案內容為空')
    })

    it('缺少必填欄位 SKU 時應記錄錯誤', async () => {
      const formData = createMockFormData(new ArrayBuffer(8))
      vi.mocked(excelLib.parseExcelBuffer).mockReturnValue([
        { sku: '', name: '商品1', categoryCode: 'CAT001', unitCode: 'PCS' },
      ])

      const result = await importProducts(formData)

      expect(result.success).toBe(true)
      expect(result.data?.failed).toBe(1)
      expect(result.data?.errors[0].message).toBe('商品編號和名稱為必填')
    })

    it('缺少必填欄位 name 時應記錄錯誤', async () => {
      const formData = createMockFormData(new ArrayBuffer(8))
      vi.mocked(excelLib.parseExcelBuffer).mockReturnValue([
        { sku: 'SKU001', name: '', categoryCode: 'CAT001', unitCode: 'PCS' },
      ])

      const result = await importProducts(formData)

      expect(result.success).toBe(true)
      expect(result.data?.failed).toBe(1)
      expect(result.data?.errors[0].message).toBe('商品編號和名稱為必填')
    })

    it('分類代碼不存在時應記錄錯誤', async () => {
      const formData = createMockFormData(new ArrayBuffer(8))
      vi.mocked(excelLib.parseExcelBuffer).mockReturnValue(validRows)
      vi.mocked(prisma.category.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.category.findFirst).mockResolvedValue(null)

      const result = await importProducts(formData)

      expect(result.success).toBe(true)
      expect(result.data?.failed).toBe(1)
      expect(result.data?.errors[0].message).toContain('分類代碼')
    })

    it('單位代碼不存在時應記錄錯誤', async () => {
      const formData = createMockFormData(new ArrayBuffer(8))
      vi.mocked(excelLib.parseExcelBuffer).mockReturnValue(validRows)
      vi.mocked(prisma.category.findUnique).mockResolvedValue(mockCategory as never)
      vi.mocked(prisma.unit.findUnique).mockResolvedValue(null)

      const result = await importProducts(formData)

      expect(result.success).toBe(true)
      expect(result.data?.failed).toBe(1)
      expect(result.data?.errors[0].message).toContain('單位代碼')
    })

    it('應處理多筆資料且部分失敗', async () => {
      const formData = createMockFormData(new ArrayBuffer(8))
      vi.mocked(excelLib.parseExcelBuffer).mockReturnValue([
        { sku: 'SKU001', name: '商品1', categoryCode: 'CAT001', unitCode: 'PCS' },
        { sku: '', name: '商品2', categoryCode: 'CAT001', unitCode: 'PCS' }, // 無效
        { sku: 'SKU003', name: '商品3', categoryCode: 'CAT001', unitCode: 'PCS' },
      ])
      vi.mocked(prisma.category.findUnique).mockResolvedValue(mockCategory as never)
      vi.mocked(prisma.unit.findUnique).mockResolvedValue(mockUnit as never)
      vi.mocked(prisma.product.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.product.create).mockResolvedValue({ id: 'new-id' } as never)

      const result = await importProducts(formData)

      expect(result.success).toBe(true)
      expect(result.data?.total).toBe(3)
      expect(result.data?.success).toBe(2)
      expect(result.data?.failed).toBe(1)
    })

    it('沒有分類代碼時應使用第一個分類', async () => {
      const formData = createMockFormData(new ArrayBuffer(8))
      vi.mocked(excelLib.parseExcelBuffer).mockReturnValue([
        { sku: 'SKU001', name: '商品1', categoryCode: '', unitCode: 'PCS' },
      ])
      vi.mocked(prisma.category.findFirst).mockResolvedValue(mockCategory as never)
      vi.mocked(prisma.unit.findUnique).mockResolvedValue(mockUnit as never)
      vi.mocked(prisma.product.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.product.create).mockResolvedValue({ id: 'new-id' } as never)

      const result = await importProducts(formData)

      expect(result.success).toBe(true)
      expect(result.data?.success).toBe(1)
      expect(prisma.category.findFirst).toHaveBeenCalled()
    })

    it('預設單位代碼為 PCS', async () => {
      const formData = createMockFormData(new ArrayBuffer(8))
      vi.mocked(excelLib.parseExcelBuffer).mockReturnValue([
        { sku: 'SKU001', name: '商品1', categoryCode: 'CAT001' },
      ])
      vi.mocked(prisma.category.findUnique).mockResolvedValue(mockCategory as never)
      vi.mocked(prisma.unit.findUnique).mockResolvedValue(mockUnit as never)
      vi.mocked(prisma.product.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.product.create).mockResolvedValue({ id: 'new-id' } as never)

      await importProducts(formData)

      expect(prisma.unit.findUnique).toHaveBeenCalledWith({ where: { code: 'PCS' } })
    })

    it('應正確處理可選欄位', async () => {
      const formData = createMockFormData(new ArrayBuffer(8))
      vi.mocked(excelLib.parseExcelBuffer).mockReturnValue([
        {
          sku: 'SKU001',
          name: '商品1',
          categoryCode: 'CAT001',
          unitCode: 'PCS',
          barcode: '4710000000001',
          shortName: '商品',
          description: '測試描述',
        },
      ])
      vi.mocked(prisma.category.findUnique).mockResolvedValue(mockCategory as never)
      vi.mocked(prisma.unit.findUnique).mockResolvedValue(mockUnit as never)
      vi.mocked(prisma.product.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.product.create).mockResolvedValue({ id: 'new-id' } as never)

      await importProducts(formData)

      expect(prisma.product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            barcode: '4710000000001',
            shortName: '商品',
            description: '測試描述',
          }),
        })
      )
    })

    it('資料庫錯誤時應記錄錯誤訊息', async () => {
      const formData = createMockFormData(new ArrayBuffer(8))
      vi.mocked(excelLib.parseExcelBuffer).mockReturnValue(validRows)
      vi.mocked(prisma.category.findUnique).mockResolvedValue(mockCategory as never)
      vi.mocked(prisma.unit.findUnique).mockResolvedValue(mockUnit as never)
      vi.mocked(prisma.product.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.product.create).mockRejectedValue(new Error('Unique constraint failed'))

      const result = await importProducts(formData)

      expect(result.success).toBe(true)
      expect(result.data?.failed).toBe(1)
      expect(result.data?.errors[0].message).toBe('Unique constraint failed')
    })

    it('整體錯誤時應回傳失敗訊息', async () => {
      const formData = createMockFormData(new ArrayBuffer(8))
      vi.mocked(excelLib.parseExcelBuffer).mockImplementation(() => {
        throw new Error('Invalid file format')
      })

      const result = await importProducts(formData)

      expect(result.success).toBe(false)
      expect(result.message).toBe('匯入商品失敗')
    })

    it('應正確計算行號 (Excel 第一行是表頭)', async () => {
      const formData = createMockFormData(new ArrayBuffer(8))
      vi.mocked(excelLib.parseExcelBuffer).mockReturnValue([
        { sku: '', name: '商品1', categoryCode: 'CAT001', unitCode: 'PCS' },
      ])

      const result = await importProducts(formData)

      expect(result.data?.errors[0].row).toBe(2) // 第一行資料對應 Excel 第二行
    })

    it('數值欄位應正確轉換', async () => {
      const formData = createMockFormData(new ArrayBuffer(8))
      vi.mocked(excelLib.parseExcelBuffer).mockReturnValue([
        {
          sku: 'SKU001',
          name: '商品1',
          categoryCode: 'CAT001',
          unitCode: 'PCS',
          costPrice: '50',
          listPrice: '120',
          sellingPrice: '100',
        },
      ])
      vi.mocked(prisma.category.findUnique).mockResolvedValue(mockCategory as never)
      vi.mocked(prisma.unit.findUnique).mockResolvedValue(mockUnit as never)
      vi.mocked(prisma.product.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.product.create).mockResolvedValue({ id: 'new-id' } as never)

      await importProducts(formData)

      expect(prisma.product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            costPrice: 50,
            listPrice: 120,
            sellingPrice: 100,
          }),
        })
      )
    })

    it('數值欄位為空時應預設為 0', async () => {
      const formData = createMockFormData(new ArrayBuffer(8))
      vi.mocked(excelLib.parseExcelBuffer).mockReturnValue([
        {
          sku: 'SKU001',
          name: '商品1',
          categoryCode: 'CAT001',
          unitCode: 'PCS',
        },
      ])
      vi.mocked(prisma.category.findUnique).mockResolvedValue(mockCategory as never)
      vi.mocked(prisma.unit.findUnique).mockResolvedValue(mockUnit as never)
      vi.mocked(prisma.product.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.product.create).mockResolvedValue({ id: 'new-id' } as never)

      await importProducts(formData)

      expect(prisma.product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            costPrice: 0,
            listPrice: 0,
            sellingPrice: 0,
            safetyStock: 0,
            reorderPoint: 0,
            reorderQty: 0,
          }),
        })
      )
    })

    it('更新商品時應使用 update 而非 create', async () => {
      const formData = createMockFormData(new ArrayBuffer(8))
      vi.mocked(excelLib.parseExcelBuffer).mockReturnValue(validRows)
      vi.mocked(prisma.category.findUnique).mockResolvedValue(mockCategory as never)
      vi.mocked(prisma.unit.findUnique).mockResolvedValue(mockUnit as never)
      vi.mocked(prisma.product.findUnique).mockResolvedValue({
        id: 'existing-id',
        sku: 'SKU001',
      } as never)
      vi.mocked(prisma.product.update).mockResolvedValue({ id: 'existing-id' } as never)

      await importProducts(formData)

      expect(prisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { sku: 'SKU001' },
        })
      )
      expect(prisma.product.create).not.toHaveBeenCalled()
    })

    it('應回傳正確的完成訊息', async () => {
      const formData = createMockFormData(new ArrayBuffer(8))
      vi.mocked(excelLib.parseExcelBuffer).mockReturnValue([
        { sku: 'SKU001', name: '商品1', categoryCode: 'CAT001', unitCode: 'PCS' },
        { sku: '', name: '商品2', categoryCode: 'CAT001', unitCode: 'PCS' },
      ])
      vi.mocked(prisma.category.findUnique).mockResolvedValue(mockCategory as never)
      vi.mocked(prisma.unit.findUnique).mockResolvedValue(mockUnit as never)
      vi.mocked(prisma.product.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.product.create).mockResolvedValue({ id: 'new-id' } as never)

      const result = await importProducts(formData)

      expect(result.message).toBe('匯入完成：成功 1 筆，失敗 1 筆')
    })
  })
})
