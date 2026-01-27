/**
 * 權限相關常量定義
 */

/**
 * 權限模組清單
 */
export const permissionModules = [
  { code: 'dashboard', name: '儀表板' },
  { code: 'products', name: '商品管理' },
  { code: 'categories', name: '分類管理' },
  { code: 'customers', name: '客戶管理' },
  { code: 'suppliers', name: '供應商管理' },
  { code: 'inventory', name: '庫存管理' },
  { code: 'orders', name: '訂單管理' },
  { code: 'purchase-orders', name: '採購管理' },
  { code: 'reports', name: '報表中心' },
  { code: 'promotions', name: '促銷管理' },
  { code: 'settings', name: '系統設定' },
] as const

/**
 * 權限操作清單
 */
export const permissionActions = [
  { code: 'create', name: '新增' },
  { code: 'read', name: '讀取' },
  { code: 'update', name: '修改' },
  { code: 'delete', name: '刪除' },
] as const
