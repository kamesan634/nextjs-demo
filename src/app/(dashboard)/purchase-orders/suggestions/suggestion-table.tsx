'use client'

import { DataTable, type ColumnDef } from '@/components/data-table'
import { Badge } from '@/components/ui/badge'
import type { PaginationInfo } from '@/types'

type PurchaseSuggestion = {
  productId: string
  productSku: string
  productName: string
  category: string
  currentStock: number
  availableStock: number
  safetyStock: number
  reorderPoint: number
  suggestedQty: number
  costPrice: number
  supplierId: string | null
  supplierName: string
  supplierPrice: number
  urgency: string
}

interface SuggestionTableProps {
  data: PurchaseSuggestion[]
  pagination: PaginationInfo
}

const urgencyMap: Record<
  string,
  { label: string; variant: 'default' | 'destructive' | 'outline' }
> = {
  CRITICAL: { label: '緊急', variant: 'destructive' },
  HIGH: { label: '高', variant: 'default' },
  NORMAL: { label: '正常', variant: 'outline' },
}

export function SuggestionTable({ data, pagination }: SuggestionTableProps) {
  const columns: ColumnDef<PurchaseSuggestion>[] = [
    {
      id: 'productSku',
      accessorKey: 'productSku',
      header: '商品編號',
    },
    {
      id: 'productName',
      accessorKey: 'productName',
      header: '商品名稱',
    },
    {
      id: 'category',
      accessorKey: 'category',
      header: '類別',
    },
    {
      id: 'currentStock',
      accessorKey: 'currentStock',
      header: '現有庫存',
      cell: (row) => (
        <div className={row.currentStock <= 0 ? 'text-red-600 font-semibold' : ''}>
          {row.currentStock}
        </div>
      ),
    },
    {
      id: 'reorderPoint',
      accessorKey: 'reorderPoint',
      header: '補貨點',
    },
    {
      id: 'suggestedQty',
      accessorKey: 'suggestedQty',
      header: '建議採購量',
      cell: (row) => <div className="font-semibold">{row.suggestedQty}</div>,
    },
    {
      id: 'supplierName',
      accessorKey: 'supplierName',
      header: '供應商',
    },
    {
      id: 'supplierPrice',
      accessorKey: 'supplierPrice',
      header: '供應商價格',
      cell: (row) => `$${row.supplierPrice.toLocaleString()}`,
    },
    {
      id: 'estimatedAmount',
      header: '預估金額',
      cell: (row) => {
        const total = row.suggestedQty * row.supplierPrice
        return `$${total.toLocaleString()}`
      },
    },
    {
      id: 'urgency',
      accessorKey: 'urgency',
      header: '緊急程度',
      cell: (row) => {
        const urgency = urgencyMap[row.urgency]
        return <Badge variant={urgency.variant}>{urgency.label}</Badge>
      },
    },
  ]

  return <DataTable columns={columns} data={data} pagination={pagination} />
}
