'use client'

import { useState } from 'react'
import { usePOSStore } from '@/stores/pos-store'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface Product {
  id: string
  sku: string
  barcode: string | null
  name: string
  shortName: string | null
  sellingPrice: number
  imageUrl: string | null
  category: { id: string; name: string }
  unit: { name: string }
}

interface Category {
  id: string
  name: string
}

interface ProductGridProps {
  products: Product[]
  categories: Category[]
}

export function ProductGrid({ products, categories }: ProductGridProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const addItem = usePOSStore((s) => s.addItem)

  const filteredProducts = selectedCategory
    ? products.filter((p) => p.category.id === selectedCategory)
    : products

  const handleAddProduct = (product: Product) => {
    addItem({
      productId: product.id,
      productName: product.name,
      productSku: product.sku,
      unitPrice: product.sellingPrice,
      quantity: 1,
      discount: 0,
      imageUrl: product.imageUrl,
    })
  }

  return (
    <div className="space-y-3">
      {/* 分類篩選 */}
      <div className="flex flex-wrap gap-2">
        <Badge
          variant={selectedCategory === null ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => setSelectedCategory(null)}
        >
          全部
        </Badge>
        {categories.map((cat) => (
          <Badge
            key={cat.id}
            variant={selectedCategory === cat.id ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setSelectedCategory(cat.id)}
          >
            {cat.name}
          </Badge>
        ))}
      </div>

      {/* 商品網格 */}
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
        {filteredProducts.map((product) => (
          <button
            key={product.id}
            className={cn(
              'flex flex-col items-center p-3 rounded-lg border bg-card',
              'hover:border-primary hover:shadow-sm transition-all',
              'text-center cursor-pointer'
            )}
            onClick={() => handleAddProduct(product)}
          >
            {product.imageUrl ? (
              <div className="w-16 h-16 rounded bg-muted mb-2 overflow-hidden">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-16 h-16 rounded bg-muted mb-2 flex items-center justify-center text-muted-foreground text-xs">
                {product.shortName || product.name.slice(0, 2)}
              </div>
            )}
            <p className="text-xs font-medium truncate w-full">
              {product.shortName || product.name}
            </p>
            <p className="text-sm font-bold text-primary mt-1">
              ${product.sellingPrice.toLocaleString()}
            </p>
          </button>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">此分類沒有商品</div>
      )}
    </div>
  )
}
