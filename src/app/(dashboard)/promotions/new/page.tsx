'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Search } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { createPromotion } from '@/actions/promotions'
import { getProducts } from '@/actions/products'

interface Product {
  id: string
  sku: string
  name: string
}

/**
 * 新增促銷活動頁面
 */
export default function NewPromotionPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  // 表單狀態
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState('DISCOUNT')
  const [discountType, setDiscountType] = useState('PERCENTAGE')
  const [discountValue, setDiscountValue] = useState('')
  const [minPurchase, setMinPurchase] = useState('')
  const [maxDiscount, setMaxDiscount] = useState('')
  const [usageLimit, setUsageLimit] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isActive, setIsActive] = useState(true)

  // 適用商品
  const [productIds, setProductIds] = useState<string[]>([])
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([])
  const [productSearch, setProductSearch] = useState('')
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [productDialogOpen, setProductDialogOpen] = useState(false)
  const [productLoading, setProductLoading] = useState(false)

  // 搜尋商品
  const searchProducts = async () => {
    if (!productSearch.trim()) return
    setProductLoading(true)
    const data = await getProducts({ search: productSearch, pageSize: 20 })
    setSearchResults(data.data || [])
    setProductLoading(false)
  }

  // 新增商品
  const addProduct = (product: Product) => {
    if (!productIds.includes(product.id)) {
      setProductIds([...productIds, product.id])
      setSelectedProducts([...selectedProducts, product])
    }
    setProductDialogOpen(false)
    setProductSearch('')
    setSearchResults([])
  }

  // 移除商品
  const removeProduct = (productId: string) => {
    setProductIds(productIds.filter((id) => id !== productId))
    setSelectedProducts(selectedProducts.filter((p) => p.id !== productId))
  }

  // 提交表單
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!code || !name || !startDate || !endDate) {
      toast.error('請填寫必要欄位')
      return
    }

    setSubmitting(true)

    const result = await createPromotion({
      code,
      name,
      description: description || undefined,
      type,
      discountType: type === 'DISCOUNT' ? discountType : undefined,
      discountValue: discountValue ? Number(discountValue) : undefined,
      minPurchase: minPurchase ? Number(minPurchase) : undefined,
      maxDiscount: maxDiscount ? Number(maxDiscount) : undefined,
      usageLimit: usageLimit ? Number(usageLimit) : undefined,
      startDate,
      endDate,
      productIds: productIds.length > 0 ? productIds : undefined,
      isActive,
    })

    setSubmitting(false)

    if (result.success) {
      toast.success(result.message)
      router.push('/promotions')
    } else {
      toast.error(result.message)
    }
  }

  return (
    <div className="space-y-6">
      {/* 頁面標題 */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/promotions">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">新增促銷活動</h1>
          <p className="text-sm text-muted-foreground">建立新的促銷活動</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* 左側：基本資訊 */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>基本資訊</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="code">促銷代碼 *</Label>
                    <Input
                      id="code"
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      placeholder="例：SUMMER2024"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">活動名稱 *</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="例：夏季特賣會"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">活動說明</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="輸入活動說明..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>折扣設定</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="type">促銷類型 *</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DISCOUNT">折扣優惠</SelectItem>
                      <SelectItem value="GIFT">贈品活動</SelectItem>
                      <SelectItem value="BUNDLE">組合優惠</SelectItem>
                      <SelectItem value="POINTS">點數加倍</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {type === 'DISCOUNT' && (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="discountType">折扣方式</Label>
                        <Select value={discountType} onValueChange={setDiscountType}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PERCENTAGE">百分比折扣</SelectItem>
                            <SelectItem value="FIXED">固定金額</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="discountValue">
                          折扣值 {discountType === 'PERCENTAGE' ? '(%)' : '(NT$)'}
                        </Label>
                        <Input
                          id="discountValue"
                          type="number"
                          min="0"
                          value={discountValue}
                          onChange={(e) => setDiscountValue(e.target.value)}
                          placeholder={discountType === 'PERCENTAGE' ? '10' : '100'}
                        />
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="minPurchase">最低消費金額</Label>
                        <Input
                          id="minPurchase"
                          type="number"
                          min="0"
                          value={minPurchase}
                          onChange={(e) => setMinPurchase(e.target.value)}
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="maxDiscount">最高折扣金額</Label>
                        <Input
                          id="maxDiscount"
                          type="number"
                          min="0"
                          value={maxDiscount}
                          onChange={(e) => setMaxDiscount(e.target.value)}
                          placeholder="不限"
                        />
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>適用商品</CardTitle>
                <CardDescription>不選擇則適用全部商品</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full mb-4"
                  onClick={() => setProductDialogOpen(true)}
                >
                  <Search className="mr-2 h-4 w-4" />
                  新增適用商品
                </Button>

                {selectedProducts.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedProducts.map((product) => (
                      <Badge
                        key={product.id}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => removeProduct(product.id)}
                      >
                        {product.name} ×
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 右側：期間與設定 */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>活動期間</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">開始日期 *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">結束日期 *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>其他設定</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="usageLimit">使用次數限制</Label>
                  <Input
                    id="usageLimit"
                    type="number"
                    min="0"
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(e.target.value)}
                    placeholder="不限"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>立即啟用</Label>
                    <p className="text-sm text-muted-foreground">建立後立即生效</p>
                  </div>
                  <Switch checked={isActive} onCheckedChange={setIsActive} />
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                {submitting ? '處理中...' : '建立促銷活動'}
              </Button>
              <Button type="button" variant="outline" className="w-full" asChild>
                <Link href="/promotions">取消</Link>
              </Button>
            </div>
          </div>
        </div>
      </form>

      {/* 商品搜尋對話框 */}
      <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>搜尋商品</DialogTitle>
            <DialogDescription>選擇適用此促銷活動的商品</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="輸入商品編號或名稱..."
                onKeyDown={(e) => e.key === 'Enter' && searchProducts()}
              />
              <Button onClick={searchProducts} disabled={productLoading}>
                搜尋
              </Button>
            </div>
            {productLoading ? (
              <div className="text-center py-4 text-muted-foreground">搜尋中...</div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                {productSearch ? '沒有找到商品' : '請輸入關鍵字搜尋'}
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-2">
                {searchResults.map((product) => (
                  <div
                    key={product.id}
                    className={`p-3 rounded-lg border cursor-pointer hover:bg-muted ${
                      productIds.includes(product.id) ? 'bg-muted' : ''
                    }`}
                    onClick={() => addProduct(product)}
                  >
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-muted-foreground">{product.sku}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
