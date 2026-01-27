/**
 * 驗證 Schema 單元測試
 * 測試 Zod schema 驗證邏輯
 */

import { describe, it, expect } from 'vitest'
import { z } from 'zod'

// 定義測試用 Schema
const CustomerFormSchema = z.object({
  name: z.string().min(1, '請輸入姓名').max(100, '姓名不能超過100字'),
  phone: z.string().optional(),
  email: z.string().email('Email 格式不正確').optional().or(z.literal('')),
})

const SupplierFormSchema = z.object({
  code: z.string().min(1, '請輸入供應商代碼'),
  name: z.string().min(1, '請輸入供應商名稱'),
  contactName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Email 格式不正確').optional().or(z.literal('')),
})

describe('CustomerFormSchema', () => {
  it('應該驗證有效的會員資料', () => {
    const validData = {
      name: '王小明',
      phone: '0912345678',
      email: 'wang@example.com',
    }

    const result = CustomerFormSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('應該拒絕空白姓名', () => {
    const invalidData = {
      name: '',
      phone: '0912345678',
    }

    const result = CustomerFormSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors
      expect(errors.name).toBeDefined()
    }
  })

  it('應該拒絕無效的 Email 格式', () => {
    const invalidData = {
      name: '王小明',
      email: 'invalid-email',
    }

    const result = CustomerFormSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })

  it('應該允許空白 Email', () => {
    const validData = {
      name: '王小明',
      email: '',
    }

    const result = CustomerFormSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })
})

describe('SupplierFormSchema', () => {
  it('應該驗證有效的供應商資料', () => {
    const validData = {
      code: 'S001',
      name: '測試供應商',
      contactName: '聯絡人',
      phone: '0223456789',
      email: 'supplier@example.com',
    }

    const result = SupplierFormSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('應該拒絕空白供應商代碼', () => {
    const invalidData = {
      code: '',
      name: '測試供應商',
    }

    const result = SupplierFormSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })

  it('應該拒絕空白供應商名稱', () => {
    const invalidData = {
      code: 'S001',
      name: '',
    }

    const result = SupplierFormSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })
})

describe('通用驗證', () => {
  it('應該驗證價格為正數', () => {
    const PriceSchema = z.number().positive('價格必須大於 0')

    expect(PriceSchema.safeParse(100).success).toBe(true)
    expect(PriceSchema.safeParse(0).success).toBe(false)
    expect(PriceSchema.safeParse(-10).success).toBe(false)
  })

  it('應該驗證數量為非負整數', () => {
    const QuantitySchema = z.number().int('數量必須為整數').nonnegative('數量不能為負')

    expect(QuantitySchema.safeParse(100).success).toBe(true)
    expect(QuantitySchema.safeParse(0).success).toBe(true)
    expect(QuantitySchema.safeParse(-1).success).toBe(false)
    expect(QuantitySchema.safeParse(1.5).success).toBe(false)
  })

  it('應該驗證日期格式', () => {
    const DateSchema = z.coerce.date()

    expect(DateSchema.safeParse('2024-01-01').success).toBe(true)
    expect(DateSchema.safeParse(new Date()).success).toBe(true)
    expect(DateSchema.safeParse('invalid-date').success).toBe(false)
  })
})
