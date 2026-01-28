/**
 * 操作日誌記錄工具單元測試
 * 測試 src/lib/audit.ts 中的操作日誌功能
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createAuditLog,
  logCreate,
  logUpdate,
  logDelete,
  logLogin,
  logLogout,
  logExport,
  getObjectDiff,
} from '@/lib/audit'
import prisma from '@/lib/prisma'

// Mock next/headers
const mockHeaders = vi.fn()
vi.mock('next/headers', () => ({
  headers: () => mockHeaders(),
}))

describe('createAuditLog (記錄操作日誌)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // 預設 headers mock
    mockHeaders.mockResolvedValue({
      get: vi.fn((key: string) => {
        if (key === 'x-forwarded-for') return '192.168.1.1'
        if (key === 'x-real-ip') return null
        if (key === 'user-agent') return 'Mozilla/5.0 Test Browser'
        return null
      }),
    })
  })

  it('應該成功建立操作日誌', async () => {
    vi.mocked(prisma.auditLog.create).mockResolvedValue({ id: 'log-1' } as never)

    await createAuditLog({
      userId: 'user-1',
      action: 'CREATE',
      module: 'products',
      targetId: 'product-1',
      targetType: 'Product',
      newData: { name: '新商品' },
      description: '建立了新商品',
    })

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        action: 'CREATE',
        module: 'products',
        targetId: 'product-1',
        targetType: 'Product',
        newData: { name: '新商品' },
        description: '建立了新商品',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 Test Browser',
      }),
    })
  })

  it('應該處理 x-forwarded-for 有多個 IP 的情況', async () => {
    mockHeaders.mockResolvedValue({
      get: vi.fn((key: string) => {
        if (key === 'x-forwarded-for') return '192.168.1.1, 10.0.0.1, 172.16.0.1'
        if (key === 'x-real-ip') return null
        if (key === 'user-agent') return 'Test Browser'
        return null
      }),
    })

    vi.mocked(prisma.auditLog.create).mockResolvedValue({ id: 'log-1' } as never)

    await createAuditLog({
      userId: 'user-1',
      action: 'VIEW',
      module: 'dashboard',
    })

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        ipAddress: '192.168.1.1', // 只取第一個 IP
      }),
    })
  })

  it('應該使用 x-real-ip 當 x-forwarded-for 不存在時', async () => {
    mockHeaders.mockResolvedValue({
      get: vi.fn((key: string) => {
        if (key === 'x-forwarded-for') return null
        if (key === 'x-real-ip') return '10.0.0.1'
        if (key === 'user-agent') return 'Test Browser'
        return null
      }),
    })

    vi.mocked(prisma.auditLog.create).mockResolvedValue({ id: 'log-1' } as never)

    await createAuditLog({
      userId: 'user-1',
      action: 'VIEW',
      module: 'dashboard',
    })

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        ipAddress: '10.0.0.1',
      }),
    })
  })

  it('應該使用 unknown 當無法取得 IP 時', async () => {
    mockHeaders.mockResolvedValue({
      get: vi.fn(() => null),
    })

    vi.mocked(prisma.auditLog.create).mockResolvedValue({ id: 'log-1' } as never)

    await createAuditLog({
      userId: 'user-1',
      action: 'VIEW',
      module: 'dashboard',
    })

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        ipAddress: 'unknown',
        userAgent: 'unknown',
      }),
    })
  })

  it('應該在記錄失敗時不拋出錯誤', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(prisma.auditLog.create).mockRejectedValue(new Error('Database error'))

    // 不應該拋出錯誤
    await expect(
      createAuditLog({
        userId: 'user-1',
        action: 'CREATE',
        module: 'products',
      })
    ).resolves.toBeUndefined()

    expect(consoleSpy).toHaveBeenCalledWith('Failed to create audit log:', expect.any(Error))
    consoleSpy.mockRestore()
  })

  it('應該處理所有 action 類型', async () => {
    vi.mocked(prisma.auditLog.create).mockResolvedValue({ id: 'log-1' } as never)

    const actions = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'VIEW', 'EXPORT'] as const

    for (const action of actions) {
      await createAuditLog({
        userId: 'user-1',
        action,
        module: 'test',
      })
    }

    expect(prisma.auditLog.create).toHaveBeenCalledTimes(7)
  })
})

describe('logCreate (記錄建立操作)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockHeaders.mockResolvedValue({
      get: vi.fn((key: string) => {
        if (key === 'x-forwarded-for') return '192.168.1.1'
        if (key === 'user-agent') return 'Test Browser'
        return null
      }),
    })
  })

  it('應該記錄建立操作', async () => {
    vi.mocked(prisma.auditLog.create).mockResolvedValue({ id: 'log-1' } as never)

    await logCreate('user-1', 'products', 'product-1', 'Product', { name: '新商品' })

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        action: 'CREATE',
        module: 'products',
        targetId: 'product-1',
        targetType: 'Product',
        newData: { name: '新商品' },
        description: '建立了 Product',
      }),
    })
  })

  it('應該使用自訂描述', async () => {
    vi.mocked(prisma.auditLog.create).mockResolvedValue({ id: 'log-1' } as never)

    await logCreate('user-1', 'products', 'product-1', 'Product', undefined, '新增商品「測試商品」')

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        description: '新增商品「測試商品」',
      }),
    })
  })

  it('應該處理沒有 newData 的情況', async () => {
    vi.mocked(prisma.auditLog.create).mockResolvedValue({ id: 'log-1' } as never)

    await logCreate('user-1', 'products', 'product-1', 'Product')

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        newData: undefined,
      }),
    })
  })
})

describe('logUpdate (記錄更新操作)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockHeaders.mockResolvedValue({
      get: vi.fn((key: string) => {
        if (key === 'x-forwarded-for') return '192.168.1.1'
        if (key === 'user-agent') return 'Test Browser'
        return null
      }),
    })
  })

  it('應該記錄更新操作', async () => {
    vi.mocked(prisma.auditLog.create).mockResolvedValue({ id: 'log-1' } as never)

    await logUpdate(
      'user-1',
      'products',
      'product-1',
      'Product',
      { name: '舊名稱' },
      { name: '新名稱' }
    )

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        action: 'UPDATE',
        module: 'products',
        targetId: 'product-1',
        targetType: 'Product',
        oldData: { name: '舊名稱' },
        newData: { name: '新名稱' },
        description: '更新了 Product',
      }),
    })
  })

  it('應該使用自訂描述', async () => {
    vi.mocked(prisma.auditLog.create).mockResolvedValue({ id: 'log-1' } as never)

    await logUpdate(
      'user-1',
      'products',
      'product-1',
      'Product',
      undefined,
      undefined,
      '更新商品價格'
    )

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        description: '更新商品價格',
      }),
    })
  })
})

describe('logDelete (記錄刪除操作)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockHeaders.mockResolvedValue({
      get: vi.fn((key: string) => {
        if (key === 'x-forwarded-for') return '192.168.1.1'
        if (key === 'user-agent') return 'Test Browser'
        return null
      }),
    })
  })

  it('應該記錄刪除操作', async () => {
    vi.mocked(prisma.auditLog.create).mockResolvedValue({ id: 'log-1' } as never)

    await logDelete('user-1', 'products', 'product-1', 'Product', { name: '被刪除的商品' })

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        action: 'DELETE',
        module: 'products',
        targetId: 'product-1',
        targetType: 'Product',
        oldData: { name: '被刪除的商品' },
        description: '刪除了 Product',
      }),
    })
  })

  it('應該使用自訂描述', async () => {
    vi.mocked(prisma.auditLog.create).mockResolvedValue({ id: 'log-1' } as never)

    await logDelete('user-1', 'products', 'product-1', 'Product', undefined, '刪除過期商品')

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        description: '刪除過期商品',
      }),
    })
  })
})

describe('logLogin (記錄登入操作)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockHeaders.mockResolvedValue({
      get: vi.fn((key: string) => {
        if (key === 'x-forwarded-for') return '192.168.1.1'
        if (key === 'user-agent') return 'Test Browser'
        return null
      }),
    })
  })

  it('應該記錄成功登入', async () => {
    vi.mocked(prisma.auditLog.create).mockResolvedValue({ id: 'log-1' } as never)

    await logLogin('user-1')

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        action: 'LOGIN',
        module: 'auth',
        description: '登入成功',
      }),
    })
  })

  it('應該記錄登入成功 (明確傳入 true)', async () => {
    vi.mocked(prisma.auditLog.create).mockResolvedValue({ id: 'log-1' } as never)

    await logLogin('user-1', true)

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        description: '登入成功',
      }),
    })
  })

  it('應該記錄登入失敗', async () => {
    vi.mocked(prisma.auditLog.create).mockResolvedValue({ id: 'log-1' } as never)

    await logLogin('user-1', false)

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        description: '登入失敗',
      }),
    })
  })
})

describe('logLogout (記錄登出操作)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockHeaders.mockResolvedValue({
      get: vi.fn((key: string) => {
        if (key === 'x-forwarded-for') return '192.168.1.1'
        if (key === 'user-agent') return 'Test Browser'
        return null
      }),
    })
  })

  it('應該記錄登出操作', async () => {
    vi.mocked(prisma.auditLog.create).mockResolvedValue({ id: 'log-1' } as never)

    await logLogout('user-1')

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        action: 'LOGOUT',
        module: 'auth',
        description: '登出系統',
      }),
    })
  })
})

describe('logExport (記錄匯出操作)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockHeaders.mockResolvedValue({
      get: vi.fn((key: string) => {
        if (key === 'x-forwarded-for') return '192.168.1.1'
        if (key === 'user-agent') return 'Test Browser'
        return null
      }),
    })
  })

  it('應該記錄匯出操作', async () => {
    vi.mocked(prisma.auditLog.create).mockResolvedValue({ id: 'log-1' } as never)

    await logExport('user-1', 'reports')

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        action: 'EXPORT',
        module: 'reports',
        description: '匯出了 reports 資料',
      }),
    })
  })

  it('應該使用自訂描述', async () => {
    vi.mocked(prisma.auditLog.create).mockResolvedValue({ id: 'log-1' } as never)

    await logExport('user-1', 'reports', '匯出 2024 年銷售報表')

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        description: '匯出 2024 年銷售報表',
      }),
    })
  })
})

describe('getObjectDiff (比較兩個物件的差異)', () => {
  it('應該找出變更的欄位', () => {
    const oldObj = { name: '舊名稱', price: 100 }
    const newObj = { name: '新名稱', price: 100 }

    const diff = getObjectDiff(oldObj, newObj)

    expect(diff.oldData).toEqual({ name: '舊名稱' })
    expect(diff.newData).toEqual({ name: '新名稱' })
  })

  it('應該找出新增的欄位', () => {
    const oldObj = { name: '商品' }
    const newObj = { name: '商品', description: '新描述' }

    const diff = getObjectDiff(oldObj, newObj)

    expect(diff.oldData).toEqual({ description: undefined })
    expect(diff.newData).toEqual({ description: '新描述' })
  })

  it('應該找出刪除的欄位', () => {
    const oldObj = { name: '商品', description: '舊描述' }
    const newObj = { name: '商品' }

    const diff = getObjectDiff(oldObj, newObj)

    expect(diff.oldData).toEqual({ description: '舊描述' })
    expect(diff.newData).toEqual({ description: undefined })
  })

  it('應該處理多個變更', () => {
    const oldObj = { name: '舊名稱', price: 100, category: 'A' }
    const newObj = { name: '新名稱', price: 200, category: 'A' }

    const diff = getObjectDiff(oldObj, newObj)

    expect(diff.oldData).toEqual({ name: '舊名稱', price: 100 })
    expect(diff.newData).toEqual({ name: '新名稱', price: 200 })
  })

  it('應該處理沒有變更的情況', () => {
    const oldObj = { name: '商品', price: 100 }
    const newObj = { name: '商品', price: 100 }

    const diff = getObjectDiff(oldObj, newObj)

    expect(diff.oldData).toEqual({})
    expect(diff.newData).toEqual({})
  })

  it('應該處理空物件', () => {
    const diff1 = getObjectDiff({}, {})
    expect(diff1.oldData).toEqual({})
    expect(diff1.newData).toEqual({})

    const diff2 = getObjectDiff({}, { name: '新商品' })
    expect(diff2.oldData).toEqual({ name: undefined })
    expect(diff2.newData).toEqual({ name: '新商品' })

    const diff3 = getObjectDiff({ name: '舊商品' }, {})
    expect(diff3.oldData).toEqual({ name: '舊商品' })
    expect(diff3.newData).toEqual({ name: undefined })
  })

  it('應該正確比較巢狀物件', () => {
    const oldObj = { meta: { tags: ['a', 'b'] } }
    const newObj = { meta: { tags: ['a', 'c'] } }

    const diff = getObjectDiff(oldObj, newObj)

    // 使用 JSON.stringify 比較，所以巢狀物件會被偵測為不同
    expect(diff.oldData).toEqual({ meta: { tags: ['a', 'b'] } })
    expect(diff.newData).toEqual({ meta: { tags: ['a', 'c'] } })
  })

  it('應該正確比較陣列', () => {
    const oldObj = { tags: ['a', 'b', 'c'] }
    const newObj = { tags: ['a', 'b', 'd'] }

    const diff = getObjectDiff(oldObj, newObj)

    expect(diff.oldData).toEqual({ tags: ['a', 'b', 'c'] })
    expect(diff.newData).toEqual({ tags: ['a', 'b', 'd'] })
  })

  it('應該處理 null 和 undefined 值', () => {
    const oldObj = { value: null }
    const newObj = { value: 'new' }

    const diff = getObjectDiff(oldObj, newObj)

    expect(diff.oldData).toEqual({ value: null })
    expect(diff.newData).toEqual({ value: 'new' })
  })

  it('應該正確比較數字', () => {
    const oldObj = { count: 0 }
    const newObj = { count: 1 }

    const diff = getObjectDiff(oldObj, newObj)

    expect(diff.oldData).toEqual({ count: 0 })
    expect(diff.newData).toEqual({ count: 1 })
  })

  it('應該正確比較布林值', () => {
    const oldObj = { isActive: true }
    const newObj = { isActive: false }

    const diff = getObjectDiff(oldObj, newObj)

    expect(diff.oldData).toEqual({ isActive: true })
    expect(diff.newData).toEqual({ isActive: false })
  })

  it('應該處理 Date 物件', () => {
    const oldObj = { date: new Date('2024-01-01') }
    const newObj = { date: new Date('2024-02-01') }

    const diff = getObjectDiff(oldObj, newObj)

    // JSON.stringify 會將 Date 轉為字串
    expect(diff.oldData.date).toBeDefined()
    expect(diff.newData.date).toBeDefined()
  })
})

describe('邊界條件測試', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockHeaders.mockResolvedValue({
      get: vi.fn(() => null),
    })
  })

  it('getObjectDiff 應該處理特殊值', () => {
    const oldObj = { empty: '', zero: 0, falsy: false }
    const newObj = { empty: 'filled', zero: 1, falsy: true }

    const diff = getObjectDiff(oldObj, newObj)

    expect(diff.oldData).toEqual({ empty: '', zero: 0, falsy: false })
    expect(diff.newData).toEqual({ empty: 'filled', zero: 1, falsy: true })
  })

  it('應該處理大型物件', () => {
    const oldObj: Record<string, number> = {}
    const newObj: Record<string, number> = {}

    for (let i = 0; i < 100; i++) {
      oldObj[`field${i}`] = i
      newObj[`field${i}`] = i + 1
    }

    const diff = getObjectDiff(oldObj, newObj)

    expect(Object.keys(diff.oldData).length).toBe(100)
    expect(Object.keys(diff.newData).length).toBe(100)
  })

  it('日誌函數應該處理特殊字元', async () => {
    vi.mocked(prisma.auditLog.create).mockResolvedValue({ id: 'log-1' } as never)

    await logCreate(
      'user-1',
      'products',
      'product-1',
      'Product',
      { name: '商品"名稱\'測試' },
      '建立含有特殊字元的商品'
    )

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        newData: { name: '商品"名稱\'測試' },
      }),
    })
  })
})
