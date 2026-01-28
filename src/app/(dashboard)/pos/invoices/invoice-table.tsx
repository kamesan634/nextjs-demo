'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, XCircle } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'
import { voidInvoice } from '@/actions/invoices'
import { DataTable, type ColumnDef } from '@/components/data-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import type { PaginationInfo } from '@/types'

export interface InvoiceListItem {
  id: string
  invoiceNo: string
  invoiceType: string
  buyerTaxId: string | null
  amount: number
  taxAmount: number | null
  totalAmount: number
  status: string
  issuedAt: Date
  order: {
    id: string
    orderNo: string
    orderDate: Date
    totalAmount: number
    customer: {
      id: string
      name: string
    } | null
  }
}

interface InvoiceTableProps {
  invoices: InvoiceListItem[]
  pagination: PaginationInfo
}

const statusMap: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  ISSUED: { label: '已開立', variant: 'default' },
  VOIDED: { label: '已作廢', variant: 'destructive' },
}

const typeMap: Record<string, string> = {
  B2B: '三聯式',
  B2C: '二聯式',
}

/**
 * 發票列表元件
 */
export function InvoiceTable({ invoices, pagination }: InvoiceTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [voidDialogOpen, setVoidDialogOpen] = useState(false)
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null)
  const [voidReason, setVoidReason] = useState('')
  const [isVoiding, setIsVoiding] = useState(false)

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', page.toString())
    router.push(`?${params.toString()}`)
  }

  const handleSearch = (search: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (search) {
      params.set('search', search)
    } else {
      params.delete('search')
    }
    params.set('page', '1')
    router.push(`?${params.toString()}`)
  }

  const handleVoid = async () => {
    if (!selectedInvoiceId || !voidReason.trim()) {
      toast.error('請輸入作廢原因')
      return
    }

    setIsVoiding(true)
    const result = await voidInvoice(selectedInvoiceId, voidReason)
    setIsVoiding(false)

    if (result.success) {
      toast.success(result.message)
      setVoidDialogOpen(false)
      setVoidReason('')
      setSelectedInvoiceId(null)
      router.refresh()
    } else {
      toast.error(result.message)
    }
  }

  const columns: ColumnDef<InvoiceListItem>[] = [
    {
      id: 'invoiceNo',
      header: '發票號碼',
      accessorKey: 'invoiceNo',
      sortable: true,
    },
    {
      id: 'orderNo',
      header: '訂單編號',
      cell: (row) => (
        <Link href={`/orders/${row.order.id}`} className="text-blue-600 hover:underline">
          {row.order.orderNo}
        </Link>
      ),
    },
    {
      id: 'invoiceType',
      header: '發票類型',
      cell: (row) => typeMap[row.invoiceType] || row.invoiceType,
    },
    {
      id: 'buyerTaxId',
      header: '統一編號',
      cell: (row) => row.buyerTaxId || '-',
    },
    {
      id: 'customer',
      header: '客戶',
      cell: (row) => row.order.customer?.name || '-',
    },
    {
      id: 'amount',
      header: '未稅金額',
      cell: (row) => `NT$ ${row.amount.toLocaleString()}`,
      className: 'text-right',
    },
    {
      id: 'taxAmount',
      header: '稅額',
      cell: (row) =>
        row.taxAmount !== null ? `NT$ ${Number(row.taxAmount).toLocaleString()}` : '-',
      className: 'text-right',
    },
    {
      id: 'totalAmount',
      header: '總金額',
      cell: (row) => {
        const total = Number(row.amount) + Number(row.taxAmount || 0)
        return `NT$ ${total.toLocaleString()}`
      },
      className: 'text-right',
    },
    {
      id: 'status',
      header: '狀態',
      cell: (row) => {
        const status = statusMap[row.status] || { label: row.status, variant: 'outline' as const }
        return <Badge variant={status.variant}>{status.label}</Badge>
      },
    },
    {
      id: 'issuedAt',
      header: '開立時間',
      cell: (row) => new Date(row.issuedAt).toLocaleString('zh-TW'),
      sortable: true,
    },
    {
      id: 'actions',
      header: '操作',
      className: 'w-[100px]',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/pos/invoices/${row.id}`}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
          {row.status === 'ISSUED' && (
            <Dialog
              open={voidDialogOpen && selectedInvoiceId === row.id}
              onOpenChange={(open) => {
                setVoidDialogOpen(open)
                if (open) {
                  setSelectedInvoiceId(row.id)
                } else {
                  setSelectedInvoiceId(null)
                  setVoidReason('')
                }
              }}
            >
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>作廢發票</DialogTitle>
                  <DialogDescription>
                    將作廢發票「{row.invoiceNo}」，此操作無法復原。
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="reason">作廢原因</Label>
                    <Textarea
                      id="reason"
                      placeholder="請輸入作廢原因..."
                      value={voidReason}
                      onChange={(e) => setVoidReason(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setVoidDialogOpen(false)
                      setVoidReason('')
                      setSelectedInvoiceId(null)
                    }}
                  >
                    取消
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleVoid}
                    disabled={isVoiding || !voidReason.trim()}
                  >
                    {isVoiding ? '作廢中...' : '確認作廢'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      ),
    },
  ]

  return (
    <DataTable<InvoiceListItem>
      columns={columns}
      data={invoices}
      pagination={pagination}
      onPageChange={handlePageChange}
      onSearch={handleSearch}
      searchPlaceholder="搜尋發票號碼或訂單編號..."
      rowKey={(row) => row.id}
      emptyMessage="尚無發票資料"
    />
  )
}
