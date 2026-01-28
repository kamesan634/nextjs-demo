import prisma from '@/lib/prisma'

/**
 * 編號產生工具
 * 用於產生各種單據編號 (訂單、採購單、退貨單等)
 */

/**
 * 產生下一個編號
 * @param ruleCode 規則代碼 (例: ORDER, PO, REFUND)
 * @returns 產生的編號
 */
export async function generateNextNumber(ruleCode: string): Promise<string> {
  // 使用交易確保序號產生的原子性
  return prisma.$transaction(async (tx) => {
    const rule = await tx.numberingRule.findUnique({
      where: { code: ruleCode },
    })

    if (!rule) {
      throw new Error(`編號規則 ${ruleCode} 不存在`)
    }

    if (!rule.isActive) {
      throw new Error(`編號規則 ${ruleCode} 已停用`)
    }

    // 檢查是否需要重設序號
    const shouldReset = checkShouldReset(rule)

    let nextSequence: number
    if (shouldReset) {
      nextSequence = 1
    } else {
      nextSequence = rule.currentSequence + 1
    }

    // 更新規則的序號
    await tx.numberingRule.update({
      where: { id: rule.id },
      data: {
        currentSequence: nextSequence,
        lastResetAt: shouldReset ? new Date() : rule.lastResetAt,
      },
    })

    // 組合編號
    return buildNumber(rule.prefix, rule.dateFormat, nextSequence, rule.sequenceLength)
  })
}

/**
 * 預覽下一個編號 (不會實際遞增序號)
 * @param ruleCode 規則代碼
 * @returns 預覽的編號
 */
export async function previewNextNumber(ruleCode: string): Promise<string> {
  const rule = await prisma.numberingRule.findUnique({
    where: { code: ruleCode },
  })

  if (!rule) {
    throw new Error(`編號規則 ${ruleCode} 不存在`)
  }

  const shouldReset = checkShouldReset(rule)
  const nextSequence = shouldReset ? 1 : rule.currentSequence + 1

  return buildNumber(rule.prefix, rule.dateFormat, nextSequence, rule.sequenceLength)
}

/**
 * 檢查是否需要重設序號
 */
function checkShouldReset(rule: { resetPeriod: string | null; lastResetAt: Date | null }): boolean {
  if (!rule.resetPeriod || rule.resetPeriod === 'NEVER') {
    return false
  }

  const now = new Date()
  const lastReset = rule.lastResetAt || new Date(0)

  switch (rule.resetPeriod) {
    case 'DAILY':
      return !isSameDay(now, lastReset)
    case 'MONTHLY':
      return !isSameMonth(now, lastReset)
    case 'YEARLY':
      return !isSameYear(now, lastReset)
    default:
      return false
  }
}

/**
 * 組合編號
 */
function buildNumber(
  prefix: string,
  dateFormat: string | null,
  sequence: number,
  sequenceLength: number
): string {
  const parts: string[] = [prefix]

  // 加入日期部分
  if (dateFormat) {
    const now = new Date()
    parts.push(formatDate(now, dateFormat))
  }

  // 加入序號部分
  parts.push(sequence.toString().padStart(sequenceLength, '0'))

  return parts.join('')
}

/**
 * 格式化日期
 */
function formatDate(date: Date, format: string): string {
  const year = date.getFullYear().toString()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')

  switch (format) {
    case 'YYYYMMDD':
      return `${year}${month}${day}`
    case 'YYYYMM':
      return `${year}${month}`
    case 'YYYY':
      return year
    default:
      return ''
  }
}

/**
 * 判斷是否同一天
 */
function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  )
}

/**
 * 判斷是否同一月
 */
function isSameMonth(d1: Date, d2: Date): boolean {
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth()
}

/**
 * 判斷是否同一年
 */
function isSameYear(d1: Date, d2: Date): boolean {
  return d1.getFullYear() === d2.getFullYear()
}

/**
 * 常用編號規則代碼
 */
export const NumberingRuleCodes = {
  ORDER: 'ORDER', // 銷售訂單
  PURCHASE_ORDER: 'PO', // 採購單
  REFUND: 'REFUND', // 退貨單
  GOODS_RECEIPT: 'GR', // 入庫單
  GOODS_ISSUE: 'GI', // 出庫單
  STOCK_COUNT: 'SC', // 盤點單
  STOCK_TRANSFER: 'ST', // 調撥單
  STOCK_ADJUSTMENT: 'SA', // 庫存調整單
  INVOICE: 'INV', // 發票
  HOLD_ORDER: 'HOLD', // 掛單
  POS_SESSION: 'POS', // POS 會話
  CASHIER_SHIFT: 'SHIFT', // 收銀班別
  CUSTOMER: 'CUST', // 客戶編號
} as const
