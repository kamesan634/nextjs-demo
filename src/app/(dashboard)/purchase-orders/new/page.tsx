'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Search, Plus, Minus, Trash2, Building2, Package } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import { Separator } from '@/components/ui/separator'
import { createPurchaseOrder, updatePurchaseOrderStatus } from '@/actions/purchase-orders'
import { getProducts } from '@/actions/products'
import { getSuppliers } from '@/actions/suppliers'

interface Product {
  id: string
  sku: string
  name: string
  costPrice: number | null
  sellingPrice: number
}

interface Supplier {
  id: string
  code: string
  name: string
  shortName: string | null
}

interface OrderItem {
  productId: string
  productSku: string
  productName: string
  unitPrice: number
  quantity: number
  subtotal: number
}

/**
 * 新增採購單頁面
 */
export default function NewPurchaseOrderPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  // 供應商
  const [supplierId, setSupplierId] = useState<string>('')
  const [suppliers, setSuppliers] = useState<Supplier[]>([])

  // 商品搜尋
  const [productSearch, setProductSearch] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [productDialogOpen, setProductDialogOpen] = useState(false)
  const [productLoading, setProductLoading] = useState(false)

  // 採購明細
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [expectedDate, setExpectedDate] = useState('')
  const [notes, setNotes] = useState('')

  // 載入供應商列表
  useEffect(() => {
    getSuppliers({ isActive: true }).then((data) => {
      setSuppliers(data.data || [])
    })
  }, [])

  // 搜尋商品
  const searchProducts = async () => {
    if (!productSearch.trim()) return
    setProductLoading(true)
    const data = await getProducts({ search: productSearch, pageSize: 20 })
    setProducts(data.data || [])
    setProductLoading(false)
  }

  // 新增商品到採購單
  const addProduct = (product: Product) => {
    const existing = orderItems.find((item) => item.productId === product.id)
    if (existing) {
      // 增加數量
      setOrderItems(
        orderItems.map((item) =>
          item.productId === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                subtotal: item.unitPrice * (item.quantity + 1),
              }
            : item
        )
      )
    } else {
      // 新增商品（使用成本價作為採購價）
      const unitPrice = product.costPrice
        ? Number(product.costPrice)
        : Number(product.sellingPrice) * 0.6
      setOrderItems([
        ...orderItems,
        {
          productId: product.id,
          productSku: product.sku,
          productName: product.name,
          unitPrice,
          quantity: 1,
          subtotal: unitPrice,
        },
      ])
    }
    setProductDialogOpen(false)
    setProductSearch('')
    setProducts([])
  }

  // 更新商品數量
  const updateQuantity = (productId: string, delta: number) => {
    setOrderItems(
      orderItems
        .map((item) =>
          item.productId === productId
            ? {
                ...item,
                quantity: Math.max(1, item.quantity + delta),
                subtotal: item.unitPrice * Math.max(1, item.quantity + delta),
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    )
  }

  // 更新商品單價
  const updateUnitPrice = (productId: string, unitPrice: number) => {
    setOrderItems(
      orderItems.map((item) =>
        item.productId === productId
          ? {
              ...item,
              unitPrice,
              subtotal: unitPrice * item.quantity,
            }
          : item
      )
    )
  }

  // 移除商品
  const removeProduct = (productId: string) => {
    setOrderItems(orderItems.filter((item) => item.productId !== productId))
  }

  // 計算金額
  const subtotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0)
  const taxAmount = subtotal * 0.05
  const totalAmount = subtotal + taxAmount

  // 格式化金額
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // 提交採購單（草稿）
  const handleSaveDraft = async () => {
    if (!supplierId) {
      toast.error('請選擇供應商')
      return
    }
    if (orderItems.length === 0) {
      toast.error('請至少加入一項商品')
      return
    }

    setSubmitting(true)

    const result = await createPurchaseOrder({
      supplierId,
      expectedDate: expectedDate || undefined,
      items: orderItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      notes: notes || undefined,
    })

    setSubmitting(false)

    if (result.success) {
      toast.success(result.message)
      router.push(`/purchase-orders/${result.data?.id}`)
    } else {
      toast.error(result.message)
    }
  }

  // 提交採購單（送審）
  const handleSubmitForApproval = async () => {
    if (!supplierId) {
      toast.error('請選擇供應商')
      return
    }
    if (orderItems.length === 0) {
      toast.error('請至少加入一項商品')
      return
    }

    setSubmitting(true)

    const result = await createPurchaseOrder({
      supplierId,
      expectedDate: expectedDate || undefined,
      items: orderItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      notes: notes || undefined,
    })

    if (result.success && result.data?.id) {
      // 更新狀態為待審核
      await updatePurchaseOrderStatus(result.data.id, 'PENDING')
      toast.success('採購單已送審')
      router.push(`/purchase-orders/${result.data.id}`)
    } else {
      toast.error(result.message)
    }

    setSubmitting(false)
  }

  return (
    <div className="space-y-6">
      {/* 頁面標題 */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/purchase-orders">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">新增採購單</h1>
          <p className="text-sm text-muted-foreground">建立新的採購單</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 左側：商品選擇與明細 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 商品搜尋 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                採購明細
              </CardTitle>
              <CardDescription>搜尋並加入商品到採購單</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full mb-4"
                onClick={() => setProductDialogOpen(true)}
              >
                <Search className="mr-2 h-4 w-4" />
                搜尋商品
              </Button>

              {orderItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  尚未加入商品，請點擊上方按鈕搜尋商品
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>商品</TableHead>
                      <TableHead className="text-right w-[120px]">單價</TableHead>
                      <TableHead className="text-center w-[120px]">數量</TableHead>
                      <TableHead className="text-right">小計</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orderItems.map((item) => (
                      <TableRow key={item.productId}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.productName}</div>
                            <div className="text-xs text-muted-foreground">{item.productSku}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            value={item.unitPrice}
                            onChange={(e) =>
                              updateUnitPrice(item.productId, Number(e.target.value))
                            }
                            className="h-8 w-24 text-right"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(item.productId, -1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(item.productId, 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(item.subtotal)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => removeProduct(item.productId)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* 備註 */}
          <Card>
            <CardHeader>
              <CardTitle>備註</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="輸入採購備註..."
                rows={3}
              />
            </CardContent>
          </Card>
        </div>

        {/* 右側：採購資訊 */}
        <div className="space-y-6">
          {/* 供應商選擇 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                供應商
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger>
                  <SelectValue placeholder="選擇供應商" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.shortName || supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* 預計交貨日 */}
          <Card>
            <CardHeader>
              <CardTitle>預計交貨日</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                type="date"
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
              />
            </CardContent>
          </Card>

          {/* 金額摘要 */}
          <Card>
            <CardHeader>
              <CardTitle>金額摘要</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">小計</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">稅額 (5%)</span>
                <span>{formatCurrency(taxAmount)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>總金額</span>
                <span>{formatCurrency(totalAmount)}</span>
              </div>
            </CardContent>
          </Card>

          {/* 提交按鈕 */}
          <div className="space-y-2">
            <Button
              className="w-full"
              size="lg"
              onClick={handleSubmitForApproval}
              disabled={submitting || !supplierId || orderItems.length === 0}
            >
              {submitting ? '處理中...' : '送審'}
            </Button>
            <Button
              className="w-full"
              variant="outline"
              onClick={handleSaveDraft}
              disabled={submitting || !supplierId || orderItems.length === 0}
            >
              儲存草稿
            </Button>
          </div>
        </div>
      </div>

      {/* 商品搜尋對話框 */}
      <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>搜尋商品</DialogTitle>
            <DialogDescription>輸入商品編號或名稱搜尋</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="輸入搜尋關鍵字..."
                onKeyDown={(e) => e.key === 'Enter' && searchProducts()}
              />
              <Button onClick={searchProducts} disabled={productLoading}>
                搜尋
              </Button>
            </div>
            {productLoading ? (
              <div className="text-center py-4 text-muted-foreground">搜尋中...</div>
            ) : products.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                {productSearch ? '沒有找到商品' : '請輸入關鍵字搜尋'}
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-2">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="p-3 rounded-lg border cursor-pointer hover:bg-muted"
                    onClick={() => addProduct(product)}
                  >
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-muted-foreground">{product.sku}</div>
                    <div className="text-sm">
                      成本價：
                      {formatCurrency(
                        product.costPrice
                          ? Number(product.costPrice)
                          : Number(product.sellingPrice) * 0.6
                      )}
                    </div>
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
