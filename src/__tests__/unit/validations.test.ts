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
