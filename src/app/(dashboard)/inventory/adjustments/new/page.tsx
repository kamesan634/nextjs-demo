'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'

import { PageHeader } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { adjustInventory } from '@/actions/inventory'

const adjustmentSchema = z.object({
  productId: z.string().min(1, '請選擇商品'),
  warehouseId: z.string().optional(),
  type: z.enum(['ADD', 'SUBTRACT', 'DAMAGE'], {
    message: '請選擇調整類型',
  }),
  quantity: z.number().int('數量必須是整數').min(1, '數量必須大於 0'),
  reason: z.string().max(200, '原因不能超過 200 字').optional(),
})

type AdjustmentFormData = z.infer<typeof adjustmentSchema>

interface Product {
  id: string
  sku: string
  name: string
}

interface Warehouse {
  id: string
  code: string
  name: string
}

/**
 * 新增庫存調整頁面
 */
export default function NewAdjustmentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [products, setProducts] = useState<Product[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const form = useForm<AdjustmentFormData>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: {
      productId: searchParams.get('productId') || '',
      warehouseId: searchParams.get('warehouseId') || '',
      type: 'ADD',
      quantity: 1,
      reason: '',
    },
  })

  // 載入商品和倉庫資料
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, warehousesRes] = await Promise.all([
          fetch('/api/products?isActive=true'),
          fetch('/api/warehouses?isActive=true'),
        ])

        if (productsRes.ok) {
          const productsData = await productsRes.json()
          setProducts(productsData.data || [])
        }

        if (warehousesRes.ok) {
          const warehousesData = await warehousesRes.json()
          setWarehouses(warehousesData.data || [])
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const onSubmit = async (data: AdjustmentFormData) => {
    startTransition(async () => {
      const result = await adjustInventory({
        productId: data.productId,
        warehouseId: data.warehouseId || undefined,
        type: data.type,
        quantity: data.quantity,
        reason: data.reason,
      })

      if (result.success) {
        toast.success(result.message)
        router.push('/inventory/adjustments')
        router.refresh()
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="新增庫存調整"
        description="調整商品庫存數量"
        backHref="/inventory/adjustments"
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>調整資訊</CardTitle>
              <CardDescription>填寫庫存調整詳情</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="productId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>商品 *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={isLoading ? '載入中...' : '請選擇商品'} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.sku} - {product.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="warehouseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>倉庫</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={isLoading ? '載入中...' : '請選擇倉庫'} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {warehouses.map((wh) => (
                            <SelectItem key={wh.id} value={wh.id}>
                              {wh.code} - {wh.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>調整類型 *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="請選擇調整類型" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ADD">盤盈（增加）</SelectItem>
                          <SelectItem value="SUBTRACT">盤虧（減少）</SelectItem>
                          <SelectItem value="DAMAGE">報損</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>盤盈會增加庫存，盤虧和報損會減少庫存</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>調整數量 *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          min={1}
                        />
                      </FormControl>
                      <FormDescription>請輸入正整數</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>調整原因</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="請輸入調整原因..." rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              取消
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? '處理中...' : '確認調整'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
