'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'

import { PageHeader } from '@/components/layout'
import { Button } from '@/components/ui/button'
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
import { createStockCount } from '@/actions/inventory'

const stockCountSchema = z.object({
  warehouseId: z.string().min(1, '請選擇倉庫'),
  type: z.enum(['FULL', 'CYCLE', 'SPOT'], {
    message: '請選擇盤點類型',
  }),
  notes: z.string().max(500, '備註不能超過 500 字').optional(),
})

type StockCountFormData = z.infer<typeof stockCountSchema>

interface Warehouse {
  id: string
  code: string
  name: string
}

/**
 * 新建盤點單頁面
 */
export default function NewStockCountPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const form = useForm<StockCountFormData>({
    resolver: zodResolver(stockCountSchema),
    defaultValues: {
      warehouseId: '',
      type: 'FULL',
      notes: '',
    },
  })

  // 載入倉庫資料
  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const res = await fetch('/api/warehouses?isActive=true')
        if (res.ok) {
          const data = await res.json()
          setWarehouses(data.data || [])
        }
      } catch (error) {
        console.error('Failed to fetch warehouses:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchWarehouses()
  }, [])

  const onSubmit = async (data: StockCountFormData) => {
    startTransition(async () => {
      const result = await createStockCount({
        warehouseId: data.warehouseId,
        type: data.type,
        notes: data.notes,
      })

      if (result.success) {
        toast.success(result.message)
        router.push(`/inventory/stock-counts/${result.data?.id}`)
        router.refresh()
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="新建盤點單"
        description="建立新的庫存盤點作業"
        backHref="/inventory/stock-counts"
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>盤點資訊</CardTitle>
              <CardDescription>設定盤點單基本資訊</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="warehouseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>盤點倉庫 *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
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
                      <FormDescription>選擇要進行盤點的倉庫</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>盤點類型 *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="請選擇盤點類型" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="FULL">全盤</SelectItem>
                          <SelectItem value="CYCLE">循環盤</SelectItem>
                          <SelectItem value="SPOT">抽盤</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        全盤：盤點所有商品；循環盤：定期輪流盤點；抽盤：抽樣盤點
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>備註</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="輸入盤點備註..." rows={3} />
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
              {isPending ? '建立中...' : '建立盤點單'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
