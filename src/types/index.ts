/**
 * 龜三的ERP Demo - 類型定義
 * 零售業簡易 ERP 系統
 */

// ===================================
// 認證相關類型
// ===================================

/**
 * 角色代碼枚舉
 */
export type RoleCode = 'ADMIN' | 'MANAGER' | 'CASHIER' | 'WAREHOUSE' | 'PURCHASER' | 'VIEWER'

/**
 * 模組代碼枚舉
 */
export type ModuleCode =
  | 'dashboard'
  | 'products'
  | 'categories'
  | 'customers'
  | 'suppliers'
  | 'inventory'
  | 'orders'
  | 'purchase-orders'
  | 'reports'
  | 'promotions'
  | 'settings'

/**
 * 操作類型枚舉
 */
export type ActionType = 'create' | 'read' | 'update' | 'delete'

/**
 * 使用者 Session 類型 (NextAuth 擴展)
 */
export interface UserSession {
  id: string
  username: string
  email: string
  name: string
  avatar?: string | null
  role: {
    id: string
    code: RoleCode
    name: string
  }
  store?: {
    id: string
    code: string
    name: string
  } | null
}

// ===================================
// API 回應類型
// ===================================

/**
 * API 回應基礎類型
 */
export interface ApiResponse<T = unknown> {
  success: boolean
  message?: string
  data?: T
  error?: string
}

/**
 * 分頁資訊類型
 */
export interface PaginationInfo {
  total: number
  page: number
  pageSize: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

/**
 * 分頁回應類型
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: PaginationInfo
}

// ===================================
// 表單狀態類型
// ===================================

/**
 * Server Action 回應類型
 */
export interface ActionResult<T = unknown> {
  success: boolean
  message?: string
  data?: T
  errors?: Record<string, string[]>
}

// ===================================
// 共用類型
// ===================================

/**
 * 排序方向
 */
export type SortDirection = 'asc' | 'desc'

/**
 * 排序選項
 */
export interface SortOption {
  field: string
  direction: SortDirection
}

/**
 * 篩選條件
 */
export interface FilterOption {
  field: string
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'startsWith' | 'endsWith'
  value: string | number | boolean
}

/**
 * 查詢參數
 */
export interface QueryParams {
  page?: number
  pageSize?: number
  search?: string
  sort?: SortOption
  filters?: FilterOption[]
}

// ===================================
// 狀態枚舉類型
// ===================================

/**
 * 訂單狀態
 */
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'

/**
 * 付款狀態
 */
export type PaymentStatus = 'UNPAID' | 'PARTIAL' | 'PAID'

/**
 * 採購單狀態
 */
export type PurchaseOrderStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'APPROVED'
  | 'ORDERED'
  | 'PARTIAL'
  | 'COMPLETED'
  | 'CANCELLED'

/**
 * 庫存異動類型
 */
export type InventoryMovementType = 'IN' | 'OUT' | 'ADJUST' | 'TRANSFER'

/**
 * 入庫類型
 */
export type GoodsReceiptType = 'PURCHASE' | 'RETURN' | 'OTHER'

/**
 * 出庫類型
 */
export type GoodsIssueType = 'SALES' | 'DAMAGE' | 'OTHER'

/**
 * 盤點類型
 */
export type StockCountType = 'FULL' | 'CYCLE' | 'SPOT'

/**
 * 促銷類型
 */
export type PromotionType = 'DISCOUNT' | 'BUNDLE' | 'GIFT' | 'POINTS'

/**
 * 折扣類型
 */
export type DiscountType = 'PERCENTAGE' | 'AMOUNT'

/**
 * 點數紀錄類型
 */
export type PointsLogType = 'EARN' | 'REDEEM' | 'EXPIRE' | 'ADJUST'

/**
 * 操作日誌類型
 */
export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE'

// ===================================
// 選項類型 (用於下拉選單)
// ===================================

/**
 * 選項類型
 */
export interface SelectOption {
  label: string
  value: string
}

/**
 * 分組選項類型
 */
export interface GroupedSelectOption {
  label: string
  options: SelectOption[]
}

// ===================================
// 表格類型
// ===================================

/**
 * 欄位定義類型
 */
export interface ColumnDef<T> {
  id: string
  header: string
  accessorKey?: keyof T
  cell?: (row: T) => React.ReactNode
  sortable?: boolean
  className?: string
}

// ===================================
// 側邊欄導航類型
// ===================================

/**
 * 導航項目類型
 */
export interface NavItem {
  title: string
  href: string
  icon?: React.ComponentType<{ className?: string }>
  badge?: string | number
  disabled?: boolean
  children?: NavItem[]
  permissions?: {
    module: ModuleCode
    action: ActionType
  }[]
}

/**
 * 導航群組類型
 */
export interface NavGroup {
  title: string
  items: NavItem[]
}
