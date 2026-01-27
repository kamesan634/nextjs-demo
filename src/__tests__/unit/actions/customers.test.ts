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
    })

    describe('getActiveCustomerLevels', () => {
      it('應只回傳啟用的會員等級', async () => {
        vi.mocked(prisma.customerLevel.findMany).mockResolvedValue([])

        await getActiveCustomerLevels()

        expect(prisma.customerLevel.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { isActive: true },
          })
        )
      })
    })

    describe('createCustomerLevel', () => {
      it('應成功建立會員等級', async () => {
        vi.mocked(prisma.customerLevel.findUnique).mockResolvedValue(null)
        vi.mocked(prisma.customerLevel.create).mockResolvedValue({ id: 'new-id' } as never)

        const result = await createCustomerLevel({
          code: 'VIP',
          name: 'VIP會員',
          discountRate: 0.1,
          pointsMultiplier: 2,
          minPoints: 1000,
          sortOrder: 1,
          isActive: true,
        })

        expect(result.success).toBe(true)
        expect(result.message).toBe('會員等級建立成功')
      })

      it('代碼重複時應回傳錯誤', async () => {
        vi.mocked(prisma.customerLevel.findUnique).mockResolvedValue({ id: 'existing' } as never)

        const result = await createCustomerLevel({
          code: 'VIP',
          name: 'VIP會員',
          discountRate: 0.1,
          pointsMultiplier: 2,
          minPoints: 1000,
          sortOrder: 1,
          isActive: true,
        })

        expect(result.success).toBe(false)
        expect(result.message).toBe('此等級代碼已被使用')
      })
    })

    describe('updateCustomerLevel', () => {
      it('應成功更新會員等級', async () => {
        vi.mocked(prisma.customerLevel.findUnique).mockResolvedValue({ id: '1' } as never)
        vi.mocked(prisma.customerLevel.findFirst).mockResolvedValue(null)
        vi.mocked(prisma.customerLevel.update).mockResolvedValue({ id: '1' } as never)

        const result = await updateCustomerLevel('1', {
          code: 'VIP',
          name: 'VIP會員更新',
          discountRate: 0.15,
          pointsMultiplier: 2,
          minPoints: 1000,
          sortOrder: 1,
          isActive: true,
        })

        expect(result.success).toBe(true)
        expect(result.message).toBe('會員等級更新成功')
      })

      it('等級不存在時應回傳錯誤', async () => {
        vi.mocked(prisma.customerLevel.findUnique).mockResolvedValue(null)

        const result = await updateCustomerLevel('nonexistent', {
          code: 'VIP',
          name: 'VIP會員',
          discountRate: 0.1,
          pointsMultiplier: 2,
          minPoints: 1000,
          sortOrder: 1,
          isActive: true,
        })

        expect(result.success).toBe(false)
        expect(result.message).toBe('會員等級不存在')
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

      it('有會員使用時不能刪除', async () => {
        vi.mocked(prisma.customerLevel.findUnique).mockResolvedValue({
          id: '1',
          _count: { customers: 5 },
        } as never)

        const result = await deleteCustomerLevel('1')

        expect(result.success).toBe(false)
        expect(result.message).toContain('5 位會員')
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

      it('有訂單時不能刪除', async () => {
        vi.mocked(prisma.customer.findUnique).mockResolvedValue({
          id: '1',
          _count: { orders: 5 },
        } as never)

        const result = await deleteCustomer('1')

        expect(result.success).toBe(false)
        expect(result.message).toContain('5 筆訂單紀錄')
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
    })
  })
})
