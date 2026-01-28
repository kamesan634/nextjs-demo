/**
 * RFM 分析工具
 * R (Recency): 最近一次消費距今天數
 * F (Frequency): 消費次數
 * M (Monetary): 消費金額
 */

export interface CustomerRFMData {
  customerId: string
  customerName: string
  lastPurchaseDate: Date | null
  purchaseCount: number
  totalAmount: number
}

export interface CustomerRFMScore extends CustomerRFMData {
  recencyScore: number
  frequencyScore: number
  monetaryScore: number
  segment: string
}

/**
 * 計算 RFM 分數 (1-5 分，5 分最好)
 */
export function calculateRFM(customers: CustomerRFMData[]): CustomerRFMScore[] {
  const now = new Date()

  // 計算每個客戶的原始數據
  const customersWithMetrics = customers.map((customer) => {
    const recencyDays = customer.lastPurchaseDate
      ? Math.floor((now.getTime() - customer.lastPurchaseDate.getTime()) / (1000 * 60 * 60 * 24))
      : 999999

    return {
      ...customer,
      recencyDays,
      frequency: customer.purchaseCount,
      monetary: customer.totalAmount,
    }
  })

  // 計算分位數用於評分
  const recencyValues = customersWithMetrics.map((c) => c.recencyDays).sort((a, b) => a - b)
  const frequencyValues = customersWithMetrics.map((c) => c.frequency).sort((a, b) => a - b)
  const monetaryValues = customersWithMetrics.map((c) => c.monetary).sort((a, b) => a - b)

  const getScore = (value: number, values: number[], reverse = false) => {
    const len = values.length
    if (len === 0) return 3

    // 特殊處理：極端值（如 null 日期轉換的 999999）
    if (reverse && value >= 999999) return 1

    // 單一值情況：返回中間分數
    if (len === 1) return 3

    const percentile = values.filter((v) => v < value).length / len

    if (reverse) {
      // Recency: 天數越小越好，所以分位數低（值小於大部分）應該得高分
      if (percentile <= 0.2) return 5
      if (percentile <= 0.4) return 4
      if (percentile <= 0.6) return 3
      if (percentile <= 0.8) return 2
      return 1
    } else {
      // Frequency & Monetary: 數值越大越好
      if (percentile >= 0.8) return 5
      if (percentile >= 0.6) return 4
      if (percentile >= 0.4) return 3
      if (percentile >= 0.2) return 2
      return 1
    }
  }

  // 計算分數和分群
  return customersWithMetrics.map((customer) => {
    const recencyScore = getScore(customer.recencyDays, recencyValues, true)
    const frequencyScore = getScore(customer.frequency, frequencyValues)
    const monetaryScore = getScore(customer.monetary, monetaryValues)

    return {
      customerId: customer.customerId,
      customerName: customer.customerName,
      lastPurchaseDate: customer.lastPurchaseDate,
      purchaseCount: customer.purchaseCount,
      totalAmount: customer.totalAmount,
      recencyScore,
      frequencyScore,
      monetaryScore,
      segment: getRFMSegment(recencyScore, frequencyScore, monetaryScore),
    }
  })
}

/**
 * 根據 RFM 分數決定客戶分群
 */
export function getRFMSegment(r: number, f: number, m: number): string {
  // Champions: 高 R, 高 F, 高 M
  if (r >= 4 && f >= 4 && m >= 4) return 'Champions'

  // Loyal: 高 F, 高 M (無論 R，只要 f >= 4 && m >= 4)
  if (f >= 4 && m >= 4) return 'Loyal'

  // Promising: 高 R, 低 F
  if (r >= 4 && f <= 2) return 'Promising'

  // At Risk: 低 R, 中高 F, 中高 M (f/m 是 3，不是 4+)
  if (r <= 2 && f >= 3 && m >= 3) return 'At Risk'

  // Lost: 極低 R (優先於 Hibernating)
  if (r === 1) return 'Lost'

  // Hibernating: 低 R, 低 F
  if (r <= 2 && f <= 2) return 'Hibernating'

  // Potential: 中等分數
  if (r >= 3 && f >= 2 && m >= 2) return 'Potential'

  return 'Needs Attention'
}

/**
 * 取得分群的中文名稱和說明
 */
export const segmentInfo: Record<string, { label: string; description: string; color: string }> = {
  Champions: {
    label: '頂級客戶',
    description: '最近購買、購買頻繁、消費金額高',
    color: 'text-green-600',
  },
  Loyal: {
    label: '忠誠客戶',
    description: '購買頻繁、消費金額高',
    color: 'text-blue-600',
  },
  Promising: {
    label: '潛力客戶',
    description: '最近購買但次數少',
    color: 'text-purple-600',
  },
  Potential: {
    label: '有潛力客戶',
    description: '中等表現客戶',
    color: 'text-indigo-600',
  },
  'At Risk': {
    label: '流失風險',
    description: '曾是好客戶但很久沒來',
    color: 'text-orange-600',
  },
  Hibernating: {
    label: '休眠客戶',
    description: '很久沒購買且次數少',
    color: 'text-gray-600',
  },
  Lost: {
    label: '已流失客戶',
    description: '極久未購買',
    color: 'text-red-600',
  },
  'Needs Attention': {
    label: '需要關注',
    description: '表現一般需要提升',
    color: 'text-yellow-600',
  },
}
