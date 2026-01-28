'use server'

import prisma from '@/lib/prisma'
import { parseExcelBuffer, productHeaderMapping } from '@/lib/excel'
import type { ActionResult } from '@/types'

interface ImportResult {
  total: number
  success: number
  failed: number
  errors: { row: number; message: string }[]
}

/**
 * 匯入商品
 */
export async function importProducts(formData: FormData): Promise<ActionResult<ImportResult>> {
  try {
    const file = formData.get('file') as File
    if (!file) {
      return { success: false, message: '請選擇檔案' }
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const rows = parseExcelBuffer(buffer, productHeaderMapping)

    if (rows.length === 0) {
      return { success: false, message: '檔案內容為空' }
    }

    const result: ImportResult = {
      total: rows.length,
      success: 0,
      failed: 0,
      errors: [],
    }

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNum = i + 2 // Excel 第 1 行是表頭

      try {
        const sku = String(row.sku || '').trim()
        const name = String(row.name || '').trim()

        if (!sku || !name) {
          result.errors.push({ row: rowNum, message: '商品編號和名稱為必填' })
          result.failed++
          continue
        }

        // 查找分類
        const categoryCode = String(row.categoryCode || '').trim()
        const category = categoryCode
          ? await prisma.category.findUnique({ where: { code: categoryCode } })
          : await prisma.category.findFirst()

        if (!category) {
          result.errors.push({ row: rowNum, message: `分類代碼 ${categoryCode} 不存在` })
          result.failed++
          continue
        }

        // 查找單位
        const unitCode = String(row.unitCode || 'PCS').trim()
        const unit = await prisma.unit.findUnique({ where: { code: unitCode } })

        if (!unit) {
          result.errors.push({ row: rowNum, message: `單位代碼 ${unitCode} 不存在` })
          result.failed++
          continue
        }

        // 檢查是否已存在
        const existing = await prisma.product.findUnique({ where: { sku } })

        if (existing) {
          // 更新現有商品
          await prisma.product.update({
            where: { sku },
            data: {
              name,
              shortName: row.shortName ? String(row.shortName) : null,
              barcode: row.barcode ? String(row.barcode) : null,
              categoryId: category.id,
              unitId: unit.id,
              costPrice: Number(row.costPrice) || 0,
              listPrice: Number(row.listPrice) || 0,
              sellingPrice: Number(row.sellingPrice) || 0,
              safetyStock: Number(row.safetyStock) || 0,
              reorderPoint: Number(row.reorderPoint) || 0,
              reorderQty: Number(row.reorderQty) || 0,
              description: row.description ? String(row.description) : null,
            },
          })
        } else {
          // 新增商品
          await prisma.product.create({
            data: {
              sku,
              name,
              shortName: row.shortName ? String(row.shortName) : null,
              barcode: row.barcode ? String(row.barcode) : null,
              categoryId: category.id,
              unitId: unit.id,
              costPrice: Number(row.costPrice) || 0,
              listPrice: Number(row.listPrice) || 0,
              sellingPrice: Number(row.sellingPrice) || 0,
              safetyStock: Number(row.safetyStock) || 0,
              reorderPoint: Number(row.reorderPoint) || 0,
              reorderQty: Number(row.reorderQty) || 0,
              description: row.description ? String(row.description) : null,
            },
          })
        }

        result.success++
      } catch (error) {
        result.errors.push({
          row: rowNum,
          message: error instanceof Error ? error.message : '未知錯誤',
        })
        result.failed++
      }
    }

    return {
      success: true,
      message: `匯入完成：成功 ${result.success} 筆，失敗 ${result.failed} 筆`,
      data: result,
    }
  } catch (error) {
    console.error('Import products error:', error)
    return { success: false, message: '匯入商品失敗' }
  }
}
