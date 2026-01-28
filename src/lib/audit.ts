import prisma from '@/lib/prisma'
import { headers } from 'next/headers'

/**
 * 操作日誌記錄工具
 */

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'VIEW' | 'EXPORT'

export interface AuditLogParams {
  userId: string
  action: AuditAction
  module: string
  targetId?: string
  targetType?: string
  oldData?: Record<string, unknown>
  newData?: Record<string, unknown>
  description?: string
}

/**
 * 記錄操作日誌
 */
export async function createAuditLog(params: AuditLogParams): Promise<void> {
  try {
    // 取得請求的 IP 和 User-Agent
    const headersList = await headers()
    const ipAddress =
      headersList.get('x-forwarded-for')?.split(',')[0] || headersList.get('x-real-ip') || 'unknown'
    const userAgent = headersList.get('user-agent') || 'unknown'

    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        module: params.module,
        targetId: params.targetId,
        targetType: params.targetType,
        oldData: params.oldData as object,
        newData: params.newData as object,
        description: params.description,
        ipAddress,
        userAgent,
      },
    })
  } catch (error) {
    // 日誌記錄失敗不應該影響主要業務邏輯
    console.error('Failed to create audit log:', error)
  }
}

/**
 * 記錄建立操作
 */
export async function logCreate(
  userId: string,
  module: string,
  targetId: string,
  targetType: string,
  newData?: Record<string, unknown>,
  description?: string
): Promise<void> {
  await createAuditLog({
    userId,
    action: 'CREATE',
    module,
    targetId,
    targetType,
    newData,
    description: description || `建立了 ${targetType}`,
  })
}

/**
 * 記錄更新操作
 */
export async function logUpdate(
  userId: string,
  module: string,
  targetId: string,
  targetType: string,
  oldData?: Record<string, unknown>,
  newData?: Record<string, unknown>,
  description?: string
): Promise<void> {
  await createAuditLog({
    userId,
    action: 'UPDATE',
    module,
    targetId,
    targetType,
    oldData,
    newData,
    description: description || `更新了 ${targetType}`,
  })
}

/**
 * 記錄刪除操作
 */
export async function logDelete(
  userId: string,
  module: string,
  targetId: string,
  targetType: string,
  oldData?: Record<string, unknown>,
  description?: string
): Promise<void> {
  await createAuditLog({
    userId,
    action: 'DELETE',
    module,
    targetId,
    targetType,
    oldData,
    description: description || `刪除了 ${targetType}`,
  })
}

/**
 * 記錄登入操作
 */
export async function logLogin(userId: string, success: boolean = true): Promise<void> {
  await createAuditLog({
    userId,
    action: 'LOGIN',
    module: 'auth',
    description: success ? '登入成功' : '登入失敗',
  })
}

/**
 * 記錄登出操作
 */
export async function logLogout(userId: string): Promise<void> {
  await createAuditLog({
    userId,
    action: 'LOGOUT',
    module: 'auth',
    description: '登出系統',
  })
}

/**
 * 記錄匯出操作
 */
export async function logExport(
  userId: string,
  module: string,
  description?: string
): Promise<void> {
  await createAuditLog({
    userId,
    action: 'EXPORT',
    module,
    description: description || `匯出了 ${module} 資料`,
  })
}

/**
 * 比較兩個物件的差異
 */
export function getObjectDiff(
  oldObj: Record<string, unknown>,
  newObj: Record<string, unknown>
): { oldData: Record<string, unknown>; newData: Record<string, unknown> } {
  const oldData: Record<string, unknown> = {}
  const newData: Record<string, unknown> = {}

  // 檢查所有在新物件中的鍵
  for (const key of Object.keys(newObj)) {
    if (JSON.stringify(oldObj[key]) !== JSON.stringify(newObj[key])) {
      oldData[key] = oldObj[key]
      newData[key] = newObj[key]
    }
  }

  // 檢查在舊物件中但不在新物件中的鍵
  for (const key of Object.keys(oldObj)) {
    if (!(key in newObj)) {
      oldData[key] = oldObj[key]
      newData[key] = undefined
    }
  }

  return { oldData, newData }
}
