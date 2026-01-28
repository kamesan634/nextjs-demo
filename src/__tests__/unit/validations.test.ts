/**
 * 驗證 Schema 單元測試
 * 測試 Zod schema 驗證邏輯
 */

import { describe, it, expect } from 'vitest'

// Auth schemas
import {
  loginSchema,
  createUserSchema,
  updateUserSchema,
  createRoleSchema,
  updateRoleSchema,
} from '@/lib/validations/auth'

// Business schemas
import {
  customerLevelSchema,
  customerSchema as businessCustomerSchema,
  supplierSchema as businessSupplierSchema,
} from '@/lib/validations/business'

// Products schemas
import {
  categorySchema,
  productSchema,
  supplierSchema as productSupplierSchema,
  customerSchema as productCustomerSchema,
} from '@/lib/validations/products'

// System schemas
import { storeSchema, warehouseSchema } from '@/lib/validations/system'

// Cashier Shifts schemas
import { openShiftSchema, closeShiftSchema } from '@/lib/validations/cashier-shifts'

// Custom Reports schemas
import {
  createCustomReportSchema,
  updateCustomReportSchema,
} from '@/lib/validations/custom-reports'

// Goods Issues schemas
import { createGoodsIssueSchema } from '@/lib/validations/goods-issues'

// Hold Orders schemas
import { createHoldOrderSchema, resumeHoldOrderSchema } from '@/lib/validations/hold-orders'

// Invoices schemas
import { createInvoiceSchema, voidInvoiceSchema } from '@/lib/validations/invoices'

// Numbering Rules schemas
import {
  createNumberingRuleSchema,
  updateNumberingRuleSchema,
} from '@/lib/validations/numbering-rules'

// POS schemas
import { openSessionSchema, closeSessionSchema } from '@/lib/validations/pos'

// Price Rules schemas
import { createPriceRuleSchema, updatePriceRuleSchema } from '@/lib/validations/price-rules'

// Product Bundles schemas
import {
  createProductBundleSchema,
  updateProductBundleSchema,
} from '@/lib/validations/product-bundles'

// Refunds schemas
import { createRefundSchema, approveRefundSchema } from '@/lib/validations/refunds'

// Scheduled Reports schemas
import {
  createScheduledReportSchema,
  updateScheduledReportSchema,
} from '@/lib/validations/scheduled-reports'

// System Parameters schemas
import {
  createSystemParameterSchema,
  updateSystemParameterSchema,
} from '@/lib/validations/system-parameters'

// ===================================
// Auth Validations Tests
// ===================================

describe('Auth Validations', () => {
  describe('loginSchema', () => {
    it('應該驗證有效的登入資料', () => {
      const validData = {
        username: 'admin',
        password: 'password123',
      }

      const result = loginSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('應該拒絕空白帳號', () => {
      const invalidData = {
        username: '',
        password: 'password123',
      }

      const result = loginSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        const errors = result.error.flatten().fieldErrors
        expect(errors.username).toBeDefined()
      }
    })

    it('應該拒絕空白密碼', () => {
      const invalidData = {
        username: 'admin',
        password: '',
      }

      const result = loginSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        const errors = result.error.flatten().fieldErrors
        expect(errors.password).toBeDefined()
      }
    })

    it('應該拒絕超過 50 字元的帳號', () => {
      const invalidData = {
        username: 'a'.repeat(51),
        password: 'password123',
      }

      const result = loginSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕超過 100 字元的密碼', () => {
      const invalidData = {
        username: 'admin',
        password: 'a'.repeat(101),
      }

      const result = loginSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('邊界值測試：接受剛好 50 字元的帳號', () => {
      const validData = {
        username: 'a'.repeat(50),
        password: 'password123',
      }

      const result = loginSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('邊界值測試：接受剛好 100 字元的密碼', () => {
      const validData = {
        username: 'admin',
        password: 'a'.repeat(100),
      }

      const result = loginSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })

  describe('createUserSchema', () => {
    const validUserData = {
      username: 'newuser',
      email: 'user@example.com',
      password: 'password123',
      name: '新用戶',
      phone: '0912345678',
      roleId: 'role-1',
      storeId: 'store-1',
      isActive: true,
    }

    it('應該驗證有效的使用者建立資料', () => {
      const result = createUserSchema.safeParse(validUserData)
      expect(result.success).toBe(true)
    })

    it('應該拒絕少於 3 字元的帳號', () => {
      const invalidData = { ...validUserData, username: 'ab' }

      const result = createUserSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        const errors = result.error.flatten().fieldErrors
        expect(errors.username).toBeDefined()
      }
    })

    it('應該拒絕包含特殊字元的帳號', () => {
      const invalidData = { ...validUserData, username: 'user@name' }

      const result = createUserSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該接受包含底線的帳號', () => {
      const validData = { ...validUserData, username: 'user_name' }

      const result = createUserSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('應該拒絕無效的 Email 格式', () => {
      const invalidData = { ...validUserData, email: 'invalid-email' }

      const result = createUserSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕少於 6 字元的密碼', () => {
      const invalidData = { ...validUserData, password: '12345' }

      const result = createUserSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕空白姓名', () => {
      const invalidData = { ...validUserData, name: '' }

      const result = createUserSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕空白角色 ID', () => {
      const invalidData = { ...validUserData, roleId: '' }

      const result = createUserSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該允許空白的門市 ID', () => {
      const validData = { ...validUserData, storeId: null }

      const result = createUserSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('邊界值測試：接受剛好 3 字元的帳號', () => {
      const validData = { ...validUserData, username: 'abc' }

      const result = createUserSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('邊界值測試：接受剛好 6 字元的密碼', () => {
      const validData = { ...validUserData, password: '123456' }

      const result = createUserSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })

  describe('updateUserSchema', () => {
    const validUpdateData = {
      email: 'user@example.com',
      password: '',
      name: '更新用戶',
      phone: '0912345678',
      roleId: 'role-1',
      storeId: 'store-1',
      isActive: true,
    }

    it('應該驗證有效的使用者更新資料', () => {
      const result = updateUserSchema.safeParse(validUpdateData)
      expect(result.success).toBe(true)
    })

    it('應該允許空白密碼（不更新密碼）', () => {
      const validData = { ...validUpdateData, password: '' }

      const result = updateUserSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('應該拒絕少於 6 字元的密碼（當有提供時）', () => {
      const invalidData = { ...validUpdateData, password: '12345' }

      const result = updateUserSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該接受有效的密碼更新', () => {
      const validData = { ...validUpdateData, password: 'newpassword123' }

      const result = updateUserSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })

  describe('createRoleSchema', () => {
    const validRoleData = {
      code: 'ADMIN_ROLE',
      name: '管理員角色',
      description: '具有所有權限的管理員',
      permissions: [
        { module: 'users', action: 'read' },
        { module: 'users', action: 'write' },
      ],
    }

    it('應該驗證有效的角色建立資料', () => {
      const result = createRoleSchema.safeParse(validRoleData)
      expect(result.success).toBe(true)
    })

    it('應該拒絕空白角色代碼', () => {
      const invalidData = { ...validRoleData, code: '' }

      const result = createRoleSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕包含小寫字母的角色代碼', () => {
      const invalidData = { ...validRoleData, code: 'admin_role' }

      const result = createRoleSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕包含數字的角色代碼', () => {
      const invalidData = { ...validRoleData, code: 'ADMIN123' }

      const result = createRoleSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕超過 20 字元的角色代碼', () => {
      const invalidData = { ...validRoleData, code: 'A'.repeat(21) }

      const result = createRoleSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕超過 50 字元的角色名稱', () => {
      const invalidData = { ...validRoleData, name: '角'.repeat(51) }

      const result = createRoleSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕超過 200 字元的角色描述', () => {
      const invalidData = { ...validRoleData, description: '描'.repeat(201) }

      const result = createRoleSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該允許空陣列的權限', () => {
      const validData = { ...validRoleData, permissions: [] }

      const result = createRoleSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('邊界值測試：接受剛好 20 字元的角色代碼', () => {
      const validData = { ...validRoleData, code: 'A'.repeat(20) }

      const result = createRoleSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })

  describe('updateRoleSchema', () => {
    const validUpdateRoleData = {
      name: '更新後角色',
      description: '更新後的描述',
      permissions: [{ module: 'products', action: 'read' }],
    }

    it('應該驗證有效的角色更新資料', () => {
      const result = updateRoleSchema.safeParse(validUpdateRoleData)
      expect(result.success).toBe(true)
    })

    it('應該拒絕空白角色名稱', () => {
      const invalidData = { ...validUpdateRoleData, name: '' }

      const result = updateRoleSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該允許 null 描述', () => {
      const validData = { ...validUpdateRoleData, description: null }

      const result = updateRoleSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })
})

// ===================================
// Business Validations Tests
// ===================================

describe('Business Validations', () => {
  describe('customerLevelSchema', () => {
    const validLevelData = {
      code: 'VIP-1',
      name: 'VIP 會員',
      discountRate: 0.9,
      pointsMultiplier: 2,
      minPoints: 1000,
      benefits: '專屬折扣、優先服務',
      sortOrder: 1,
      isActive: true,
    }

    it('應該驗證有效的會員等級資料', () => {
      const result = customerLevelSchema.safeParse(validLevelData)
      expect(result.success).toBe(true)
    })

    it('應該拒絕空白等級代碼', () => {
      const invalidData = { ...validLevelData, code: '' }

      const result = customerLevelSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕包含特殊字元的等級代碼', () => {
      const invalidData = { ...validLevelData, code: 'VIP@1' }

      const result = customerLevelSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕負數的折扣率', () => {
      const invalidData = { ...validLevelData, discountRate: -0.1 }

      const result = customerLevelSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕大於 1 的折扣率', () => {
      const invalidData = { ...validLevelData, discountRate: 1.1 }

      const result = customerLevelSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕負數的點數倍率', () => {
      const invalidData = { ...validLevelData, pointsMultiplier: -1 }

      const result = customerLevelSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕大於 10 的點數倍率', () => {
      const invalidData = { ...validLevelData, pointsMultiplier: 11 }

      const result = customerLevelSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕非整數的升級點數', () => {
      const invalidData = { ...validLevelData, minPoints: 100.5 }

      const result = customerLevelSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕負數的升級點數', () => {
      const invalidData = { ...validLevelData, minPoints: -100 }

      const result = customerLevelSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕負數的排序順序', () => {
      const invalidData = { ...validLevelData, sortOrder: -1 }

      const result = customerLevelSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('邊界值測試：接受折扣率為 0', () => {
      const validData = { ...validLevelData, discountRate: 0 }

      const result = customerLevelSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('邊界值測試：接受折扣率為 1', () => {
      const validData = { ...validLevelData, discountRate: 1 }

      const result = customerLevelSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('邊界值測試：接受點數倍率為 10', () => {
      const validData = { ...validLevelData, pointsMultiplier: 10 }

      const result = customerLevelSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })

  describe('customerSchema (business)', () => {
    const validCustomerData = {
      code: 'C001',
      name: '王小明',
      phone: '0912345678',
      email: 'wang@example.com',
      gender: 'M' as const,
      birthday: '1990-01-01',
      address: '台北市信義區',
      levelId: 'level-1',
      totalPoints: 1000,
      availablePoints: 500,
      notes: '備註內容',
      isActive: true,
    }

    it('應該驗證有效的會員資料', () => {
      const result = businessCustomerSchema.safeParse(validCustomerData)
      expect(result.success).toBe(true)
    })

    it('應該拒絕空白會員編號', () => {
      const invalidData = { ...validCustomerData, code: '' }

      const result = businessCustomerSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕包含特殊字元的會員編號', () => {
      const invalidData = { ...validCustomerData, code: 'C@001' }

      const result = businessCustomerSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕空白會員姓名', () => {
      const invalidData = { ...validCustomerData, name: '' }

      const result = businessCustomerSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕無效的 Email 格式', () => {
      const invalidData = { ...validCustomerData, email: 'invalid-email' }

      const result = businessCustomerSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該允許空白 Email', () => {
      const validData = { ...validCustomerData, email: '' }

      const result = businessCustomerSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('應該拒絕無效的性別值', () => {
      const invalidData = { ...validCustomerData, gender: 'X' }

      const result = businessCustomerSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該接受所有有效的性別值', () => {
      const genders = ['M', 'F', 'O'] as const
      genders.forEach((gender) => {
        const validData = { ...validCustomerData, gender }
        const result = businessCustomerSchema.safeParse(validData)
        expect(result.success).toBe(true)
      })
    })

    it('應該拒絕負數的累計點數', () => {
      const invalidData = { ...validCustomerData, totalPoints: -100 }

      const result = businessCustomerSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕非整數的可用點數', () => {
      const invalidData = { ...validCustomerData, availablePoints: 100.5 }

      const result = businessCustomerSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕空白會員等級 ID', () => {
      const invalidData = { ...validCustomerData, levelId: '' }

      const result = businessCustomerSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('邊界值測試：接受 0 點的累計點數', () => {
      const validData = { ...validCustomerData, totalPoints: 0 }

      const result = businessCustomerSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })

  describe('supplierSchema (business)', () => {
    const validSupplierData = {
      code: 'SUP001',
      name: '測試供應商',
      shortName: '測試',
      contactPerson: '聯絡人',
      phone: '0223456789',
      fax: '0223456780',
      email: 'supplier@example.com',
      address: '台北市中山區',
      taxId: '12345678',
      bankName: '測試銀行',
      bankAccount: '1234567890',
      paymentTerms: 30,
      creditLimit: 100000,
      notes: '備註',
      isActive: true,
    }

    it('應該驗證有效的供應商資料', () => {
      const result = businessSupplierSchema.safeParse(validSupplierData)
      expect(result.success).toBe(true)
    })

    it('應該拒絕空白供應商代碼', () => {
      const invalidData = { ...validSupplierData, code: '' }

      const result = businessSupplierSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕包含特殊字元的供應商代碼', () => {
      const invalidData = { ...validSupplierData, code: 'SUP@001' }

      const result = businessSupplierSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕空白供應商名稱', () => {
      const invalidData = { ...validSupplierData, name: '' }

      const result = businessSupplierSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕負數的付款天數', () => {
      const invalidData = { ...validSupplierData, paymentTerms: -1 }

      const result = businessSupplierSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕超過 365 天的付款天數', () => {
      const invalidData = { ...validSupplierData, paymentTerms: 366 }

      const result = businessSupplierSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕非整數的付款天數', () => {
      const invalidData = { ...validSupplierData, paymentTerms: 30.5 }

      const result = businessSupplierSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕負數的信用額度', () => {
      const invalidData = { ...validSupplierData, creditLimit: -1000 }

      const result = businessSupplierSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('邊界值測試：接受 0 天的付款天數', () => {
      const validData = { ...validSupplierData, paymentTerms: 0 }

      const result = businessSupplierSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('邊界值測試：接受 365 天的付款天數', () => {
      const validData = { ...validSupplierData, paymentTerms: 365 }

      const result = businessSupplierSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })
})

// ===================================
// Products Validations Tests
// ===================================

describe('Products Validations', () => {
  describe('categorySchema', () => {
    const validCategoryData = {
      code: 'CAT001',
      name: '電子產品',
      description: '電子產品分類',
      parentId: null,
      sortOrder: 1,
      isActive: true,
    }

    it('應該驗證有效的商品分類資料', () => {
      const result = categorySchema.safeParse(validCategoryData)
      expect(result.success).toBe(true)
    })

    it('應該拒絕空白分類代碼', () => {
      const invalidData = { ...validCategoryData, code: '' }

      const result = categorySchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕包含特殊字元的分類代碼', () => {
      const invalidData = { ...validCategoryData, code: 'CAT@001' }

      const result = categorySchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕超過 20 字元的分類代碼', () => {
      const invalidData = { ...validCategoryData, code: 'A'.repeat(21) }

      const result = categorySchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕空白分類名稱', () => {
      const invalidData = { ...validCategoryData, name: '' }

      const result = categorySchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕超過 50 字元的分類名稱', () => {
      const invalidData = { ...validCategoryData, name: '分'.repeat(51) }

      const result = categorySchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕超過 200 字元的分類描述', () => {
      const invalidData = { ...validCategoryData, description: '描'.repeat(201) }

      const result = categorySchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕負數的排序順序', () => {
      const invalidData = { ...validCategoryData, sortOrder: -1 }

      const result = categorySchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕非整數的排序順序', () => {
      const invalidData = { ...validCategoryData, sortOrder: 1.5 }

      const result = categorySchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該允許 null 的父分類 ID', () => {
      const validData = { ...validCategoryData, parentId: null }

      const result = categorySchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('邊界值測試：接受剛好 20 字元的分類代碼', () => {
      const validData = { ...validCategoryData, code: 'A'.repeat(20) }

      const result = categorySchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })

  describe('productSchema', () => {
    const validProductData = {
      sku: 'PRD001',
      barcode: '4710000000001',
      name: '測試商品',
      shortName: '測試',
      description: '商品描述',
      specification: '規格說明',
      costPrice: 100,
      listPrice: 150,
      sellingPrice: 130,
      minPrice: 110,
      safetyStock: 10,
      reorderPoint: 5,
      reorderQty: 20,
      categoryId: 'cat-1',
      unitId: 'unit-1',
      taxTypeId: 'tax-1',
      isActive: true,
      isSerialControl: false,
      isBatchControl: false,
      allowNegativeStock: false,
      imageUrl: 'https://example.com/image.jpg',
    }

    it('應該驗證有效的商品資料', () => {
      const result = productSchema.safeParse(validProductData)
      expect(result.success).toBe(true)
    })

    it('應該拒絕空白商品編號', () => {
      const invalidData = { ...validProductData, sku: '' }

      const result = productSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕包含特殊字元的商品編號', () => {
      const invalidData = { ...validProductData, sku: 'PRD@001' }

      const result = productSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕超過 50 字元的商品編號', () => {
      const invalidData = { ...validProductData, sku: 'A'.repeat(51) }

      const result = productSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕空白商品名稱', () => {
      const invalidData = { ...validProductData, name: '' }

      const result = productSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕超過 100 字元的商品名稱', () => {
      const invalidData = { ...validProductData, name: '品'.repeat(101) }

      const result = productSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕負數的成本價', () => {
      const invalidData = { ...validProductData, costPrice: -100 }

      const result = productSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕負數的定價', () => {
      const invalidData = { ...validProductData, listPrice: -100 }

      const result = productSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕負數的售價', () => {
      const invalidData = { ...validProductData, sellingPrice: -100 }

      const result = productSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕負數的最低售價', () => {
      const invalidData = { ...validProductData, minPrice: -100 }

      const result = productSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕負數的安全庫存', () => {
      const invalidData = { ...validProductData, safetyStock: -10 }

      const result = productSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕非整數的安全庫存', () => {
      const invalidData = { ...validProductData, safetyStock: 10.5 }

      const result = productSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕負數的補貨點', () => {
      const invalidData = { ...validProductData, reorderPoint: -5 }

      const result = productSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕空白商品分類 ID', () => {
      const invalidData = { ...validProductData, categoryId: '' }

      const result = productSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕空白計量單位 ID', () => {
      const invalidData = { ...validProductData, unitId: '' }

      const result = productSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕無效的圖片網址', () => {
      const invalidData = { ...validProductData, imageUrl: 'invalid-url' }

      const result = productSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該允許空白的圖片網址', () => {
      const validData = { ...validProductData, imageUrl: '' }

      const result = productSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('邊界值測試：接受價格為 0', () => {
      const validData = {
        ...validProductData,
        costPrice: 0,
        listPrice: 0,
        sellingPrice: 0,
      }

      const result = productSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('邊界值測試：接受庫存設定為 0', () => {
      const validData = {
        ...validProductData,
        safetyStock: 0,
        reorderPoint: 0,
        reorderQty: 0,
      }

      const result = productSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })

  describe('supplierSchema (products)', () => {
    const validSupplierData = {
      code: 'SUP001',
      name: '測試供應商',
      shortName: '測試',
      contactPerson: '聯絡人',
      phone: '0223456789',
      fax: '0223456780',
      email: 'supplier@example.com',
      address: '台北市中山區',
      taxId: '12345678',
      bankName: '測試銀行',
      bankAccount: '1234567890',
      paymentTerms: 30,
      creditLimit: 100000,
      notes: '備註',
      isActive: true,
    }

    it('應該驗證有效的供應商資料', () => {
      const result = productSupplierSchema.safeParse(validSupplierData)
      expect(result.success).toBe(true)
    })

    it('應該拒絕空白供應商代碼', () => {
      const invalidData = { ...validSupplierData, code: '' }

      const result = productSupplierSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕負數的付款天數', () => {
      const invalidData = { ...validSupplierData, paymentTerms: -1 }

      const result = productSupplierSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕負數的信用額度', () => {
      const invalidData = { ...validSupplierData, creditLimit: -1000 }

      const result = productSupplierSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('customerSchema (products)', () => {
    const validCustomerData = {
      code: 'C001',
      name: '王小明',
      phone: '0912345678',
      email: 'wang@example.com',
      gender: 'M' as const,
      birthday: new Date('1990-01-01'),
      address: '台北市信義區',
      levelId: 'level-1',
      notes: '備註內容',
      isActive: true,
    }

    it('應該驗證有效的會員資料', () => {
      const result = productCustomerSchema.safeParse(validCustomerData)
      expect(result.success).toBe(true)
    })

    it('應該拒絕空白會員編號', () => {
      const invalidData = { ...validCustomerData, code: '' }

      const result = productCustomerSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕空白會員姓名', () => {
      const invalidData = { ...validCustomerData, name: '' }

      const result = productCustomerSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕無效的 Email 格式', () => {
      const invalidData = { ...validCustomerData, email: 'invalid-email' }

      const result = productCustomerSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該允許空白 Email', () => {
      const validData = { ...validCustomerData, email: '' }

      const result = productCustomerSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('應該接受 Date 物件的生日', () => {
      const validData = { ...validCustomerData, birthday: new Date() }

      const result = productCustomerSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('應該拒絕空白會員等級 ID', () => {
      const invalidData = { ...validCustomerData, levelId: '' }

      const result = productCustomerSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })
})

// ===================================
// System Validations Tests
// ===================================

describe('System Validations', () => {
  describe('storeSchema', () => {
    const validStoreData = {
      code: 'STORE001',
      name: '台北旗艦店',
      address: '台北市信義區信義路五段7號',
      phone: '0223456789',
      email: 'taipei@example.com',
      manager: '王店長',
      openTime: '09:00',
      closeTime: '21:00',
      isActive: true,
    }

    it('應該驗證有效的門市資料', () => {
      const result = storeSchema.safeParse(validStoreData)
      expect(result.success).toBe(true)
    })

    it('應該拒絕空白門市代碼', () => {
      const invalidData = { ...validStoreData, code: '' }

      const result = storeSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕包含特殊字元的門市代碼', () => {
      const invalidData = { ...validStoreData, code: 'STORE@001' }

      const result = storeSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕超過 20 字元的門市代碼', () => {
      const invalidData = { ...validStoreData, code: 'A'.repeat(21) }

      const result = storeSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕空白門市名稱', () => {
      const invalidData = { ...validStoreData, name: '' }

      const result = storeSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕超過 100 字元的門市名稱', () => {
      const invalidData = { ...validStoreData, name: '店'.repeat(101) }

      const result = storeSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕超過 200 字元的地址', () => {
      const invalidData = { ...validStoreData, address: '地'.repeat(201) }

      const result = storeSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕超過 20 字元的電話', () => {
      const invalidData = { ...validStoreData, phone: '1'.repeat(21) }

      const result = storeSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕無效的 Email 格式', () => {
      const invalidData = { ...validStoreData, email: 'invalid-email' }

      const result = storeSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該允許空白 Email', () => {
      const validData = { ...validStoreData, email: '' }

      const result = storeSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('應該拒絕超過 50 字元的店長姓名', () => {
      const invalidData = { ...validStoreData, manager: '王'.repeat(51) }

      const result = storeSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕超過 10 字元的營業開始時間', () => {
      const invalidData = { ...validStoreData, openTime: '1'.repeat(11) }

      const result = storeSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該允許 null 的可選欄位', () => {
      const validData = {
        ...validStoreData,
        address: null,
        phone: null,
        email: null,
        manager: null,
        openTime: null,
        closeTime: null,
      }

      const result = storeSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('邊界值測試：接受剛好 20 字元的門市代碼', () => {
      const validData = { ...validStoreData, code: 'A'.repeat(20) }

      const result = storeSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('邊界值測試：接受剛好 100 字元的門市名稱', () => {
      const validData = { ...validStoreData, name: '店'.repeat(100) }

      const result = storeSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })

  describe('warehouseSchema', () => {
    const validWarehouseData = {
      code: 'WH001',
      name: '主倉庫',
      address: '新北市三重區重新路1號',
      phone: '0229876543',
      manager: '李倉管',
      isActive: true,
      isDefault: true,
    }

    it('應該驗證有效的倉庫資料', () => {
      const result = warehouseSchema.safeParse(validWarehouseData)
      expect(result.success).toBe(true)
    })

    it('應該拒絕空白倉庫代碼', () => {
      const invalidData = { ...validWarehouseData, code: '' }

      const result = warehouseSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕包含特殊字元的倉庫代碼', () => {
      const invalidData = { ...validWarehouseData, code: 'WH@001' }

      const result = warehouseSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕超過 20 字元的倉庫代碼', () => {
      const invalidData = { ...validWarehouseData, code: 'A'.repeat(21) }

      const result = warehouseSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕空白倉庫名稱', () => {
      const invalidData = { ...validWarehouseData, name: '' }

      const result = warehouseSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕超過 100 字元的倉庫名稱', () => {
      const invalidData = { ...validWarehouseData, name: '倉'.repeat(101) }

      const result = warehouseSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕超過 200 字元的地址', () => {
      const invalidData = { ...validWarehouseData, address: '地'.repeat(201) }

      const result = warehouseSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕超過 20 字元的電話', () => {
      const invalidData = { ...validWarehouseData, phone: '1'.repeat(21) }

      const result = warehouseSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕超過 50 字元的倉管人員姓名', () => {
      const invalidData = { ...validWarehouseData, manager: '李'.repeat(51) }

      const result = warehouseSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該允許 null 的可選欄位', () => {
      const validData = {
        ...validWarehouseData,
        address: null,
        phone: null,
        manager: null,
      }

      const result = warehouseSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('應該要求 isDefault 欄位', () => {
      const invalidData = {
        code: 'WH001',
        name: '主倉庫',
        isActive: true,
      }

      const result = warehouseSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('邊界值測試：接受剛好 20 字元的倉庫代碼', () => {
      const validData = { ...validWarehouseData, code: 'A'.repeat(20) }

      const result = warehouseSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('邊界值測試：接受剛好 100 字元的倉庫名稱', () => {
      const validData = { ...validWarehouseData, name: '倉'.repeat(100) }

      const result = warehouseSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('邊界值測試：接受剛好 200 字元的地址', () => {
      const validData = { ...validWarehouseData, address: '地'.repeat(200) }

      const result = warehouseSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })
})

// ===================================
// Cashier Shifts Validations Tests
// ===================================

describe('Cashier Shifts Validations', () => {
  describe('openShiftSchema', () => {
    const validOpenShiftData = {
      sessionId: 'session-1',
      storeId: 'store-1',
      openingCash: 1000,
    }

    it('應該驗證有效的開班資料', () => {
      const result = openShiftSchema.safeParse(validOpenShiftData)
      expect(result.success).toBe(true)
    })

    it('應該拒絕空白班別 ID', () => {
      const invalidData = { ...validOpenShiftData, sessionId: '' }

      const result = openShiftSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        const errors = result.error.flatten().fieldErrors
        expect(errors.sessionId).toBeDefined()
      }
    })

    it('應該拒絕空白店舖 ID', () => {
      const invalidData = { ...validOpenShiftData, storeId: '' }

      const result = openShiftSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        const errors = result.error.flatten().fieldErrors
        expect(errors.storeId).toBeDefined()
      }
    })

    it('應該拒絕負數的開班金額', () => {
      const invalidData = { ...validOpenShiftData, openingCash: -100 }

      const result = openShiftSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('邊界值測試：接受開班金額為 0', () => {
      const validData = { ...validOpenShiftData, openingCash: 0 }

      const result = openShiftSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('應該拒絕缺少必填欄位', () => {
      const invalidData = { openingCash: 1000 }

      const result = openShiftSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('closeShiftSchema', () => {
    const validCloseShiftData = {
      closingCash: 5000,
      notes: '關班備註',
    }

    it('應該驗證有效的關班資料', () => {
      const result = closeShiftSchema.safeParse(validCloseShiftData)
      expect(result.success).toBe(true)
    })

    it('應該拒絕負數的關班金額', () => {
      const invalidData = { ...validCloseShiftData, closingCash: -100 }

      const result = closeShiftSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該允許不提供備註', () => {
      const validData = { closingCash: 5000 }

      const result = closeShiftSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('邊界值測試：接受關班金額為 0', () => {
      const validData = { ...validCloseShiftData, closingCash: 0 }

      const result = closeShiftSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })
})

// ===================================
// Custom Reports Validations Tests
// ===================================

describe('Custom Reports Validations', () => {
  describe('createCustomReportSchema', () => {
    const validCustomReportData = {
      name: '銷售報表',
      description: '每月銷售分析報表',
      queryDefinition: {
        dataSource: 'orders' as const,
        fields: ['orderNumber', 'totalAmount', 'orderDate'],
        filters: [{ field: 'status', operator: 'eq' as const, value: 'COMPLETED' }],
        groupBy: ['orderDate'],
        orderBy: [{ field: 'totalAmount', direction: 'desc' as const }],
        limit: 100,
      },
      chartConfig: {
        type: 'bar' as const,
        xField: 'orderDate',
        yField: 'totalAmount',
        title: '銷售趨勢圖',
      },
      isPublic: true,
    }

    it('應該驗證有效的自訂報表資料', () => {
      const result = createCustomReportSchema.safeParse(validCustomReportData)
      expect(result.success).toBe(true)
    })

    it('應該拒絕空白報表名稱', () => {
      const invalidData = { ...validCustomReportData, name: '' }

      const result = createCustomReportSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        const errors = result.error.flatten().fieldErrors
        expect(errors.name).toBeDefined()
      }
    })

    it('應該拒絕超過 100 字元的報表名稱', () => {
      const invalidData = { ...validCustomReportData, name: '報'.repeat(101) }

      const result = createCustomReportSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕超過 500 字元的描述', () => {
      const invalidData = { ...validCustomReportData, description: '描'.repeat(501) }

      const result = createCustomReportSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該允許 null 的描述', () => {
      const validData = { ...validCustomReportData, description: null }

      const result = createCustomReportSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('應該拒絕無效的資料來源', () => {
      const invalidData = {
        ...validCustomReportData,
        queryDefinition: {
          ...validCustomReportData.queryDefinition,
          dataSource: 'invalid_source',
        },
      }

      const result = createCustomReportSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該接受所有有效的資料來源', () => {
      const dataSources = [
        'orders',
        'products',
        'customers',
        'inventory',
        'purchase_orders',
      ] as const
      dataSources.forEach((dataSource) => {
        const validData = {
          ...validCustomReportData,
          queryDefinition: {
            ...validCustomReportData.queryDefinition,
            dataSource,
          },
        }
        const result = createCustomReportSchema.safeParse(validData)
        expect(result.success).toBe(true)
      })
    })

    it('應該拒絕空白欄位陣列', () => {
      const invalidData = {
        ...validCustomReportData,
        queryDefinition: {
          ...validCustomReportData.queryDefinition,
          fields: [],
        },
      }

      const result = createCustomReportSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該接受所有有效的運算子', () => {
      const operators = ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'contains', 'in'] as const
      operators.forEach((operator) => {
        const validData = {
          ...validCustomReportData,
          queryDefinition: {
            ...validCustomReportData.queryDefinition,
            filters: [{ field: 'status', operator, value: 'test' }],
          },
        }
        const result = createCustomReportSchema.safeParse(validData)
        expect(result.success).toBe(true)
      })
    })

    it('應該拒絕無效的排序方向', () => {
      const invalidData = {
        ...validCustomReportData,
        queryDefinition: {
          ...validCustomReportData.queryDefinition,
          orderBy: [{ field: 'totalAmount', direction: 'invalid' }],
        },
      }

      const result = createCustomReportSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕小於 1 的 limit', () => {
      const invalidData = {
        ...validCustomReportData,
        queryDefinition: {
          ...validCustomReportData.queryDefinition,
          limit: 0,
        },
      }

      const result = createCustomReportSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕大於 10000 的 limit', () => {
      const invalidData = {
        ...validCustomReportData,
        queryDefinition: {
          ...validCustomReportData.queryDefinition,
          limit: 10001,
        },
      }

      const result = createCustomReportSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該接受所有有效的圖表類型', () => {
      const chartTypes = ['bar', 'line', 'pie', 'table'] as const
      chartTypes.forEach((type) => {
        const validData = {
          ...validCustomReportData,
          chartConfig: { ...validCustomReportData.chartConfig, type },
        }
        const result = createCustomReportSchema.safeParse(validData)
        expect(result.success).toBe(true)
      })
    })

    it('應該允許 null 的圖表設定', () => {
      const validData = { ...validCustomReportData, chartConfig: null }

      const result = createCustomReportSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('邊界值測試：接受 limit 為 1', () => {
      const validData = {
        ...validCustomReportData,
        queryDefinition: {
          ...validCustomReportData.queryDefinition,
          limit: 1,
        },
      }

      const result = createCustomReportSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('邊界值測試：接受 limit 為 10000', () => {
      const validData = {
        ...validCustomReportData,
        queryDefinition: {
          ...validCustomReportData.queryDefinition,
          limit: 10000,
        },
      }

      const result = createCustomReportSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })

  describe('updateCustomReportSchema', () => {
    it('應該與 createCustomReportSchema 有相同的驗證', () => {
      const validData = {
        name: '更新的報表名稱',
        queryDefinition: {
          dataSource: 'products' as const,
          fields: ['sku', 'name'],
          filters: [],
        },
        isPublic: false,
      }

      const result = updateCustomReportSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })
})

// ===================================
// Goods Issues Validations Tests
// ===================================

describe('Goods Issues Validations', () => {
  describe('createGoodsIssueSchema', () => {
    const validGoodsIssueData = {
      warehouseId: 'warehouse-1',
      type: 'SALES' as const,
      referenceType: 'ORDER',
      referenceId: 'order-123',
      issueDate: '2024-01-15',
      notes: '出庫備註',
      items: [{ productId: 'product-1', quantity: 10, notes: '商品備註' }],
    }

    it('應該驗證有效的出庫單資料', () => {
      const result = createGoodsIssueSchema.safeParse(validGoodsIssueData)
      expect(result.success).toBe(true)
    })

    it('應該拒絕空白倉庫 ID', () => {
      const invalidData = { ...validGoodsIssueData, warehouseId: '' }

      const result = createGoodsIssueSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        const errors = result.error.flatten().fieldErrors
        expect(errors.warehouseId).toBeDefined()
      }
    })

    it('應該接受所有有效的出庫類型', () => {
      const types = ['SALES', 'DAMAGE', 'OTHER'] as const
      types.forEach((type) => {
        const validData = { ...validGoodsIssueData, type }
        const result = createGoodsIssueSchema.safeParse(validData)
        expect(result.success).toBe(true)
      })
    })

    it('應該拒絕無效的出庫類型', () => {
      const invalidData = { ...validGoodsIssueData, type: 'INVALID' }

      const result = createGoodsIssueSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕空白的商品項目陣列', () => {
      const invalidData = { ...validGoodsIssueData, items: [] }

      const result = createGoodsIssueSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕數量小於 1 的項目', () => {
      const invalidData = {
        ...validGoodsIssueData,
        items: [{ productId: 'product-1', quantity: 0, notes: null }],
      }

      const result = createGoodsIssueSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕空白的商品 ID', () => {
      const invalidData = {
        ...validGoodsIssueData,
        items: [{ productId: '', quantity: 10, notes: null }],
      }

      const result = createGoodsIssueSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕超過 500 字元的備註', () => {
      const invalidData = { ...validGoodsIssueData, notes: '備'.repeat(501) }

      const result = createGoodsIssueSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該允許 null 的參考類型', () => {
      const validData = { ...validGoodsIssueData, referenceType: null }

      const result = createGoodsIssueSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('應該允許 null 的參考 ID', () => {
      const validData = { ...validGoodsIssueData, referenceId: null }

      const result = createGoodsIssueSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('邊界值測試：接受數量為 1 的項目', () => {
      const validData = {
        ...validGoodsIssueData,
        items: [{ productId: 'product-1', quantity: 1, notes: null }],
      }

      const result = createGoodsIssueSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })
})

// ===================================
// Hold Orders Validations Tests
// ===================================

describe('Hold Orders Validations', () => {
  describe('createHoldOrderSchema', () => {
    const validHoldOrderData = {
      storeId: 'store-1',
      items: '[{"productId":"p1","quantity":1}]',
      subtotal: 1000,
      discount: 100,
      totalAmount: 900,
      reason: '客戶暫時離開',
      customerId: 'customer-1',
    }

    it('應該驗證有效的掛單資料', () => {
      const result = createHoldOrderSchema.safeParse(validHoldOrderData)
      expect(result.success).toBe(true)
    })

    it('應該拒絕空白店舖 ID', () => {
      const invalidData = { ...validHoldOrderData, storeId: '' }

      const result = createHoldOrderSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        const errors = result.error.flatten().fieldErrors
        expect(errors.storeId).toBeDefined()
      }
    })

    it('應該拒絕空白商品項目', () => {
      const invalidData = { ...validHoldOrderData, items: '' }

      const result = createHoldOrderSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕負數的小計金額', () => {
      const invalidData = { ...validHoldOrderData, subtotal: -100 }

      const result = createHoldOrderSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕負數的折扣金額', () => {
      const invalidData = { ...validHoldOrderData, discount: -50 }

      const result = createHoldOrderSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕負數的總金額', () => {
      const invalidData = { ...validHoldOrderData, totalAmount: -100 }

      const result = createHoldOrderSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該允許不提供原因', () => {
      const validData = { ...validHoldOrderData, reason: undefined }

      const result = createHoldOrderSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('應該允許不提供客戶 ID', () => {
      const validData = { ...validHoldOrderData, customerId: undefined }

      const result = createHoldOrderSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('邊界值測試：接受小計金額為 0', () => {
      const validData = { ...validHoldOrderData, subtotal: 0 }

      const result = createHoldOrderSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('邊界值測試：接受折扣金額為 0', () => {
      const validData = { ...validHoldOrderData, discount: 0 }

      const result = createHoldOrderSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })

  describe('resumeHoldOrderSchema', () => {
    it('應該驗證有效的恢復掛單資料', () => {
      const validData = { holdOrderId: 'hold-order-1' }

      const result = resumeHoldOrderSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('應該拒絕空白掛單 ID', () => {
      const invalidData = { holdOrderId: '' }

      const result = resumeHoldOrderSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        const errors = result.error.flatten().fieldErrors
        expect(errors.holdOrderId).toBeDefined()
      }
    })
  })
})

// ===================================
// Invoices Validations Tests
// ===================================

describe('Invoices Validations', () => {
  describe('createInvoiceSchema', () => {
    const validInvoiceData = {
      orderId: 'order-1',
      invoiceType: 'B2B' as const,
      buyerTaxId: '12345678',
      buyerName: '測試公司',
      carrierType: 'MOBILE' as const,
      carrierNo: '/ABC1234',
      donationCode: '1234',
      amount: 1000,
      taxAmount: 50,
      totalAmount: 1050,
    }

    it('應該驗證有效的發票資料', () => {
      const result = createInvoiceSchema.safeParse(validInvoiceData)
      expect(result.success).toBe(true)
    })

    it('應該拒絕空白訂單 ID', () => {
      const invalidData = { ...validInvoiceData, orderId: '' }

      const result = createInvoiceSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        const errors = result.error.flatten().fieldErrors
        expect(errors.orderId).toBeDefined()
      }
    })

    it('應該接受所有有效的發票類型', () => {
      const types = ['B2B', 'B2C'] as const
      types.forEach((invoiceType) => {
        const validData = { ...validInvoiceData, invoiceType }
        const result = createInvoiceSchema.safeParse(validData)
        expect(result.success).toBe(true)
      })
    })

    it('應該拒絕無效的發票類型', () => {
      const invalidData = { ...validInvoiceData, invoiceType: 'INVALID' }

      const result = createInvoiceSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該接受所有有效的載具類型', () => {
      const types = ['MOBILE', 'CITIZEN', 'NONE'] as const
      types.forEach((carrierType) => {
        const validData = { ...validInvoiceData, carrierType }
        const result = createInvoiceSchema.safeParse(validData)
        expect(result.success).toBe(true)
      })
    })

    it('應該拒絕負數的金額', () => {
      const invalidData = { ...validInvoiceData, amount: -100 }

      const result = createInvoiceSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕負數的稅額', () => {
      const invalidData = { ...validInvoiceData, taxAmount: -10 }

      const result = createInvoiceSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕負數的總金額', () => {
      const invalidData = { ...validInvoiceData, totalAmount: -100 }

      const result = createInvoiceSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該允許不提供買受人統編', () => {
      const validData = { ...validInvoiceData, buyerTaxId: undefined }

      const result = createInvoiceSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('應該允許不提供買受人名稱', () => {
      const validData = { ...validInvoiceData, buyerName: undefined }

      const result = createInvoiceSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('邊界值測試：接受金額為 0', () => {
      const validData = { ...validInvoiceData, amount: 0 }

      const result = createInvoiceSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })

  describe('voidInvoiceSchema', () => {
    it('應該驗證有效的作廢發票資料', () => {
      const validData = { voidReason: '客戶要求取消' }

      const result = voidInvoiceSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('應該拒絕空白作廢原因', () => {
      const invalidData = { voidReason: '' }

      const result = voidInvoiceSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        const errors = result.error.flatten().fieldErrors
        expect(errors.voidReason).toBeDefined()
      }
    })
  })
})

// ===================================
// Numbering Rules Validations Tests
// ===================================

describe('Numbering Rules Validations', () => {
  describe('createNumberingRuleSchema', () => {
    const validNumberingRuleData = {
      code: 'SO_RULE',
      name: '銷售單編號規則',
      prefix: 'SO-',
      dateFormat: 'YYYYMMDD',
      sequenceLength: 5,
      resetPeriod: 'DAILY' as const,
      isActive: true,
    }

    it('應該驗證有效的編號規則資料', () => {
      const result = createNumberingRuleSchema.safeParse(validNumberingRuleData)
      expect(result.success).toBe(true)
    })

    it('應該拒絕空白規則代碼', () => {
      const invalidData = { ...validNumberingRuleData, code: '' }

      const result = createNumberingRuleSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        const errors = result.error.flatten().fieldErrors
        expect(errors.code).toBeDefined()
      }
    })

    it('應該拒絕超過 30 字元的規則代碼', () => {
      const invalidData = { ...validNumberingRuleData, code: 'A'.repeat(31) }

      const result = createNumberingRuleSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕包含小寫字母的規則代碼', () => {
      const invalidData = { ...validNumberingRuleData, code: 'so_rule' }

      const result = createNumberingRuleSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕包含特殊字元的規則代碼（除了底線）', () => {
      const invalidData = { ...validNumberingRuleData, code: 'SO-RULE' }

      const result = createNumberingRuleSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕空白規則名稱', () => {
      const invalidData = { ...validNumberingRuleData, name: '' }

      const result = createNumberingRuleSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕超過 100 字元的規則名稱', () => {
      const invalidData = { ...validNumberingRuleData, name: '規'.repeat(101) }

      const result = createNumberingRuleSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕空白前綴', () => {
      const invalidData = { ...validNumberingRuleData, prefix: '' }

      const result = createNumberingRuleSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕超過 10 字元的前綴', () => {
      const invalidData = { ...validNumberingRuleData, prefix: 'A'.repeat(11) }

      const result = createNumberingRuleSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕包含小寫字母的前綴', () => {
      const invalidData = { ...validNumberingRuleData, prefix: 'so-' }

      const result = createNumberingRuleSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕包含底線的前綴', () => {
      const invalidData = { ...validNumberingRuleData, prefix: 'SO_' }

      const result = createNumberingRuleSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕小於 1 的序號長度', () => {
      const invalidData = { ...validNumberingRuleData, sequenceLength: 0 }

      const result = createNumberingRuleSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕大於 10 的序號長度', () => {
      const invalidData = { ...validNumberingRuleData, sequenceLength: 11 }

      const result = createNumberingRuleSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕非整數的序號長度', () => {
      const invalidData = { ...validNumberingRuleData, sequenceLength: 5.5 }

      const result = createNumberingRuleSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該接受所有有效的重設週期', () => {
      const periods = ['DAILY', 'MONTHLY', 'YEARLY', 'NEVER'] as const
      periods.forEach((resetPeriod) => {
        const validData = { ...validNumberingRuleData, resetPeriod }
        const result = createNumberingRuleSchema.safeParse(validData)
        expect(result.success).toBe(true)
      })
    })

    it('應該允許 null 的日期格式', () => {
      const validData = { ...validNumberingRuleData, dateFormat: null }

      const result = createNumberingRuleSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('應該允許 null 的重設週期', () => {
      const validData = { ...validNumberingRuleData, resetPeriod: null }

      const result = createNumberingRuleSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('邊界值測試：接受剛好 30 字元的規則代碼', () => {
      const validData = { ...validNumberingRuleData, code: 'A'.repeat(30) }

      const result = createNumberingRuleSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('邊界值測試：接受序號長度為 1', () => {
      const validData = { ...validNumberingRuleData, sequenceLength: 1 }

      const result = createNumberingRuleSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('邊界值測試：接受序號長度為 10', () => {
      const validData = { ...validNumberingRuleData, sequenceLength: 10 }

      const result = createNumberingRuleSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })

  describe('updateNumberingRuleSchema', () => {
    it('應該驗證有效的更新資料（不含 code）', () => {
      const validData = {
        name: '更新的規則名稱',
        prefix: 'UP-',
        sequenceLength: 6,
        isActive: false,
      }

      const result = updateNumberingRuleSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('應該拒絕空白規則名稱', () => {
      const invalidData = {
        name: '',
        prefix: 'UP-',
        sequenceLength: 6,
        isActive: true,
      }

      const result = updateNumberingRuleSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })
})

// ===================================
// POS Validations Tests
// ===================================

describe('POS Validations', () => {
  describe('openSessionSchema', () => {
    const validOpenSessionData = {
      storeId: 'store-1',
      openingCash: 5000,
    }

    it('應該驗證有效的開班資料', () => {
      const result = openSessionSchema.safeParse(validOpenSessionData)
      expect(result.success).toBe(true)
    })

    it('應該拒絕空白店舖 ID', () => {
      const invalidData = { ...validOpenSessionData, storeId: '' }

      const result = openSessionSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        const errors = result.error.flatten().fieldErrors
        expect(errors.storeId).toBeDefined()
      }
    })

    it('應該拒絕負數的開班金額', () => {
      const invalidData = { ...validOpenSessionData, openingCash: -100 }

      const result = openSessionSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('邊界值測試：接受開班金額為 0', () => {
      const validData = { ...validOpenSessionData, openingCash: 0 }

      const result = openSessionSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })

  describe('closeSessionSchema', () => {
    const validCloseSessionData = {
      closingCash: 10000,
      notes: '今日正常營業',
    }

    it('應該驗證有效的關班資料', () => {
      const result = closeSessionSchema.safeParse(validCloseSessionData)
      expect(result.success).toBe(true)
    })

    it('應該拒絕負數的關班金額', () => {
      const invalidData = { ...validCloseSessionData, closingCash: -100 }

      const result = closeSessionSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該允許不提供備註', () => {
      const validData = { closingCash: 10000 }

      const result = closeSessionSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('邊界值測試：接受關班金額為 0', () => {
      const validData = { ...validCloseSessionData, closingCash: 0 }

      const result = closeSessionSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })
})

// ===================================
// Price Rules Validations Tests
// ===================================

describe('Price Rules Validations', () => {
  describe('createPriceRuleSchema', () => {
    const validPriceRuleData = {
      productId: 'product-1',
      ruleType: 'QUANTITY' as const,
      minQuantity: 10,
      memberLevelId: 'level-1',
      price: 100,
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      isActive: true,
    }

    it('應該驗證有效的價格規則資料', () => {
      const result = createPriceRuleSchema.safeParse(validPriceRuleData)
      expect(result.success).toBe(true)
    })

    it('應該拒絕空白商品 ID', () => {
      const invalidData = { ...validPriceRuleData, productId: '' }

      const result = createPriceRuleSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        const errors = result.error.flatten().fieldErrors
        expect(errors.productId).toBeDefined()
      }
    })

    it('應該接受所有有效的規則類型', () => {
      const types = ['QUANTITY', 'MEMBER_LEVEL', 'PROMOTION'] as const
      types.forEach((ruleType) => {
        const validData = { ...validPriceRuleData, ruleType }
        const result = createPriceRuleSchema.safeParse(validData)
        expect(result.success).toBe(true)
      })
    })

    it('應該拒絕無效的規則類型', () => {
      const invalidData = { ...validPriceRuleData, ruleType: 'INVALID' }

      const result = createPriceRuleSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕負數的價格', () => {
      const invalidData = { ...validPriceRuleData, price: -100 }

      const result = createPriceRuleSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕小於 1 的最小數量', () => {
      const invalidData = { ...validPriceRuleData, minQuantity: 0 }

      const result = createPriceRuleSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕非整數的最小數量', () => {
      const invalidData = { ...validPriceRuleData, minQuantity: 5.5 }

      const result = createPriceRuleSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該允許 null 的最小數量', () => {
      const validData = { ...validPriceRuleData, minQuantity: null }

      const result = createPriceRuleSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('應該允許 null 的會員等級 ID', () => {
      const validData = { ...validPriceRuleData, memberLevelId: null }

      const result = createPriceRuleSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('應該允許 null 的開始日期', () => {
      const validData = { ...validPriceRuleData, startDate: null }

      const result = createPriceRuleSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('應該允許 null 的結束日期', () => {
      const validData = { ...validPriceRuleData, endDate: null }

      const result = createPriceRuleSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('邊界值測試：接受價格為 0', () => {
      const validData = { ...validPriceRuleData, price: 0 }

      const result = createPriceRuleSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('邊界值測試：接受最小數量為 1', () => {
      const validData = { ...validPriceRuleData, minQuantity: 1 }

      const result = createPriceRuleSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })

  describe('updatePriceRuleSchema', () => {
    it('應該驗證有效的更新資料（不含 productId）', () => {
      const validData = {
        ruleType: 'MEMBER_LEVEL' as const,
        price: 80,
        isActive: false,
      }

      const result = updatePriceRuleSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('應該拒絕負數的價格', () => {
      const invalidData = {
        ruleType: 'QUANTITY' as const,
        price: -50,
        isActive: true,
      }

      const result = updatePriceRuleSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })
})

// ===================================
// Product Bundles Validations Tests
// ===================================

describe('Product Bundles Validations', () => {
  describe('createProductBundleSchema', () => {
    const validProductBundleData = {
      code: 'BUNDLE-001',
      name: '超值套餐',
      description: '含主餐、飲料、甜點',
      bundlePrice: 299,
      isActive: true,
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      items: [
        { productId: 'product-1', quantity: 1 },
        { productId: 'product-2', quantity: 2 },
      ],
    }

    it('應該驗證有效的商品組合資料', () => {
      const result = createProductBundleSchema.safeParse(validProductBundleData)
      expect(result.success).toBe(true)
    })

    it('應該拒絕空白組合代碼', () => {
      const invalidData = { ...validProductBundleData, code: '' }

      const result = createProductBundleSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        const errors = result.error.flatten().fieldErrors
        expect(errors.code).toBeDefined()
      }
    })

    it('應該拒絕超過 30 字元的組合代碼', () => {
      const invalidData = { ...validProductBundleData, code: 'A'.repeat(31) }

      const result = createProductBundleSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕包含特殊字元的組合代碼（除了底線和連字號）', () => {
      const invalidData = { ...validProductBundleData, code: 'BUNDLE@001' }

      const result = createProductBundleSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該接受包含底線的組合代碼', () => {
      const validData = { ...validProductBundleData, code: 'BUNDLE_001' }

      const result = createProductBundleSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('應該接受包含小寫字母的組合代碼', () => {
      const validData = { ...validProductBundleData, code: 'bundle-001' }

      const result = createProductBundleSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('應該拒絕空白組合名稱', () => {
      const invalidData = { ...validProductBundleData, name: '' }

      const result = createProductBundleSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕超過 100 字元的組合名稱', () => {
      const invalidData = { ...validProductBundleData, name: '套'.repeat(101) }

      const result = createProductBundleSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕超過 500 字元的描述', () => {
      const invalidData = { ...validProductBundleData, description: '描'.repeat(501) }

      const result = createProductBundleSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該允許 null 的描述', () => {
      const validData = { ...validProductBundleData, description: null }

      const result = createProductBundleSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('應該拒絕負數的組合價格', () => {
      const invalidData = { ...validProductBundleData, bundlePrice: -100 }

      const result = createProductBundleSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕空白的商品項目陣列', () => {
      const invalidData = { ...validProductBundleData, items: [] }

      const result = createProductBundleSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕數量小於 1 的項目', () => {
      const invalidData = {
        ...validProductBundleData,
        items: [{ productId: 'product-1', quantity: 0 }],
      }

      const result = createProductBundleSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕空白的商品 ID', () => {
      const invalidData = {
        ...validProductBundleData,
        items: [{ productId: '', quantity: 1 }],
      }

      const result = createProductBundleSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該允許 null 的開始日期', () => {
      const validData = { ...validProductBundleData, startDate: null }

      const result = createProductBundleSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('應該允許 null 的結束日期', () => {
      const validData = { ...validProductBundleData, endDate: null }

      const result = createProductBundleSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('邊界值測試：接受剛好 30 字元的組合代碼', () => {
      const validData = { ...validProductBundleData, code: 'A'.repeat(30) }

      const result = createProductBundleSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('邊界值測試：接受組合價格為 0', () => {
      const validData = { ...validProductBundleData, bundlePrice: 0 }

      const result = createProductBundleSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('邊界值測試：接受數量為 1 的項目', () => {
      const validData = {
        ...validProductBundleData,
        items: [{ productId: 'product-1', quantity: 1 }],
      }

      const result = createProductBundleSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })

  describe('updateProductBundleSchema', () => {
    it('應該驗證有效的更新資料（不含 code）', () => {
      const validData = {
        name: '更新的套餐名稱',
        bundlePrice: 399,
        isActive: false,
        items: [{ productId: 'product-1', quantity: 2 }],
      }

      const result = updateProductBundleSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('應該拒絕空白組合名稱', () => {
      const invalidData = {
        name: '',
        bundlePrice: 399,
        isActive: true,
        items: [{ productId: 'product-1', quantity: 1 }],
      }

      const result = updateProductBundleSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })
})

// ===================================
// Refunds Validations Tests
// ===================================

describe('Refunds Validations', () => {
  describe('createRefundSchema', () => {
    const validRefundData = {
      orderId: 'order-1',
      reason: '商品瑕疵',
      type: 'REFUND' as const,
      items: [
        {
          productId: 'product-1',
          quantity: 1,
          unitPrice: 100,
          reason: '顏色不符',
        },
      ],
      notes: '客戶來店退貨',
    }

    it('應該驗證有效的退換貨資料', () => {
      const result = createRefundSchema.safeParse(validRefundData)
      expect(result.success).toBe(true)
    })

    it('應該拒絕空白訂單 ID', () => {
      const invalidData = { ...validRefundData, orderId: '' }

      const result = createRefundSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        const errors = result.error.flatten().fieldErrors
        expect(errors.orderId).toBeDefined()
      }
    })

    it('應該拒絕空白退換貨原因', () => {
      const invalidData = { ...validRefundData, reason: '' }

      const result = createRefundSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        const errors = result.error.flatten().fieldErrors
        expect(errors.reason).toBeDefined()
      }
    })

    it('應該接受所有有效的退換貨類型', () => {
      const types = ['REFUND', 'EXCHANGE'] as const
      types.forEach((type) => {
        const validData = { ...validRefundData, type }
        const result = createRefundSchema.safeParse(validData)
        expect(result.success).toBe(true)
      })
    })

    it('應該拒絕無效的退換貨類型', () => {
      const invalidData = { ...validRefundData, type: 'INVALID' }

      const result = createRefundSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕空白的商品項目陣列', () => {
      const invalidData = { ...validRefundData, items: [] }

      const result = createRefundSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕空白的商品 ID', () => {
      const invalidData = {
        ...validRefundData,
        items: [{ productId: '', quantity: 1, unitPrice: 100 }],
      }

      const result = createRefundSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕非正整數的數量', () => {
      const invalidData = {
        ...validRefundData,
        items: [{ productId: 'product-1', quantity: 0, unitPrice: 100 }],
      }

      const result = createRefundSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕非整數的數量', () => {
      const invalidData = {
        ...validRefundData,
        items: [{ productId: 'product-1', quantity: 1.5, unitPrice: 100 }],
      }

      const result = createRefundSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕負數的單價', () => {
      const invalidData = {
        ...validRefundData,
        items: [{ productId: 'product-1', quantity: 1, unitPrice: -100 }],
      }

      const result = createRefundSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該允許不提供商品項目原因', () => {
      const validData = {
        ...validRefundData,
        items: [{ productId: 'product-1', quantity: 1, unitPrice: 100 }],
      }

      const result = createRefundSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('應該允許不提供備註', () => {
      const validData = { ...validRefundData, notes: undefined }

      const result = createRefundSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('邊界值測試：接受數量為 1', () => {
      const validData = {
        ...validRefundData,
        items: [{ productId: 'product-1', quantity: 1, unitPrice: 100 }],
      }

      const result = createRefundSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('邊界值測試：接受單價為 0', () => {
      const validData = {
        ...validRefundData,
        items: [{ productId: 'product-1', quantity: 1, unitPrice: 0 }],
      }

      const result = createRefundSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })

  describe('approveRefundSchema', () => {
    it('應該驗證有效的審核資料', () => {
      const validData = {
        approvalStatus: 'APPROVED' as const,
        notes: '同意退貨',
      }

      const result = approveRefundSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('應該接受所有有效的審核狀態', () => {
      const statuses = ['APPROVED', 'REJECTED'] as const
      statuses.forEach((approvalStatus) => {
        const validData = { approvalStatus }
        const result = approveRefundSchema.safeParse(validData)
        expect(result.success).toBe(true)
      })
    })

    it('應該拒絕無效的審核狀態', () => {
      const invalidData = { approvalStatus: 'INVALID' }

      const result = approveRefundSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該允許不提供備註', () => {
      const validData = { approvalStatus: 'REJECTED' as const }

      const result = approveRefundSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })
})

// ===================================
// Scheduled Reports Validations Tests
// ===================================

describe('Scheduled Reports Validations', () => {
  describe('createScheduledReportSchema', () => {
    const validScheduledReportData = {
      reportId: 'report-1',
      schedule: '0 9 * * 1',
      recipients: ['user1@example.com', 'user2@example.com'],
      format: 'EXCEL' as const,
      isActive: true,
    }

    it('應該驗證有效的排程報表資料', () => {
      const result = createScheduledReportSchema.safeParse(validScheduledReportData)
      expect(result.success).toBe(true)
    })

    it('應該拒絕空白報表 ID', () => {
      const invalidData = { ...validScheduledReportData, reportId: '' }

      const result = createScheduledReportSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        const errors = result.error.flatten().fieldErrors
        expect(errors.reportId).toBeDefined()
      }
    })

    it('應該拒絕空白排程', () => {
      const invalidData = { ...validScheduledReportData, schedule: '' }

      const result = createScheduledReportSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕無效的 cron 格式', () => {
      const invalidData = { ...validScheduledReportData, schedule: 'invalid cron' }

      const result = createScheduledReportSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該接受有效的 cron 格式', () => {
      const validSchedules = ['0 0 * * *', '30 9 * * 1-5', '0 */2 * * *', '0 0 1 * *', '0 0 1 1 *']
      validSchedules.forEach((schedule) => {
        const validData = { ...validScheduledReportData, schedule }
        const result = createScheduledReportSchema.safeParse(validData)
        expect(result.success).toBe(true)
      })
    })

    it('應該拒絕空白的收件者陣列', () => {
      const invalidData = { ...validScheduledReportData, recipients: [] }

      const result = createScheduledReportSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕無效的 Email 格式', () => {
      const invalidData = {
        ...validScheduledReportData,
        recipients: ['invalid-email'],
      }

      const result = createScheduledReportSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該接受所有有效的格式', () => {
      const formats = ['EXCEL', 'PDF'] as const
      formats.forEach((format) => {
        const validData = { ...validScheduledReportData, format }
        const result = createScheduledReportSchema.safeParse(validData)
        expect(result.success).toBe(true)
      })
    })

    it('應該拒絕無效的格式', () => {
      const invalidData = { ...validScheduledReportData, format: 'CSV' }

      const result = createScheduledReportSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('邊界值測試：接受只有一個收件者', () => {
      const validData = {
        ...validScheduledReportData,
        recipients: ['single@example.com'],
      }

      const result = createScheduledReportSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })

  describe('updateScheduledReportSchema', () => {
    it('應該驗證有效的更新資料（不含 reportId）', () => {
      const validData = {
        schedule: '0 10 * * 1-5',
        recipients: ['updated@example.com'],
        format: 'PDF' as const,
        isActive: false,
      }

      const result = updateScheduledReportSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('應該拒絕無效的 cron 格式', () => {
      const invalidData = {
        schedule: 'not a cron',
        recipients: ['test@example.com'],
        format: 'EXCEL' as const,
        isActive: true,
      }

      const result = updateScheduledReportSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })
})

// ===================================
// System Parameters Validations Tests
// ===================================

describe('System Parameters Validations', () => {
  describe('createSystemParameterSchema', () => {
    const validSystemParameterData = {
      code: 'TAX_RATE',
      name: '稅率',
      value: '0.05',
      dataType: 'NUMBER' as const,
      category: 'TAX' as const,
      description: '銷售稅率設定',
      isEditable: true,
    }

    it('應該驗證有效的系統參數資料', () => {
      const result = createSystemParameterSchema.safeParse(validSystemParameterData)
      expect(result.success).toBe(true)
    })

    it('應該拒絕空白參數代碼', () => {
      const invalidData = { ...validSystemParameterData, code: '' }

      const result = createSystemParameterSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        const errors = result.error.flatten().fieldErrors
        expect(errors.code).toBeDefined()
      }
    })

    it('應該拒絕超過 50 字元的參數代碼', () => {
      const invalidData = { ...validSystemParameterData, code: 'A'.repeat(51) }

      const result = createSystemParameterSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕包含小寫字母的參數代碼', () => {
      const invalidData = { ...validSystemParameterData, code: 'tax_rate' }

      const result = createSystemParameterSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕包含特殊字元的參數代碼（除了底線）', () => {
      const invalidData = { ...validSystemParameterData, code: 'TAX-RATE' }

      const result = createSystemParameterSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕空白參數名稱', () => {
      const invalidData = { ...validSystemParameterData, name: '' }

      const result = createSystemParameterSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕超過 100 字元的參數名稱', () => {
      const invalidData = { ...validSystemParameterData, name: '參'.repeat(101) }

      const result = createSystemParameterSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕空白參數值', () => {
      const invalidData = { ...validSystemParameterData, value: '' }

      const result = createSystemParameterSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該接受所有有效的資料類型', () => {
      const dataTypes = ['STRING', 'NUMBER', 'BOOLEAN', 'JSON'] as const
      dataTypes.forEach((dataType) => {
        const validData = { ...validSystemParameterData, dataType }
        const result = createSystemParameterSchema.safeParse(validData)
        expect(result.success).toBe(true)
      })
    })

    it('應該拒絕無效的資料類型', () => {
      const invalidData = { ...validSystemParameterData, dataType: 'ARRAY' }

      const result = createSystemParameterSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該接受所有有效的分類', () => {
      const categories = ['COMPANY', 'TAX', 'INVENTORY', 'SALES', 'SECURITY'] as const
      categories.forEach((category) => {
        const validData = { ...validSystemParameterData, category }
        const result = createSystemParameterSchema.safeParse(validData)
        expect(result.success).toBe(true)
      })
    })

    it('應該拒絕無效的分類', () => {
      const invalidData = { ...validSystemParameterData, category: 'OTHER' }

      const result = createSystemParameterSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕超過 500 字元的描述', () => {
      const invalidData = { ...validSystemParameterData, description: '描'.repeat(501) }

      const result = createSystemParameterSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該允許 null 的描述', () => {
      const validData = { ...validSystemParameterData, description: null }

      const result = createSystemParameterSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('邊界值測試：接受剛好 50 字元的參數代碼', () => {
      const validData = { ...validSystemParameterData, code: 'A'.repeat(50) }

      const result = createSystemParameterSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('邊界值測試：接受剛好 100 字元的參數名稱', () => {
      const validData = { ...validSystemParameterData, name: '參'.repeat(100) }

      const result = createSystemParameterSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('邊界值測試：接受剛好 500 字元的描述', () => {
      const validData = { ...validSystemParameterData, description: '描'.repeat(500) }

      const result = createSystemParameterSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })

  describe('updateSystemParameterSchema', () => {
    it('應該驗證有效的更新資料（不含 code）', () => {
      const validData = {
        name: '更新的參數名稱',
        value: '0.1',
        dataType: 'NUMBER' as const,
        category: 'TAX' as const,
        isEditable: false,
      }

      const result = updateSystemParameterSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('應該拒絕空白參數名稱', () => {
      const invalidData = {
        name: '',
        value: 'test',
        dataType: 'STRING' as const,
        category: 'COMPANY' as const,
        isEditable: true,
      }

      const result = updateSystemParameterSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕空白參數值', () => {
      const invalidData = {
        name: '測試參數',
        value: '',
        dataType: 'STRING' as const,
        category: 'COMPANY' as const,
        isEditable: true,
      }

      const result = updateSystemParameterSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })
})
