/**
 * 權限相關常量單元測試
 * 測試 src/lib/permissions.ts 中的權限定義
 */

import { describe, it, expect } from 'vitest'
import { permissionModules, permissionActions } from '@/lib/permissions'

describe('permissionModules (權限模組清單)', () => {
  it('應該包含所有預期的權限模組', () => {
    const moduleCodes = permissionModules.map((m) => m.code)

    expect(moduleCodes).toContain('dashboard')
    expect(moduleCodes).toContain('products')
    expect(moduleCodes).toContain('categories')
    expect(moduleCodes).toContain('customers')
    expect(moduleCodes).toContain('suppliers')
    expect(moduleCodes).toContain('inventory')
    expect(moduleCodes).toContain('orders')
    expect(moduleCodes).toContain('purchase-orders')
    expect(moduleCodes).toContain('reports')
    expect(moduleCodes).toContain('promotions')
    expect(moduleCodes).toContain('settings')
  })

  it('應該有 11 個權限模組', () => {
    expect(permissionModules.length).toBe(11)
  })

  it('每個模組應該有 code 和 name 屬性', () => {
    for (const mod of permissionModules) {
      expect(module).toHaveProperty('code')
      expect(module).toHaveProperty('name')
      expect(typeof mod.code).toBe('string')
      expect(typeof mod.name).toBe('string')
      expect(mod.code.length).toBeGreaterThan(0)
      expect(mod.name.length).toBeGreaterThan(0)
    }
  })

  it('每個模組的 code 應該是唯一的', () => {
    const codes = permissionModules.map((m) => m.code)
    const uniqueCodes = new Set(codes)
    expect(uniqueCodes.size).toBe(codes.length)
  })

  it('每個模組的 name 應該是中文', () => {
    for (const mod of permissionModules) {
      // 檢查名稱是否包含中文字元
      expect(mod.name).toMatch(/[\u4e00-\u9fff]/)
    }
  })

  it('應該包含正確的模組名稱對應', () => {
    const moduleMap = new Map(permissionModules.map((m) => [m.code, m.name]))

    expect(moduleMap.get('dashboard')).toBe('儀表板')
    expect(moduleMap.get('products')).toBe('商品管理')
    expect(moduleMap.get('categories')).toBe('分類管理')
    expect(moduleMap.get('customers')).toBe('客戶管理')
    expect(moduleMap.get('suppliers')).toBe('供應商管理')
    expect(moduleMap.get('inventory')).toBe('庫存管理')
    expect(moduleMap.get('orders')).toBe('訂單管理')
    expect(moduleMap.get('purchase-orders')).toBe('採購管理')
    expect(moduleMap.get('reports')).toBe('報表中心')
    expect(moduleMap.get('promotions')).toBe('促銷管理')
    expect(moduleMap.get('settings')).toBe('系統設定')
  })

  it('應該是唯讀陣列 (as const)', () => {
    // 確認 permissionModules 是 readonly
    // TypeScript 會在編譯時檢查，這裡用運行時檢查確認結構
    expect(Array.isArray(permissionModules)).toBe(true)

    // 模組物件應該有固定的結構
    const firstModule = permissionModules[0]
    expect(Object.keys(firstModule)).toEqual(['code', 'name'])
  })
})

describe('permissionActions (權限操作清單)', () => {
  it('應該包含所有 CRUD 操作', () => {
    const actionCodes = permissionActions.map((a) => a.code)

    expect(actionCodes).toContain('create')
    expect(actionCodes).toContain('read')
    expect(actionCodes).toContain('update')
    expect(actionCodes).toContain('delete')
  })

  it('應該有 4 個權限操作', () => {
    expect(permissionActions.length).toBe(4)
  })

  it('每個操作應該有 code 和 name 屬性', () => {
    for (const action of permissionActions) {
      expect(action).toHaveProperty('code')
      expect(action).toHaveProperty('name')
      expect(typeof action.code).toBe('string')
      expect(typeof action.name).toBe('string')
      expect(action.code.length).toBeGreaterThan(0)
      expect(action.name.length).toBeGreaterThan(0)
    }
  })

  it('每個操作的 code 應該是唯一的', () => {
    const codes = permissionActions.map((a) => a.code)
    const uniqueCodes = new Set(codes)
    expect(uniqueCodes.size).toBe(codes.length)
  })

  it('每個操作的 name 應該是中文', () => {
    for (const action of permissionActions) {
      // 檢查名稱是否包含中文字元
      expect(action.name).toMatch(/[\u4e00-\u9fff]/)
    }
  })

  it('應該包含正確的操作名稱對應', () => {
    const actionMap = new Map(permissionActions.map((a) => [a.code, a.name]))

    expect(actionMap.get('create')).toBe('新增')
    expect(actionMap.get('read')).toBe('讀取')
    expect(actionMap.get('update')).toBe('修改')
    expect(actionMap.get('delete')).toBe('刪除')
  })

  it('應該是唯讀陣列 (as const)', () => {
    // 確認 permissionActions 是 readonly
    expect(Array.isArray(permissionActions)).toBe(true)

    // 操作物件應該有固定的結構
    const firstAction = permissionActions[0]
    expect(Object.keys(firstAction)).toEqual(['code', 'name'])
  })
})

describe('權限組合測試', () => {
  it('應該能夠產生所有模組與操作的組合', () => {
    const permissionCombinations: string[] = []

    for (const mod of permissionModules) {
      for (const action of permissionActions) {
        permissionCombinations.push(`${mod.code}:${action.code}`)
      }
    }

    // 11 模組 * 4 操作 = 44 種組合
    expect(permissionCombinations.length).toBe(44)
  })

  it('應該能夠透過 code 找到對應的模組', () => {
    const findModule = (code: string) => permissionModules.find((m) => m.code === code)

    expect(findModule('products')?.name).toBe('商品管理')
    expect(findModule('nonexistent')).toBeUndefined()
  })

  it('應該能夠透過 code 找到對應的操作', () => {
    const findAction = (code: string) => permissionActions.find((a) => a.code === code)

    expect(findAction('create')?.name).toBe('新增')
    expect(findAction('nonexistent')).toBeUndefined()
  })

  it('應該能夠建立權限字串格式', () => {
    // 模擬權限字串格式: "module:action"
    const createPermissionString = (moduleCode: string, actionCode: string) => {
      const foundMod = permissionModules.find((m) => m.code === moduleCode)
      const action = permissionActions.find((a) => a.code === actionCode)

      if (!foundMod || !action) return null
      return `${foundMod.code}:${action.code}`
    }

    expect(createPermissionString('products', 'create')).toBe('products:create')
    expect(createPermissionString('orders', 'read')).toBe('orders:read')
    expect(createPermissionString('nonexistent', 'create')).toBeNull()
    expect(createPermissionString('products', 'nonexistent')).toBeNull()
  })

  it('應該能夠建立完整權限描述', () => {
    const getPermissionDescription = (moduleCode: string, actionCode: string) => {
      const foundMod = permissionModules.find((m) => m.code === moduleCode)
      const action = permissionActions.find((a) => a.code === actionCode)

      if (!foundMod || !action) return null
      return `${foundMod.name} - ${action.name}`
    }

    expect(getPermissionDescription('products', 'create')).toBe('商品管理 - 新增')
    expect(getPermissionDescription('orders', 'delete')).toBe('訂單管理 - 刪除')
    expect(getPermissionDescription('inventory', 'update')).toBe('庫存管理 - 修改')
  })
})

describe('邊界條件測試', () => {
  it('permissionModules 應該是非空陣列', () => {
    expect(permissionModules.length).toBeGreaterThan(0)
  })

  it('permissionActions 應該是非空陣列', () => {
    expect(permissionActions.length).toBeGreaterThan(0)
  })

  it('模組 code 不應該包含特殊字元 (除了連字號)', () => {
    for (const mod of permissionModules) {
      // 只允許小寫字母和連字號
      expect(mod.code).toMatch(/^[a-z-]+$/)
    }
  })

  it('操作 code 不應該包含特殊字元', () => {
    for (const action of permissionActions) {
      // 只允許小寫字母
      expect(action.code).toMatch(/^[a-z]+$/)
    }
  })

  it('模組名稱不應該有空白前後綴', () => {
    for (const mod of permissionModules) {
      expect(mod.name.trim()).toBe(mod.name)
    }
  })

  it('操作名稱不應該有空白前後綴', () => {
    for (const action of permissionActions) {
      expect(action.name.trim()).toBe(action.name)
    }
  })

  it('應該能夠安全地遍歷空結果', () => {
    const nonExistentModules = permissionModules.filter((m) => m.code === 'nonexistent')
    expect(nonExistentModules.length).toBe(0)

    // 確認空陣列遍歷不會出錯
    let count = 0
    for (const _module of nonExistentModules) {
      count++
    }
    expect(count).toBe(0)
  })
})

describe('資料完整性測試', () => {
  it('所有模組應該可以被序列化為 JSON', () => {
    const json = JSON.stringify(permissionModules)
    const parsed = JSON.parse(json)

    expect(parsed.length).toBe(permissionModules.length)
    expect(parsed[0].code).toBe(permissionModules[0].code)
    expect(parsed[0].name).toBe(permissionModules[0].name)
  })

  it('所有操作應該可以被序列化為 JSON', () => {
    const json = JSON.stringify(permissionActions)
    const parsed = JSON.parse(json)

    expect(parsed.length).toBe(permissionActions.length)
    expect(parsed[0].code).toBe(permissionActions[0].code)
    expect(parsed[0].name).toBe(permissionActions[0].name)
  })

  it('模組資料應該能用於建立 HTML select options', () => {
    const options = permissionModules.map((m) => ({
      value: m.code,
      label: m.name,
    }))

    expect(options.length).toBe(11)
    expect(options[0]).toHaveProperty('value')
    expect(options[0]).toHaveProperty('label')
  })

  it('操作資料應該能用於建立 HTML select options', () => {
    const options = permissionActions.map((a) => ({
      value: a.code,
      label: a.name,
    }))

    expect(options.length).toBe(4)
    expect(options[0]).toHaveProperty('value')
    expect(options[0]).toHaveProperty('label')
  })
})
