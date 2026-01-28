/**
 * 發票號碼產生與驗證工具
 */

/**
 * 產生發票號碼
 * 格式：民國年+月份 prefix + 英文字母 + 8位數字
 * 例如：11401AB12345678
 * @param prefix - 可選的前綴字母，預設為 'AA'
 * @returns 發票號碼
 */
export function generateInvoiceNo(prefix: string = 'AA'): string {
  const now = new Date()

  // 計算民國年 (西元年 - 1911)
  const rocYear = now.getFullYear() - 1911

  // 取得月份 (補零)
  const month = String(now.getMonth() + 1).padStart(2, '0')

  // 產生8位隨機數字
  const randomDigits = Math.floor(Math.random() * 100000000)
    .toString()
    .padStart(8, '0')

  // 組合發票號碼：民國年(3位) + 月份(2位) + 英文字母(2位) + 數字(8位)
  return `${rocYear}${month}${prefix}${randomDigits}`
}

/**
 * 驗證統一編號格式
 * @param taxId - 統一編號
 * @returns 是否為有效的統一編號格式 (8位數字)
 */
export function validateTaxId(taxId: string): boolean {
  // 檢查是否為8位數字
  const taxIdPattern = /^\d{8}$/

  if (!taxIdPattern.test(taxId)) {
    return false
  }

  // 統一編號驗證邏輯 (使用台灣統編檢查碼演算法)
  const weights = [1, 2, 1, 2, 1, 2, 4, 1]
  let sum = 0

  for (let i = 0; i < 8; i++) {
    let product = parseInt(taxId[i]) * weights[i]

    // 如果乘積為兩位數，將十位數和個位數相加
    if (product >= 10) {
      product = Math.floor(product / 10) + (product % 10)
    }

    sum += product
  }

  // 檢查總和是否為5或10的倍數
  if (sum % 5 === 0) {
    return true
  }

  // 特殊情況：第7位數字為7時，可以容錯
  if (taxId[6] === '7') {
    sum += 1
    return sum % 5 === 0
  }

  return false
}

/**
 * 計算稅額 (5% 營業稅)
 * @param amount - 未稅金額
 * @returns 稅額 (四捨五入到整數)
 */
export function calculateTax(amount: number): number {
  return Math.round(amount * 0.05)
}

/**
 * 計算含稅總額
 * @param amount - 未稅金額
 * @returns 含稅總額
 */
export function calculateTotalWithTax(amount: number): number {
  return amount + calculateTax(amount)
}

/**
 * 從含稅金額反推未稅金額
 * @param totalAmount - 含稅總額
 * @returns 未稅金額 (四捨五入到整數)
 */
export function calculateAmountFromTotal(totalAmount: number): number {
  return Math.round(totalAmount / 1.05)
}
