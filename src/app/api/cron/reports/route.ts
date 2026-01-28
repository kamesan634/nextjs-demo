import { NextResponse } from 'next/server'
import { getDueScheduledReports, updateScheduleAfterRun } from '@/lib/report-scheduler'

/**
 * Cron job 路由 - 執行到期的排程報表
 * 建議使用 Vercel Cron 或外部排程服務定期呼叫此端點
 */
export async function GET(request: Request) {
  try {
    // 驗證 cron 密鑰 (選用，增加安全性)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 取得到期的排程
    const dueSchedules = await getDueScheduledReports()

    if (dueSchedules.length === 0) {
      return NextResponse.json({
        message: 'No scheduled reports due',
        processed: 0,
      })
    }

    const results: { id: string; reportName: string; status: string }[] = []

    for (const schedule of dueSchedules) {
      try {
        // TODO: 執行報表查詢並寄送郵件
        // 這裡僅更新執行時間作為示範
        // 實際實作需要:
        // 1. 執行 CustomReport 的 queryDefinition
        // 2. 將結果匯出為指定格式 (EXCEL/PDF)
        // 3. 透過郵件服務寄送給 recipients

        console.log(`Processing scheduled report: ${schedule.report.name}`)
        console.log(`Recipients: ${JSON.stringify(schedule.recipients)}`)
        console.log(`Format: ${schedule.format}`)

        // 更新執行時間
        await updateScheduleAfterRun(schedule.id)

        results.push({
          id: schedule.id,
          reportName: schedule.report.name,
          status: 'success',
        })
      } catch (error) {
        console.error(`Failed to process schedule ${schedule.id}:`, error)
        results.push({
          id: schedule.id,
          reportName: schedule.report.name,
          status: 'failed',
        })
      }
    }

    return NextResponse.json({
      message: 'Scheduled reports processed',
      processed: results.length,
      results,
    })
  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Vercel Cron 設定
// 在 vercel.json 中加入：
// {
//   "crons": [{
//     "path": "/api/cron/reports",
//     "schedule": "0 * * * *"
//   }]
// }
