'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import type { ActionResult } from '@/types'

interface CreateInvoiceData {
  orderId: string
  invoiceType: 'B2B' | 'B2C'
  buyerTaxId?: string
  buyerName?: string
  carrierType?: string
  carrierNo?: string
  donationCode?: string
}

interface GetInvoicesParams {
  orderId?: string
  invoiceType?: 'B2B' | 'B2C'
  status?: 'ISSUED' | 'VOIDED'
  startDate?: Date
  endDate?: Date
  page?: number
  pageSize?: number
}

/**
 * 生成發票號碼
 */
async function generateInvoiceNo(): Promise<string> {
  const today = new Date()
  const year = today.getFullYear()
  const month = (today.getMonth() + 1).toString().padStart(2, '0')

  // 發票號碼格式：AA12345678 (前綴 + 8 位數字)
  const prefix = 'AA' // 可以根據實際情況調整

  const lastInvoice = await prisma.invoice.findFirst({
    where: {
      invoiceNo: {
        startsWith: prefix,
      },
      createdAt: {
        gte: new Date(year, parseInt(month) - 1, 1),
        lt: new Date(year, parseInt(month), 1),
      },
    },
    orderBy: {
      invoiceNo: 'desc',
    },
  })

  let sequence = 1
  if (lastInvoice) {
    const lastSequence = parseInt(lastInvoice.invoiceNo.substring(2))
    sequence = lastSequence + 1
  }

  return `${prefix}${sequence.toString().padStart(8, '0')}`
}

/**
 * 建立發票
 */
export async function createInvoice(data: CreateInvoiceData): Promise<ActionResult> {
  try {
    // 檢查訂單是否存在
    const order = await prisma.order.findUnique({
      where: { id: data.orderId },
      include: {
        customer: true,
      },
    })

    if (!order) {
      return {
        success: false,
        message: '訂單不存在',
      }
    }

    // 檢查是否已有發票
    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        orderId: data.orderId,
        status: 'ISSUED',
      },
    })

    if (existingInvoice) {
      return {
        success: false,
        message: '此訂單已開立發票',
      }
    }

    const invoiceNo = await generateInvoiceNo()

    // 計算稅額 (假設 5% 稅率)
    const totalAmount = Number(order.totalAmount)
    const taxAmount = Math.round(totalAmount * 0.05)
    const amount = totalAmount - taxAmount

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNo,
        orderId: data.orderId,
        invoiceType: data.invoiceType,
        amount,
        taxAmount,
        totalAmount,
        status: 'ISSUED',
        issuedAt: new Date(),
        buyerTaxId: data.buyerTaxId,
        buyerName: data.buyerName || order.customer?.name,
        carrierType: data.carrierType,
        carrierNo: data.carrierNo,
        donationCode: data.donationCode,
      },
      include: {
        order: {
          include: {
            items: {
              include: {
                product: true,
              },
            },
            customer: true,
          },
        },
      },
    })

    revalidatePath('/pos/invoices')
    revalidatePath(`/orders/${data.orderId}`)

    return {
      success: true,
      message: '發票開立成功',
      data: invoice,
    }
  } catch (error) {
    console.error('Error creating invoice:', error)
    return {
      success: false,
      message: '開立發票失敗',
    }
  }
}

/**
 * 作廢發票
 */
export async function voidInvoice(id: string, reason: string): Promise<ActionResult> {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
    })

    if (!invoice) {
      return {
        success: false,
        message: '發票不存在',
      }
    }

    if (invoice.status === 'VOIDED') {
      return {
        success: false,
        message: '發票已作廢',
      }
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: {
        status: 'VOIDED',
        voidedAt: new Date(),
        voidReason: reason,
      },
      include: {
        order: true,
      },
    })

    revalidatePath('/pos/invoices')
    revalidatePath(`/orders/${invoice.orderId}`)

    return {
      success: true,
      message: '發票已作廢',
      data: updatedInvoice,
    }
  } catch (error) {
    console.error('Error voiding invoice:', error)
    return {
      success: false,
      message: '作廢發票失敗',
    }
  }
}

/**
 * 取得發票列表（含分頁）
 */
export async function getInvoices(params: GetInvoicesParams = {}): Promise<ActionResult> {
  try {
    const { orderId, invoiceType, status, startDate, endDate, page = 1, pageSize = 20 } = params

    const where: Prisma.InvoiceWhereInput = {}

    if (orderId) where.orderId = orderId
    if (invoiceType) where.invoiceType = invoiceType
    if (status) where.status = status

    if (startDate || endDate) {
      where.issuedAt = {}
      if (startDate) where.issuedAt.gte = startDate
      if (endDate) where.issuedAt.lte = endDate
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          order: {
            select: {
              id: true,
              orderNo: true,
              orderDate: true,
              totalAmount: true,
              customer: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          issuedAt: 'desc',
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.invoice.count({ where }),
    ])

    return {
      success: true,
      data: {
        invoices,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    }
  } catch (error) {
    console.error('Error getting invoices:', error)
    return {
      success: false,
      message: '取得發票列表失敗',
    }
  }
}

/**
 * 取得單一發票（含訂單資訊）
 */
export async function getInvoice(id: string): Promise<ActionResult> {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    sku: true,
                  },
                },
              },
            },
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
            store: {
              select: {
                id: true,
                name: true,
                code: true,
                address: true,
              },
            },
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
      },
    })

    if (!invoice) {
      return {
        success: false,
        message: '發票不存在',
      }
    }

    return {
      success: true,
      data: invoice,
    }
  } catch (error) {
    console.error('Error getting invoice:', error)
    return {
      success: false,
      message: '取得發票失敗',
    }
  }
}
