'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { supplierSchema, type SupplierFormData } from '@/lib/validations/business'
import { createSupplier, updateSupplier } from '@/actions/suppliers'
import type { Decimal } from '@prisma/client/runtime/library'

interface Supplier {
  id: string
  code: string
  name: string
  shortName: string | null
  contactPerson: string | null
  phone: string | null
  fax: string | null
  email: string | null
  address: string | null
  taxId: string | null
  bankName: string | null
  bankAccount: string | null
  paymentTerms: number
  creditLimit: Decimal | null
  notes: string | null
  isActive: boolean
}

interface SupplierFormProps {
  supplier?: Supplier
  generatedCode?: string
}

/**
 * 供應商表單元件
 */
export function SupplierForm({ supplier, generatedCode }: SupplierFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const isEditing = !!supplier

  const form = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      code: supplier?.code || generatedCode || '',
      name: supplier?.name || '',
      shortName: supplier?.shortName || '',
      contactPerson: supplier?.contactPerson || '',
      phone: supplier?.phone || '',
      fax: supplier?.fax || '',
      email: supplier?.email || '',
      address: supplier?.address || '',
      taxId: supplier?.taxId || '',
      bankName: supplier?.bankName || '',
      bankAccount: supplier?.bankAccount || '',
      paymentTerms: supplier?.paymentTerms || 30,
      creditLimit: supplier?.creditLimit ? Number(supplier.creditLimit) : undefined,
      notes: supplier?.notes || '',
      isActive: supplier?.isActive ?? true,
    },
  })

  const onSubmit = async (data: SupplierFormData) => {
    startTransition(async () => {
      const result = isEditing
        ? await updateSupplier(supplier.id, data)
        : await createSupplier(data)

      if (result.success) {
        toast.success(result.message)
        router.push('/suppliers')
        router.refresh()
      } else {
        toast.error(result.message)
        if (result.errors) {
          Object.entries(result.errors).forEach(([field, messages]) => {
            form.setError(field as keyof SupplierFormData, {
              message: messages[0],
            })
          })
        }
      }
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* 基本資料 */}
          <Card>
            <CardHeader>
              <CardTitle>基本資料</CardTitle>
              <CardDescription>供應商的基本資訊</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>供應商代碼 *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="S00001" disabled={isEditing} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="taxId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>統一編號</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="12345678" value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>供應商名稱 *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="請輸入供應商名稱" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="shortName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>簡稱</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="供應商簡稱" value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>地址</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="請輸入地址" value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">啟用狀態</FormLabel>
                      <FormDescription>停用後供應商將無法在採購單中使用</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* 聯絡資訊 */}
          <Card>
            <CardHeader>
              <CardTitle>聯絡資訊</CardTitle>
              <CardDescription>供應商的聯絡方式</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="contactPerson"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>聯絡人</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="聯絡人姓名" value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>電話</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="02-12345678" value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fax"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>傳真</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="02-12345679" value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>電子郵件</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        {...field}
                        placeholder="supplier@example.com"
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </div>

        {/* 交易條件 */}
        <Card>
          <CardHeader>
            <CardTitle>交易條件</CardTitle>
            <CardDescription>付款與信用額度設定</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <FormField
                control={form.control}
                name="paymentTerms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>付款天數</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        min={0}
                        max={365}
                      />
                    </FormControl>
                    <FormDescription>預設 30 天</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="creditLimit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>信用額度</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) =>
                          field.onChange(e.target.value ? Number(e.target.value) : undefined)
                        }
                        value={field.value ?? ''}
                        placeholder="不限制"
                        min={0}
                      />
                    </FormControl>
                    <FormDescription>留空表示不限制</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bankName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>銀行名稱</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="銀行名稱" value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bankAccount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>銀行帳號</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="銀行帳號" value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* 備註 */}
        <Card>
          <CardHeader>
            <CardTitle>備註</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="供應商備註..."
                      rows={4}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* 提交按鈕 */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            取消
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? '處理中...' : isEditing ? '更新供應商' : '建立供應商'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
