'use client'

import { useState, useCallback } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { usePOSStore } from '@/stores/pos-store'

export function ProductSearch() {
  const [query, setQuery] = useState('')
  const addItem = usePOSStore((s) => s.addItem)

  const handleKeyDown = useCallback(
    async (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && query.trim()) {
        try {
          const res = await fetch(`/api/products/search?q=${encodeURIComponent(query.trim())}`)
          if (res.ok) {
            const product = await res.json()
            if (product) {
              addItem({
                productId: product.id,
                productName: product.name,
                productSku: product.sku,
                unitPrice: product.sellingPrice,
                quantity: 1,
                discount: 0,
                imageUrl: product.imageUrl,
              })
              setQuery('')
            }
          }
        } catch {
          // 搜尋失敗不處理
        }
      }
    },
    [query, addItem]
  )

  return (
    <div className="relative flex-1 max-w-md">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="掃描條碼或搜尋商品..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        className="pl-9"
        autoFocus
      />
    </div>
  )
}
