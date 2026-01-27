import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * 合併 Tailwind CSS 類名
 * 處理類名衝突和條件類名
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 格式化金額
 * @param amount 金額數值
 * @param currency 貨幣代碼 (預設: TWD)
 * @returns 格式化後的金額字串
 */
export function formatCurrency(amount: number | string, currency = 'TWD'): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num)
}

/**
 * 格式化日期
 * @param date 日期
 * @param options 格式化選項
 * @returns 格式化後的日期字串
 */
export function formatDate(
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }
): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('zh-TW', options).format(d)
}

/**
 * 格式化日期時間
 * @param date 日期時間
 * @returns 格式化後的日期時間字串
 */
export function formatDateTime(date: Date | string): string {
  return formatDate(date, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * 產生唯一識別碼
 * @param prefix 前綴
 * @returns 唯一識別碼
 */
export function generateId(prefix = ''): string {
  const timestamp = Date.now().toString(36)
  const randomStr = Math.random().toString(36).substring(2, 8)
  return prefix ? `${prefix}-${timestamp}${randomStr}` : `${timestamp}${randomStr}`
}

/**
 * 產生單據編號
 * @param prefix 前綴 (例: ORD, PO, INV)
 * @returns 單據編號
 */
export function generateDocumentNo(prefix: string): string {
  const now = new Date()
  const year = now.getFullYear().toString().slice(-2)
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  const day = now.getDate().toString().padStart(2, '0')
  const time = now.getTime().toString().slice(-6)
  return `${prefix}${year}${month}${day}${time}`
}

/**
 * 延遲函數
 * @param ms 延遲毫秒數
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * 安全解析 JSON
 * @param str JSON 字串
 * @param fallback 預設值
 * @returns 解析後的物件或預設值
 */
export function safeJsonParse<T>(str: string, fallback: T): T {
  try {
    return JSON.parse(str) as T
  } catch {
    return fallback
  }
}

/**
 * 計算分頁資訊
 * @param total 總筆數
 * @param page 目前頁碼
 * @param pageSize 每頁筆數
 */
export function calculatePagination(total: number, page: number, pageSize: number) {
  const totalPages = Math.ceil(total / pageSize)
  const hasNextPage = page < totalPages
  const hasPrevPage = page > 1

  return {
    total,
    page,
    pageSize,
    totalPages,
    hasNextPage,
    hasPrevPage,
  }
}
