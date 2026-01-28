/**
 * Invoices Server Actions 測試
 * 測試發票管理相關的 Server Actions
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createInvoice, voidInvoice, getInvoices, getInvoice } from '@/actions/invoices'
import prisma from '@/lib/prisma'

// Mock revalidatePath
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

describe('Invoices Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createInvoice', () => {
    const validInvoiceData = {
      orderId: 'order-1',
      invoiceType: 'B2C' as const,
      carrierType: 'PHONE',
      carrierNo: '/ABC1234',
    }

    it('應成功建立發票', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        id: 'order-1',
        totalAmount: 1000,
        customer: { name: '張三' },
      } as never)
      vi.mocked(prisma.invoice.findFirst).mockResolvedValueOnce(null) // 檢查是否已有發票
      vi.mocked(prisma.invoice.findFirst).mockResolvedValueOnce(null) // generateInvoiceNo
      vi.mocked(prisma.invoice.create).mockResolvedValue({
        id: 'invoice-1',
        invoiceNo: 'AA00000001',
        status: 'ISSUED',
        order: {
          items: [],
          customer: { name: '張三' },
        },
      } as never)

      const result = await createInvoice(validInvoiceData)

      expect(result.success).toBe(true)
      expect(result.message).toBe('發票開立成功')
      expect(result.data).toBeDefined()
    })

    it('訂單不存在時應回傳錯誤', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue(null)

      const result = await createInvoice(validInvoiceData)

      expect(result.success).toBe(false)
      expect(result.message).toBe('訂單不存在')
    })

    it('訂單已有發票時應回傳錯誤', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        id: 'order-1',
        totalAmount: 1000,
        customer: null,
      } as never)
      vi.mocked(prisma.invoice.findFirst).mockResolvedValueOnce({
        id: 'existing-invoice',
        status: 'ISSUED',
      } as never)

      const result = await createInvoice(validInvoiceData)

      expect(result.success).toBe(false)
      expect(result.message).toBe('此訂單已開立發票')
    })

    it('應正確計算稅額', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        id: 'order-1',
        totalAmount: 1000,
        customer: null,
      } as never)
      vi.mocked(prisma.invoice.findFirst).mockResolvedValueOnce(null)
      vi.mocked(prisma.invoice.findFirst).mockResolvedValueOnce(null)
      vi.mocked(prisma.invoice.create).mockResolvedValue({
        id: 'invoice-1',
        invoiceNo: 'AA00000001',
      } as never)

      await createInvoice(validInvoiceData)

      expect(prisma.invoice.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            totalAmount: 1000,
            taxAmount: 50, // 1000 * 0.05
            amount: 950, // 1000 - 50
          }),
        })
      )
    })

    it('應支援 B2B 發票（含統編）', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        id: 'order-1',
        totalAmount: 1000,
        customer: { name: '張三' },
      } as never)
      vi.mocked(prisma.invoice.findFirst).mockResolvedValueOnce(null)
      vi.mocked(prisma.invoice.findFirst).mockResolvedValueOnce(null)
      vi.mocked(prisma.invoice.create).mockResolvedValue({
        id: 'invoice-1',
        invoiceNo: 'AA00000001',
      } as never)

      const b2bInvoiceData = {
        orderId: 'order-1',
        invoiceType: 'B2B' as const,
        buyerTaxId: '12345678',
        buyerName: '測試公司',
      }

      await createInvoice(b2bInvoiceData)

      expect(prisma.invoice.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            invoiceType: 'B2B',
            buyerTaxId: '12345678',
            buyerName: '測試公司',
          }),
        })
      )
    })

    it('應支援捐贈碼', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        id: 'order-1',
        totalAmount: 1000,
        customer: null,
      } as never)
      vi.mocked(prisma.invoice.findFirst).mockResolvedValueOnce(null)
      vi.mocked(prisma.invoice.findFirst).mockResolvedValueOnce(null)
      vi.mocked(prisma.invoice.create).mockResolvedValue({
        id: 'invoice-1',
        invoiceNo: 'AA00000001',
      } as never)

      const donationInvoiceData = {
        orderId: 'order-1',
        invoiceType: 'B2C' as const,
        donationCode: '25885',
      }

      await createInvoice(donationInvoiceData)

      expect(prisma.invoice.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            donationCode: '25885',
          }),
        })
      )
    })

    it('應使用訂單會員名稱作為買受人（如未指定）', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        id: 'order-1',
        totalAmount: 1000,
        customer: { name: '張三' },
      } as never)
      vi.mocked(prisma.invoice.findFirst).mockResolvedValueOnce(null)
      vi.mocked(prisma.invoice.findFirst).mockResolvedValueOnce(null)
      vi.mocked(prisma.invoice.create).mockResolvedValue({
        id: 'invoice-1',
        invoiceNo: 'AA00000001',
      } as never)

      await createInvoice({
        orderId: 'order-1',
        invoiceType: 'B2C',
      })

      expect(prisma.invoice.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            buyerName: '張三',
          }),
        })
      )
    })

    it('資料庫錯誤時應回傳失敗', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        id: 'order-1',
        totalAmount: 1000,
        customer: null,
      } as never)
      vi.mocked(prisma.invoice.findFirst).mockResolvedValueOnce(null)
      vi.mocked(prisma.invoice.findFirst).mockResolvedValueOnce(null)
      vi.mocked(prisma.invoice.create).mockRejectedValue(new Error('DB Error'))

      const result = await createInvoice(validInvoiceData)

      expect(result.success).toBe(false)
      expect(result.message).toBe('開立發票失敗')
    })

    it('應生成正確格式的發票號碼', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        id: 'order-1',
        totalAmount: 1000,
        customer: null,
      } as never)
      vi.mocked(prisma.invoice.findFirst).mockResolvedValueOnce(null)
      vi.mocked(prisma.invoice.findFirst).mockResolvedValueOnce({
        invoiceNo: 'AA00000005',
      } as never)
      vi.mocked(prisma.invoice.create).mockResolvedValue({
        id: 'invoice-1',
        invoiceNo: 'AA00000006',
      } as never)

      await createInvoice(validInvoiceData)

      expect(prisma.invoice.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            invoiceNo: expect.stringMatching(/^AA\d{8}$/),
          }),
        })
      )
    })
  })

  describe('voidInvoice', () => {
    it('應成功作廢發票', async () => {
      vi.mocked(prisma.invoice.findUnique).mockResolvedValue({
        id: 'invoice-1',
        orderId: 'order-1',
        status: 'ISSUED',
      } as never)
      vi.mocked(prisma.invoice.update).mockResolvedValue({
        id: 'invoice-1',
        status: 'VOIDED',
        order: { id: 'order-1' },
      } as never)

      const result = await voidInvoice('invoice-1', '客戶要求')

      expect(result.success).toBe(true)
      expect(result.message).toBe('發票已作廢')
      expect(prisma.invoice.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'VOIDED',
            voidedAt: expect.any(Date),
            voidReason: '客戶要求',
          }),
        })
      )
    })

    it('發票不存在時應回傳錯誤', async () => {
      vi.mocked(prisma.invoice.findUnique).mockResolvedValue(null)

      const result = await voidInvoice('nonexistent', '原因')

      expect(result.success).toBe(false)
      expect(result.message).toBe('發票不存在')
    })

    it('發票已作廢時應回傳錯誤', async () => {
      vi.mocked(prisma.invoice.findUnique).mockResolvedValue({
        id: 'invoice-1',
        status: 'VOIDED',
      } as never)

      const result = await voidInvoice('invoice-1', '原因')

      expect(result.success).toBe(false)
      expect(result.message).toBe('發票已作廢')
    })

    it('資料庫錯誤時應回傳失敗', async () => {
      vi.mocked(prisma.invoice.findUnique).mockResolvedValue({
        id: 'invoice-1',
        orderId: 'order-1',
        status: 'ISSUED',
      } as never)
      vi.mocked(prisma.invoice.update).mockRejectedValue(new Error('DB Error'))

      const result = await voidInvoice('invoice-1', '原因')

      expect(result.success).toBe(false)
      expect(result.message).toBe('作廢發票失敗')
    })
  })

  describe('getInvoices', () => {
    it('應回傳分頁的發票列表', async () => {
      const mockInvoices = [
        {
          id: 'invoice-1',
          invoiceNo: 'AA00000001',
          status: 'ISSUED',
          order: {
            id: 'order-1',
            orderNo: 'ORD-20240115-0001',
            orderDate: new Date(),
            totalAmount: 1000,
            customer: { id: 'c1', name: '張三' },
          },
        },
      ]

      vi.mocked(prisma.invoice.findMany).mockResolvedValue(mockInvoices as never)
      vi.mocked(prisma.invoice.count).mockResolvedValue(1)

      const result = await getInvoices({ page: 1, pageSize: 20 })

      expect(result.success).toBe(true)
      expect((result.data as any)?.invoices).toHaveLength(1)
      expect((result.data as any)?.pagination).toEqual({
        page: 1,
        pageSize: 20,
        total: 1,
        totalPages: 1,
      })
    })

    it('應支援依訂單篩選', async () => {
      vi.mocked(prisma.invoice.findMany).mockResolvedValue([])
      vi.mocked(prisma.invoice.count).mockResolvedValue(0)

      await getInvoices({ orderId: 'order-1' })

      expect(prisma.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ orderId: 'order-1' }),
        })
      )
    })

    it('應支援依發票類型篩選', async () => {
      vi.mocked(prisma.invoice.findMany).mockResolvedValue([])
      vi.mocked(prisma.invoice.count).mockResolvedValue(0)

      await getInvoices({ invoiceType: 'B2B' })

      expect(prisma.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ invoiceType: 'B2B' }),
        })
      )
    })

    it('應支援依狀態篩選', async () => {
      vi.mocked(prisma.invoice.findMany).mockResolvedValue([])
      vi.mocked(prisma.invoice.count).mockResolvedValue(0)

      await getInvoices({ status: 'VOIDED' })

      expect(prisma.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'VOIDED' }),
        })
      )
    })

    it('應支援日期範圍篩選', async () => {
      vi.mocked(prisma.invoice.findMany).mockResolvedValue([])
      vi.mocked(prisma.invoice.count).mockResolvedValue(0)

      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-31')

      await getInvoices({ startDate, endDate })

      expect(prisma.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            issuedAt: {
              gte: startDate,
              lte: endDate,
            },
          }),
        })
      )
    })

    it('應使用預設分頁參數', async () => {
      vi.mocked(prisma.invoice.findMany).mockResolvedValue([])
      vi.mocked(prisma.invoice.count).mockResolvedValue(0)

      const result = await getInvoices()

      expect((result.data as any)?.pagination.page).toBe(1)
      expect((result.data as any)?.pagination.pageSize).toBe(20)
    })

    it('應正確計算分頁資訊', async () => {
      vi.mocked(prisma.invoice.findMany).mockResolvedValue([])
      vi.mocked(prisma.invoice.count).mockResolvedValue(50)

      const result = await getInvoices({ page: 2, pageSize: 20 })

      expect((result.data as any)?.pagination.totalPages).toBe(3)
    })

    it('資料庫錯誤時應回傳失敗', async () => {
      vi.mocked(prisma.invoice.findMany).mockRejectedValue(new Error('DB Error'))

      const result = await getInvoices()

      expect(result.success).toBe(false)
      expect(result.message).toBe('取得發票列表失敗')
    })
  })

  describe('getInvoice', () => {
    it('應回傳發票詳情', async () => {
      const mockInvoice = {
        id: 'invoice-1',
        invoiceNo: 'AA00000001',
        status: 'ISSUED',
        order: {
          items: [
            {
              product: { id: 'p1', name: '商品1', sku: 'S1' },
            },
          ],
          customer: { id: 'c1', name: '張三', email: 'customer@example.com', phone: '0912345678' },
          store: { id: 's1', name: '台北店', code: 'TPE', address: '台北市XX路' },
          user: { id: 'u1', username: 'cashier1' },
        },
      }

      vi.mocked(prisma.invoice.findUnique).mockResolvedValue(mockInvoice as never)

      const result = await getInvoice('invoice-1')

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockInvoice)
    })

    it('發票不存在時應回傳錯誤', async () => {
      vi.mocked(prisma.invoice.findUnique).mockResolvedValue(null)

      const result = await getInvoice('nonexistent')

      expect(result.success).toBe(false)
      expect(result.message).toBe('發票不存在')
    })

    it('資料庫錯誤時應回傳失敗', async () => {
      vi.mocked(prisma.invoice.findUnique).mockRejectedValue(new Error('DB Error'))

      const result = await getInvoice('invoice-1')

      expect(result.success).toBe(false)
      expect(result.message).toBe('取得發票失敗')
    })
  })
})
