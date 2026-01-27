import { PrismaClient } from '@prisma/client'

/**
 * 建立 Prisma Client 單例
 * 避免開發環境熱重載時建立多個連線
 */

// 擴展全域類型定義
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// 建立或取得現有的 Prisma Client
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

// 非生產環境時快取 client
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export default prisma
