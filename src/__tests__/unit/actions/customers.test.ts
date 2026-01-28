/**
 * Customers Server Actions 測試
 * 測試客戶/會員管理相關的 Server Actions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getCustomerLevels,
  getActiveCustomerLevels,
  getCustomerLevel,
  createCustomerLevel,
  updateCustomerLevel,
  deleteCustomerLevel,
  getCustomers,
  getCustomer,
  getCustomerByPhone,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  adjustCustomerPoints,
  generateCustomerCode,
} from '@/actions/customers'
import prisma from '@/lib/prisma'

// Mock revalidatePath
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

describe('Customers Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===== 會員等級測試 =====
  describe('CustomerLevel Actions', () => {
    describe('getCustomerLevels', () => {
      it('應回傳分頁的會員等級列表', async () => {
        const mockLevels = [
          { id: '1', code: 'VIP', name: 'VIP會員', _count: { customers: 10 } },
          { id: '2', code: 'NORMAL', name: '一般會員', _count: { customers: 50 } },
        ]

        vi.mocked(prisma.customerLevel.findMany).mockResolvedValue(mockLevels as never)
        vi.mocked(prisma.customerLevel.count).mockResolvedValue(2)

        const result = await getCustomerLevels({ page: 1, pageSize: 10 })

        expect(result.data).toHaveLength(2)
        expect(result.pagination.total).toBe(2)
        expect(result.pagination.page).toBe(1)
        expect(result.pagination.pageSize).toBe(10)
      })

      it('應支援搜尋功能', async () => {
        vi.mocked(prisma.customerLevel.findMany).mockResolvedValue([])
        vi.mocked(prisma.customerLevel.count).mockResolvedValue(0)

        await getCustomerLevels({ search: 'VIP' })

        expect(prisma.customerLevel.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              OR: expect.any(Array),
            }),
          })
        )
      })

      it('應支援 isActive 篩選', async () => {
        vi.mocked(prisma.customerLevel.findMany).mockResolvedValue([])
        vi.mocked(prisma.customerLevel.count).mockResolvedValue(0)

        await getCustomerLevels({ isActive: true })

        expect(prisma.customerLevel.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({ isActive: true }),
          })
        )
      })

      it('應使用預設分頁參數', async () => {
        vi.mocked(prisma.customerLevel.findMany).mockResolvedValue([])
        vi.mocked(prisma.customerLevel.count).mockResolvedValue(0)

        const result = await getCustomerLevels()

        expect(result.pagination.page).toBe(1)
        expect(result.pagination.pageSize).toBe(10)
      })

      it('應正確計算分頁資訊', async () => {
        vi.mocked(prisma.customerLevel.findMany).mockResolvedValue([])
        vi.mocked(prisma.customerLevel.count).mockResolvedValue(25)

        const result = await getCustomerLevels({ page: 2, pageSize: 10 })

        expect(result.pagination.totalPages).toBe(3)
        expect(result.pagination.hasNextPage).toBe(true)
        expect(result.pagination.hasPrevPage).toBe(true)
      })
    })

    describe('getActiveCustomerLevels', () => {
      it('應只回傳啟用的會員等級', async () => {
        const mockLevels = [
          { id: '1', code: 'VIP', name: 'VIP會員', discountRate: 0.1, pointsMultiplier: 2 },
        ]
        vi.mocked(prisma.customerLevel.findMany).mockResolvedValue(mockLevels as never)

        const result = await getActiveCustomerLevels()

        expect(prisma.customerLevel.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { isActive: true },
          })
        )
        expect(result).toEqual(mockLevels)
      })
    })

    describe('getCustomerLevel', () => {
      it('應回傳單一會員等級詳情', async () => {
        const mockLevel = {
          id: '1',
          code: 'VIP',
          name: 'VIP會員',
          discountRate: 0.1,
          pointsMultiplier: 2,
          _count: { customers: 10 },
        }

        vi.mocked(prisma.customerLevel.findUnique).mockResolvedValue(mockLevel as never)

        const result = await getCustomerLevel('1')

        expect(result).toBeDefined()
        expect(result?.name).toBe('VIP會員')
        expect(result?._count.customers).toBe(10)
      })

      it('會員等級不存在時應回傳 null', async () => {
        vi.mocked(prisma.customerLevel.findUnique).mockResolvedValue(null)

        const result = await getCustomerLevel('nonexistent')

        expect(result).toBeNull()
      })
    })

    describe('createCustomerLevel', () => {
      const validLevelData = {
        code: 'VIP',
        name: 'VIP會員',
        discountRate: 0.1,
        pointsMultiplier: 2,
        minPoints: 1000,
        sortOrder: 1,
        isActive: true,
      }

      it('應成功建立會員等級', async () => {
        vi.mocked(prisma.customerLevel.findUnique).mockResolvedValue(null)
        vi.mocked(prisma.customerLevel.create).mockResolvedValue({ id: 'new-id' } as never)

        const result = await createCustomerLevel(validLevelData)

        expect(result.success).toBe(true)
        expect(result.message).toBe('會員等級建立成功')
        expect((result.data as { id: string })?.id).toBe('new-id')
      })

      it('代碼重複時應回傳錯誤', async () => {
        vi.mocked(prisma.customerLevel.findUnique).mockResolvedValue({ id: 'existing' } as never)

        const result = await createCustomerLevel(validLevelData)

        expect(result.success).toBe(false)
        expect(result.message).toBe('此等級代碼已被使用')
      })

      it('驗證失敗時應回傳錯誤', async () => {
        const result = await createCustomerLevel({
          code: '',
          name: '',
          discountRate: 0,
          pointsMultiplier: 0,
          minPoints: 0,
          sortOrder: 0,
          isActive: true,
        })

        expect(result.success).toBe(false)
        expect(result.message).toBe('驗證失敗')
        expect(result.errors).toBeDefined()
      })

      it('資料庫錯誤時應回傳失敗', async () => {
        vi.mocked(prisma.customerLevel.findUnique).mockResolvedValue(null)
        vi.mocked(prisma.customerLevel.create).mockRejectedValue(new Error('DB Error'))

        const result = await createCustomerLevel(validLevelData)

        expect(result.success).toBe(false)
        expect(result.message).toBe('建立會員等級失敗')
      })
    })

    describe('updateCustomerLevel', () => {
      const validLevelData = {
        code: 'VIP',
        name: 'VIP會員更新',
        discountRate: 0.15,
        pointsMultiplier: 2,
        minPoints: 1000,
        sortOrder: 1,
        isActive: true,
      }

      it('應成功更新會員等級', async () => {
        vi.mocked(prisma.customerLevel.findUnique).mockResolvedValue({ id: '1' } as never)
        vi.mocked(prisma.customerLevel.findFirst).mockResolvedValue(null)
        vi.mocked(prisma.customerLevel.update).mockResolvedValue({ id: '1' } as never)

        const result = await updateCustomerLevel('1', validLevelData)

        expect(result.success).toBe(true)
        expect(result.message).toBe('會員等級更新成功')
      })

      it('等級不存在時應回傳錯誤', async () => {
        vi.mocked(prisma.customerLevel.findUnique).mockResolvedValue(null)

        const result = await updateCustomerLevel('nonexistent', validLevelData)

        expect(result.success).toBe(false)
        expect(result.message).toBe('會員等級不存在')
      })

      it('代碼被其他等級使用時應回傳錯誤', async () => {
        vi.mocked(prisma.customerLevel.findUnique).mockResolvedValue({ id: '1' } as never)
        vi.mocked(prisma.customerLevel.findFirst).mockResolvedValue({
          id: '2',
          code: 'VIP',
        } as never)

        const result = await updateCustomerLevel('1', validLevelData)

        expect(result.success).toBe(false)
        expect(result.message).toBe('此等級代碼已被使用')
      })

      it('驗證失敗時應回傳錯誤', async () => {
        const result = await updateCustomerLevel('1', {
          code: '',
          name: '',
          discountRate: 0,
          pointsMultiplier: 0,
          minPoints: 0,
          sortOrder: 0,
          isActive: true,
        })

        expect(result.success).toBe(false)
        expect(result.message).toBe('驗證失敗')
      })

      it('資料庫錯誤時應回傳失敗', async () => {
        vi.mocked(prisma.customerLevel.findUnique).mockResolvedValue({ id: '1' } as never)
        vi.mocked(prisma.customerLevel.findFirst).mockResolvedValue(null)
        vi.mocked(prisma.customerLevel.update).mockRejectedValue(new Error('DB Error'))

        const result = await updateCustomerLevel('1', validLevelData)

        expect(result.success).toBe(false)
        expect(result.message).toBe('更新會員等級失敗')
      })
    })

    describe('deleteCustomerLevel', () => {
      it('應成功刪除會員等級', async () => {
        vi.mocked(prisma.customerLevel.findUnique).mockResolvedValue({
          id: '1',
          _count: { customers: 0 },
        } as never)
        vi.mocked(prisma.customerLevel.delete).mockResolvedValue({ id: '1' } as never)

        const result = await deleteCustomerLevel('1')

        expect(result.success).toBe(true)
        expect(result.message).toBe('會員等級刪除成功')
      })

      it('等級不存在時應回傳錯誤', async () => {
        vi.mocked(prisma.customerLevel.findUnique).mockResolvedValue(null)

        const result = await deleteCustomerLevel('nonexistent')

        expect(result.success).toBe(false)
        expect(result.message).toBe('會員等級不存在')
      })

      it('有會員使用時不能刪除', async () => {
        vi.mocked(prisma.customerLevel.findUnique).mockResolvedValue({
          id: '1',
          _count: { customers: 5 },
        } as never)

        const result = await deleteCustomerLevel('1')

        expect(result.success).toBe(false)
        expect(result.message).toContain('5 位會員')
      })

      it('資料庫錯誤時應回傳失敗', async () => {
        vi.mocked(prisma.customerLevel.findUnique).mockResolvedValue({
          id: '1',
          _count: { customers: 0 },
        } as never)
        vi.mocked(prisma.customerLevel.delete).mockRejectedValue(new Error('DB Error'))

        const result = await deleteCustomerLevel('1')

        expect(result.success).toBe(false)
        expect(result.message).toBe('刪除會員等級失敗')
      })
    })
  })

  // ===== 客戶/會員測試 =====
  describe('Customer Actions', () => {
    describe('getCustomers', () => {
      it('應回傳分頁的客戶列表', async () => {
        const mockCustomers = [
          { id: '1', code: 'C001', name: '張三', level: { name: 'VIP' }, _count: { orders: 10 } },
          { id: '2', code: 'C002', name: '李四', level: { name: '一般' }, _count: { orders: 5 } },
        ]

        vi.mocked(prisma.customer.findMany).mockResolvedValue(mockCustomers as never)
        vi.mocked(prisma.customer.count).mockResolvedValue(2)

        const result = await getCustomers({ page: 1, pageSize: 10 })

        expect(result.data).toHaveLength(2)
        expect(result.pagination.total).toBe(2)
        expect(result.pagination.page).toBe(1)
        expect(result.pagination.pageSize).toBe(10)
      })

      it('應支援搜尋功能', async () => {
        vi.mocked(prisma.customer.findMany).mockResolvedValue([])
        vi.mocked(prisma.customer.count).mockResolvedValue(0)

        await getCustomers({ search: '張三' })

        expect(prisma.customer.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              OR: expect.arrayContaining([
                expect.objectContaining({ code: expect.any(Object) }),
                expect.objectContaining({ name: expect.any(Object) }),
                expect.objectContaining({ phone: expect.any(Object) }),
                expect.objectContaining({ email: expect.any(Object) }),
              ]),
            }),
          })
        )
      })

      it('應支援依等級篩選', async () => {
        vi.mocked(prisma.customer.findMany).mockResolvedValue([])
        vi.mocked(prisma.customer.count).mockResolvedValue(0)

        await getCustomers({ levelId: 'level-1' })

        expect(prisma.customer.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({ levelId: 'level-1' }),
          })
        )
      })

      it('應支援 isActive 篩選', async () => {
        vi.mocked(prisma.customer.findMany).mockResolvedValue([])
        vi.mocked(prisma.customer.count).mockResolvedValue(0)

        await getCustomers({ isActive: true })

        expect(prisma.customer.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({ isActive: true }),
          })
        )
      })

      it('應使用預設分頁參數', async () => {
        vi.mocked(prisma.customer.findMany).mockResolvedValue([])
        vi.mocked(prisma.customer.count).mockResolvedValue(0)

        const result = await getCustomers()

        expect(result.pagination.page).toBe(1)
        expect(result.pagination.pageSize).toBe(10)
      })

      it('應正確計算分頁資訊', async () => {
        vi.mocked(prisma.customer.findMany).mockResolvedValue([])
        vi.mocked(prisma.customer.count).mockResolvedValue(35)

        const result = await getCustomers({ page: 2, pageSize: 10 })

        expect(result.pagination.totalPages).toBe(4)
        expect(result.pagination.hasNextPage).toBe(true)
        expect(result.pagination.hasPrevPage).toBe(true)
      })
    })

    describe('getCustomer', () => {
      it('應回傳客戶詳情', async () => {
        const mockCustomer = {
          id: '1',
          code: 'C001',
          name: '張三',
          level: { name: 'VIP' },
          orders: [],
          pointsLogs: [],
          _count: { orders: 5, pointsLogs: 10 },
        }

        vi.mocked(prisma.customer.findUnique).mockResolvedValue(mockCustomer as never)

        const result = await getCustomer('1')

        expect(result?.name).toBe('張三')
        expect(result?._count.orders).toBe(5)
      })

      it('客戶不存在時應回傳 null', async () => {
        vi.mocked(prisma.customer.findUnique).mockResolvedValue(null)

        const result = await getCustomer('nonexistent')

        expect(result).toBeNull()
      })
    })

    describe('getCustomerByPhone', () => {
      it('應依手機號碼查詢會員', async () => {
        const mockCustomer = {
          id: '1',
          phone: '0912345678',
          name: '張三',
          level: { discountRate: 10 },
        }

        vi.mocked(prisma.customer.findUnique).mockResolvedValue(mockCustomer as never)

        const result = await getCustomerByPhone('0912345678')

        expect(result?.phone).toBe('0912345678')
        expect(prisma.customer.findUnique).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { phone: '0912345678' },
          })
        )
      })

      it('手機號碼不存在時應回傳 null', async () => {
        vi.mocked(prisma.customer.findUnique).mockResolvedValue(null)

        const result = await getCustomerByPhone('0999999999')

        expect(result).toBeNull()
      })
    })

    describe('createCustomer', () => {
      const validCustomerData = {
        code: 'C001',
        name: '新會員',
        phone: '0912345678',
        levelId: 'level-1',
        totalPoints: 0,
        availablePoints: 0,
        isActive: true,
      }

      it('應成功建立客戶', async () => {
        vi.mocked(prisma.customer.findUnique).mockResolvedValue(null)
        vi.mocked(prisma.customer.create).mockResolvedValue({ id: 'new-id' } as never)

        const result = await createCustomer(validCustomerData)

        expect(result.success).toBe(true)
        expect(result.message).toBe('會員建立成功')
        expect((result.data as { id: string })?.id).toBe('new-id')
      })

      it('編號重複時應回傳錯誤', async () => {
        vi.mocked(prisma.customer.findUnique).mockResolvedValue({ id: 'existing' } as never)

        const result = await createCustomer(validCustomerData)

        expect(result.success).toBe(false)
        expect(result.message).toBe('此會員編號已被使用')
      })

      it('手機號碼重複時應回傳錯誤', async () => {
        vi.mocked(prisma.customer.findUnique)
          .mockResolvedValueOnce(null) // 編號檢查
          .mockResolvedValueOnce({ id: 'existing' } as never) // 手機檢查

        const result = await createCustomer(validCustomerData)

        expect(result.success).toBe(false)
        expect(result.message).toBe('此手機號碼已被使用')
      })

      it('驗證失敗時應回傳錯誤', async () => {
        const result = await createCustomer({
          code: '',
          name: '',
          phone: '',
          levelId: '',
          totalPoints: 0,
          availablePoints: 0,
          isActive: true,
        })

        expect(result.success).toBe(false)
        expect(result.message).toBe('驗證失敗')
        expect(result.errors).toBeDefined()
      })

      it('應正確處理生日欄位', async () => {
        vi.mocked(prisma.customer.findUnique).mockResolvedValue(null)
        vi.mocked(prisma.customer.create).mockResolvedValue({ id: 'new-id' } as never)

        await createCustomer({
          ...validCustomerData,
          birthday: '1990-01-01',
        })

        expect(prisma.customer.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              birthday: expect.any(Date),
            }),
          })
        )
      })

      it('資料庫錯誤時應回傳失敗', async () => {
        vi.mocked(prisma.customer.findUnique).mockResolvedValue(null)
        vi.mocked(prisma.customer.create).mockRejectedValue(new Error('DB Error'))

        const result = await createCustomer(validCustomerData)

        expect(result.success).toBe(false)
        expect(result.message).toBe('建立會員失敗')
      })
    })

    describe('updateCustomer', () => {
      const validCustomerData = {
        code: 'C001',
        name: '更新會員',
        phone: '0912345678',
        levelId: 'level-1',
        totalPoints: 100,
        availablePoints: 100,
        isActive: true,
      }

      it('應成功更新客戶', async () => {
        vi.mocked(prisma.customer.findUnique).mockResolvedValue({ id: '1' } as never)
        vi.mocked(prisma.customer.findFirst).mockResolvedValue(null)
        vi.mocked(prisma.customer.update).mockResolvedValue({ id: '1' } as never)

        const result = await updateCustomer('1', validCustomerData)

        expect(result.success).toBe(true)
        expect(result.message).toBe('會員更新成功')
      })

      it('會員不存在時應回傳錯誤', async () => {
        vi.mocked(prisma.customer.findUnique).mockResolvedValue(null)

        const result = await updateCustomer('nonexistent', validCustomerData)

        expect(result.success).toBe(false)
        expect(result.message).toBe('會員不存在')
      })

      it('編號被其他會員使用時應回傳錯誤', async () => {
        vi.mocked(prisma.customer.findUnique).mockResolvedValue({ id: '1' } as never)
        vi.mocked(prisma.customer.findFirst).mockResolvedValue({ id: '2', code: 'C001' } as never)

        const result = await updateCustomer('1', validCustomerData)

        expect(result.success).toBe(false)
        expect(result.message).toBe('此會員編號已被使用')
      })

      it('手機號碼被其他會員使用時應回傳錯誤', async () => {
        vi.mocked(prisma.customer.findUnique).mockResolvedValue({ id: '1' } as never)
        vi.mocked(prisma.customer.findFirst)
          .mockResolvedValueOnce(null) // 編號檢查
          .mockResolvedValueOnce({ id: '2', phone: '0912345678' } as never) // 手機檢查

        const result = await updateCustomer('1', validCustomerData)

        expect(result.success).toBe(false)
        expect(result.message).toBe('此手機號碼已被使用')
      })

      it('驗證失敗時應回傳錯誤', async () => {
        const result = await updateCustomer('1', {
          code: '',
          name: '',
          phone: '',
          levelId: '',
          totalPoints: 0,
          availablePoints: 0,
          isActive: true,
        })

        expect(result.success).toBe(false)
        expect(result.message).toBe('驗證失敗')
      })

      it('應正確處理生日欄位', async () => {
        vi.mocked(prisma.customer.findUnique).mockResolvedValue({ id: '1' } as never)
        vi.mocked(prisma.customer.findFirst).mockResolvedValue(null)
        vi.mocked(prisma.customer.update).mockResolvedValue({ id: '1' } as never)

        await updateCustomer('1', {
          ...validCustomerData,
          birthday: '1990-01-01',
        })

        expect(prisma.customer.update).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              birthday: expect.any(Date),
            }),
          })
        )
      })

      it('資料庫錯誤時應回傳失敗', async () => {
        vi.mocked(prisma.customer.findUnique).mockResolvedValue({ id: '1' } as never)
        vi.mocked(prisma.customer.findFirst).mockResolvedValue(null)
        vi.mocked(prisma.customer.update).mockRejectedValue(new Error('DB Error'))

        const result = await updateCustomer('1', validCustomerData)

        expect(result.success).toBe(false)
        expect(result.message).toBe('更新會員失敗')
      })
    })

    describe('deleteCustomer', () => {
      it('應成功刪除客戶', async () => {
        vi.mocked(prisma.customer.findUnique).mockResolvedValue({
          id: '1',
          _count: { orders: 0 },
        } as never)
        vi.mocked(prisma.pointsLog.deleteMany).mockResolvedValue({ count: 0 } as never)
        vi.mocked(prisma.couponUsage.deleteMany).mockResolvedValue({ count: 0 } as never)
        vi.mocked(prisma.customer.delete).mockResolvedValue({ id: '1' } as never)

        const result = await deleteCustomer('1')

        expect(result.success).toBe(true)
        expect(result.message).toBe('會員刪除成功')
      })

      it('會員不存在時應回傳錯誤', async () => {
        vi.mocked(prisma.customer.findUnique).mockResolvedValue(null)

        const result = await deleteCustomer('nonexistent')

        expect(result.success).toBe(false)
        expect(result.message).toBe('會員不存在')
      })

      it('有訂單時不能刪除', async () => {
        vi.mocked(prisma.customer.findUnique).mockResolvedValue({
          id: '1',
          _count: { orders: 5 },
        } as never)

        const result = await deleteCustomer('1')

        expect(result.success).toBe(false)
        expect(result.message).toContain('5 筆訂單紀錄')
      })

      it('應先刪除關聯資料', async () => {
        vi.mocked(prisma.customer.findUnique).mockResolvedValue({
          id: '1',
          _count: { orders: 0 },
        } as never)
        vi.mocked(prisma.pointsLog.deleteMany).mockResolvedValue({ count: 5 } as never)
        vi.mocked(prisma.couponUsage.deleteMany).mockResolvedValue({ count: 3 } as never)
        vi.mocked(prisma.customer.delete).mockResolvedValue({ id: '1' } as never)

        await deleteCustomer('1')

        expect(prisma.pointsLog.deleteMany).toHaveBeenCalledWith({
          where: { customerId: '1' },
        })
        expect(prisma.couponUsage.deleteMany).toHaveBeenCalledWith({
          where: { customerId: '1' },
        })
      })

      it('資料庫錯誤時應回傳失敗', async () => {
        vi.mocked(prisma.customer.findUnique).mockResolvedValue({
          id: '1',
          _count: { orders: 0 },
        } as never)
        vi.mocked(prisma.pointsLog.deleteMany).mockResolvedValue({ count: 0 } as never)
        vi.mocked(prisma.couponUsage.deleteMany).mockResolvedValue({ count: 0 } as never)
        vi.mocked(prisma.customer.delete).mockRejectedValue(new Error('DB Error'))

        const result = await deleteCustomer('1')

        expect(result.success).toBe(false)
        expect(result.message).toBe('刪除會員失敗')
      })
    })

    describe('adjustCustomerPoints', () => {
      it('應成功增加點數 (EARN)', async () => {
        vi.mocked(prisma.customer.findUnique).mockResolvedValue({
          id: '1',
          totalPoints: 100,
          availablePoints: 100,
        } as never)
        vi.mocked(prisma.$transaction).mockResolvedValue([{}, {}] as never)

        const result = await adjustCustomerPoints('1', {
          type: 'EARN',
          points: 50,
          description: '消費獲得',
        })

        expect(result.success).toBe(true)
        expect(result.message).toBe('點數調整成功')
      })

      it('應成功扣除點數 (REDEEM)', async () => {
        vi.mocked(prisma.customer.findUnique).mockResolvedValue({
          id: '1',
          totalPoints: 100,
          availablePoints: 100,
        } as never)
        vi.mocked(prisma.$transaction).mockResolvedValue([{}, {}] as never)

        const result = await adjustCustomerPoints('1', {
          type: 'REDEEM',
          points: 50,
          description: '兌換商品',
        })

        expect(result.success).toBe(true)
      })

      it('應成功調整點數 (ADJUST)', async () => {
        vi.mocked(prisma.customer.findUnique).mockResolvedValue({
          id: '1',
          totalPoints: 100,
          availablePoints: 100,
        } as never)
        vi.mocked(prisma.$transaction).mockResolvedValue([{}, {}] as never)

        const result = await adjustCustomerPoints('1', {
          type: 'ADJUST',
          points: -30,
          description: '手動調整',
        })

        expect(result.success).toBe(true)
        expect(result.message).toBe('點數調整成功')
      })

      it('點數不足時應回傳錯誤', async () => {
        vi.mocked(prisma.customer.findUnique).mockResolvedValue({
          id: '1',
          totalPoints: 30,
          availablePoints: 30,
        } as never)

        const result = await adjustCustomerPoints('1', {
          type: 'REDEEM',
          points: 50,
        })

        expect(result.success).toBe(false)
        expect(result.message).toBe('可用點數不足')
      })

      it('會員不存在時應回傳錯誤', async () => {
        vi.mocked(prisma.customer.findUnique).mockResolvedValue(null)

        const result = await adjustCustomerPoints('nonexistent', {
          type: 'EARN',
          points: 50,
        })

        expect(result.success).toBe(false)
        expect(result.message).toBe('會員不存在')
      })

      it('沒有提供描述時應使用預設描述', async () => {
        vi.mocked(prisma.customer.findUnique).mockResolvedValue({
          id: '1',
          totalPoints: 100,
          availablePoints: 100,
        } as never)
        vi.mocked(prisma.$transaction).mockResolvedValue([{}, {}] as never)

        await adjustCustomerPoints('1', {
          type: 'EARN',
          points: 50,
        })

        expect(prisma.$transaction).toHaveBeenCalled()
      })

      it('資料庫錯誤時應回傳失敗', async () => {
        vi.mocked(prisma.customer.findUnique).mockResolvedValue({
          id: '1',
          totalPoints: 100,
          availablePoints: 100,
        } as never)
        vi.mocked(prisma.$transaction).mockRejectedValue(new Error('DB Error'))

        const result = await adjustCustomerPoints('1', {
          type: 'EARN',
          points: 50,
        })

        expect(result.success).toBe(false)
        expect(result.message).toBe('點數調整失敗')
      })
    })

    describe('generateCustomerCode', () => {
      it('無會員時應回傳 C00001', async () => {
        vi.mocked(prisma.customer.findFirst).mockResolvedValue(null)

        const result = await generateCustomerCode()

        expect(result).toBe('C00001')
      })

      it('有會員時應產生下一個編號', async () => {
        vi.mocked(prisma.customer.findFirst).mockResolvedValue({ code: 'C00005' } as never)

        const result = await generateCustomerCode()

        expect(result).toBe('C00006')
      })

      it('應正確處理大數字', async () => {
        vi.mocked(prisma.customer.findFirst).mockResolvedValue({ code: 'C12345' } as never)

        const result = await generateCustomerCode()

        expect(result).toBe('C12346')
      })

      it('應正確補零', async () => {
        vi.mocked(prisma.customer.findFirst).mockResolvedValue({ code: 'C00099' } as never)

        const result = await generateCustomerCode()

        expect(result).toBe('C00100')
      })

      it('應查詢以 C 開頭的編號', async () => {
        vi.mocked(prisma.customer.findFirst).mockResolvedValue(null)

        await generateCustomerCode()

        expect(prisma.customer.findFirst).toHaveBeenCalledWith(
          expect.objectContaining({
            where: {
              code: {
                startsWith: 'C',
              },
            },
            orderBy: { code: 'desc' },
          })
        )
      })
    })
  })
})
