'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Search, Plus, Minus, Trash2, User, ShoppingCart } from 'lucide-react'
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
import { createOrder } from '@/actions/orders'
import { getProducts } from '@/actions/products'
import { getCustomers } from '@/actions/customers'
import { getStores } from '@/actions/stores'

interface Product {
  id: string
  sku: string
  name: string
  sellingPrice: number
  inventories?: {
    quantity: number
  }[]
}

interface Customer {
  id: string
  code: string
  name: string
  phone: string | null
  availablePoints: number
}

interface Store {
  id: string
  code: string
  name: string
}

interface OrderItem {
  productId: string
  productSku: string
  productName: string
  unitPrice: number
  quantity: number
  discount: number
  subtotal: number
}

/**
 * 新增訂單頁面
 */
export default function NewOrderPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  // 選擇會員
  const [customerId, setCustomerId] = useState<string>('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerSearch, setCustomerSearch] = useState('')
  const [customers, setCustomers] = useState<Customer[]>([])
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false)
  const [customerLoading, setCustomerLoading] = useState(false)

  // 選擇門市
  const [storeId, setStoreId] = useState<string>('')
  const [stores, setStores] = useState<Store[]>([])

  // 商品搜尋
  const [productSearch, setProductSearch] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [productDialogOpen, setProductDialogOpen] = useState(false)
  const [productLoading, setProductLoading] = useState(false)

  // 訂單明細
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [usedPoints, setUsedPoints] = useState(0)
  const [notes, setNotes] = useState('')

  // 載入門市列表
  useEffect(() => {
    getStores({ isActive: true }).then((data) => {
      setStores(data.data || [])
    })
  }, [])

  // 搜尋會員
  const searchCustomers = async () => {
    if (!customerSearch.trim()) return
    setCustomerLoading(true)
    const data = await getCustomers({ search: customerSearch, pageSize: 20 })
    setCustomers(data.data || [])
    setCustomerLoading(false)
  }

  // 選擇會員
  const selectCustomer = (customer: Customer) => {
    setCustomerId(customer.id)
    setSelectedCustomer(customer)
    setCustomerDialogOpen(false)
    setCustomerSearch('')
    setCustomers([])
    setUsedPoints(0) // 重置點數
  }

  // 清除會員
  const clearCustomer = () => {
    setCustomerId('')
    setSelectedCustomer(null)
    setUsedPoints(0)
  }

  // 搜尋商品
  const searchProducts = async () => {
    if (!productSearch.trim()) return
    setProductLoading(true)
    const data = await getProducts({ search: productSearch, pageSize: 20 })
    setProducts(data.data || [])
    setProductLoading(false)
  }

  // 新增商品到訂單
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
                subtotal: item.unitPrice * (item.quantity + 1) - item.discount,
              }
            : item
        )
      )
    } else {
      // 新增商品
      const unitPrice = Number(product.sellingPrice)
      setOrderItems([
        ...orderItems,
        {
          productId: product.id,
          productSku: product.sku,
          productName: product.name,
          unitPrice,
          quantity: 1,
          discount: 0,
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
                subtotal: item.unitPrice * Math.max(1, item.quantity + delta) - item.discount,
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    )
  }

  // 移除商品
  const removeProduct = (productId: string) => {
    setOrderItems(orderItems.filter((item) => item.productId !== productId))
  }

  // 更新商品折扣
  const updateDiscount = (productId: string, discount: number) => {
    setOrderItems(
      orderItems.map((item) =>
        item.productId === productId
          ? {
              ...item,
              discount,
              subtotal: item.unitPrice * item.quantity - discount,
            }
          : item
      )
    )
  }

  // 計算金額
  const subtotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0)
  const pointsDiscount = usedPoints * 0.1 // 10點 = 1元
  const totalAmount = Math.max(0, subtotal - pointsDiscount)
  const earnedPoints = Math.floor(totalAmount / 100) // 消費100元得1點

  // 格式化金額
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // 提交訂單
  const handleSubmit = async () => {
    if (orderItems.length === 0) {
      toast.error('請至少加入一項商品')
      return
    }

    setSubmitting(true)

    const result = await createOrder({
      customerId: customerId || undefined,
      storeId: storeId || undefined,
      userId: '', // 將由後端從session取得
      items: orderItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
      })),
      usedPoints,
      notes: notes || undefined,
    })

    setSubmitting(false)

    if (result.success) {
      toast.success(result.message)
      router.push(`/orders/${result.data?.id}`)
    } else {
      toast.error(result.message)
    }
  }

  return (
    <div className="space-y-6">
      {/* 頁面標題 */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/orders">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">新增訂單</h1>
          <p className="text-sm text-muted-foreground">建立新的銷售訂單</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 左側：商品選擇與明細 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 商品搜尋 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                商品明細
              </CardTitle>
              <CardDescription>搜尋並加入商品到訂單</CardDescription>
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
                      <TableHead className="text-right">單價</TableHead>
                      <TableHead className="text-center w-[120px]">數量</TableHead>
                      <TableHead className="text-right w-[100px]">折扣</TableHead>
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
                        <TableCell className="text-right">
                          {formatCurrency(item.unitPrice)}
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
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            value={item.discount}
                            onChange={(e) => updateDiscount(item.productId, Number(e.target.value))}
                            className="h-8 w-20 text-right"
                          />
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
                placeholder="輸入訂單備註..."
                rows={3}
              />
            </CardContent>
          </Card>
        </div>

        {/* 右側：訂單資訊 */}
        <div className="space-y-6">
          {/* 會員選擇 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                會員
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedCustomer ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">會員編號</p>
                    <p className="font-medium">{selectedCustomer.code}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">姓名</p>
                    <p className="font-medium">{selectedCustomer.name}</p>
                  </div>
                  {selectedCustomer.phone && (
                    <div>
                      <p className="text-sm text-muted-foreground">電話</p>
                      <p className="font-medium">{selectedCustomer.phone}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">可用點數</p>
                    <p className="font-medium text-green-600">
                      {selectedCustomer.availablePoints.toLocaleString()} 點
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="w-full" onClick={clearCustomer}>
                    清除會員
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setCustomerDialogOpen(true)}
                >
                  <Search className="mr-2 h-4 w-4" />
                  搜尋會員
                </Button>
              )}
            </CardContent>
          </Card>

          {/* 門市選擇 */}
          <Card>
            <CardHeader>
              <CardTitle>門市</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={storeId} onValueChange={setStoreId}>
                <SelectTrigger>
                  <SelectValue placeholder="選擇門市" />
                </SelectTrigger>
                <SelectContent>
                  {stores.map((store) => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* 點數折抵 */}
          {selectedCustomer && selectedCustomer.availablePoints > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>點數折抵</CardTitle>
                <CardDescription>
                  10 點 = NT$1，最多可使用 {selectedCustomer.availablePoints} 點
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    max={selectedCustomer.availablePoints}
                    value={usedPoints}
                    onChange={(e) =>
                      setUsedPoints(
                        Math.min(Number(e.target.value), selectedCustomer.availablePoints)
                      )
                    }
                    placeholder="輸入使用點數"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setUsedPoints(selectedCustomer.availablePoints)}
                  >
                    全部
                  </Button>
                </div>
                {usedPoints > 0 && (
                  <p className="mt-2 text-sm text-green-600">
                    可折抵 {formatCurrency(pointsDiscount)}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* 金額摘要 */}
          <Card>
            <CardHeader>
              <CardTitle>金額摘要</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">商品小計</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {pointsDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>點數折抵 ({usedPoints} 點)</span>
                  <span>-{formatCurrency(pointsDiscount)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>應付金額</span>
                <span>{formatCurrency(totalAmount)}</span>
              </div>
              {selectedCustomer && (
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>可獲得點數</span>
                  <span>+{earnedPoints} 點</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 提交按鈕 */}
          <Button
            className="w-full"
            size="lg"
            onClick={handleSubmit}
            disabled={submitting || orderItems.length === 0}
          >
            {submitting ? '處理中...' : '建立訂單'}
          </Button>
        </div>
      </div>

      {/* 會員搜尋對話框 */}
      <Dialog open={customerDialogOpen} onOpenChange={setCustomerDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>搜尋會員</DialogTitle>
            <DialogDescription>輸入會員編號、姓名或電話搜尋</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder="輸入搜尋關鍵字..."
                onKeyDown={(e) => e.key === 'Enter' && searchCustomers()}
              />
              <Button onClick={searchCustomers} disabled={customerLoading}>
                搜尋
              </Button>
            </div>
            {customerLoading ? (
              <div className="text-center py-4 text-muted-foreground">搜尋中...</div>
            ) : customers.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                {customerSearch ? '沒有找到會員' : '請輸入關鍵字搜尋'}
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-2">
                {customers.map((customer) => (
                  <div
                    key={customer.id}
                    className="p-3 rounded-lg border cursor-pointer hover:bg-muted"
                    onClick={() => selectCustomer(customer)}
                  >
                    <div className="font-medium">{customer.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {customer.code} {customer.phone && `/ ${customer.phone}`}
                    </div>
                    <div className="text-sm text-green-600">
                      可用點數：{customer.availablePoints.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

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
                    <div className="text-sm font-medium text-primary">
                      {formatCurrency(Number(product.sellingPrice))}
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
