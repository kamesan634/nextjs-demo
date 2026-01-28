'use client'

import { useState } from 'react'
import { Printer, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Product {
  id: string
  sku: string
  barcode: string | null
  name: string
  price: number
  unit: string
}

interface Category {
  id: string
  name: string
}

interface LabelPreviewProps {
  products: Product[]
  categories: Category[]
}

export function LabelPreview({ products, categories }: LabelPreviewProps) {
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [search, setSearch] = useState('')

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
  )

  const toggleProduct = (id: string) => {
    const newSelected = new Set(selectedProducts)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
      if (!quantities[id]) {
        setQuantities((prev) => ({ ...prev, [id]: 1 }))
      }
    }
    setSelectedProducts(newSelected)
  }

  const selectAll = () => {
    if (selectedProducts.size === filteredProducts.length) {
      setSelectedProducts(new Set())
    } else {
      const allIds = new Set(filteredProducts.map((p) => p.id))
      setSelectedProducts(allIds)
      const newQuantities = { ...quantities }
      filteredProducts.forEach((p) => {
        if (!newQuantities[p.id]) newQuantities[p.id] = 1
      })
      setQuantities(newQuantities)
    }
  }

  const handlePrint = () => {
    const selectedItems = products
      .filter((p) => selectedProducts.has(p.id))
      .map((p) => ({
        ...p,
        quantity: quantities[p.id] || 1,
      }))

    // 開啟列印預覽視窗
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const labels = selectedItems.flatMap((item) =>
      Array.from({ length: item.quantity }, () => item)
    )

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>商品標籤列印</title>
        <style>
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
          body { font-family: sans-serif; }
          .label-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
            padding: 10mm;
          }
          .label {
            border: 1px solid #ccc;
            padding: 8px;
            text-align: center;
            page-break-inside: avoid;
          }
          .label .name {
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 4px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .label .sku {
            font-size: 10px;
            color: #666;
            margin-bottom: 4px;
          }
          .label .barcode {
            font-size: 10px;
            font-family: monospace;
            margin-bottom: 4px;
          }
          .label .price {
            font-size: 16px;
            font-weight: bold;
            color: #e00;
          }
          .label .unit {
            font-size: 10px;
            color: #999;
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="padding:10px;text-align:center;">
          <button onclick="window.print()" style="padding:8px 24px;font-size:14px;cursor:pointer;">
            列印
          </button>
        </div>
        <div class="label-grid">
          ${labels
            .map(
              (item) => `
            <div class="label">
              <div class="name">${item.name}</div>
              <div class="sku">${item.sku}</div>
              ${item.barcode ? `<div class="barcode">${item.barcode}</div>` : ''}
              <div class="price">$${item.price.toLocaleString()}</div>
              <div class="unit">/ ${item.unit}</div>
            </div>
          `
            )
            .join('')}
        </div>
      </body>
      </html>
    `)
    printWindow.document.close()
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>選擇商品</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Input
              placeholder="搜尋商品名稱或 SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
            <Button variant="outline" onClick={selectAll}>
              <Check className="mr-2 h-4 w-4" />
              {selectedProducts.size === filteredProducts.length ? '取消全選' : '全選'}
            </Button>
            <Button onClick={handlePrint} disabled={selectedProducts.size === 0}>
              <Printer className="mr-2 h-4 w-4" />
              列印標籤 ({selectedProducts.size})
            </Button>
          </div>

          <div className="border rounded-lg divide-y max-h-[600px] overflow-y-auto">
            {filteredProducts.map((product) => (
              <div key={product.id} className="flex items-center gap-4 p-3 hover:bg-muted/50">
                <Checkbox
                  checked={selectedProducts.has(product.id)}
                  onCheckedChange={() => toggleProduct(product.id)}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{product.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {product.sku}
                    {product.barcode && ` | ${product.barcode}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">${product.price.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">/ {product.unit}</p>
                </div>
                {selectedProducts.has(product.id) && (
                  <Input
                    type="number"
                    min={1}
                    value={quantities[product.id] || 1}
                    onChange={(e) =>
                      setQuantities((prev) => ({
                        ...prev,
                        [product.id]: parseInt(e.target.value) || 1,
                      }))
                    }
                    className="w-[80px]"
                    placeholder="數量"
                  />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
