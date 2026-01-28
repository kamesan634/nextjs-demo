/**
 * Cron 工具函數 (純客戶端使用)
 */

/**
 * 計算下次執行時間
 */
export function calculateNextRunAt(cronExpression: string): Date {
  const parts = cronExpression.split(' ')
  const now = new Date()
  const next = new Date(now)

  // 簡化的 cron 解析: minute hour dayOfMonth month dayOfWeek
  const minute = parts[0] === '*' ? 0 : parseInt(parts[0])
  const hour = parts[1] === '*' ? 0 : parseInt(parts[1])
  const dayOfMonth = parts[2]
  const dayOfWeek = parts[4]

  next.setHours(hour, minute, 0, 0)

  // 如果時間已過，移到下一個執行週期
  if (next <= now) {
    if (dayOfMonth !== '*') {
      // 每月特定日期
      next.setMonth(next.getMonth() + 1)
      next.setDate(parseInt(dayOfMonth))
    } else if (dayOfWeek !== '*') {
      // 每週特定星期
      const targetDay = parseInt(dayOfWeek)
      const currentDay = next.getDay()
      const daysUntilTarget = (targetDay - currentDay + 7) % 7 || 7
      next.setDate(next.getDate() + daysUntilTarget)
    } else {
      // 每天
      next.setDate(next.getDate() + 1)
    }
  }

  return next
}

/**
 * 解析 cron 表達式為可讀字串
 */
export function parseCronToReadable(cronExpression: string): string {
  const parts = cronExpression.split(' ')
  if (parts.length !== 5) return cronExpression

  const [minute, hour, dayOfMonth, , dayOfWeek] = parts

  const hourStr = hour === '*' ? '' : `${hour}:${minute.padStart(2, '0')}`

  if (dayOfMonth !== '*') {
    return `每月 ${dayOfMonth} 日 ${hourStr}`
  }

  if (dayOfWeek !== '*') {
    const days = ['日', '一', '二', '三', '四', '五', '六']
    return `每週${days[parseInt(dayOfWeek)]} ${hourStr}`
  }

  if (hour !== '*') {
    return `每天 ${hourStr}`
  }

  return `每小時 ${minute} 分`
}

/**
 * 產生常用 cron 表達式
 */
export const commonCronExpressions = [
  { label: '每天早上 8 點', value: '0 8 * * *' },
  { label: '每天下午 6 點', value: '0 18 * * *' },
  { label: '每週一早上 9 點', value: '0 9 * * 1' },
  { label: '每週五下午 5 點', value: '0 17 * * 5' },
  { label: '每月 1 日早上 8 點', value: '0 8 1 * *' },
  { label: '每月 15 日早上 8 點', value: '0 8 15 * *' },
]
