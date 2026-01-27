import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * 健康檢查 API
 * 用於 Docker 容器健康檢查
 */
export async function GET() {
  try {
    // 檢查資料庫連線
    await prisma.$queryRaw`SELECT 1`

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
    })
  } catch (error) {
    console.error('Health check failed:', error)

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    )
  }
}
