'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { createProductBundle, updateProductBundle } from '@/actions/product-bundles'
import {
  createProductBundleSchema,
  updateProductBundleSchema,
  type CreateProductBundleFormData,
  type UpdateProductBundleFormData,
} from '@/lib/validations/product-bundles'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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

interface Product {
  id: string
  name: string
  sku: string
  sellingPrice: number
}

interface BundleFormProps {
  bundle?: {
    id: string
    code: string
    name: string
    description: string | null
    bundlePrice: number
    isActive: boolean
    startDate: Date | null
    endDate: Date | null
    items: {
      id: string
      productId: string
      quantity: number
      product: Product
    }[]
  }
  products: Product[]
}

export function BundleForm({ bundle, products }: BundleFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEditing = !!bundle

  const form = useForm<CreateProductBundleFormData>({
    resolver: zodResolver(createProductBundleSchema),
    defaultValues: {
      code: bundle?.code || '',
      name: bundle?.name || '',
      description: bundle?.description || '',
      bundlePrice: bundle?.bundlePrice || 0,
      isActive: bundle?.isActive ?? true,
      startDate: bundle?.startDate ? new Date(bundle.startDate).toISOString().split('T')[0] : '',
      endDate: bundle?.endDate ? new Date(bundle.endDate).toISOString().split('T')[0] : '',
      items: bundle?.items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
      })) || [{ productId: '', quantity: 1 }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  })

  const onSubmit = async (data: CreateProductBundleFormData) => {
    setIsSubmitting(true)

    try {
      const result = isEditing
        ? await updateProductBundle(bundle.id, data as UpdateProductBundleFormData)
        : await createProductBundle(data)

      if (result.success) {
        toast.success(result.message)
        router.push('/products/bundles')
        router.refresh()
      } else {
        toast.error(result.message)
      }
    } catch {
      toast.error('操作失敗，請稍後再試')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? '編輯商品組合' : '新增商品組合'}</CardTitle>
        <CardDescription>設定商品組合/套餐資料</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {!isEditing && (
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>組合代碼 *</FormLabel>
                      <FormControl>
                        <Input placeholder="例: BUNDLE001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>組合名稱 *</FormLabel>
                    <FormControl>
                      <Input placeholder="請輸入組合名稱" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>描述</FormLabel>
                  <FormControl>
                    <Textarea placeholder="請輸入描述" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-6 md:grid-cols-3">
              <FormField
                control={form.control}
                name="bundlePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>組合價格 *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>開始日期</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>結束日期</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* 組合項目 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">組合商品</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ productId: '', quantity: 1 })}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  新增商品
                </Button>
              </div>

              {fields.map((field, index) => (
                <div key={field.id} className="flex items-end gap-4 border rounded-lg p-4">
                  <FormField
                    control={form.control}
                    name={`items.${index}.productId`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>商品 *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="選擇商品" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {products.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.sku} - {p.name} (${Number(p.sellingPrice).toLocaleString()})
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
                    name={`items.${index}.quantity`}
                    render={({ field }) => (
                      <FormItem className="w-[120px]">
                        <FormLabel>數量 *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>啟用組合</FormLabel>
                    <FormDescription>停用的組合將不會顯示在 POS 中</FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <div className="flex gap-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? '儲存變更' : '建立組合'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                取消
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
